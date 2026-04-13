import Link from 'next/link'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type { Program } from '@/lib/types'
import { SubscribeForm } from './subscribe/subscribe-form'
import { ProgramCard } from './components/program-card'


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
  if (upcomingRows.length >= 3) {
    featured = await attachRatingStats(upcomingRows)
  } else {
    // Not enough upcoming deadlines to fill the grid — show recent programs
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
            A community directory where singers and instrumentalists browse
            summer festivals, academies, and young artist programs, with
            honest reviews from past participants.
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

          {/* Interest signup CTA */}
          <div className="mt-10 rounded-xl bg-brand-50 p-8 sm:p-10 text-left sm:text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Should we keep building this?
            </h2>
            <p className="sm:mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-600">
              This is an early-stage project. We're trying to figure out
              if the young artist community actually wants a dedicated directory
              and review platform. If this is something you'd use, drop your
              email below. It helps us know there's real interest.
            </p>
            <div className="sm:mx-auto mt-6 max-w-sm">
              <SubscribeForm variant="light" />
            </div>
          </div>
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
    </>
  )
}
