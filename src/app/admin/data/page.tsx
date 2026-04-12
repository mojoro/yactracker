import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { isAdminAuthenticated, adminLogout } from '../actions'
import { deleteProgram, deleteReview, deleteAudition } from './actions'
import { DeleteButton } from './delete-button'
import { ProgramEditor } from './program-editor'
import { AuditionForm } from './audition-form'

type SearchParams = { [key: string]: string | string[] | undefined }

export default async function AdminDataPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  if (!(await isAdminAuthenticated())) redirect('/admin')

  const params = await searchParams
  const selectedProgramId = typeof params.program === 'string' ? params.program : null

  const [programs, allInstruments, allCategories, allLocations] = await Promise.all([
    prisma.program.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        _count: { select: { reviews: true, auditions: true } },
      },
    }),
    prisma.instrument.findMany({ orderBy: { name: 'asc' }, select: { name: true } }),
    prisma.category.findMany({ orderBy: { name: 'asc' }, select: { name: true } }),
    prisma.location.findMany({ orderBy: { city: 'asc' }, select: { city: true, country: true } }),
  ])

  let reviews: Array<{
    id: string
    rating: number
    reviewer_name: string | null
    title: string | null
    body: string
    year_attended: number | null
    created_at: Date
  }> = []

  let fullProgram: {
    id: string
    name: string
    description: string | null
    start_date: Date | null
    end_date: Date | null
    application_deadline: Date | null
    tuition: number | null
    application_fee: number | null
    age_min: number | null
    age_max: number | null
    offers_scholarship: boolean
    application_url: string | null
    program_url: string | null
    program_instruments: Array<{ instrument: { name: string } }>
    program_categories: Array<{ category: { name: string } }>
    program_locations: Array<{ location: { city: string; country: string } }>
  } | null = null

  let auditions: Array<{
    id: string
    time_slot: Date | null
    audition_fee: number | null
    instructions: string | null
    registration_url: string | null
    location: { city: string; country: string }
    audition_instruments: Array<{ instrument: { name: string } }>
  }> = []

  if (selectedProgramId) {
    const [reviewRows, programRow, auditionRows] = await Promise.all([
      prisma.review.findMany({
        where: { program_id: selectedProgramId },
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          rating: true,
          reviewer_name: true,
          title: true,
          body: true,
          year_attended: true,
          created_at: true,
        },
      }),
      prisma.program.findUnique({
        where: { id: selectedProgramId },
        include: {
          program_instruments: { include: { instrument: { select: { name: true } } } },
          program_categories: { include: { category: { select: { name: true } } } },
          program_locations: { include: { location: { select: { city: true, country: true } } } },
        },
      }),
      prisma.audition.findMany({
        where: { program_id: selectedProgramId },
        orderBy: { time_slot: { sort: 'asc', nulls: 'last' } },
        include: {
          location: { select: { city: true, country: true } },
          audition_instruments: { include: { instrument: { select: { name: true } } } },
        },
      }),
    ])
    reviews = reviewRows
    fullProgram = programRow
    auditions = auditionRows
  }

  const selectedProgram = selectedProgramId
    ? programs.find((p) => p.id === selectedProgramId)
    : null

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">
            Manage data
          </h1>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/import"
              prefetch={false}
              className="text-sm text-gray-600 hover:text-gray-900 underline"
            >
              Import
            </Link>
            <Link
              href="/admin/reports"
              prefetch={false}
              className="text-sm text-gray-600 hover:text-gray-900 underline"
            >
              Reports
            </Link>
            <Link
              href="/"
              prefetch={false}
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
      </header>

      {/* Programs table */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900">
          Programs ({programs.length})
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="pb-2 pr-4">Name</th>
                <th className="pb-2 pr-4">Reviews</th>
                <th className="pb-2 pr-4">Auditions</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {programs.map((p) => (
                <tr
                  key={p.id}
                  className={`border-b border-gray-100 ${
                    p.id === selectedProgramId ? 'bg-blue-50' : ''
                  }`}
                >
                  <td className="py-2 pr-4 font-medium text-gray-900">
                    <a
                      href={`/admin/data?program=${p.id}`}
                      className="hover:underline"
                    >
                      {p.name}
                    </a>
                  </td>
                  <td className="py-2 pr-4 text-gray-600">{p._count.reviews}</td>
                  <td className="py-2 pr-4 text-gray-600">{p._count.auditions}</td>
                  <td className="py-2">
                    <DeleteButton
                      action={deleteProgram}
                      name="program_id"
                      value={p.id}
                      confirmMessage={`Delete "${p.name}" and all its reviews/auditions?`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Edit selected program */}
      {fullProgram && (
        <section className="mt-10 border-t border-gray-200 pt-8">
          <h2 className="text-lg font-semibold text-gray-900">
            Edit: {fullProgram.name}
          </h2>
          <div className="mt-4">
            <ProgramEditor
              program={{
                id: fullProgram.id,
                name: fullProgram.name,
                description: fullProgram.description,
                start_date: fullProgram.start_date?.toISOString().slice(0, 10) ?? null,
                end_date: fullProgram.end_date?.toISOString().slice(0, 10) ?? null,
                application_deadline: fullProgram.application_deadline?.toISOString().slice(0, 10) ?? null,
                tuition: fullProgram.tuition,
                application_fee: fullProgram.application_fee,
                age_min: fullProgram.age_min,
                age_max: fullProgram.age_max,
                offers_scholarship: fullProgram.offers_scholarship,
                application_url: fullProgram.application_url,
                program_url: fullProgram.program_url,
                instruments: fullProgram.program_instruments.map((pi) => pi.instrument.name).join(', '),
                categories: fullProgram.program_categories.map((pc) => pc.category.name).join(', '),
                locations: fullProgram.program_locations.map((pl) => `${pl.location.city}/${pl.location.country}`).join(', '),
              }}
              validInstruments={allInstruments.map((i) => i.name)}
              validCategories={allCategories.map((c) => c.name)}
              validLocations={allLocations.map((l) => `${l.city}/${l.country}`)}
            />
          </div>
        </section>
      )}

      {/* Reviews for selected program */}
      {selectedProgram && (
        <section className="mt-10 border-t border-gray-200 pt-8">
          <h2 className="text-lg font-semibold text-gray-900">
            Reviews for {selectedProgram.name} ({reviews.length})
          </h2>
          {reviews.length === 0 ? (
            <p className="mt-3 text-sm text-gray-600">No reviews.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {reviews.map((r) => (
                <div
                  key={r.id}
                  className="flex items-start justify-between rounded-lg border border-gray-200 bg-white p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-yellow-500">
                        {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                      </span>
                      {r.title && (
                        <span className="font-medium text-gray-900">{r.title}</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-700 line-clamp-2">{r.body}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {r.reviewer_name ?? 'Anonymous'}
                      {r.year_attended ? ` · ${r.year_attended}` : ''}
                      {' · '}
                      {r.created_at.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="ml-4">
                    <DeleteButton
                      action={deleteReview}
                      name="review_id"
                      value={r.id}
                      confirmMessage="Delete this review?"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Auditions for selected program */}
      {selectedProgram && (
        <section className="mt-10 border-t border-gray-200 pt-8">
          <h2 className="text-lg font-semibold text-gray-900">
            Auditions for {selectedProgram.name} ({auditions.length})
          </h2>

          {auditions.length > 0 && (
            <div className="mt-4 space-y-3">
              {auditions.map((a) => {
                const locStr = `${a.location.city}/${a.location.country}`
                const tsStr = a.time_slot
                  ? a.time_slot.toISOString().slice(0, 16)
                  : ''
                const instStr = a.audition_instruments
                  .map((ai) => ai.instrument.name)
                  .join(', ')

                return (
                  <div key={a.id} className="space-y-3">
                    <div className="flex items-start justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">{a.location.city}, {a.location.country}</span>
                        {a.time_slot && (
                          <span className="ml-2 text-gray-500">
                            {a.time_slot.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                        {a.audition_fee !== null && (
                          <span className="ml-2 text-gray-500">
                            Fee: ${a.audition_fee}
                          </span>
                        )}
                        {instStr && (
                          <span className="ml-2 text-gray-400">{instStr}</span>
                        )}
                      </div>
                      <DeleteButton
                        action={deleteAudition}
                        name="audition_id"
                        value={a.id}
                        confirmMessage="Delete this audition?"
                      />
                    </div>
                    <AuditionForm
                      programId={selectedProgramId!}
                      audition={{
                        id: a.id,
                        location: locStr,
                        time_slot: tsStr,
                        audition_fee: a.audition_fee?.toString() ?? '',
                        instructions: a.instructions ?? '',
                        registration_url: a.registration_url ?? '',
                        instruments: instStr,
                      }}
                      validLocations={allLocations.map((l) => `${l.city}/${l.country}`)}
                      validInstruments={allInstruments.map((i) => i.name)}
                    />
                  </div>
                )
              })}
            </div>
          )}

          {/* Add new audition */}
          <div className="mt-4">
            <AuditionForm
              programId={selectedProgramId!}
              validLocations={allLocations.map((l) => `${l.city}/${l.country}`)}
              validInstruments={allInstruments.map((i) => i.name)}
            />
          </div>
        </section>
      )}
    </div>
  )
}
