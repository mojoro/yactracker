import { describe, it, expect } from 'vitest'
import { sortInstruments } from '@/lib/types'

describe('sortInstruments', () => {
  it('pins Voice first regardless of input position', () => {
    const input = [
      { name: 'Violin' },
      { name: 'Cello' },
      { name: 'Voice' },
      { name: 'Flute' },
    ]
    const result = sortInstruments(input)
    expect(result[0]).toEqual({ name: 'Voice' })
  })

  it('sorts other instruments alphabetically', () => {
    const input = [
      { name: 'Violin' },
      { name: 'Cello' },
      { name: 'Voice' },
      { name: 'Flute' },
      { name: 'Oboe' },
    ]
    const result = sortInstruments(input)
    expect(result.map((i) => i.name)).toEqual([
      'Voice',
      'Cello',
      'Flute',
      'Oboe',
      'Violin',
    ])
  })

  it('returns empty array for empty input', () => {
    expect(sortInstruments([])).toEqual([])
  })

  it('handles array with only Voice', () => {
    const result = sortInstruments([{ name: 'Voice' }])
    expect(result).toEqual([{ name: 'Voice' }])
  })

  it('does not mutate the original array', () => {
    const input = [
      { name: 'Violin' },
      { name: 'Voice' },
      { name: 'Cello' },
    ]
    const copy = [...input]
    sortInstruments(input)
    expect(input).toEqual(copy)
  })
})
