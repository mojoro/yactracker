import { prisma } from '@/lib/prisma'
import { toSlug } from '@/lib/slug'
import type { ExtractedProgram } from './extractor'

/**
 * Upsert a Program from approved extracted data.
 *
 * Resolves instrument/category/location names to IDs (creating new reference
 * data rows as needed), then creates or updates the Program with all join
 * table connections.
 *
 * Returns the canonical program ID.
 */
export async function upsertProgramFromExtraction(
  extracted: ExtractedProgram,
  existingProgramId: string | null,
): Promise<string> {
  // Resolve all reference data names → IDs in parallel
  const [instrumentIds, categoryIds, locationIds] = await Promise.all([
    resolveInstruments(extracted.instruments),
    resolveCategories(extracted.categories),
    resolveLocations(extracted.locations),
  ])

  // Generate unique slug for new programs
  let slug = toSlug(extracted.name)
  if (!existingProgramId) {
    const conflict = await prisma.program.findUnique({ where: { slug }, select: { id: true } })
    if (conflict) {
      const count = await prisma.program.count({ where: { slug: { startsWith: slug } } })
      slug = `${slug}-${count + 1}`
    }
  }

  const programData = {
    name: extracted.name,
    description: extracted.description,
    start_date: extracted.start_date ? new Date(extracted.start_date) : null,
    end_date: extracted.end_date ? new Date(extracted.end_date) : null,
    application_deadline: extracted.application_deadline
      ? new Date(extracted.application_deadline)
      : null,
    tuition: extracted.tuition,
    application_fee: extracted.application_fee,
    age_min: extracted.age_min,
    age_max: extracted.age_max,
    offers_scholarship: extracted.offers_scholarship,
    application_url: extracted.application_url,
    program_url: extracted.program_url,
  }

  if (existingProgramId) {
    // Update existing program + replace all joins
    await prisma.$transaction(async (tx) => {
      await tx.program.update({
        where: { id: existingProgramId },
        data: programData,
      })

      // Replace instrument joins
      await tx.programInstrument.deleteMany({
        where: { program_id: existingProgramId },
      })
      if (instrumentIds.length > 0) {
        await tx.programInstrument.createMany({
          data: instrumentIds.map((instrument_id) => ({
            program_id: existingProgramId,
            instrument_id,
          })),
        })
      }

      // Replace category joins
      await tx.programCategory.deleteMany({
        where: { program_id: existingProgramId },
      })
      if (categoryIds.length > 0) {
        await tx.programCategory.createMany({
          data: categoryIds.map((category_id) => ({
            program_id: existingProgramId,
            category_id,
          })),
        })
      }

      // Replace location joins
      await tx.programLocation.deleteMany({
        where: { program_id: existingProgramId },
      })
      if (locationIds.length > 0) {
        await tx.programLocation.createMany({
          data: locationIds.map((location_id) => ({
            program_id: existingProgramId,
            location_id,
          })),
        })
      }
    })
    return existingProgramId
  }

  // Create new program with joins
  const program = await prisma.$transaction(async (tx) => {
    const p = await tx.program.create({
      data: { ...programData, slug },
      select: { id: true },
    })

    if (instrumentIds.length > 0) {
      await tx.programInstrument.createMany({
        data: instrumentIds.map((instrument_id) => ({
          program_id: p.id,
          instrument_id,
        })),
      })
    }

    if (categoryIds.length > 0) {
      await tx.programCategory.createMany({
        data: categoryIds.map((category_id) => ({
          program_id: p.id,
          category_id,
        })),
      })
    }

    if (locationIds.length > 0) {
      await tx.programLocation.createMany({
        data: locationIds.map((location_id) => ({
          program_id: p.id,
          location_id,
        })),
      })
    }

    return p
  })

  return program.id
}

// ---------------------------------------------------------------------------
// Name → ID resolvers (match against existing, skip unknown)
// ---------------------------------------------------------------------------

async function resolveInstruments(names: string[]): Promise<string[]> {
  if (names.length === 0) return []
  const all = await prisma.instrument.findMany({ select: { id: true, name: true } })
  const ids: string[] = []
  for (const name of names) {
    const trimmed = name.trim()
    if (!trimmed) continue
    const match = all.find((i) => i.name.toLowerCase() === trimmed.toLowerCase())
    if (match) {
      ids.push(match.id)
    } else {
      console.warn(`[upsert] Skipping unknown instrument: "${trimmed}"`)
    }
  }
  return ids
}

async function resolveCategories(names: string[]): Promise<string[]> {
  if (names.length === 0) return []
  const all = await prisma.category.findMany({ select: { id: true, name: true } })
  const ids: string[] = []
  for (const name of names) {
    const trimmed = name.trim()
    if (!trimmed) continue
    const match = all.find((c) => c.name.toLowerCase() === trimmed.toLowerCase())
    if (match) {
      ids.push(match.id)
    } else {
      console.warn(`[upsert] Skipping unknown category: "${trimmed}"`)
    }
  }
  return ids
}

async function resolveLocations(
  locations: Array<{ city: string; country: string; state: string | null }>,
): Promise<string[]> {
  const ids: string[] = []
  for (const loc of locations) {
    const city = loc.city.trim()
    const country = loc.country.trim()
    if (!city || !country) continue

    const existing = await prisma.location.findFirst({
      where: {
        city: { equals: city, mode: 'insensitive' },
        country: { equals: country, mode: 'insensitive' },
      },
      select: { id: true },
    })

    if (existing) {
      ids.push(existing.id)
    } else {
      console.warn(`[upsert] Skipping unknown location: "${city}/${country}"`)
    }
  }
  return ids
}
