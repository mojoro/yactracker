'use server'

import { revalidatePath } from 'next/cache'
import { apiFetch } from '@/lib/api'

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

  revalidatePath(`/programs/${program_id}`)
}
