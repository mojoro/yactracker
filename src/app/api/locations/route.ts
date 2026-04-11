import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  badRequest,
  internalError,
  validationError,
} from '@/lib/problem'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const country = searchParams.get('country')

  try {
    const locations = await prisma.location.findMany({
      where: country ? { country } : undefined,
      orderBy: [{ country: 'asc' }, { city: 'asc' }],
      select: {
        id: true,
        city: true,
        country: true,
        state: true,
        address: true,
      },
    })
    return NextResponse.json({ items: locations })
  } catch {
    return internalError('Failed to list locations')
  }
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return badRequest('Invalid JSON body')
  }

  if (typeof body !== 'object' || body === null) {
    return badRequest('Body must be an object')
  }

  const {
    city,
    country,
    state,
    address,
  } = body as {
    city?: unknown
    country?: unknown
    state?: unknown
    address?: unknown
  }

  if (typeof city !== 'string' || city.trim() === '') {
    return validationError('city is required')
  }
  if (typeof country !== 'string' || country.trim() === '') {
    return validationError('country is required')
  }
  if (state !== undefined && state !== null && typeof state !== 'string') {
    return validationError('state must be a string')
  }
  if (
    address !== undefined &&
    address !== null &&
    typeof address !== 'string'
  ) {
    return validationError('address must be a string')
  }

  try {
    const created = await prisma.location.create({
      data: {
        city: city.trim(),
        country: country.trim(),
        state:
          typeof state === 'string' && state.trim() !== ''
            ? state.trim()
            : null,
        address:
          typeof address === 'string' && address.trim() !== ''
            ? address.trim()
            : null,
      },
      select: {
        id: true,
        city: true,
        country: true,
        state: true,
        address: true,
      },
    })
    return NextResponse.json(created, {
      status: 201,
      headers: { Location: `/api/locations/${created.id}` },
    })
  } catch {
    return internalError('Failed to create location')
  }
}
