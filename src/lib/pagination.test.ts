import { describe, it, expect } from 'vitest'
import {
  encodeCursor,
  decodeCursor,
  parsePagination,
  buildMeta,
} from '@/lib/pagination'

describe('encodeCursor / decodeCursor', () => {
  it('round-trips an offset back to the original value', () => {
    const token = encodeCursor({ offset: 42 })
    expect(decodeCursor(token)).toEqual({ offset: 42 })
  })

  it('returns null for a garbage string', () => {
    expect(decodeCursor('not-a-cursor!!!')).toBeNull()
  })

  it('returns null for valid base64 but invalid JSON', () => {
    const token = Buffer.from('<<<not json>>>', 'utf8').toString('base64url')
    expect(decodeCursor(token)).toBeNull()
  })

  it('returns null for JSON without an offset field', () => {
    const token = Buffer.from(JSON.stringify({ page: 3 }), 'utf8').toString('base64url')
    expect(decodeCursor(token)).toBeNull()
  })

  it('floors a fractional offset', () => {
    const token = Buffer.from(JSON.stringify({ offset: 7.9 }), 'utf8').toString('base64url')
    expect(decodeCursor(token)).toEqual({ offset: 7 })
  })

  it('clamps a negative offset to 0', () => {
    const token = Buffer.from(JSON.stringify({ offset: -5 }), 'utf8').toString('base64url')
    expect(decodeCursor(token)).toEqual({ offset: 0 })
  })

  it('returns null for Infinity offset', () => {
    const token = Buffer.from(JSON.stringify({ offset: Infinity }), 'utf8').toString('base64url')
    expect(decodeCursor(token)).toBeNull()
  })

  it('returns null for NaN offset', () => {
    const token = Buffer.from(JSON.stringify({ offset: NaN }), 'utf8').toString('base64url')
    expect(decodeCursor(token)).toBeNull()
  })
})

describe('parsePagination', () => {
  it('defaults to offset 0 and limit 20 with no params', () => {
    const result = parsePagination(new URLSearchParams())
    expect(result).toEqual({ offset: 0, limit: 20, skip: 0, take: 20 })
  })

  it('clamps limit to minimum of 1', () => {
    const result = parsePagination(new URLSearchParams({ limit: '0' }))
    expect(result.limit).toBe(1)
  })

  it('clamps limit to maximum of 100', () => {
    const result = parsePagination(new URLSearchParams({ limit: '999' }))
    expect(result.limit).toBe(100)
  })

  it('decodes a valid cursor to the correct offset', () => {
    const cursor = encodeCursor({ offset: 40 })
    const result = parsePagination(new URLSearchParams({ cursor }))
    expect(result.offset).toBe(40)
  })

  it('falls back to offset 0 for an invalid cursor', () => {
    const result = parsePagination(new URLSearchParams({ cursor: 'garbage' }))
    expect(result.offset).toBe(0)
  })

  it('sets skip equal to offset and take equal to limit', () => {
    const cursor = encodeCursor({ offset: 10 })
    const result = parsePagination(new URLSearchParams({ cursor, limit: '5' }))
    expect(result.skip).toBe(result.offset)
    expect(result.take).toBe(result.limit)
  })
})

describe('buildMeta', () => {
  it('returns next cursor and null prev on the first page with more items', () => {
    const meta = buildMeta({ offset: 0, limit: 10, skip: 0, take: 10 }, 25)
    expect(meta.next).not.toBeNull()
    expect(meta.prev).toBeNull()
    expect(meta.total_items).toBe(25)
  })

  it('returns both cursors on a middle page', () => {
    const meta = buildMeta({ offset: 10, limit: 10, skip: 10, take: 10 }, 30)
    expect(meta.next).not.toBeNull()
    expect(meta.prev).not.toBeNull()
  })

  it('returns null next and non-null prev on the last page', () => {
    const meta = buildMeta({ offset: 20, limit: 10, skip: 20, take: 10 }, 25)
    expect(meta.next).toBeNull()
    expect(meta.prev).not.toBeNull()
  })

  it('returns both cursors null when all items fit on one page', () => {
    const meta = buildMeta({ offset: 0, limit: 20, skip: 0, take: 20 }, 5)
    expect(meta.next).toBeNull()
    expect(meta.prev).toBeNull()
  })

  it('sets total_items to the provided value', () => {
    const meta = buildMeta({ offset: 0, limit: 10, skip: 0, take: 10 }, 42)
    expect(meta.total_items).toBe(42)
  })
})
