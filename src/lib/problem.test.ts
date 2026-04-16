import { describe, it, expect } from 'vitest'
import { notFound, badRequest, validationError, conflict, internalError } from '@/lib/problem'

describe('notFound', () => {
  it('returns 404 status', () => {
    const res = notFound('Program not found')
    expect(res.status).toBe(404)
  })

  it('returns RFC 9457 problem body with correct fields', async () => {
    const res = notFound('Program not found')
    const body = await res.json()
    expect(body).toEqual({
      type: '/problems/not-found',
      title: 'Resource not found',
      status: 404,
      detail: 'Program not found',
    })
  })

  it('sets Content-Type to application/problem+json', () => {
    const res = notFound('Program not found')
    expect(res.headers.get('content-type')).toBe('application/problem+json')
  })
})

describe('badRequest', () => {
  it('returns 400 status with correct body', async () => {
    const res = badRequest('Missing required field')
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body).toEqual({
      type: '/problems/bad-request',
      title: 'Bad request',
      status: 400,
      detail: 'Missing required field',
    })
  })

  it('sets Content-Type to application/problem+json', () => {
    const res = badRequest('Missing required field')
    expect(res.headers.get('content-type')).toBe('application/problem+json')
  })
})

describe('validationError', () => {
  it('returns 400 status with correct body', async () => {
    const res = validationError('rating must be between 1 and 5')
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body).toEqual({
      type: '/problems/validation-error',
      title: 'Validation failed',
      status: 400,
      detail: 'rating must be between 1 and 5',
    })
  })

  it('sets Content-Type to application/problem+json', () => {
    const res = validationError('rating must be between 1 and 5')
    expect(res.headers.get('content-type')).toBe('application/problem+json')
  })
})

describe('conflict', () => {
  it('returns 409 status with correct body', async () => {
    const res = conflict('Program with this name already exists')
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body).toEqual({
      type: '/problems/conflict',
      title: 'Conflict',
      status: 409,
      detail: 'Program with this name already exists',
    })
  })

  it('sets Content-Type to application/problem+json', () => {
    const res = conflict('Program with this name already exists')
    expect(res.headers.get('content-type')).toBe('application/problem+json')
  })
})

describe('internalError', () => {
  it('returns 500 status with correct body', async () => {
    const res = internalError('Unexpected database error')
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body).toEqual({
      type: '/problems/internal-error',
      title: 'Internal server error',
      status: 500,
      detail: 'Unexpected database error',
    })
  })

  it('sets Content-Type to application/problem+json', () => {
    const res = internalError('Unexpected database error')
    expect(res.headers.get('content-type')).toBe('application/problem+json')
  })
})
