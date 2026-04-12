import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type { Audition, Review } from '@/lib/types'
import { submitReview } from './actions'

function formatTuition(n: number | null): string {
  if (n === null) return '—'
  if (n === 0) return 'Free'
  return `$${n.toLocaleString('en-US')}`
}

function formatFee(n: number | null): string {
  if (n === null) return '—'
  if (n === 0) return 'Free'
  return `$${n.toLocaleString('en-US')}`
}

function formatDate(iso: string | null, opts?: { time?: boolean }): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
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

function formatDateRange(a: string | null, b: string | null): string {
  if (!a && !b) return '—'
  if (a && b) return `${formatDate(a)} → ${formatDate(b)}`
  if (a) return formatDate(a)
  return formatDate(b)
}

function formatAgeRange(min: number | null, max: number | null): string {
  if (min === null && max === null) return '—'
  if (min !== null && max !== null) return `${min}–${max}`
  if (min !== null) return `${min}+`
  return `up to ${max}`
}

function renderStars(rating: number): string {
  const r = Math.max(0, Math.min(5, Math.round(rating)))
  return '★'.repeat(r) + '☆'.repeat(5 - r)
}

const PROGRAM_INCLUDE = {
  program_instruments: { include: { instrument: true } },
  program_categories: { include: { category: true } },
  program_locations: { include: { location: true } },
} as const

type ProgramWithRelations = Prisma.ProgramGetPayload<{
  include: typeof PROGRAM_INCLUDE
}>

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
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  }
}

function KeyFact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{children}</dd>
    </div>
  )
}

