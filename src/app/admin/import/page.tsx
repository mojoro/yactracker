import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { isAdminAuthenticated, adminLogout } from '../actions'
import { approveCandidate, rejectCandidate } from './actions'

type SearchParams = { [key: string]: string | string[] | undefined }

function getString(params: SearchParams, key: string): string | undefined {
  const v = params[key]
  return Array.isArray(v) ? v[0] : v
}

export default async function AdminImportPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  if (!(await isAdminAuthenticated())) redirect('/admin')

  const params = await searchParams
  const statusFilter = getString(params, 'status') ?? 'pending'

  const candidates = await prisma.programCandidate.findMany({
    where: { status: statusFilter },
    orderBy: { created_at: 'desc' },
    take: 50,
    include: {
      import_source: { select: { name: true, url: true } },
      import_run: {
        select: {
          extraction_model: true,
          extraction_tokens_in: true,
          extraction_tokens_out: true,
          started_at: true,
        },
      },
      program: { select: { id: true, name: true } },
    },
  })

  const counts = await prisma.programCandidate.groupBy({
    by: ['status'],
    _count: true,
  })
  const countMap: Record<string, number> = {}
  for (const c of counts) countMap[c.status] = c._count

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">
            Import review
          </h1>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-gray-600 hover:text-gray-900 underline"
            >
              Back to site
            </Link>
            <form action={adminLogout}>
              <button
                type="submit"
                className="text-sm text-gray-500 hover:text-gray-900 underline"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
        <p className="mt-1 text-sm text-gray-600">
          Review extracted program candidates before they go live.
        </p>
      </header>

      {/* Status tabs */}
      <nav className="mb-6 flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
        {['pending', 'approved', 'rejected', 'stale'].map((s) => (
          <Link
            key={s}
            href={`/admin/import?status=${s}`}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              statusFilter === s
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
            {countMap[s] ? (
              <span className="ml-1.5 rounded-full bg-gray-200 px-1.5 py-0.5 text-xs">
                {countMap[s]}
              </span>
            ) : null}
          </Link>
        ))}
      </nav>

      {candidates.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-gray-700">
            No {statusFilter} candidates.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {candidates.map((c) => {
            const extracted = c.extracted_json as Record<string, unknown>
            return (
              <CandidateCard
                key={c.id}
                candidateId={c.id}
                status={c.status}
                confidence={c.confidence}
                sourceName={c.import_source.name}
                sourceUrl={c.import_source.url}
                model={c.import_run.extraction_model}
                tokensIn={c.import_run.extraction_tokens_in}
                tokensOut={c.import_run.extraction_tokens_out}
                fetchedAt={c.import_run.started_at}
                matchedProgram={c.program}
                extracted={extracted}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

function CandidateCard({
  candidateId,
  status,
  confidence,
  sourceName,
  sourceUrl,
  model,
  tokensIn,
  tokensOut,
  fetchedAt,
  matchedProgram,
  extracted,
}: {
  candidateId: string
  status: string
  confidence: number | null
  sourceName: string
  sourceUrl: string
  model: string | null
  tokensIn: number | null
  tokensOut: number | null
  fetchedAt: Date
  matchedProgram: { id: string; name: string } | null
  extracted: Record<string, unknown>
}) {
  const name = (extracted.name as string) || 'Unnamed'
  const description = extracted.description as string | null
  const instruments = (extracted.instruments as string[]) ?? []
  const categories = (extracted.categories as string[]) ?? []
  const locations = (extracted.locations as Array<{ city: string; country: string }>) ?? []
  const tuition = extracted.tuition as number | null
  const deadline = extracted.application_deadline as string | null

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-5">
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{name}</h2>
          <p className="mt-0.5 text-sm text-gray-600">
            Source:{' '}
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {sourceName}
            </a>
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {confidence !== null && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                confidence >= 0.7
                  ? 'bg-green-100 text-green-800'
                  : confidence >= 0.4
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
              }`}
            >
              {(confidence * 100).toFixed(0)}% confidence
            </span>
          )}
          {matchedProgram && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
              Matches:{' '}
              <Link
                href={`/programs/${matchedProgram.id}`}
                className="underline"
              >
                {matchedProgram.name}
              </Link>
            </span>
          )}
        </div>
      </div>

      {/* Extracted data summary */}
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
        {locations.length > 0 && (
          <div>
            <span className="text-xs uppercase tracking-wide text-gray-500">
              Location
            </span>
            <p className="text-gray-900">
              {locations.map((l) => `${l.city}, ${l.country}`).join(' / ')}
            </p>
          </div>
        )}
        {deadline && (
          <div>
            <span className="text-xs uppercase tracking-wide text-gray-500">
              Deadline
            </span>
            <p className="text-gray-900">{deadline}</p>
          </div>
        )}
        {tuition !== null && (
          <div>
            <span className="text-xs uppercase tracking-wide text-gray-500">
              Tuition
            </span>
            <p className="text-gray-900">
              {tuition === 0 ? 'Free' : `$${tuition.toLocaleString('en-US')}`}
            </p>
          </div>
        )}
        {model && (
          <div>
            <span className="text-xs uppercase tracking-wide text-gray-500">
              Model
            </span>
            <p className="text-gray-900">
              {model}
              {tokensIn != null && tokensOut != null && (
                <span className="text-gray-500">
                  {' '}({tokensIn + tokensOut} tok)
                </span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Tags */}
      {(categories.length > 0 || instruments.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <span
              key={c}
              className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
            >
              {c}
            </span>
          ))}
          {instruments.map((i) => (
            <span
              key={i}
              className="rounded-full border border-gray-300 px-2 py-0.5 text-xs text-gray-700"
            >
              {i}
            </span>
          ))}
        </div>
      )}

      {/* Description preview */}
      {description && (
        <p className="mt-3 text-sm text-gray-700 line-clamp-3">{description}</p>
      )}

      {/* Meta */}
      <p className="mt-3 text-xs text-gray-500">
        Fetched {fetchedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        {' · '}ID: {candidateId.slice(0, 8)}
      </p>

      {/* Actions */}
      {status === 'pending' && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
          <form action={approveCandidate}>
            <input type="hidden" name="candidate_id" value={candidateId} />
            <button
              type="submit"
              className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
            >
              {matchedProgram ? 'Approve (update)' : 'Approve (create)'}
            </button>
          </form>
          <form action={rejectCandidate} className="flex items-center gap-2">
            <input type="hidden" name="candidate_id" value={candidateId} />
            <input
              type="text"
              name="reviewer_notes"
              placeholder="Reason (optional)"
              className="rounded-md border border-gray-300 px-2 py-1 text-sm"
            />
            <button
              type="submit"
              className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
            >
              Reject
            </button>
          </form>
        </div>
      )}
    </article>
  )
}
