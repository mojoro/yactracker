import Link from 'next/link'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { parsePagination, buildMeta, encodeCursor } from '@/lib/pagination'
import { parseSort, toPrismaOrderBy } from '@/lib/sort'
import { type Program, sortInstruments } from '@/lib/types'
import { ProgramCard } from '@/app/components/program-card'

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

const ALLOWED_SORT_FIELDS = ['name', 'tuition', 'application_deadline', 'created_at'] as const

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
    slug: row.slug,
    name: row.name,
    description: row.description,
    start_date: row.start_date ? row.start_date.toISOString() : null,
    end_date: row.end_date ? row.end_date.toISOString() : null,
    application_deadline: row.application_deadline ? row.application_deadline.toISOString() : null,
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

function formatAppFee(n: number | null): string {
  if (n === null) return '\u2014'
  if (n === 0) return 'Free'
  return `$${n.toLocaleString('en-US')}`
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
    'app_fee',
    'sort',
    'limit',
    'view',
  ]
  for (const k of keys) {
    const v = getString(params, k)
    if (v !== undefined && v !== '') qs.set(k, v)
  }
  if (newCursor) qs.set('cursor', newCursor)
  const qsStr = qs.toString()
  return qsStr ? `/programs?${qsStr}` : '/programs'
}

