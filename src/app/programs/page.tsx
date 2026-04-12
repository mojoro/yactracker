import Link from 'next/link'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { parsePagination, buildMeta } from '@/lib/pagination'
import { parseSort, toPrismaOrderBy } from '@/lib/sort'
import type { Program } from '@/lib/types'

type SearchParams = { [key: string]: string | string[] | undefined }

const SORT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '-created_at', label: 'Newest' },
  { value: 'name', label: 'Name (A→Z)' },
  { value: '-name', label: 'Name (Z→A)' },
  { value: 'application_deadline', label: 'Deadline (soonest)' },
  { value: '-application_deadline', label: 'Deadline (latest)' },
  { value: 'tuition', label: 'Tuition (low→high)' },
  { value: '-tuition', label: 'Tuition (high→low)' },
]

const ALLOWED_SORT_FIELDS = [
  'name',
  'tuition',
  'application_deadline',
  'created_at',
] as const

const PROGRAM_INCLUDE = {
  program_instruments: { include: { instrument: true } },
  program_categories: { include: { category: true } },
  program_locations: { include: { location: true } },
} as const

type ProgramWithRelations = Prisma.ProgramGetPayload<{
  include: typeof PROGRAM_INCLUDE
}>

function formatProgram(
  row: ProgramWithRelations,
  stats: { avg: number | null; count: number },
): Program {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    start_date: row.start_date ? row.start_date.toISOString() : null,
    end_date: row.end_date ? row.end_date.toISOString() : null,
    application_deadline: row.application_deadline
      ? row.application_deadline.toISOString()
      : null,
    tuition: row.tuition,
    application_fee: row.application_fee,
    age_min: row.age_min,
    age_max: row.age_max,
    offers_scholarship: row.offers_scholarship,
    application_url: row.application_url,
    program_url: row.program_url,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
    instruments: row.program_instruments.map((pi) => ({
      id: pi.instrument.id,
      name: pi.instrument.name,
    })),
    categories: row.program_categories.map((pc) => ({
      id: pc.category.id,
      name: pc.category.name,
    })),
    locations: row.program_locations.map((pl) => ({
      id: pl.location.id,
      city: pl.location.city,
      country: pl.location.country,
      state: pl.location.state,
      address: pl.location.address,
    })),
    average_rating: stats.avg === null ? null : Math.round(stats.avg * 10) / 10,
    review_count: stats.count,
  }
}

function getString(params: SearchParams, key: string): string | undefined {
  const v = params[key]
  if (v === undefined) return undefined
  if (Array.isArray(v)) return v[0]
  return v
}

function formatTuition(n: number | null): string {
  if (n === null) return 'Not listed'
  if (n === 0) return 'Free'
  return `$${n.toLocaleString('en-US')}`
}

function formatDate(iso: string | null): string {
  if (!iso) return 'TBD'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'TBD'
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatRating(avg: number | null, count: number): string {
  if (!count || avg === null) return 'No reviews yet'
  return `★ ${avg.toFixed(1)} (${count} review${count === 1 ? '' : 's'})`
}

function cursorLink(params: SearchParams, newCursor: string | null): string {
  const qs = new URLSearchParams()
  const keys = [
    'q',
    'instrument_id',
    'category_id',
    'country',
    'offers_scholarship',
    'tuition_lower_than',
    'sort',
    'limit',
  ]
  for (const k of keys) {
    const v = getString(params, k)
    if (v !== undefined && v !== '') qs.set(k, v)
  }
  if (newCursor) qs.set('cursor', newCursor)
  const qsStr = qs.toString()
  return qsStr ? `/programs?${qsStr}` : '/programs'
}

function parseCsvUuids(value: string | undefined): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
}

