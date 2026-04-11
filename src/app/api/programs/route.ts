import { NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { badRequest, internalError, validationError } from '@/lib/problem'
import { buildMeta, parsePagination } from '@/lib/pagination'
import { parseSort, toPrismaOrderBy } from '@/lib/sort'

// ---------------------------------------------------------------------------
// Types & helpers
// ---------------------------------------------------------------------------

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

const ALLOWED_SORT_FIELDS = [
  'name',
  'tuition',
  'application_deadline',
  'created_at',
] as const

// ---------------------------------------------------------------------------
// GET /api/programs
// ---------------------------------------------------------------------------

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)

    const pagination = parsePagination(searchParams)
    const sortFields = parseSort(searchParams.get('sort'))
    const orderBy = toPrismaOrderBy(sortFields, ALLOWED_SORT_FIELDS, {
      created_at: 'desc',
    })

    const where: Prisma.ProgramWhereInput = {}
    const andFilters: Prisma.ProgramWhereInput[] = []

    const instrumentIds = parseCsvUuids(searchParams.get('instrument_id'))
    if (instrumentIds.length > 0) {
      andFilters.push({
        program_instruments: {
          some: { instrument_id: { in: instrumentIds } },
        },
      })
    }

    const categoryIds = parseCsvUuids(searchParams.get('category_id'))
    if (categoryIds.length > 0) {
      andFilters.push({
        program_categories: {
          some: { category_id: { in: categoryIds } },
        },
      })
    }

    const locationId = searchParams.get('location_id')
    if (locationId) {
      andFilters.push({
        program_locations: {
          some: { location_id: locationId },
        },
      })
    }

    const country = searchParams.get('country')
    if (country) {
      andFilters.push({
        program_locations: {
          some: { location: { country } },
        },
      })
    }

    const deadlineAfter = searchParams.get('deadline_after')
    if (deadlineAfter) {
      const d = new Date(deadlineAfter)
      if (Number.isNaN(d.getTime())) {
        return badRequest("Invalid 'deadline_after' date.")
      }
      andFilters.push({ application_deadline: { gte: d } })
    }

    const deadlineBefore = searchParams.get('deadline_before')
    if (deadlineBefore) {
      const d = new Date(deadlineBefore)
      if (Number.isNaN(d.getTime())) {
        return badRequest("Invalid 'deadline_before' date.")
      }
      andFilters.push({ application_deadline: { lte: d } })
    }

    const tuitionLowerThan = searchParams.get('tuition_lower_than')
    if (tuitionLowerThan !== null) {
      const n = Number.parseFloat(tuitionLowerThan)
      if (!Number.isFinite(n)) {
        return badRequest("Invalid 'tuition_lower_than' value.")
      }
      andFilters.push({ tuition: { lte: n } })
    }

    const offersScholarship = searchParams.get('offers_scholarship')
    if (offersScholarship !== null) {
      if (offersScholarship !== 'true' && offersScholarship !== 'false') {
        return badRequest("'offers_scholarship' must be 'true' or 'false'.")
      }
      andFilters.push({ offers_scholarship: offersScholarship === 'true' })
    }

    const q = searchParams.get('q')
    if (q) {
      andFilters.push({
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      })
    }

    if (andFilters.length > 0) {
      where.AND = andFilters
    }

    const [programs, totalItems] = await Promise.all([
      prisma.program.findMany({
        where,
        orderBy,
        skip: pagination.skip,
        take: pagination.take,
        include: PROGRAM_INCLUDE,
      }),
      prisma.program.count({ where }),
    ])

    const programIds = programs.map((p) => p.id)
    const statsMap = new Map<string, RatingStats>()
    if (programIds.length > 0) {
      const grouped = await prisma.review.groupBy({
        by: ['program_id'],
        where: { program_id: { in: programIds } },
        _avg: { rating: true },
        _count: { rating: true },
      })
      for (const g of grouped) {
        statsMap.set(g.program_id, {
          _avg: { rating: g._avg.rating },
          _count: { rating: g._count.rating },
        })
      }
    }

    const items = programs.map((p) => formatProgram(p, statsMap.get(p.id) ?? null))

    return NextResponse.json({
      items,
      meta: buildMeta(pagination, totalItems),
    })
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'Unknown error'
    return internalError(detail)
  }
}