function viewLink(params: SearchParams, view: 'card' | 'list'): string {
  const qs = new URLSearchParams()
  const keys = [
    'q',
    'instrument_id',
    'category_id',
    'country',
    'offers_scholarship',
    'tuition_lower_than',
    'app_fee',
    'sort',
    'limit',
    'cursor',
  ]
  for (const k of keys) {
    const v = getString(params, k)
    if (v !== undefined && v !== '') qs.set(k, v)
  }
  if (view !== 'card') qs.set('view', view)
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

  const appFee = getString(params, 'app_fee')
  if (appFee === 'free') {
    andFilters.push({ OR: [{ application_fee: null }, { application_fee: 0 }] })
  } else if (appFee === 'paid') {
    andFilters.push({ application_fee: { gt: 0 } })
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

  const instruments = sortInstruments(allInstruments.filter((i) => usedInstrumentIds.has(i.id)))
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
  const currentAppFee = getString(params, 'app_fee') ?? ''
  const currentSort = sortParam
  const currentView = getString(params, 'view') === 'list' ? 'list' : 'card'

  const hasPrev = meta.prev !== null
  const hasNext = meta.next !== null
  const limit = pagination.limit
  const currentPage = Math.floor(pagination.offset / limit)
  const totalPages = Math.ceil(totalItems / limit)

  return (
    <main className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
      <header className="py-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Programs</h1>
        <p className="mt-1 text-base text-slate-500">
          Browse and filter young artist programs in classical music and opera.
        </p>
      </header>

      <form
        action="/programs"
        method="GET"
        className="mb-8 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5"
      >
        <div>
          <label
            htmlFor="q"
            className="mb-1.5 block text-xs font-semibold tracking-wide text-slate-500 uppercase"
          >
            Search
          </label>
          <input
            id="q"
            name="q"
            type="text"
            defaultValue={currentQ}
            placeholder="Search by name or description..."
            className="w-full rounded-lg border-0 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 transition-colors focus:bg-white focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label
              htmlFor="instrument_id"
              className="mb-1.5 block text-xs font-semibold tracking-wide text-slate-500 uppercase"
            >
              Instrument
            </label>
            <select
              id="instrument_id"
              name="instrument_id"
              defaultValue={currentInstrument}
              className="w-full rounded-lg border-0 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 transition-colors focus:bg-white focus:ring-2 focus:ring-brand-500"
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
            <label
              htmlFor="category_id"
              className="mb-1.5 block text-xs font-semibold tracking-wide text-slate-500 uppercase"
            >
              Category
            </label>
            <select
              id="category_id"
              name="category_id"
              defaultValue={currentCategory}
              className="w-full rounded-lg border-0 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 transition-colors focus:bg-white focus:ring-2 focus:ring-brand-500"
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
            <label
              htmlFor="country"
              className="mb-1.5 block text-xs font-semibold tracking-wide text-slate-500 uppercase"
            >
              Country
            </label>
            <select
              id="country"
              name="country"
              defaultValue={currentCountry}
              className="w-full rounded-lg border-0 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 transition-colors focus:bg-white focus:ring-2 focus:ring-brand-500"
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
            <label
              htmlFor="tuition_lower_than"
              className="mb-1.5 block text-xs font-semibold tracking-wide text-slate-500 uppercase"
            >
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
              className="w-full rounded-lg border-0 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 transition-colors focus:bg-white focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label
              htmlFor="sort"
              className="mb-1.5 block text-xs font-semibold tracking-wide text-slate-500 uppercase"
            >
              Sort by
            </label>
            <select
              id="sort"
              name="sort"
              defaultValue={currentSort}
              className="w-full rounded-lg border-0 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 transition-colors focus:bg-white focus:ring-2 focus:ring-brand-500"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="app_fee"
              className="mb-1.5 block text-xs font-semibold tracking-wide text-slate-500 uppercase"
            >
              Application fee
            </label>
            <select
              id="app_fee"
              name="app_fee"
              defaultValue={currentAppFee}
              className="w-full rounded-lg border-0 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 transition-colors focus:bg-white focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Any</option>
              <option value="free">Free application</option>
              <option value="paid">Has application fee</option>
            </select>
          </div>

          <div className="flex items-center pt-6">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                name="offers_scholarship"
                value="true"
                defaultChecked={currentScholarship}
                className="h-4 w-4 rounded border-slate-300 accent-brand-600"
              />
              Offers scholarship
            </label>
          </div>
        </div>
        {currentView !== 'card' && <input type="hidden" name="view" value={currentView} />}

        <div className="mt-5 flex items-center gap-4 border-t border-slate-100 pt-4">
          <button
            type="submit"
            className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Apply filters
          </button>
          <Link
            href="/programs"
            className="text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            Clear
          </Link>
          <div className="ml-auto flex items-center overflow-hidden rounded-lg ring-1 ring-slate-200">
            <Link
              href={viewLink(params, 'card')}
              className={`inline-flex items-center px-2.5 py-2 transition-colors ${
                currentView === 'card'
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-slate-500 hover:bg-slate-50'
              }`}
              aria-label="Card view"
              title="Card view"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="1" y="1" width="6" height="6" rx="1" fill="currentColor" />
                <rect x="9" y="1" width="6" height="6" rx="1" fill="currentColor" />
                <rect x="1" y="9" width="6" height="6" rx="1" fill="currentColor" />
                <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" />
              </svg>
            </Link>
            <Link
              href={viewLink(params, 'list')}
              className={`inline-flex items-center px-2.5 py-2 transition-colors ${
                currentView === 'list'
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-slate-500 hover:bg-slate-50'
              }`}
              aria-label="List view"
              title="List view"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="1" y="1.5" width="14" height="2.5" rx="0.5" fill="currentColor" />
                <rect x="1" y="6.75" width="14" height="2.5" rx="0.5" fill="currentColor" />
                <rect x="1" y="12" width="14" height="2.5" rx="0.5" fill="currentColor" />
              </svg>
            </Link>
          </div>
        </div>
      </form>

      <p className="mt-6 mb-2 text-sm text-slate-500">
        {meta.total_items} result{meta.total_items === 1 ? '' : 's'}
      </p>

      {programs.length === 0 ? (
        <div className="rounded-xl bg-white p-16 text-center shadow-sm ring-1 ring-slate-900/5">
          <p className="text-lg font-medium text-slate-700">No programs match your filters.</p>
          <p className="mt-2 text-sm text-slate-500">
            Try adjusting your search criteria or{' '}
            <Link
              href="/programs"
              className="font-medium text-brand-600 transition-colors hover:text-brand-700"
            >
              clear all filters
            </Link>{' '}
            to start over.
          </p>
        </div>
      ) : (
        <>
          {currentView === 'list' ? (
            <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-900/5">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left">
                      <th className="px-4 py-3 font-semibold text-slate-700">Program</th>
                      <th className="hidden px-4 py-3 font-semibold text-slate-700 sm:table-cell">
                        Location
                      </th>
                      <th className="hidden px-4 py-3 font-semibold text-slate-700 md:table-cell">
                        Categories
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-700">Tuition</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-700">App fee</th>
                      <th className="hidden px-4 py-3 font-semibold text-slate-700 lg:table-cell">
                        Deadline
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-700">Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {programs.map((p) => (
                      <ProgramRow key={p.id} program={p} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {programs.map((p) => (
                <ProgramCard key={p.id} program={p} />
              ))}
            </div>
          )}

          <nav className="mt-6 flex items-center justify-center gap-1">
            {hasPrev ? (
              <Link
                href={cursorLink(params, meta.prev)}
                className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
              >
                Previous
              </Link>
            ) : (
              <span className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-slate-300">
                Previous
              </span>
            )}

            {Array.from({ length: totalPages }, (_, i) => {
              const isActive = i === currentPage
              const cursor = i === 0 ? null : encodeCursor({ offset: i * limit })
              return (
                <Link
                  key={i}
                  href={cursorLink(params, cursor)}
                  className={`inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {i + 1}
                </Link>
              )
            })}

            {hasNext ? (
              <Link
                href={cursorLink(params, meta.next)}
                className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
              >
                Next
              </Link>
            ) : (
              <span className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-slate-300">
                Next
              </span>
            )}
          </nav>
        </>
      )}
    </main>
  )
}

function ProgramRow({ program }: { program: Program }) {
  const locationText =
    program.locations.length > 0
      ? program.locations.map((l) => `${l.city}, ${l.country}`).join(' / ')
      : 'TBD'

  const shownCategories = program.categories.slice(0, 2)
  const extraCategories = program.categories.length - shownCategories.length

  const hasRating = program.review_count > 0 && program.average_rating !== null

  return (
    <tr className="transition-colors hover:bg-slate-50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Link
            href={`/programs/${program.slug}`}
            className="font-medium text-slate-900 transition-colors hover:text-brand-600"
          >
            {program.name}
          </Link>
          {program.offers_scholarship && (
            <span className="rounded-full bg-success-50 px-1.5 py-0.5 text-[10px] font-semibold text-success-700">
              Aid
            </span>
          )}
        </div>
      </td>
      <td className="hidden px-4 py-3 text-slate-500 sm:table-cell">{locationText}</td>
      <td className="hidden px-4 py-3 md:table-cell">
        {shownCategories.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {shownCategories.map((c) => (
              <span
                key={c.id}
                className="rounded-full bg-tag-50 px-2 py-0.5 text-xs font-medium text-tag-700"
              >
                {c.name}
              </span>
            ))}
            {extraCategories > 0 && (
              <span className="rounded-full bg-tag-50 px-2 py-0.5 text-xs font-medium text-tag-700">
                +{extraCategories}
              </span>
            )}
          </div>
        ) : (
          <span className="text-slate-400">{'\u2014'}</span>
        )}
      </td>
      <td className="px-4 py-3 text-right font-medium whitespace-nowrap text-slate-900">
        {formatTuition(program.tuition)}
      </td>
      <td className="px-4 py-3 text-right whitespace-nowrap text-slate-600">
        {formatAppFee(program.application_fee)}
      </td>
      <td className="hidden px-4 py-3 whitespace-nowrap text-slate-500 lg:table-cell">
        {formatDate(program.application_deadline)}
      </td>
      <td className="px-4 py-3 text-right whitespace-nowrap">
        {hasRating ? (
          <span className="inline-flex items-center gap-1">
            <span className="text-accent-500">&#9733;</span>
            <span className="font-medium text-slate-700">{program.average_rating!.toFixed(1)}</span>
            <span className="text-slate-400">({program.review_count})</span>
          </span>
        ) : (
          <span className="text-slate-400">No reviews</span>
        )}
      </td>
    </tr>
  )
}
