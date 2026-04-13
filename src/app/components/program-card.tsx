import Link from 'next/link'
import type { Program } from '@/lib/types'

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

export function ProgramCard({ program }: { program: Program }) {
  const locationText =
    program.locations.length > 0
      ? program.locations.map((l) => `${l.city}, ${l.country}`).join(' / ')
      : 'Location TBD'

  const shownInstruments = program.instruments.slice(0, 3)
  const extraInstruments = program.instruments.length - shownInstruments.length

  const shownCategories = program.categories.slice(0, 3)
  const extraCategories = program.categories.length - shownCategories.length

  const hasRating = program.review_count > 0 && program.average_rating !== null

  return (
    <article className="flex flex-col rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5 transition hover:shadow-md hover:-translate-y-0.5">
      {shownCategories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {shownCategories.map((c) => (
            <span
              key={c.id}
              className="rounded-full bg-tag-50 px-2.5 py-0.5 text-xs font-medium text-tag-700"
            >
              {c.name}
            </span>
          ))}
          {extraCategories > 0 && (
            <span className="rounded-full bg-tag-50 px-2.5 py-0.5 text-xs font-medium text-tag-700">
              +{extraCategories}
            </span>
          )}
        </div>
      )}

      <h2 className="text-base font-semibold text-slate-900 leading-snug mt-2">
        <Link
          href={`/programs/${program.slug}`}
          className="hover:text-brand-600 transition-colors"
        >
          {program.name}
        </Link>
      </h2>

      <p className="text-sm text-slate-500 mt-1">{locationText}</p>

      {shownInstruments.length > 0 && (
        <div className="mt-2.5 mb-1 flex flex-wrap gap-1.5">
          {shownInstruments.map((i) => (
            <span
              key={i.id}
              className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600"
            >
              {i.name}
            </span>
          ))}
          {extraInstruments > 0 && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
              +{extraInstruments}
            </span>
          )}
        </div>
      )}

      <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-sm">
          <span className="font-medium text-slate-900">
            {formatTuition(program.tuition)}
          </span>
          {program.offers_scholarship && (
            <span className="rounded-full bg-success-50 px-1.5 py-0.5 text-[10px] font-semibold text-success-700">
              Aid
            </span>
          )}
          <span className="mx-0.5 text-slate-300">|</span>
          <span className="text-slate-500 whitespace-nowrap">
            App fee: {formatAppFee(program.application_fee)}
          </span>
          <span className="mx-0.5 text-slate-300">|</span>
          <span className="text-slate-500">
            {formatDate(program.application_deadline)}
          </span>
        </div>
        <div className="text-sm">
          {hasRating ? (
            <span className="inline-flex items-center gap-1">
              <span className="text-accent-500">&#9733;</span>
              <span className="font-medium text-slate-700">
                {program.average_rating!.toFixed(1)}
              </span>
              <span className="text-slate-400">
                ({program.review_count})
              </span>
            </span>
          ) : (
            <span className="text-slate-400">No reviews</span>
          )}
        </div>
      </div>
    </article>
  )
}
