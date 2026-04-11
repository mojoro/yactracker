import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  badRequest,
  internalError,
  notFound,
  validationError,
} from '@/lib/problem'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ location_id: string }> },
) {
  const { location_id } = await params

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

  const existing = await prisma.location.findUnique({
    where: { id: location_id },
    select: { id: true },
  })
  if (!existing) {
    return notFound(`Location with id '${location_id}' not found.`)
  }

  try {
    const updated = await prisma.location.update({
      where: { id: location_id },
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
    return NextResponse.json(updated)
  } catch {
    return internalError('Failed to update location')
  }
}
