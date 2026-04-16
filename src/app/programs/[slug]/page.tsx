import Link from 'next/link'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type { Audition, Review } from '@/lib/types'
import { submitReview } from './actions'
import { HelpfulButton } from './helpful-button'
import { ReportButton } from './report-form'

function formatTuition(n: number | null): string | null {
  if (n === null) return null
  if (n === 0) return 'Free'
  return `$${n.toLocaleString('en-US')}`
}

function formatFee(n: number | null): string | null {
  if (n === null) return null
  if (n === 0) return 'Free'
  return `$${n.toLocaleString('en-US')}`
}

function formatDate(iso: string | null, opts?: { time?: boolean }): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const dateOpts: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }
  if (opts?.time) {
    dateOpts.hour = 'numeric'
    dateOpts.minute = '2-digit'
    dateOpts.hour12 = true
  }
  return d.toLocaleString('en-US', dateOpts)
}

function formatDateRange(a: string | null, b: string | null): string | null {
  if (!a && !b) return null
  if (a && b) return `${formatDate(a)} → ${formatDate(b)}`
  if (a) return formatDate(a)
  return formatDate(b)
}

function formatAgeRange(min: number | null, max: number | null): string | null {
  if (min === null && max === null) return null
  if (min !== null && max !== null) return `${min}–${max}`
  if (min !== null) return `${min}+`
  return `up to ${max}`
}

function EditLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-tag-700 transition-colors hover:text-brand-600"
    >
      <span>&mdash;</span>
      <span className="text-xs font-medium">Add</span>
    </Link>
  )
}

const PROGRAM_INCLUDE = {
  program_instruments: { include: { instrument: true } },
  program_categories: { include: { category: true } },
  program_locations: { include: { location: true } },
} as const

type AuditionWithRelations = Prisma.AuditionGetPayload<{
  include: {
    location: true
    audition_instruments: { include: { instrument: true } }
  }
}>

function formatAuditionRow(row: AuditionWithRelations): Audition {
  return {
    id: row.id,
    program_id: row.program_id,
    location_id: row.location_id,
    location: {
      id: row.location.id,
      city: row.location.city,
      country: row.location.country,
      state: row.location.state,
      address: row.location.address,
    },
    time_slot: row.time_slot ? row.time_slot.toISOString() : null,
    audition_fee: row.audition_fee,
    instructions: row.instructions,
    registration_url: row.registration_url,
    instruments: row.audition_instruments.map((ai) => ({
      id: ai.instrument.id,
      name: ai.instrument.name,
    })),
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  }
}

function formatReviewRow(row: {
  id: string
  program_id: string
  rating: number
  year_attended: number | null
  reviewer_name: string | null
  title: string | null
  body: string
  helpful_count: number
  created_at: Date
  updated_at: Date
}): Review {
  return {
    id: row.id,
    program_id: row.program_id,
    rating: row.rating,
    year_attended: row.year_attended,
    reviewer_name: row.reviewer_name,
    title: row.title,
    body: row.body,
    helpful_count: row.helpful_count,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  }
}

function KeyFact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold tracking-wide text-slate-400 uppercase">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-slate-900">{children}</dd>
    </div>
  )
}

function AuditionCard({ audition }: { audition: Audition }) {
  return (
    <li className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="font-semibold text-slate-900">
          {audition.location.city}, {audition.location.country}
        </div>
        <div className="text-sm text-slate-500">
          {audition.time_slot ? formatDate(audition.time_slot, { time: true }) : '—'}
        </div>
      </div>
      <div className="mt-1 text-sm text-slate-600">Fee: {formatFee(audition.audition_fee)}</div>
      {audition.instruments.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {audition.instruments.map((inst) => (
            <span
              key={inst.id}
              className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600"
            >
              {inst.name}
            </span>
          ))}
        </div>
      )}
      {audition.instructions && (
        <p className="mt-3 text-sm whitespace-pre-line text-slate-600">{audition.instructions}</p>
      )}
      {audition.registration_url && (
        <a
          href={audition.registration_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          Register
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
            />
          </svg>
        </a>
      )}
    </li>
  )
}

