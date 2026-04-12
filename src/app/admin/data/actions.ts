'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

export async function deleteProgram(formData: FormData) {
  const id = formData.get('program_id') as string
  if (!id) throw new Error('Missing program_id')

  // Delete join rows + children first, then program
  await prisma.$transaction(async (tx) => {
    // Audition children
    const auditions = await tx.audition.findMany({
      where: { program_id: id },
      select: { id: true },
    })
    if (auditions.length > 0) {
      await tx.auditionInstrument.deleteMany({
        where: { audition_id: { in: auditions.map((a) => a.id) } },
      })
      await tx.audition.deleteMany({ where: { program_id: id } })
    }

    await tx.review.deleteMany({ where: { program_id: id } })
    await tx.programInstrument.deleteMany({ where: { program_id: id } })
    await tx.programCategory.deleteMany({ where: { program_id: id } })
    await tx.programLocation.deleteMany({ where: { program_id: id } })

    // Unlink import sources + candidates
    await tx.importSource.updateMany({
      where: { program_id: id },
      data: { program_id: null },
    })
    await tx.programCandidate.updateMany({
      where: { program_id: id },
      data: { program_id: null },
    })

    await tx.program.delete({ where: { id } })
  })

  revalidatePath('/admin/data')
  revalidatePath('/programs')
  revalidatePath('/')
}

export interface UpdateProgramState {
  message?: string
  error?: string
}

export async function updateProgram(
  _prev: UpdateProgramState | null,
  formData: FormData,
): Promise<UpdateProgramState> {
  const id = formData.get('program_id') as string
  if (!id) return { error: 'Missing program_id' }

  const str = (k: string) => (formData.get(k) as string)?.trim() || null
  const num = (k: string) => {
    const v = str(k)
    if (v === null) return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  const int = (k: string) => {
    const n = num(k)
    return n !== null ? Math.round(n) : null
  }
  const date = (k: string) => {
    const v = str(k)
    if (!v) return null
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? null : d
  }
  const csvList = (k: string) =>
    (str(k) ?? '').split(',').map((s) => s.trim()).filter(Boolean)

  try {
    const instrumentNames = csvList('instruments')
    const categoryNames = csvList('categories')
    const locationEntries = csvList('locations').map((l) => {
      const parts = l.split('/').map((s) => s.trim())
      return { city: parts[0] || l, country: parts[1] || '', state: parts[2] || null }
    }).filter((l) => l.city && l.country)

    // Validate names against existing reference data (case-insensitive)
    const [allInstruments, allCategories] = await Promise.all([
      prisma.instrument.findMany({ select: { id: true, name: true } }),
      prisma.category.findMany({ select: { id: true, name: true } }),
    ])

    const instrumentIds: string[] = []
    const unknownInstruments: string[] = []
    for (const name of instrumentNames) {
      const match = allInstruments.find(
        (i) => i.name.toLowerCase() === name.toLowerCase(),
      )
      if (match) instrumentIds.push(match.id)
      else unknownInstruments.push(name)
    }
    if (unknownInstruments.length > 0) {
      return { error: `Unknown instruments: ${unknownInstruments.join(', ')}. Check spelling or add them first.` }
    }

    const categoryIds: string[] = []
    const unknownCategories: string[] = []
    for (const name of categoryNames) {
      const match = allCategories.find(
        (c) => c.name.toLowerCase() === name.toLowerCase(),
      )
      if (match) categoryIds.push(match.id)
      else unknownCategories.push(name)
    }
    if (unknownCategories.length > 0) {
      return { error: `Unknown categories: ${unknownCategories.join(', ')}. Check spelling or add them first.` }
    }

    const locationIds: string[] = []
    const unknownLocations: string[] = []
    for (const loc of locationEntries) {
      const existing = await prisma.location.findFirst({
        where: {
          city: { equals: loc.city, mode: 'insensitive' },
          country: { equals: loc.country, mode: 'insensitive' },
        },
        select: { id: true },
      })
      if (existing) {
        locationIds.push(existing.id)
      } else {
        unknownLocations.push(`${loc.city}/${loc.country}`)
      }
    }
    if (unknownLocations.length > 0) {
      return { error: `Unknown locations: ${unknownLocations.join(', ')}. Add them via the API first.` }
    }

    await prisma.$transaction(async (tx) => {
      await tx.program.update({
        where: { id },
        data: {
          name: str('name') ?? '',
          description: str('description'),
          start_date: date('start_date'),
          end_date: date('end_date'),
          application_deadline: date('application_deadline'),
          tuition: num('tuition'),
          application_fee: num('application_fee'),
          age_min: int('age_min'),
          age_max: int('age_max'),
          offers_scholarship: formData.get('offers_scholarship') === 'true',
          application_url: str('application_url'),
          program_url: str('program_url'),
        },
      })

      await tx.programInstrument.deleteMany({ where: { program_id: id } })
      if (instrumentIds.length > 0) {
        await tx.programInstrument.createMany({
          data: instrumentIds.map((instrument_id) => ({ program_id: id, instrument_id })),
        })
      }

      await tx.programCategory.deleteMany({ where: { program_id: id } })
      if (categoryIds.length > 0) {
        await tx.programCategory.createMany({
          data: categoryIds.map((category_id) => ({ program_id: id, category_id })),
        })
      }

      await tx.programLocation.deleteMany({ where: { program_id: id } })
      if (locationIds.length > 0) {
        await tx.programLocation.createMany({
          data: locationIds.map((location_id) => ({ program_id: id, location_id })),
        })
      }
    })

    revalidatePath('/admin/data')
    revalidatePath(`/programs/${id}`)
    revalidatePath('/programs')
    return { message: 'Saved.' }
  } catch (e) {
    console.error('[admin] updateProgram failed:', e)
    return { error: e instanceof Error ? e.message : String(e) }
  }
}

export async function deleteReview(formData: FormData) {
  const id = formData.get('review_id') as string
  if (!id) throw new Error('Missing review_id')

  const review = await prisma.review.delete({ where: { id } })

  revalidatePath('/admin/data')
  revalidatePath(`/programs/${review.program_id}`)
}
