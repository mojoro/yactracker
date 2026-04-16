import { describe, it, expect } from 'vitest'
import { buildQuery } from '@/lib/api'

describe('buildQuery', () => {
  it('returns empty string for empty object', () => {
    expect(buildQuery({})).toBe('')
  })

  it('filters out undefined values', () => {
    expect(buildQuery({ a: undefined, b: 'kept' })).toBe('?b=kept')
  })

  it('filters out null values', () => {
    expect(buildQuery({ a: null, b: 'kept' })).toBe('?b=kept')
  })

  it('filters out empty string values', () => {
    expect(buildQuery({ a: '', b: 'kept' })).toBe('?b=kept')
  })

  it('builds a single param', () => {
    expect(buildQuery({ key: 'value' })).toBe('?key=value')
  })

  it('builds multiple params', () => {
    const result = buildQuery({ category: 'opera', sort: '-name', limit: 10 })
    const url = new URL(`http://x${result}`)
    expect(url.searchParams.get('category')).toBe('opera')
    expect(url.searchParams.get('sort')).toBe('-name')
    expect(url.searchParams.get('limit')).toBe('10')
  })

  it('converts boolean true to "true"', () => {
    expect(buildQuery({ active: true })).toBe('?active=true')
  })

  it('converts number to string', () => {
    expect(buildQuery({ limit: 42 })).toBe('?limit=42')
  })
})