export default async function ProgramsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams

  // --- Build Prisma where clause (mirrors GET /api/programs) ---
  const where: Prisma.ProgramWhereInput = {}
  const andFilters: Prisma.ProgramWhereInput[] = []

  const instrumentIds = parseCsvUuids(getString(params, 'instrument_id'))
  if (instrumentIds.length > 0) {
    andFilters.push({
      program_instruments: { some: { instrument_id: { in: instrumentIds } } },
    })
  }

  const categoryIds = parseCsvUuids(getString(params, 'category_id'))
  if (categoryIds.length > 0) {
    andFilters.push({
      program_categories: { some: { category_id: { in: categoryIds } } },
    })
  }

  const country = getString(params, 'country')
  if (country) {
    andFilters.push({
      program_locations: { some: { location: { country } } },
    })
  }

  const tuitionLowerThan = getString(params, 'tuition_lower_than')
  if (tuitionLowerThan !== undefined && tuitionLowerThan !== '') {
    const n = Number.parseFloat(tuitionLowerThan)
    if (Number.isFinite(n)) {
      andFilters.push({ tuition: { lte: n } })
    }
  }

  const offersScholarship = getString(params, 'offers_scholarship')
  if (offersScholarship === 'true') {
    andFilters.push({ offers_scholarship: true })
  }

  const q = getString(params, 'q')
  if (q) {
    andFilters.push({
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ],
    })
  }

  if (andFilters.length > 0) {
    where.AND = andFilters
  }

  // --- Sort + pagination ---
  const sortParam = getString(params, 'sort') ?? '-created_at'
  const orderBy = toPrismaOrderBy(parseSort(sortParam), ALLOWED_SORT_FIELDS, {
    created_at: 'desc',
  })

  const urlParams = new URLSearchParams()
  const cursorParam = getString(params, 'cursor')
  if (cursorParam) urlParams.set('cursor', cursorParam)
  urlParams.set('limit', getString(params, 'limit') ?? '12')
  const pagination = parsePagination(urlParams)

  // --- Fetch filtered programs + total count ---
  const [programRows, totalItems] = await Promise.all([
    prisma.program.findMany({
      where,
      orderBy,
      skip: pagination.skip,
      take: pagination.take,
      include: PROGRAM_INCLUDE,
    }),
    prisma.program.count({ where }),
  ])

  // Attach rating stats
  const programIds = programRows.map((p) => p.id)
  const statsMap = new Map<string, { avg: number | null; count: number }>()
  if (programIds.length > 0) {
    const grouped = await prisma.review.groupBy({
      by: ['program_id'],
      where: { program_id: { in: programIds } },
      _avg: { rating: true },
      _count: { rating: true },
    })
    for (const g of grouped) {
      statsMap.set(g.program_id, { avg: g._avg.rating, count: g._count.rating })
    }
  }
  const programs: Program[] = programRows.map((p) =>
    formatProgram(p, statsMap.get(p.id) ?? { avg: null, count: 0 }),
  )
  const meta = buildMeta(pagination, totalItems)

  // --- Fetch "all programs" for filter dropdown options ---
  const allProgramRows = await prisma.program.findMany({
    take: 100,
    include: PROGRAM_INCLUDE,
  })

  const usedInstrumentIds = new Set<string>()
  const usedCategoryIds = new Set<string>()
  const usedCountries = new Set<string>()
  for (const p of allProgramRows) {
    for (const pi of p.program_instruments) usedInstrumentIds.add(pi.instrument.id)
    for (const pc of p.program_categories) usedCategoryIds.add(pc.category.id)
    for (const pl of p.program_locations) usedCountries.add(pl.location.country)
  }

  const [allInstruments, allCategories, allLocations] = await Promise.all([
    prisma.instrument.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.category.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.location.findMany({
      orderBy: [{ country: 'asc' }, { city: 'asc' }],
      select: { id: true, city: true, country: true, state: true, address: true },
    }),
  ])

  const instruments = allInstruments.filter((i) => usedInstrumentIds.has(i.id))
  const categories = allCategories.filter((c) => usedCategoryIds.has(c.id))
  const countries = allLocations
    .map((l) => l.country)
    .filter((c, idx, arr) => usedCountries.has(c) && arr.indexOf(c) === idx)
    .sort()

  const currentQ = getString(params, 'q') ?? ''
  const currentInstrument = getString(params, 'instrument_id') ?? ''
  const currentCategory = getString(params, 'category_id') ?? ''
  const currentCountry = getString(params, 'country') ?? ''
  const currentScholarship = getString(params, 'offers_scholarship') === 'true'
  const currentTuition = getString(params, 'tuition_lower_than') ?? ''
  const currentSort = sortParam

  const hasPrev = meta.prev !== null
  const hasNext = meta.next !== null

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Programs</h1>
        <p className="mt-1 text-sm text-gray-600">
          Browse and filter young artist programs.
        </p>
      </header>

      <form
        action="/programs"
        method="GET"
        className="mb-6 rounded-lg border border-gray-200 bg-white p-4"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="lg:col-span-3">
            <label htmlFor="q" className="block text-sm font-medium text-gray-700">
              Search
            </label>
            <input
              id="q"
              name="q"
              type="text"
              defaultValue={currentQ}
              placeholder="Search by name or description..."
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="instrument_id" className="block text-sm font-medium text-gray-700">
              Instrument
            </label>
            <select
              id="instrument_id"
              name="instrument_id"
              defaultValue={currentInstrument}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
            >
              <option value="">All instruments</option>
              {instruments.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="category_id" className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              id="category_id"
              name="category_id"
              defaultValue={currentCategory}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700">
              Country
            </label>
            <select
              id="country"
              name="country"
              defaultValue={currentCountry}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
            >
              <option value="">All countries</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="tuition_lower_than" className="block text-sm font-medium text-gray-700">
              Max tuition (USD)
            </label>
            <input
              id="tuition_lower_than"
              name="tuition_lower_than"
              type="number"
              min="0"
              step="1"
              defaultValue={currentTuition}
              placeholder="e.g. 5000"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="sort" className="block text-sm font-medium text-gray-700">
              Sort by
            </label>
            <select
              id="sort"
              name="sort"
              defaultValue={currentSort}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                name="offers_scholarship"
                value="true"
                defaultChecked={currentScholarship}
                className="h-4 w-4 rounded border-gray-300"
              />
              Offers scholarship
            </label>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="submit"
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Apply filters
          </button>
          <Link
            href="/programs"
            className="text-sm text-gray-600 underline hover:text-gray-900"
          >
            Clear
          </Link>
          <span className="ml-auto text-sm text-gray-500">
            {meta.total_items} result{meta.total_items === 1 ? '' : 's'}
          </span>
        </div>
      </form>

      {programs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-gray-700">No programs match your filters.</p>
          <Link
            href="/programs"
            className="mt-3 inline-block text-sm text-gray-900 underline hover:text-gray-600"
          >
            Clear filters
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {programs.map((p) => (
              <ProgramCard key={p.id} program={p} />
            ))}
          </div>

          <nav className="mt-8 flex items-center justify-between border-t border-gray-200 pt-4">
            {hasPrev ? (
              <Link
                href={cursorLink(params, meta.prev)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                ← Previous
              </Link>
            ) : (
              <span className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-400">
                ← Previous
              </span>
            )}

            <span className="text-sm text-gray-600">
              {totalItems} total
            </span>

            {hasNext ? (
              <Link
                href={cursorLink(params, meta.next)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                Next →
              </Link>
            ) : (
              <span className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-400">
                Next →
              </span>
            )}
          </nav>
        </>
      )}
    </main>
  )
}

