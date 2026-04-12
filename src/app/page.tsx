import Link from 'next/link'
import { buildQuery, listCategories, listPrograms } from '@/lib/api'
import type { Program } from '@/lib/types'

function formatTuition(n: number | null): string {
  if (n === null || n === 0) return 'Free'
  return `$${n.toLocaleString('en-US')}`
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso))
}

function formatRating(avg: number | null, count: number): string {
  if (count === 0 || avg === null) return 'No reviews yet'
  return `★ ${avg.toFixed(1)} (${count} review${count === 1 ? '' : 's'})`
}

function formatLocations(program: Program): string {
  if (program.locations.length === 0) return '—'
  return program.locations.map((l) => `${l.city}, ${l.country}`).join(' · ')
}

export default async function Home() {
  const today = new Date().toISOString().slice(0, 10)

  const [upcomingRes, categoriesRes] = await Promise.all([
    listPrograms(
      buildQuery({
        limit: 6,
        sort: 'application_deadline',
        deadline_after: today,
      }),
    ),
    listCategories(),
  ])

  let featured = upcomingRes.items
  if (featured.length === 0) {
    const fallback = await listPrograms(
      buildQuery({ limit: 6, sort: '-created_at' }),
    )
    featured = fallback.items
  }

  const categories = categoriesRes.items

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-12">
      <section className="space-y-6">
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-gray-900">
            Find and review young artist programs in classical music and opera
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl">
            YACTracker is a Young Artist Community where singers and
            instrumentalists browse summer festivals, academies, and young
            artist programs — and share honest reviews from past participants.
          </p>
        </div>
        <form
          action="/programs"
          method="GET"
          className="flex flex-col sm:flex-row gap-2 max-w-xl"
        >
          <label htmlFor="home-search" className="sr-only">
            Search programs
          </label>
          <input
            id="home-search"
            type="text"
            name="q"
            placeholder="Search programs..."
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
          <button
            type="submit"
            className="rounded-md border border-gray-900 bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Search
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-gray-900">
            Featured programs
          </h2>
          <Link
            href="/programs"
            className="text-sm text-gray-600 hover:text-gray-900 underline"
          >
            Browse all
          </Link>
        </div>
        {featured.length === 0 ? (
          <p className="text-sm text-gray-600">No programs available yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.map((program) => {
              const visibleCategories = program.categories.slice(0, 3)
              const extraCategoryCount =
                program.categories.length - visibleCategories.length
              return (
                <article
                  key={program.id}
                  className="border border-gray-200 rounded-md p-4 flex flex-col gap-3"
                >
                  <h3 className="text-base font-semibold leading-tight">
                    <Link
                      href={`/programs/${program.id}`}
                      className="text-gray-900 hover:underline"
                    >
                      {program.name}
                    </Link>
                  </h3>
                  <p className="text-sm text-gray-600">
                    {formatLocations(program)}
                  </p>
                  {visibleCategories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {visibleCategories.map((c) => (
                        <span
                          key={c.id}
                          className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-700"
                        >
                          {c.name}
                        </span>
                      ))}
                      {extraCategoryCount > 0 && (
                        <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-700">
                          +{extraCategoryCount}
                        </span>
                      )}
                    </div>
                  )}
                  <dl className="grid grid-cols-2 gap-2 text-xs text-gray-700 mt-auto">
                    <div>
                      <dt className="text-gray-500">Tuition</dt>
                      <dd>{formatTuition(program.tuition)}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Deadline</dt>
                      <dd>{formatDate(program.application_deadline)}</dd>
                    </div>
                  </dl>
                  <p className="text-xs text-gray-600">
                    {formatRating(program.average_rating, program.review_count)}
                  </p>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight text-gray-900">
          Browse by category
        </h2>
        {categories.length === 0 ? (
          <p className="text-sm text-gray-600">No categories available.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/programs?category_id=${c.id}`}
                className="rounded-full border border-gray-200 bg-white px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
