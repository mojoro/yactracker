import { NextResponse, type NextRequest } from 'next/server'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { notFound, validationError, internalError } from '@/lib/problem'
import { parsePagination, buildMeta } from '@/lib/pagination'

type RouteContext = {
  params: Promise<{ program_id: string }>
}

type AuditionWithRelations = Prisma.AuditionGetPayload<{
  include: {
    location: true
    audition_instruments: { include: { instrument: true } }
  }
}>

function formatAudition(audition: AuditionWithRelations) {
  return {
    id: audition.id,
    program_id: audition.program_id,
    location_id: audition.location_id,
    location: {
      id: audition.location.id,
      city: audition.location.city,
      country: audition.location.country,
      state: audition.location.state,
      address: audition.location.address,
    },
    time_slot: audition.time_slot,
    audition_fee: audition.audition_fee,
    instructions: audition.instructions,
    registration_url: audition.registration_url,
    instruments: audition.audition_instruments.map((ai) => ({
      id: ai.instrument.id,
      name: ai.instrument.name,
    })),
    created_at: audition.created_at,
    updated_at: audition.updated_at,
  }
}

export async function GET(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const { program_id } = await context.params

    const program = await prisma.program.findUnique({
      where: { id: program_id },
      select: { id: true },
    })
    if (!program) {
      return notFound(`Program with id '${program_id}' not found.`)
    }

    const { searchParams } = new URL(request.url)
    const pagination = parsePagination(searchParams)

    const timeSlotFilter: { gte?: Date; lte?: Date } = {}
    const afterParam = searchParams.get('after')
    if (afterParam) {
      const d = new Date(afterParam)
      if (Number.isNaN(d.getTime())) {
        return validationError('after must be a valid ISO 8601 date-time')
      }
      timeSlotFilter.gte = d
    }
    const beforeParam = searchParams.get('before')
    if (beforeParam) {
      const d = new Date(beforeParam)
      if (Number.isNaN(d.getTime())) {
        return validationError('before must be a valid ISO 8601 date-time')
      }
      timeSlotFilter.lte = d
    }

    const where: Prisma.AuditionWhereInput = { program_id }
    if (timeSlotFilter.gte || timeSlotFilter.lte) {
      where.time_slot = timeSlotFilter
    }

    const [items, totalItems] = await Promise.all([
      prisma.audition.findMany({
        where,
        orderBy: [{ time_slot: 'asc' }, { created_at: 'asc' }],
        skip: pagination.skip,
        take: pagination.take,
        include: {
          location: true,
          audition_instruments: { include: { instrument: true } },
        },
      }),
      prisma.audition.count({ where }),
    ])

    return NextResponse.json({
      items: items.map(formatAudition),
      meta: buildMeta(pagination, totalItems),
    })
  } catch (err) {
    console.error('GET /programs/[program_id]/auditions failed', err)
    return internalError('Failed to list auditions.')
  }
}

interface AuditionInput {
  location_id?: unknown
  time_slot?: unknown
  audition_fee?: unknown
  instructions?: unknown
  registration_url?: unknown
  instrument_ids?: unknown
}

interface ValidatedAuditionInput {
  location_id: string
  time_slot: Date | null
  audition_fee: number | null
  instructions: string | null
  registration_url: string | null
  instrument_ids: string[] | null
}

async function validateAuditionInput(
  payload: AuditionInput,
): Promise<NextResponse | ValidatedAuditionInput> {
  if (typeof payload.location_id !== 'string' || payload.location_id.trim() === '') {
    return validationError('location_id is required and must be a string')
  }

  let time_slot: Date | null = null
  if (payload.time_slot !== undefined && payload.time_slot !== null) {
    if (typeof payload.time_slot !== 'string') {
      return validationError('time_slot must be an ISO 8601 date-time string')
    }
    const d = new Date(payload.time_slot)
    if (Number.isNaN(d.getTime())) {
      return validationError('time_slot must be a valid ISO 8601 date-time')
    }
    time_slot = d
  }

  let audition_fee: number | null = null
  if (payload.audition_fee !== undefined && payload.audition_fee !== null) {
    if (typeof payload.audition_fee !== 'number' || !Number.isFinite(payload.audition_fee)) {
      return validationError('audition_fee must be a number')
    }
    audition_fee = payload.audition_fee
  }

  let instructions: string | null = null
  if (payload.instructions !== undefined && payload.instructions !== null) {
    if (typeof payload.instructions !== 'string') {
      return validationError('instructions must be a string')
    }
    instructions = payload.instructions
  }

  let registration_url: string | null = null
  if (payload.registration_url !== undefined && payload.registration_url !== null) {
    if (typeof payload.registration_url !== 'string') {
      return validationError('registration_url must be a string')
    }
    registration_url = payload.registration_url
  }

  let instrument_ids: string[] | null = null
  if (payload.instrument_ids !== undefined && payload.instrument_ids !== null) {
    if (
      !Array.isArray(payload.instrument_ids) ||
      !payload.instrument_ids.every((v): v is string => typeof v === 'string')
    ) {
      return validationError('instrument_ids must be an array of strings')
    }
    instrument_ids = payload.instrument_ids
  }

  const location = await prisma.location.findUnique({
    where: { id: payload.location_id },
    select: { id: true },
  })
  if (!location) {
    return validationError('location_id references unknown location')
  }

  if (instrument_ids && instrument_ids.length > 0) {
    const found = await prisma.instrument.findMany({
      where: { id: { in: instrument_ids } },
      select: { id: true },
    })
    if (found.length !== instrument_ids.length) {
      return validationError('instrument_ids references one or more unknown instruments')
    }
  }

  return {
    location_id: payload.location_id,
    time_slot,
    audition_fee,
    instructions,
    registration_url,
    instrument_ids,
  }
}

export async function POST(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const { program_id } = await context.params

    const program = await prisma.program.findUnique({
      where: { id: program_id },
      select: { id: true },
    })
    if (!program) {
      return notFound(`Program with id '${program_id}' not found.`)
    }

    let payload: AuditionInput
    try {
      payload = (await request.json()) as AuditionInput
    } catch {
      return validationError('Request body must be valid JSON.')
    }

    const validated = await validateAuditionInput(payload)
    if (validated instanceof NextResponse) {
      return validated
    }

    const audition = await prisma.audition.create({
      data: {
        program_id,
        location_id: validated.location_id,
        time_slot: validated.time_slot,
        audition_fee: validated.audition_fee,
        instructions: validated.instructions,
        registration_url: validated.registration_url,
        audition_instruments: validated.instrument_ids
          ? {
              create: validated.instrument_ids.map((instrument_id) => ({ instrument_id })),
            }
          : undefined,
      },
      include: {
        location: true,
        audition_instruments: { include: { instrument: true } },
      },
    })

    return NextResponse.json(formatAudition(audition), {
      status: 201,
      headers: {
        Location: `/api/programs/${program_id}/auditions/${audition.id}`,
      },
    })
  } catch (err) {
    console.error('POST /programs/[program_id]/auditions failed', err)
    return internalError('Failed to create audition.')
  }
}
