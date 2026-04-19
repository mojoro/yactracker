import Link from 'next/link'
import { cookies } from 'next/headers'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type { Program } from '@/lib/types'
import { SubscribeForm } from './subscribe/subscribe-form'
import { ProgramCard } from './components/program-card'
import { PlatformPoll } from './components/platform-poll'
import { PLATFORMS, type Platform } from './components/platform-poll-constants'

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

async function attachRatingStats(programs: ProgramWithRelations[]): Promise<Program[]> {
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
  return programs.map((p) => formatProgram(p, statsMap.get(p.id) ?? { avg: null, count: 0 }))
}

export default async function Home() {
  const [recentRows, categoryRows, platformGroups, cookieStore] = await Promise.all([
    prisma.program.findMany({
      orderBy: { updated_at: 'desc' },
      take: 6,
      include: PROGRAM_INCLUDE,
    }),
    prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
    prisma.platformVote.groupBy({
      by: ['platform'],
      _count: { _all: true },
    }),
    cookies(),
  ])

  const initialCounts: Record<Platform, number> = {
    facebook: 0,
    instagram: 0,
    discord: 0,
    reddit: 0,
    other: 0,
  }
  for (const row of platformGroups) {
    if ((PLATFORMS as readonly string[]).includes(row.platform)) {
      initialCounts[row.platform as Platform] = row._count._all
    }
  }

  const votedRaw = cookieStore.get('platform_votes')?.value
  let initialVoted: Platform[] = []
  if (votedRaw) {
    try {
      const parsed: unknown = JSON.parse(votedRaw)
      if (Array.isArray(parsed)) {
        initialVoted = parsed.filter((v): v is Platform =>
          (PLATFORMS as readonly string[]).includes(v),
        )
      }
    } catch {
      // malformed cookie — treat as no votes
    }
  }

  const recent = await attachRatingStats(recentRows)
  const categories = categoryRows

  return (
    <>
      {/* Hero */}
      <section className="bg-white py-12 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            A free, community-built directory of young artist programs
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            No ads, no paid placements, no paywalls. Just honest information and reviews from
            singers and instrumentalists who&apos;ve been through these programs. Browse summer
            festivals, academies, and YAPs. Help others by sharing your experience.
          </p>

          <form action="/programs" method="GET" className="mx-auto mt-8 max-w-xl">
            <label htmlFor="home-search" className="sr-only">
              Search programs
            </label>
            {/* Mobile: input with nested button */}
            <div className="relative sm:hidden">
              <input
                id="home-search"
                type="text"
                name="q"
                placeholder="Search programs..."
                className="w-full rounded-full border-0 bg-slate-100 py-3 pr-12 pl-5 text-base ring-1 ring-slate-200 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
              <button
                type="submit"
                className="absolute top-1/2 right-1.5 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-brand-600 transition-colors hover:bg-brand-700"
                aria-label="Search"
              >
                <svg
                  className="h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                  />
                </svg>
              </button>
            </div>
            {/* Desktop: side by side */}
            <div className="hidden gap-2 sm:flex">
              <input
                type="text"
                name="q"
                placeholder="Search programs..."
                className="flex-1 rounded-full border-0 bg-slate-100 px-5 py-3 text-base ring-1 ring-slate-200 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Community contribution CTA */}
      <section className="bg-brand-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              This directory grows when you contribute
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Every review and program listing here comes from the community. If you&apos;ve
              attended a program, please leave a review. If you know of a program that&apos;s
              missing or see a field that needs updating, please feel free to add it! The more
              people contribute, the more useful this becomes for everyone.
            </p>
            <div className="mt-6 flex flex-row justify-center gap-3 sm:justify-start">
              <Link
                href="/reviews/new"
                className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
              >
                Write a review
              </Link>
              <Link
                href="/programs/new"
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-900/5 transition hover:shadow-md"
              >
                Submit a program
              </Link>
            </div>
          </div>
          <div className="mt-8 border-t border-brand-600/10 pt-6">
            <PlatformPoll initialCounts={initialCounts} initialVoted={initialVoted} />
          </div>
          <div className="mt-8 border-t border-brand-600/10 pt-6">
            <p className="text-sm font-medium text-slate-600">Want to stay in the loop?</p>
            <div className="mt-3 max-w-sm">
              <SubscribeForm variant="light" />
            </div>
          </div>
        </div>
      </section>

      {/* Recently added / updated */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Recently updated</h2>
            <Link
              href="/programs"
              className="text-sm font-medium text-brand-600 transition-colors hover:text-brand-700"
            >
              Browse all &rarr;
            </Link>
          </div>

          {recent.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">No programs available yet.</p>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {recent.map((program) => (
                <ProgramCard key={program.id} program={program} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Browse by category */}
      <section className="pt-4 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Browse by category</h2>

          {categories.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">No categories available.</p>
          ) : (
            <div className="mt-6 flex flex-wrap gap-3">
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/programs?category_id=${c.id}`}
                  className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-900/5 transition hover:text-brand-600 hover:shadow-md"
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
