import { NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { badRequest, internalError, notFound, validationError } from '@/lib/problem'

// Re-use the include shape and formatter from the collection route. Keeping a
// local copy here avoids importing non-exported internals and keeps this file
// self-contained per file-ownership rules.

const PROGRAM_INCLUDE = {
  program_instruments: { include: { instrument: true } },
  program_categories: { include: { category: true } },
  program_locations: { include: { location: true } },
} as const

type ProgramWithRelations = Prisma.ProgramGetPayload<{
  include: typeof PROGRAM_INCLUDE
}>

interface RatingStats {
  _avg: { rating: number | null }
  _count: { rating: number }
}

function formatProgram(
  program: ProgramWithRelations,
  stats?: RatingStats | null,
): Record<string, unknown> {
  const avg = stats?._avg.rating ?? null
  return {
    id: program.id,
    slug: program.slug,
    name: program.name,
    description: program.description,
    start_date: program.start_date ? program.start_date.toISOString() : null,
    end_date: program.end_date ? program.end_date.toISOString() : null,
    application_deadline: program.application_deadline
      ? program.application_deadline.toISOString()
      : null,
    tuition: program.tuition,
    application_fee: program.application_fee,
    age_min: program.age_min,
    age_max: program.age_max,
    offers_scholarship: program.offers_scholarship,
    application_url: program.application_url,
    program_url: program.program_url,
    created_at: program.created_at.toISOString(),
    updated_at: program.updated_at.toISOString(),
    instruments: program.program_instruments.map((pi) => ({
      id: pi.instrument.id,
      name: pi.instrument.name,
    })),
    categories: program.program_categories.map((pc) => ({
      id: pc.category.id,
      name: pc.category.name,
    })),
    locations: program.program_locations.map((pl) => ({
      id: pl.location.id,
      city: pl.location.city,
      country: pl.location.country,
      state: pl.location.state,
      address: pl.location.address,
    })),
    average_rating: avg === null ? null : Math.round(avg * 10) / 10,
    review_count: stats?._count.rating ?? 0,
  }
}

async function loadRatingStats(programId: string): Promise<RatingStats> {
  const agg = await prisma.review.aggregate({
    where: { program_id: programId },
    _avg: { rating: true },
    _count: { rating: true },
  })
  return {
    _avg: { rating: agg._avg.rating },
    _count: { rating: agg._count.rating },
  }
}

// ---------------------------------------------------------------------------
// GET /api/programs/{program_id}
// ---------------------------------------------------------------------------

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ program_id: string }> },
): Promise<NextResponse> {
  const { program_id } = await params

  try {
    const program = await prisma.program.findUnique({
      where: { id: program_id },
      include: PROGRAM_INCLUDE,
    })

    if (!program) {
      return notFound(`Program with id '${program_id}' not found.`)
    }

    const stats = await loadRatingStats(program_id)
    return NextResponse.json(formatProgram(program, stats))
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'Unknown error'
    return internalError(detail)
  }
}

