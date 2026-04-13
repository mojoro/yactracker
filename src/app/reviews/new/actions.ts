'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { toSlug } from '@/lib/slug'

export interface SubmitReviewState {
  error?: string
}

interface ProgramSelection {
  id: string
  name: string
  is_new: boolean
}

function parseProgramSelection(raw: string | null): ProgramSelection | null {
  if (!raw) return null
  try {
    const obj = JSON.parse(raw)
    if (
      typeof obj === 'object' &&
      obj !== null &&
      'id' in obj &&
      'name' in obj &&
      'is_new' in obj
    ) {
      return obj as ProgramSelection
    }
    return null
  } catch {
    return null
  }
}

export async function submitReviewGeneric(
  _prev: SubmitReviewState | null,
  formData: FormData,
): Promise<SubmitReviewState> {
  // Honeypot
  const honeypot = (formData.get('url_confirm') as string)?.trim()
  if (honeypot) return { error: '' }

  // Parse program selection
  const programSelection = parseProgramSelection(formData.get('program') as string)
  if (!programSelection || !programSelection.name.trim()) {
    return { error: 'Please select or enter a program.' }
  }

  // Validate rating
  const ratingRaw = formData.get('rating')
  const rating = Number(ratingRaw)
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: 'Rating is required (1–5).' }
  }

  // Validate body
  const body = ((formData.get('body') as string) ?? '').trim()
  if (!body) return { error: 'Review body is required.' }
  if (body.length > 5000) return { error: 'Review is too long (max 5000 characters).' }

  // Optional fields
  const reviewer_name = ((formData.get('reviewer_name') as string) ?? '').trim() || null
  if (reviewer_name && reviewer_name.length > 100) return { error: 'Name is too long (max 100 characters).' }

  const title = ((formData.get('title') as string) ?? '').trim() || null
  if (title && title.length > 200) return { error: 'Title is too long (max 200 characters).' }

  let year_attended: number | null = null
  const yearRaw = formData.get('year_attended')
  if (yearRaw !== null && yearRaw !== '') {
    const y = Number(yearRaw)
    if (Number.isInteger(y) && y >= 1950 && y <= 2100) {
      year_attended = y
    }
  }

  let programSlug: string

  try {
    if (programSelection.is_new) {
      // Create minimal program + review in one transaction
      const programName = programSelection.name.trim()
      if (programName.length > 200) return { error: 'Program name is too long (max 200 characters).' }

      let slug = toSlug(programName)
      const slugConflict = await prisma.program.findUnique({
        where: { slug },
        select: { id: true },
      })
      if (slugConflict) {
        const count = await prisma.program.count({
          where: { slug: { startsWith: slug } },
        })
        slug = `${slug}-${count + 1}`
      }

      const result = await prisma.$transaction(async (tx) => {
        const program = await tx.program.create({
          data: { name: programName, slug },
          select: { id: true, slug: true },
        })

        await tx.review.create({
          data: {
            program_id: program.id,
            rating,
            body,
            reviewer_name,
            title,
            year_attended,
          },
        })

        return program
      })

      programSlug = result.slug
    } else {
      // Existing program — verify it exists then create review
      const program = await prisma.program.findUnique({
        where: { id: programSelection.id },
        select: { id: true, slug: true },
      })
      if (!program) return { error: 'Selected program not found.' }

      await prisma.review.create({
        data: {
          program_id: program.id,
          rating,
          body,
          reviewer_name,
          title,
          year_attended,
        },
      })

      programSlug = program.slug
    }
  } catch (e) {
    console.error('[public] submitReviewGeneric failed:', e)
    return { error: 'Something went wrong. Please try again.' }
  }

  revalidatePath(`/programs/${programSlug}`)
  revalidatePath('/programs')
  revalidatePath('/')
  redirect(`/programs/${programSlug}`)
}