function AuditionCard({ audition }: { audition: Audition }) {
  return (
    <li className="rounded-lg border border-gray-200 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="font-medium text-gray-900">
          {audition.location.city}, {audition.location.country}
        </div>
        <div className="text-sm text-gray-600">
          {audition.time_slot ? formatDate(audition.time_slot, { time: true }) : '—'}
        </div>
      </div>
      <div className="mt-1 text-sm text-gray-700">
        Fee: {formatFee(audition.audition_fee)}
      </div>
      {audition.instruments.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {audition.instruments.map((inst) => (
            <span
              key={inst.id}
              className="rounded border border-gray-300 bg-gray-50 px-2 py-0.5 text-xs text-gray-700"
            >
              {inst.name}
            </span>
          ))}
        </div>
      )}
      {audition.instructions && (
        <p className="mt-2 whitespace-pre-line text-sm text-gray-700">
          {audition.instructions}
        </p>
      )}
      {audition.registration_url && (
        <a
          href={audition.registration_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-sm font-medium text-blue-600 hover:underline"
        >
          Register →
        </a>
      )}
    </li>
  )
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <li className="rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-2">
        <span className="text-yellow-500" aria-label={`${review.rating} out of 5`}>
          {renderStars(review.rating)}
        </span>
        {review.title && (
          <span className="font-medium text-gray-900">{review.title}</span>
        )}
      </div>
      <div className="mt-1 text-xs text-gray-500">
        {review.reviewer_name ?? 'Anonymous'}
        {review.year_attended ? ` · ${review.year_attended}` : ''}
      </div>
      <p className="mt-2 whitespace-pre-line text-sm text-gray-800">{review.body}</p>
    </li>
  )
}

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ program_id: string }>
}) {
  const { program_id } = await params

  const programRow = await prisma.program.findUnique({
    where: { id: program_id },
    include: PROGRAM_INCLUDE,
  })
  if (!programRow) notFound()

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

  const reviews: Review[] = reviewRows.map(formatReviewRow)
  const auditions: Audition[] = auditionRows.map(formatAuditionRow)

  const locationLabel = program.locations
    .map((l) => `${l.city}, ${l.country}`)
    .join(' • ')

  const reviewCount = program.review_count
  const avg = program.average_rating

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-10">
      {/* Header */}
      <div>
        <Link
          href="/programs"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to programs
        </Link>
        <h1 className="mt-3 text-3xl font-bold text-gray-900 sm:text-4xl">
          {program.name}
        </h1>
        {locationLabel && (
          <p className="mt-2 text-sm text-gray-600">{locationLabel}</p>
        )}
        {(program.categories.length > 0 || program.instruments.length > 0) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {program.categories.map((c) => (
              <span
                key={c.id}
                className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700"
              >
                {c.name}
              </span>
            ))}
            {program.instruments.map((i) => (
              <span
                key={i.id}
                className="rounded-full border border-gray-300 bg-white px-2.5 py-0.5 text-xs text-gray-700"
              >
                {i.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Key facts */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900">Key facts</h2>
        <dl className="mt-4 grid grid-cols-1 gap-4 rounded-lg border border-gray-200 p-4 sm:grid-cols-2 md:grid-cols-3">
          <KeyFact label="Dates">
            {formatDateRange(program.start_date, program.end_date)}
          </KeyFact>
          <KeyFact label="Application deadline">
            {formatDate(program.application_deadline)}
          </KeyFact>
          <KeyFact label="Tuition">{formatTuition(program.tuition)}</KeyFact>
          <KeyFact label="Application fee">
            {formatFee(program.application_fee)}
          </KeyFact>
          <KeyFact label="Age range">
            {formatAgeRange(program.age_min, program.age_max)}
          </KeyFact>
          <KeyFact label="Scholarship">
            {program.offers_scholarship ? 'Yes' : 'No'}
          </KeyFact>
        </dl>
        {(program.program_url || program.application_url) && (
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            {program.program_url && (
              <a
                href={program.program_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:underline"
              >
                Program website →
              </a>
            )}
            {program.application_url && (
              <a
                href={program.application_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:underline"
              >
                Apply now →
              </a>
            )}
          </div>
        )}
      </section>

      {/* Description */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900">About</h2>
        <p className="mt-3 whitespace-pre-line text-sm text-gray-800">
          {program.description ?? '—'}
        </p>
      </section>

      {/* Auditions */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900">Auditions</h2>
        {auditions.length === 0 ? (
          <p className="mt-3 text-sm text-gray-600">No scheduled auditions.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {auditions.map((a) => (
              <AuditionCard key={a.id} audition={a} />
            ))}
          </ul>
        )}
      </section>

      {/* Reviews */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900">Reviews</h2>
        <p className="mt-2 text-sm text-gray-700">
          {reviewCount > 0 && avg !== null
            ? `★ ${avg.toFixed(1)} out of 5 · ${reviewCount} review${reviewCount === 1 ? '' : 's'}`
            : 'No reviews yet'}
        </p>
        {reviews.length > 0 && (
          <ul className="mt-4 space-y-3">
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </ul>
        )}
      </section>

      {/* Review form */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900">Submit a review</h3>
        <form action={submitReview} className="mt-4 space-y-4">
          <input type="hidden" name="program_id" value={program_id} />

          <div>
            <label
              htmlFor="reviewer_name"
              className="block text-sm font-medium text-gray-700"
            >
              Your name
            </label>
            <input
              id="reviewer_name"
              name="reviewer_name"
              type="text"
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="rating"
              className="block text-sm font-medium text-gray-700"
            >
              Rating <span className="text-red-600">*</span>
            </label>
            <select
              id="rating"
              name="rating"
              required
              defaultValue=""
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="" disabled>
                Select a rating
              </option>
              <option value="5">5 ★★★★★</option>
              <option value="4">4 ★★★★</option>
              <option value="3">3 ★★★</option>
              <option value="2">2 ★★</option>
              <option value="1">1 ★</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="year_attended"
              className="block text-sm font-medium text-gray-700"
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
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              Title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="body"
              className="block text-sm font-medium text-gray-700"
            >
              Review <span className="text-red-600">*</span>
            </label>
            <textarea
              id="body"
              name="body"
              required
              rows={4}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Submit review
          </button>
        </form>
      </section>
    </div>
  )
}