// ---------------------------------------------------------------------------
// PUT /api/programs/{program_id}
// ---------------------------------------------------------------------------

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ program_id: string }> },
): Promise<NextResponse> {
  const { program_id } = await params

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return badRequest('Invalid JSON body')
  }

  if (!isRecord(raw)) {
    return badRequest('Request body must be a JSON object')
  }

  const name = raw.name
  if (typeof name !== 'string' || name.trim().length === 0) {
    return validationError('name is required')
  }

  const update: Prisma.ProgramUpdateInput = { name: name.trim() }

  if ('description' in raw) {
    if (raw.description !== null && typeof raw.description !== 'string') {
      return validationError('description must be a string or null')
    }
    update.description = raw.description as string | null
  }

  const startDate = parseDateField(raw, 'start_date')
  if (startDate && 'error' in startDate) return startDate.error
  if (startDate) update.start_date = startDate.value

  const endDate = parseDateField(raw, 'end_date')
  if (endDate && 'error' in endDate) return endDate.error
  if (endDate) update.end_date = endDate.value

  const appDeadline = parseDateField(raw, 'application_deadline')
  if (appDeadline && 'error' in appDeadline) return appDeadline.error
  if (appDeadline) update.application_deadline = appDeadline.value

  const tuition = parseNumberField(raw, 'tuition')
  if (tuition && 'error' in tuition) return tuition.error
  if (tuition) update.tuition = tuition.value

  const appFee = parseNumberField(raw, 'application_fee')
  if (appFee && 'error' in appFee) return appFee.error
  if (appFee) update.application_fee = appFee.value

  const ageMin = parseIntField(raw, 'age_min')
  if (ageMin && 'error' in ageMin) return ageMin.error
  if (ageMin) update.age_min = ageMin.value

  const ageMax = parseIntField(raw, 'age_max')
  if (ageMax && 'error' in ageMax) return ageMax.error
  if (ageMax) update.age_max = ageMax.value

  if ('offers_scholarship' in raw) {
    if (typeof raw.offers_scholarship !== 'boolean') {
      return validationError('offers_scholarship must be a boolean')
    }
    update.offers_scholarship = raw.offers_scholarship
  }

  if ('application_url' in raw) {
    if (raw.application_url !== null && typeof raw.application_url !== 'string') {
      return validationError('application_url must be a string or null')
    }
    update.application_url = raw.application_url as string | null
  }

  if ('program_url' in raw) {
    if (raw.program_url !== null && typeof raw.program_url !== 'string') {
      return validationError('program_url must be a string or null')
    }
    update.program_url = raw.program_url as string | null
  }

  const instrumentIds = parseIdArray(raw.instrument_ids)
  if (instrumentIds === 'invalid') {
    return validationError('instrument_ids must be an array of strings')
  }
  const categoryIds = parseIdArray(raw.category_ids)
  if (categoryIds === 'invalid') {
    return validationError('category_ids must be an array of strings')
  }
  const locationIds = parseIdArray(raw.location_ids)
  if (locationIds === 'invalid') {
    return validationError('location_ids must be an array of strings')
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.program.findUnique({
        where: { id: program_id },
        select: { id: true },
      })
      if (!existing) {
        return null
      }

      await tx.program.update({
        where: { id: program_id },
        data: update,
      })

      if (instrumentIds !== null) {
        await tx.programInstrument.deleteMany({ where: { program_id } })
        if (instrumentIds.length > 0) {
          await tx.programInstrument.createMany({
            data: instrumentIds.map((instrument_id) => ({
              program_id,
              instrument_id,
            })),
          })
        }
      }

      if (categoryIds !== null) {
        await tx.programCategory.deleteMany({ where: { program_id } })
        if (categoryIds.length > 0) {
          await tx.programCategory.createMany({
            data: categoryIds.map((category_id) => ({
              program_id,
              category_id,
            })),
          })
        }
      }

      if (locationIds !== null) {
        await tx.programLocation.deleteMany({ where: { program_id } })
        if (locationIds.length > 0) {
          await tx.programLocation.createMany({
            data: locationIds.map((location_id) => ({
              program_id,
              location_id,
            })),
          })
        }
      }

      return tx.program.findUnique({
        where: { id: program_id },
        include: PROGRAM_INCLUDE,
      })
    })

    if (!updated) {
      return notFound(`Program with id '${program_id}' not found.`)
    }

    const stats = await loadRatingStats(program_id)
    return NextResponse.json(formatProgram(updated, stats))
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'Unknown error'
    return internalError(detail)
  }
}

// ---------------------------------------------------------------------------
// Helpers (local — other agents don't touch this file)
// ---------------------------------------------------------------------------

function parseDateField(
  raw: Record<string, unknown>,
  key: string,
): { value: Date | null } | { error: NextResponse } | null {
  if (!(key in raw)) return null
  const v = raw[key]
  if (v === null) return { value: null }
  if (typeof v !== 'string') {
    return { error: validationError(`${key} must be an ISO date string or null`) }
  }
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) {
    return { error: validationError(`${key} is not a valid date`) }
  }
  return { value: d }
}

function parseNumberField(
  raw: Record<string, unknown>,
  key: string,
): { value: number | null } | { error: NextResponse } | null {
  if (!(key in raw)) return null
  const v = raw[key]
  if (v === null) return { value: null }
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    return { error: validationError(`${key} must be a number or null`) }
  }
  return { value: v }
}

function parseIntField(
  raw: Record<string, unknown>,
  key: string,
): { value: number | null } | { error: NextResponse } | null {
  if (!(key in raw)) return null
  const v = raw[key]
  if (v === null) return { value: null }
  if (typeof v !== 'number' || !Number.isInteger(v)) {
    return { error: validationError(`${key} must be an integer or null`) }
  }
  return { value: v }
}

function parseIdArray(value: unknown): string[] | null | 'invalid' {
  if (value === undefined) return null
  if (!Array.isArray(value)) return 'invalid'
  if (!value.every((v) => typeof v === 'string')) return 'invalid'
  return value as string[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