function ProgramCard({ program }: { program: Program }) {
  const locationText =
    program.locations.length > 0
      ? program.locations.map((l) => `${l.city}, ${l.country}`).join(' • ')
      : 'Location TBD'

  const shownInstruments = program.instruments.slice(0, 3)
  const extraInstruments = program.instruments.length - shownInstruments.length

  const shownCategories = program.categories.slice(0, 3)
  const extraCategories = program.categories.length - shownCategories.length

  return (
    <article className="flex flex-col rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-400 hover:shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">
        <Link href={`/programs/${program.id}`} className="hover:underline">
          {program.name}
        </Link>
      </h2>
      <p className="mt-1 text-sm text-gray-600">{locationText}</p>

      {(shownCategories.length > 0 || shownInstruments.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {shownCategories.map((c) => (
            <span
              key={c.id}
              className="rounded-full bg-gray-900 px-2 py-0.5 text-xs font-medium text-white"
            >
              {c.name}
            </span>
          ))}
          {extraCategories > 0 && (
            <span className="rounded-full bg-gray-700 px-2 py-0.5 text-xs font-medium text-white">
              +{extraCategories}
            </span>
          )}
          {shownInstruments.map((i) => (
            <span
              key={i.id}
              className="rounded-full border border-gray-300 px-2 py-0.5 text-xs text-gray-700"
            >
              {i.name}
            </span>
          ))}
          {extraInstruments > 0 && (
            <span className="rounded-full border border-gray-300 px-2 py-0.5 text-xs text-gray-700">
              +{extraInstruments}
            </span>
          )}
        </div>
      )}

      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-wide text-gray-500">Tuition</dt>
          <dd className="text-gray-900">{formatTuition(program.tuition)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-gray-500">Deadline</dt>
          <dd className="text-gray-900">{formatDate(program.application_deadline)}</dd>
        </div>
      </dl>

      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-sm">
        <span className="text-gray-700">
          {formatRating(program.average_rating, program.review_count)}
        </span>
        {program.offers_scholarship && (
          <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
            Scholarship
          </span>
        )}
      </div>
    </article>
  )
}