// ---------------------------------------------------------------------------
// POST /api/programs
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<NextResponse> {
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

  const dataResult = buildProgramData(raw)
  if ('error' in dataResult) {
    return dataResult.error
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
    const program = await prisma.program.create({
      data: {
        name: name.trim(),
        ...dataResult.data,
        program_instruments:
          instrumentIds && instrumentIds.length > 0
            ? { create: instrumentIds.map((id) => ({ instrument_id: id })) }
            : undefined,
        program_categories:
          categoryIds && categoryIds.length > 0
            ? { create: categoryIds.map((id) => ({ category_id: id })) }
            : undefined,
        program_locations:
          locationIds && locationIds.length > 0
            ? { create: locationIds.map((id) => ({ location_id: id })) }
            : undefined,
      },
      include: PROGRAM_INCLUDE,
    })

    const body = formatProgram(program, {
      _avg: { rating: null },
      _count: { rating: 0 },
    })

    return NextResponse.json(body, {
      status: 201,
      headers: { Location: `/api/programs/${program.id}` },
    })
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'Unknown error'
    return internalError(detail)
  }
}

// ---------------------------------------------------------------------------
// Shared body parsing
// ---------------------------------------------------------------------------

interface ParsedProgramData {
  data: Omit<Prisma.ProgramUncheckedCreateInput, 'name'>
}

function buildProgramData(
  raw: Record<string, unknown>,
): ParsedProgramData | { error: NextResponse } {
  const data: Omit<Prisma.ProgramUncheckedCreateInput, 'name'> = {}

  if ('description' in raw) {
    if (raw.description !== null && typeof raw.description !== 'string') {
      return { error: validationError('description must be a string or null') }
    }
    data.description = raw.description as string | null
  }

  const startDate = parseDateField(raw, 'start_date')
  if (startDate && 'error' in startDate) return { error: startDate.error }
  if (startDate) data.start_date = startDate.value

  const endDate = parseDateField(raw, 'end_date')
  if (endDate && 'error' in endDate) return { error: endDate.error }
  if (endDate) data.end_date = endDate.value

  const appDeadline = parseDateField(raw, 'application_deadline')
  if (appDeadline && 'error' in appDeadline) return { error: appDeadline.error }
  if (appDeadline) data.application_deadline = appDeadline.value

  const tuition = parseNumberField(raw, 'tuition')
  if (tuition && 'error' in tuition) return { error: tuition.error }
  if (tuition) data.tuition = tuition.value

  const appFee = parseNumberField(raw, 'application_fee')
  if (appFee && 'error' in appFee) return { error: appFee.error }
  if (appFee) data.application_fee = appFee.value

  const ageMin = parseIntField(raw, 'age_min')
  if (ageMin && 'error' in ageMin) return { error: ageMin.error }
  if (ageMin) data.age_min = ageMin.value

  const ageMax = parseIntField(raw, 'age_max')
  if (ageMax && 'error' in ageMax) return { error: ageMax.error }
  if (ageMax) data.age_max = ageMax.value

  if ('offers_scholarship' in raw) {
    if (typeof raw.offers_scholarship !== 'boolean') {
      return { error: validationError('offers_scholarship must be a boolean') }
    }
    data.offers_scholarship = raw.offers_scholarship
  }

  if ('application_url' in raw) {
    if (raw.application_url !== null && typeof raw.application_url !== 'string') {
      return { error: validationError('application_url must be a string or null') }
    }
    data.application_url = raw.application_url as string | null
  }

  if ('program_url' in raw) {
    if (raw.program_url !== null && typeof raw.program_url !== 'string') {
      return { error: validationError('program_url must be a string or null') }
    }
    data.program_url = raw.program_url as string | null
  }

  return { data }
}

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

function parseCsvUuids(value: string | null): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
