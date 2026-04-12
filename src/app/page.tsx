import Link from 'next/link'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type { Program } from '@/lib/types'
import { SubscribeForm } from './subscribe/subscribe-form'

function formatTuition(n: number | null): string {
  if (n === null || n === 0) return 'Free'
  return `$${n.toLocaleString('en-US')}`
}

function formatDate(iso: string | null): string {
  if (!iso) return '\u2014'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso))
}

function formatLocations(program: Program): string {
  if (program.locations.length === 0) return '\u2014'
  return program.locations.map((l) => `${l.city}, ${l.country}`).join(' \u00b7 ')
}

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

async function attachRatingStats(
  programs: ProgramWithRelations[],
): Promise<Program[]> {
  if (programs.length === 0) return []
  const ids = programs.map((p) => p.id)
  const grouped = await prisma.review.groupBy({
    by: ['program_id'],
    where: { program_id: { in: ids } },
    _avg: { rating: true },
    _count: { rating: true },
  })
  const statsMap = new Map(
    grouped.map((g) => [g.program_id, { avg: g._avg.rating, count: g._count.rating }]),
  )
  return programs.map((p) =>
    formatProgram(p, statsMap.get(p.id) ?? { avg: null, count: 0 }),
  )
}

function RatingDisplay({ avg, count }: { avg: number | null; count: number }) {
  if (count === 0 || avg === null) {
    return <span className="text-xs text-slate-400">No reviews</span>
  }
  return (
    <span className="flex items-center gap-1">
      <svg
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-4 w-4 text-accent-500"
        aria-hidden="true"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      <span className="text-sm font-semibold text-slate-900">{avg.toFixed(1)}</span>
      <span className="text-xs text-slate-400">({count})</span>
    </span>
  )
}

function ProgramCard({ program }: { program: Program }) {
  const visibleCategories = program.categories.slice(0, 3)
  const extraCategoryCount = program.categories.length - visibleCategories.length

  return (
    <article className="rounded-xl bg-white shadow-sm ring-1 ring-slate-900/5 transition hover:shadow-md hover:-translate-y-0.5">
      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {visibleCategories.map((c) => (
              <span
                key={c.id}
                className="rounded-full bg-tag-50 px-2.5 py-0.5 text-xs font-medium text-tag-700"
              >
                {c.name}
              </span>
            ))}
            {extraCategoryCount > 0 && (
              <span className="rounded-full bg-tag-50 px-2.5 py-0.5 text-xs font-medium text-tag-700">
                +{extraCategoryCount}
              </span>
            )}
          </div>
          {program.offers_scholarship && (
            <span className="shrink-0 rounded-full bg-success-50 px-2 py-0.5 text-xs font-medium text-success-700 ring-1 ring-success-600/20">
              Scholarship
            </span>
          )}
        </div>

        <h3 className="mt-3 text-base font-semibold leading-snug text-slate-900">
          <Link
            href={`/programs/${program.id}`}
            className="hover:text-brand-600 transition-colors"
          >
            {program.name}
          </Link>
        </h3>

        <p className="mt-1.5 text-sm text-slate-500">
          {formatLocations(program)}
        </p>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <div className="flex items-center gap-1 text-sm">
            <span className="font-medium text-slate-900">
              {formatTuition(program.tuition)}
            </span>
            <span className="text-slate-300">&middot;</span>
            <span className="text-slate-500">
              {formatDate(program.application_deadline)}
            </span>
          </div>
          <RatingDisplay avg={program.average_rating} count={program.review_count} />
        </div>
      </div>
    </article>
  )
}

export default async function Home() {
  const today = new Date()

  const [upcomingRows, categoryRows] = await Promise.all([
    prisma.program.findMany({
      where: { application_deadline: { gte: today } },
      orderBy: { application_deadline: 'asc' },
      take: 6,
      include: PROGRAM_INCLUDE,
    }),
    prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ])

  let featured: Program[]
  if (upcomingRows.length > 0) {
    featured = await attachRatingStats(upcomingRows)
  } else {
    const fallbackRows = await prisma.program.findMany({
      orderBy: { created_at: 'desc' },
      take: 6,
      include: PROGRAM_INCLUDE,
    })
    featured = await attachRatingStats(fallbackRows)
  }

  const categories = categoryRows

  return (
    <>
      {/* Hero */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="max-w-3xl text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">
            Find and review young artist programs in classical music and opera
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-600">
            YACTracker is a Young Artist Community where singers and
            instrumentalists browse summer festivals, academies, and young
            artist programs — and share honest reviews from past participants.
          </p>

          <form
            action="/programs"
            method="GET"
            className="mt-8 flex max-w-xl flex-col gap-3 sm:flex-row sm:gap-2"
          >
            <label htmlFor="home-search" className="sr-only">
              Search programs
            </label>
            <input
              id="home-search"
              type="text"
              name="q"
              placeholder="Search programs..."
              className="flex-1 rounded-full border-0 bg-slate-100 px-5 py-3 text-base ring-1 ring-slate-200 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Featured programs */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Featured programs
            </h2>
            <Link
              href="/programs"
              className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
            >
              Browse all &rarr;
            </Link>
          </div>

          {featured.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">No programs available yet.</p>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((program) => (
                <ProgramCard key={program.id} program={program} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Browse by category */}
      <section className="pb-16 pt-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Browse by category
          </h2>

          {categories.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">No categories available.</p>
          ) : (
            <div className="mt-6 flex flex-wrap gap-3">
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/programs?category_id=${c.id}`}
                  className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-900/5 transition hover:shadow-md hover:text-brand-600"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Mailing list CTA */}
      <section className="pb-16 pt-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl bg-brand-50 p-8 sm:p-10">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Stay in the loop
            </h2>
            <p className="mt-2 max-w-xl text-sm text-slate-600">
              Get notified about new programs, upcoming deadlines, and community
              updates. No spam — just the good stuff.
            </p>
            <div className="mt-5 max-w-md">
              <SubscribeForm variant="light" />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