function ReviewCard({
  review,
  programId,
  liked,
}: {
  review: Review
  programId: string
  liked: boolean
}) {
  return (
    <li className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }, (_, i) => (
            <svg
              key={i}
              className={`h-4 w-4 ${i < review.rating ? 'text-accent-500' : 'text-slate-200'}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        <ReportButton programId={programId} reviewId={review.id} />
      </div>
      {review.title && <h4 className="mt-2 font-semibold text-slate-900">{review.title}</h4>}
      <p className="mt-1 text-xs text-slate-400">
        {review.reviewer_name ?? 'Anonymous'}
        {review.year_attended ? ` · ${review.year_attended}` : ''}
      </p>
      <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-slate-700">
        {review.body}
      </p>
      <HelpfulButton reviewId={review.id} initialCount={review.helpful_count} initialLiked={liked} />
    </li>
  )
}

export default async function ProgramDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const programRow = await prisma.program.findUnique({
    where: { slug },
    include: PROGRAM_INCLUDE,
  })
  if (!programRow) notFound()

  const program_id = programRow.id

  const [ratingAgg, reviewRows, auditionRows] = await Promise.all([
    prisma.review.aggregate({
      where: { program_id },
      _avg: { rating: true },
      _count: { rating: true },
    }),
    prisma.review.findMany({
      where: { program_id },
      orderBy: { created_at: 'desc' },
      take: 50,
      include: { _count: { select: { review_likes: true } } },
    }),
    prisma.audition.findMany({
      where: { program_id },
      orderBy: [{ time_slot: 'asc' }, { created_at: 'asc' }],
      take: 50,
      include: {
        location: true,
        audition_instruments: { include: { instrument: true } },
      },
    }),
  ])

  const avgRaw = ratingAgg._avg.rating
  const program = {
    id: programRow.id,
    name: programRow.name,
    description: programRow.description,
    start_date: programRow.start_date ? programRow.start_date.toISOString() : null,
    end_date: programRow.end_date ? programRow.end_date.toISOString() : null,
    application_deadline: programRow.application_deadline
      ? programRow.application_deadline.toISOString()
      : null,
    tuition: programRow.tuition,
    application_fee: programRow.application_fee,
    age_min: programRow.age_min,
    age_max: programRow.age_max,
    offers_scholarship: programRow.offers_scholarship,
    application_url: programRow.application_url,
    program_url: programRow.program_url,
    created_at: programRow.created_at.toISOString(),
    updated_at: programRow.updated_at.toISOString(),
    instruments: programRow.program_instruments.map((pi) => ({
      id: pi.instrument.id,
      name: pi.instrument.name,
    })),
    categories: programRow.program_categories.map((pc) => ({
      id: pc.category.id,
      name: pc.category.name,
    })),
    locations: programRow.program_locations.map((pl) => ({
      id: pl.location.id,
      city: pl.location.city,
      country: pl.location.country,
      state: pl.location.state,
      address: pl.location.address,
    })),
    average_rating: avgRaw === null ? null : Math.round(avgRaw * 10) / 10,
    review_count: ratingAgg._count.rating,
  }

  const reviews: Review[] = reviewRows.map((r) =>
    formatReviewRow({ ...r, helpful_count: r._count.review_likes }),
  )
  const auditions: Audition[] = auditionRows.map(formatAuditionRow)

  const cookieStore = await cookies()
  const likedRaw = cookieStore.get('helpful_reviews')?.value
  const likedSet = new Set<string>(likedRaw ? JSON.parse(likedRaw) : [])

  const locationLabel = program.locations.map((l) => `${l.city}, ${l.country}`).join(' • ')

  const reviewCount = program.review_count
  const avg = program.average_rating

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <Link
        href="/programs"
        className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
          />
        </svg>
        Back to programs
      </Link>

      {/* Page header */}
      <div className="mt-3">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {program.name}
        </h1>
        {locationLabel && <p className="mt-2 text-base text-slate-500">{locationLabel}</p>}

        {reviewCount > 0 && avg !== null && (
          <div className="mt-3 flex items-center gap-2">
            <svg className="h-5 w-5 text-accent-500" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-2xl font-bold text-slate-900">{avg.toFixed(1)}</span>
            <span className="text-sm text-slate-500">
              ({reviewCount} review{reviewCount === 1 ? '' : 's'})
            </span>
          </div>
        )}

        {(program.categories.length > 0 || program.instruments.length > 0) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {program.categories.map((c) => (
              <span
                key={c.id}
                className="rounded-full bg-tag-50 px-2.5 py-0.5 text-xs font-medium text-tag-700"
              >
                {c.name}
              </span>
            ))}
            {program.instruments.map((i) => (
              <span
                key={i.id}
                className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600"
              >
                {i.name}
              </span>
            ))}
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={`/programs/${slug}/edit`}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-900/10 transition-colors hover:bg-slate-50"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
              />
            </svg>
            Edit
          </Link>
          {program.program_url && (
            <a
              href={program.program_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Visit website
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                />
              </svg>
            </a>
          )}
          {program.application_url && (
            <a
              href={program.application_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-900/10 transition-colors hover:bg-slate-50"
            >
              Apply now
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                />
              </svg>
            </a>
          )}
        </div>
      </div>

      {/* Key facts */}
      <section className="mt-10 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
        <h2 className="text-lg font-semibold text-slate-900">Key facts</h2>
        <dl className="mt-4 grid grid-cols-2 gap-6 sm:grid-cols-3">
          <KeyFact label="Dates">
            {formatDateRange(program.start_date, program.end_date) ?? (
              <EditLink href={`/programs/${slug}/edit`} />
            )}
          </KeyFact>
          <KeyFact label="Application deadline">
            {formatDate(program.application_deadline) ?? (
              <EditLink href={`/programs/${slug}/edit`} />
            )}
          </KeyFact>
          <KeyFact label="Tuition">
            {formatTuition(program.tuition) ?? <EditLink href={`/programs/${slug}/edit`} />}
          </KeyFact>
          <KeyFact label="Application fee">
            {formatFee(program.application_fee) ?? <EditLink href={`/programs/${slug}/edit`} />}
          </KeyFact>
          <KeyFact label="Age range">
            {formatAgeRange(program.age_min, program.age_max) ?? (
              <EditLink href={`/programs/${slug}/edit`} />
            )}
          </KeyFact>
          <KeyFact label="Scholarship">
            {program.offers_scholarship ? (
              <span className="inline-flex items-center rounded-full bg-success-50 px-2 py-0.5 text-xs font-medium text-success-700">
                Available
              </span>
            ) : (
              'No'
            )}
          </KeyFact>
        </dl>
      </section>

      {/* About */}
      <section className="mt-8 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
        <h2 className="text-lg font-semibold text-slate-900">About</h2>
        <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-slate-700">
          {program.description ?? <EditLink href={`/programs/${slug}/edit`} />}
        </p>
        <div className="mt-4 border-t border-slate-100 pt-3">
          <ReportButton programId={program_id} label="Report inaccurate information" />
        </div>
      </section>

      {/* Auditions */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Auditions</h2>
          <Link
            href={`/programs/${slug}/auditions/new`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add audition
          </Link>
        </div>
        {auditions.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No scheduled auditions.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {auditions.map((a) => (
              <AuditionCard key={a.id} audition={a} />
            ))}
          </ul>
        )}
      </section>

      {/* Reviews */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">
          Reviews{reviewCount > 0 ? ` (${reviewCount})` : ''}
        </h2>

        {reviewCount > 0 && avg !== null ? (
          <div className="mt-4 flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5">
            <svg className="h-8 w-8 text-accent-500" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <div>
              <span className="text-3xl font-bold text-slate-900">{avg.toFixed(1)}</span>
              <span className="ml-1 text-sm text-slate-500">out of 5</span>
              <p className="text-sm text-slate-500">
                {reviewCount} review{reviewCount === 1 ? '' : 's'}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">No reviews yet.</p>
        )}

        {reviews.length > 0 && (
          <ul className="mt-4 space-y-4">
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} programId={program_id} liked={likedSet.has(r.id)} />
            ))}
          </ul>
        )}
      </section>

      {/* Review form */}
      <section className="mt-8 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
        <h2 className="text-lg font-semibold text-slate-900">Share your experience</h2>
        <form action={submitReview} className="mt-5">
          <input type="hidden" name="program_id" value={program_id} />
          <input
            type="text"
            name="url_confirm"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="sr-only"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="reviewer_name"
                className="mb-1.5 block text-xs font-semibold tracking-wide text-slate-500 uppercase"
              >
                Your name
              </label>
              <input
                id="reviewer_name"
                name="reviewer_name"
                type="text"
                className="w-full rounded-lg border-0 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 transition-colors focus:bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label
                htmlFor="rating"
                className="mb-1.5 block text-xs font-semibold tracking-wide text-slate-500 uppercase"
              >
                Rating <span className="text-red-500">*</span>
              </label>
              <select
                id="rating"
                name="rating"
                required
                defaultValue=""
                className="w-full rounded-lg border-0 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 transition-colors focus:bg-white focus:ring-2 focus:ring-brand-500"
              >
                <option value="" disabled>
                  Select a rating
                </option>
                <option value="5">5 - Excellent</option>
                <option value="4">4 - Very good</option>
                <option value="3">3 - Average</option>
                <option value="2">2 - Below average</option>
                <option value="1">1 - Poor</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="year_attended"
                className="mb-1.5 block text-xs font-semibold tracking-wide text-slate-500 uppercase"
              >
                Year attended
              </label>
              <input
                id="year_attended"
                name="year_attended"
                type="number"
                min={1950}
                max={2100}
                step={1}
                className="w-full rounded-lg border-0 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 transition-colors focus:bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label
                htmlFor="title"
                className="mb-1.5 block text-xs font-semibold tracking-wide text-slate-500 uppercase"
              >
                Title
              </label>
              <input
                id="title"
                name="title"
                type="text"
                className="w-full rounded-lg border-0 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 transition-colors focus:bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="mt-4">
            <label
              htmlFor="body"
              className="mb-1.5 block text-xs font-semibold tracking-wide text-slate-500 uppercase"
            >
              Review <span className="text-red-500">*</span>
            </label>
            <textarea
              id="body"
              name="body"
              required
              rows={4}
              className="w-full rounded-lg border-0 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 transition-colors focus:bg-white focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="mt-5">
            <button
              type="submit"
              className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Submit review
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
