import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    program: { findMany: vi.fn() },
    programCandidate: { create: vi.fn() },
  },
}))

import { prisma } from '@/lib/prisma'
import { createCandidate } from '@/lib/import/candidate'
import type { ExtractionSuccess } from '@/lib/import/extractor'

const mockFindMany = prisma.program.findMany as ReturnType<typeof vi.fn>
const mockCreate = prisma.programCandidate.create as ReturnType<typeof vi.fn>

function makeExtraction(overrides: Partial<ExtractionSuccess['program']> = {}): ExtractionSuccess {
  return {
    kind: 'success',
    confidence: 0.9,
    model: 'test',
    tokens_in: 100,
    tokens_out: 50,
    program: {
      name: 'Aspen Music Festival',
      description: 'A summer program',
      start_date: null,
      end_date: null,
      application_deadline: null,
      tuition: null,
      application_fee: null,
      age_min: null,
      age_max: null,
      offers_scholarship: false,
      application_url: null,
      program_url: null,
      categories: [],
      instruments: [],
      locations: [],
      auditions: [],
      ...overrides,
    },
  }
}

beforeEach(() => {
  mockFindMany.mockReset()
  mockCreate.mockReset()
  mockCreate.mockResolvedValue({ id: 'candidate-1' })
})

describe('createCandidate', () => {
  it('returns null match when no programs match by name', async () => {
    mockFindMany.mockResolvedValue([])

    const result = await createCandidate(makeExtraction(), 'src-1', 'run-1')

    expect(result.matched_program_id).toBeNull()
    expect(result.candidate_id).toBe('candidate-1')
  })

  it('matches single program by name', async () => {
    mockFindMany.mockResolvedValue([
      {
        id: 'prog-1',
        name: 'Aspen Music Festival',
        updated_at: new Date(),
        program_locations: [],
      },
    ])

    const result = await createCandidate(makeExtraction(), 'src-1', 'run-1')

    expect(result.matched_program_id).toBe('prog-1')
  })

  it('prefers program with matching city when multiple name matches', async () => {
    mockFindMany.mockResolvedValue([
      {
        id: 'prog-1',
        name: 'Aspen Music Festival',
        updated_at: new Date('2024-01-01'),
        program_locations: [{ location: { city: 'New York', country: 'US' } }],
      },
      {
        id: 'prog-2',
        name: 'Aspen Music Festival',
        updated_at: new Date('2023-01-01'),
        program_locations: [{ location: { city: 'Aspen', country: 'US' } }],
      },
    ])

    const extraction = makeExtraction({
      locations: [{ city: 'Aspen', country: 'US', state: null }],
    })
    const result = await createCandidate(extraction, 'src-1', 'run-1')

    expect(result.matched_program_id).toBe('prog-2')
  })

  it('falls back to most recently updated when no city overlap', async () => {
    const newer = new Date('2025-06-01')
    const older = new Date('2020-01-01')
    mockFindMany.mockResolvedValue([
      {
        id: 'prog-old',
        name: 'Aspen Music Festival',
        updated_at: older,
        program_locations: [],
      },
      {
        id: 'prog-new',
        name: 'Aspen Music Festival',
        updated_at: newer,
        program_locations: [],
      },
    ])

    const result = await createCandidate(makeExtraction(), 'src-1', 'run-1')

    expect(result.matched_program_id).toBe('prog-new')
  })

  it('picks most recently updated when multiple city matches', async () => {
    mockFindMany.mockResolvedValue([
      {
        id: 'prog-older',
        name: 'Aspen Music Festival',
        updated_at: new Date('2022-01-01'),
        program_locations: [{ location: { city: 'Aspen', country: 'US' } }],
      },
      {
        id: 'prog-newer',
        name: 'Aspen Music Festival',
        updated_at: new Date('2024-06-01'),
        program_locations: [{ location: { city: 'Aspen', country: 'US' } }],
      },
    ])

    const extraction = makeExtraction({
      locations: [{ city: 'Aspen', country: 'US', state: null }],
    })
    const result = await createCandidate(extraction, 'src-1', 'run-1')

    expect(result.matched_program_id).toBe('prog-newer')
  })

  it('normalizes extracted name case-insensitively for matching query', async () => {
    mockFindMany.mockResolvedValue([
      {
        id: 'prog-1',
        name: 'Aspen Music Festival',
        updated_at: new Date(),
        program_locations: [],
      },
    ])

    // Name with different casing — findMany mock still returns match because
    // the Prisma query uses mode:'insensitive'; we verify findMany was called
    const extraction = makeExtraction({ name: '  ASPEN  MUSIC  FESTIVAL  ' })
    const result = await createCandidate(extraction, 'src-1', 'run-1')

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          name: expect.objectContaining({ mode: 'insensitive' }),
        }),
      }),
    )
    expect(result.matched_program_id).toBe('prog-1')
  })

  it('returns null match when extracted name is empty after normalization', async () => {
    // An all-whitespace name normalizes to '' — findMatchingProgram returns null
    // without querying the DB
    const extraction = makeExtraction({ name: '   ' })
    const result = await createCandidate(extraction, 'src-1', 'run-1')

    expect(mockFindMany).not.toHaveBeenCalled()
    expect(result.matched_program_id).toBeNull()
  })

  it('creates candidate in pending status with extraction data', async () => {
    mockFindMany.mockResolvedValue([])
    const extraction = makeExtraction()

    await createCandidate(extraction, 'src-1', 'run-1')

    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        import_source_id: 'src-1',
        import_run_id: 'run-1',
        status: 'pending',
        confidence: 0.9,
      }),
      select: { id: true },
    })
  })

  it('stores matched program id on candidate when match found', async () => {
    mockFindMany.mockResolvedValue([
      {
        id: 'prog-match',
        name: 'Aspen Music Festival',
        updated_at: new Date(),
        program_locations: [],
      },
    ])

    await createCandidate(makeExtraction(), 'src-1', 'run-1')

    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ program_id: 'prog-match' }),
      select: { id: true },
    })
  })

  it('stores null program id on candidate when no match found', async () => {
    mockFindMany.mockResolvedValue([])

    await createCandidate(makeExtraction(), 'src-1', 'run-1')

    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ program_id: null }),
      select: { id: true },
    })
  })

  it('returns candidate id from created record', async () => {
    mockFindMany.mockResolvedValue([])
    mockCreate.mockResolvedValue({ id: 'unique-candidate-id' })

    const result = await createCandidate(makeExtraction(), 'src-1', 'run-1')

    expect(result.candidate_id).toBe('unique-candidate-id')
  })
})
