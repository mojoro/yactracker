'use server'

import { revalidatePath } from 'next/cache'
import { cookies, headers } from 'next/headers'
import { apiFetch } from '@/lib/api'
import { extractIp, hashIp } from '@/lib/ip-hash'
import { prisma } from '@/lib/prisma'

export interface ReportFormState {
  message?: string
  error?: string
}

export async function submitReport(
  _prev: ReportFormState | null,
  formData: FormData,
): Promise<ReportFormState> {
  // Honeypot
  const honeypot = String(formData.get('url_confirm') ?? '').trim()
  if (honeypot) return { message: 'Thanks for your report.' }

  const program_id = String(formData.get('program_id') ?? '').trim()
  if (!program_id) return { error: 'Missing program.' }

  const review_id = String(formData.get('review_id') ?? '').trim() || null

  const report_type = String(formData.get('report_type') ?? '').trim()
  if (!['inaccurate_data', 'inappropriate_content', 'other'].includes(report_type)) {
    return { error: 'Invalid report type.' }
  }

  const description = String(formData.get('description') ?? '').trim()
  if (!description) return { error: 'Description is required.' }
  if (description.length > 5000) return { error: 'Description is too long (max 5000 characters).' }

  const reporter_email = String(formData.get('reporter_email') ?? '').trim() || null
  if (reporter_email && reporter_email.length > 254) {
    return { error: 'Email is too long.' }
  }

  await prisma.report.create({
    data: {
      program_id,
      review_id,
      report_type,
      description,
      reporter_email,
    },
  })

  return { message: 'Thanks for your report. We will review it shortly.' }
}

export async function submitReview(formData: FormData): Promise<void> {
  // Honeypot
  const honeypot = String(formData.get('url_confirm') ?? '').trim()
  if (honeypot) return

  const program_id = String(formData.get('program_id') ?? '')
  if (!program_id) {
    throw new Error('program_id is required')
  }

  const ratingRaw = formData.get('rating')
  const rating = Number(ratingRaw)
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error('rating must be an integer between 1 and 5')
  }

  const body = String(formData.get('body') ?? '').trim()
  if (!body) {
    throw new Error('Review body is required')
  }
  if (body.length > 5000) {
    throw new Error('Review is too long (max 5000 characters)')
  }

  const reviewer_name = String(formData.get('reviewer_name') ?? '').trim()
  if (reviewer_name.length > 100) {
    throw new Error('Name is too long (max 100 characters)')
  }

  const title = String(formData.get('title') ?? '').trim()
  if (title.length > 200) {
    throw new Error('Title is too long (max 200 characters)')
  }

  const payload: Record<string, unknown> = { rating, body }
  if (reviewer_name) payload.reviewer_name = reviewer_name
  if (title) payload.title = title
  const year_raw = formData.get('year_attended')
  if (year_raw !== null && year_raw !== '') {
    const year = Number(year_raw)
    if (Number.isInteger(year) && year >= 1950 && year <= 2100) {
      payload.year_attended = year
    }
  }

  const res = await apiFetch(`/api/programs/${program_id}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Failed to submit review: ${res.status} ${text}`)
  }

  // Look up slug for revalidation since routes use slugs
  const prog = await prisma.program.findUnique({
    where: { id: program_id },
    select: { slug: true },
  })
  if (prog?.slug) revalidatePath(`/programs/${prog.slug}`)
}

export async function toggleHelpful(
  reviewId: string,
): Promise<{ helpful_count: number; liked: boolean }> {
  const headerStore = await headers()
  const ip = extractIp(headerStore)
  const ip_hash = await hashIp(ip)

  const existing = await prisma.reviewLike.findUnique({
    where: { review_id_ip_hash: { review_id: reviewId, ip_hash } },
  })

  if (existing) {
    await prisma.reviewLike.delete({ where: { id: existing.id } })
  } else {
    await prisma.reviewLike.create({ data: { review_id: reviewId, ip_hash } })
  }

  const helpful_count = await prisma.reviewLike.count({ where: { review_id: reviewId } })

  const cookieStore = await cookies()
  const raw = cookieStore.get('helpful_reviews')?.value
  const likedIds: string[] = raw ? JSON.parse(raw) : []

  if (existing) {
    const updated = likedIds.filter((id) => id !== reviewId)
    cookieStore.set('helpful_reviews', JSON.stringify(updated), {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    })
  } else {
    likedIds.push(reviewId)
    cookieStore.set('helpful_reviews', JSON.stringify(likedIds), {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    })
  }

  return { helpful_count, liked: !existing }
}
