import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notFound, validationError, internalError } from '@/lib/problem'
import { parsePagination, buildMeta } from '@/lib/pagination'
import { parseSort, toPrismaOrderBy } from '@/lib/sort'

type RouteContext = {
  params: Promise<{ program_id: string }>
}

const ALLOWED_SORT_FIELDS = ['rating', 'year_attended', 'created_at'] as const

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

    const where: {
      program_id: string
      rating?: number
      year_attended?: number
    } = { program_id }

    const ratingParam = searchParams.get('rating')
    if (ratingParam !== null) {
      const rating = Number.parseInt(ratingParam, 10)
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return validationError('rating must be an integer between 1 and 5')
      }
      where.rating = rating
    }

    const yearParam = searchParams.get('year_attended')
    if (yearParam !== null) {
      const year = Number.parseInt(yearParam, 10)
      if (!Number.isInteger(year)) {
        return validationError('year_attended must be an integer')
      }
      where.year_attended = year
    }

    const orderBy = toPrismaOrderBy(parseSort(searchParams.get('sort')), ALLOWED_SORT_FIELDS, {
      created_at: 'desc',
    })

    const [items, totalItems] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy,
        skip: pagination.skip,
        take: pagination.take,
        include: { _count: { select: { review_likes: true } } },
      }),
      prisma.review.count({ where }),
    ])

    return NextResponse.json({
      items: items.map((r) => ({
        ...r,
        helpful_count: r._count.review_likes,
        _count: undefined,
      })),
      meta: buildMeta(pagination, totalItems),
    })
  } catch (err) {
    console.error('GET /programs/[program_id]/reviews failed', err)
    return internalError('Failed to list reviews.')
  }
}

interface ReviewInput {
  rating?: unknown
  body?: unknown
  year_attended?: unknown
  reviewer_name?: unknown
  title?: unknown
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

    let payload: ReviewInput
    try {
      payload = (await request.json()) as ReviewInput
    } catch {
      return validationError('Request body must be valid JSON.')
    }

    if (
      typeof payload.rating !== 'number' ||
      !Number.isInteger(payload.rating) ||
      payload.rating < 1 ||
      payload.rating > 5
    ) {
      return validationError('rating must be an integer between 1 and 5')
    }

    if (typeof payload.body !== 'string' || payload.body.trim() === '') {
      return validationError('body is required and must be a non-empty string')
    }

    let year_attended: number | null = null
    if (payload.year_attended !== undefined && payload.year_attended !== null) {
      if (typeof payload.year_attended !== 'number' || !Number.isInteger(payload.year_attended)) {
        return validationError('year_attended must be an integer')
      }
      year_attended = payload.year_attended
    }

    let reviewer_name: string | null = null
    if (payload.reviewer_name !== undefined && payload.reviewer_name !== null) {
      if (typeof payload.reviewer_name !== 'string') {
        return validationError('reviewer_name must be a string')
      }
      reviewer_name = payload.reviewer_name
    }

    let title: string | null = null
    if (payload.title !== undefined && payload.title !== null) {
      if (typeof payload.title !== 'string') {
        return validationError('title must be a string')
      }
      title = payload.title
    }

    const review = await prisma.review.create({
      data: {
        program_id,
        rating: payload.rating,
        body: payload.body,
        year_attended,
        reviewer_name,
        title,
      },
    })

    return NextResponse.json(review, {
      status: 201,
      headers: {
        Location: `/api/programs/${program_id}/reviews/${review.id}`,
      },
    })
  } catch (err) {
    console.error('POST /programs/[program_id]/reviews failed', err)
    return internalError('Failed to create review.')
  }
}
