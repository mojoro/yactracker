import { describe, it, expect } from 'vitest'
import { parseSort, toPrismaOrderBy } from '@/lib/sort'

describe('parseSort', () => {
  it('returns empty array for null', () => {
    expect(parseSort(null)).toEqual([])
  })

  it('returns empty array for undefined', () => {
    expect(parseSort(undefined)).toEqual([])
  })

  it('returns empty array for empty string', () => {
    expect(parseSort('')).toEqual([])
  })

  it('parses a single ascending field', () => {
    expect(parseSort('name')).toEqual([
      { field: 'name', direction: 'asc' },
    ])
  })

  it('parses a single descending field with - prefix', () => {
    expect(parseSort('-created_at')).toEqual([
      { field: 'created_at', direction: 'desc' },
    ])
  })

  it('parses multiple comma-separated fields', () => {
    expect(parseSort('name,-tuition')).toEqual([
      { field: 'name', direction: 'asc' },
      { field: 'tuition', direction: 'desc' },
    ])
  })

  it('trims whitespace around commas', () => {
    expect(parseSort(' name , -tuition ')).toEqual([
      { field: 'name', direction: 'asc' },
      { field: 'tuition', direction: 'desc' },
    ])
  })

  it('filters out empty segments from consecutive commas', () => {
    expect(parseSort('name,,tuition')).toEqual([
      { field: 'name', direction: 'asc' },
      { field: 'tuition', direction: 'asc' },
    ])
  })
})

describe('toPrismaOrderBy', () => {
  it('filters to only allowed fields', () => {
    const sort = parseSort('name,-tuition')
    const result = toPrismaOrderBy(sort, ['name', 'tuition'] as const)
    expect(result).toEqual([
      { name: 'asc' },
      { tuition: 'desc' },
    ])
  })

  it('returns fallback when no valid fields are present', () => {
    const sort = parseSort('unknown')
    const result = toPrismaOrderBy(sort, ['name'] as const)
    expect(result).toEqual([{ created_at: 'desc' }])
  })

  it('preserves order of valid fields', () => {
    const sort = parseSort('-tuition,name')
    const result = toPrismaOrderBy(sort, ['name', 'tuition'] as const)
    expect(result).toEqual([
      { tuition: 'desc' },
      { name: 'asc' },
    ])
  })

  it('keeps only valid fields when mixed with invalid ones', () => {
    const sort = parseSort('name,-bogus,tuition')
    const result = toPrismaOrderBy(sort, ['name', 'tuition'] as const)
    expect(result).toEqual([
      { name: 'asc' },
      { tuition: 'asc' },
    ])
  })
})
