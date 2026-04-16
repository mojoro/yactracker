import { describe, it, expect } from 'vitest'
import { toSlug } from '@/lib/slug'

describe('toSlug', () => {
  it('converts basic ASCII to lowercase hyphenated slug', () => {
    expect(toSlug('Aspen Music Festival')).toBe('aspen-music-festival')
  })

  it('strips diacritics', () => {
    expect(toSlug('Académie du Festival d\'Aix')).toBe('academie-du-festival-daix')
  })

  it('handles curly apostrophes', () => {
    expect(toSlug('Wolf Trap Opera\u2019s Academy')).toBe('wolf-trap-opera-s-academy')
  })

  it('trims leading and trailing whitespace', () => {
    expect(toSlug('  Tanglewood  ')).toBe('tanglewood')
  })

  it('collapses consecutive special characters to a single hyphen', () => {
    expect(toSlug('A & B --- C')).toBe('a-b-c')
  })

  it('returns empty string for empty input', () => {
    expect(toSlug('')).toBe('')
  })

  it('returns empty string for all-special-chars input', () => {
    expect(toSlug('---!!!')).toBe('')
  })
})
