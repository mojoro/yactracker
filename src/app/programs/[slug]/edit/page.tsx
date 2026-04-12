import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { sortInstruments } from '@/lib/types'
import { EditProgramForm } from './edit-form'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const program = await prisma.program.findUnique({
    where: { slug },
    select: { name: true },
  })
  return {
    title: program ? `Edit ${program.name} | Young Artist Community` : 'Edit Program | Young Artist Community',
  }
}

export default async function EditProgramPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const [programRow, allInstruments, allCategories, allLocations] = await Promise.all([
    prisma.program.findUnique({
      where: { slug },
      include: {
        program_instruments: { include: { instrument: true } },
        program_categories: { include: { category: true } },
        program_locations: { include: { location: true } },
      },
    }),
    prisma.instrument.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.category.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.location.findMany({
      orderBy: [{ country: 'asc' }, { city: 'asc' }],
      select: { id: true, city: true, country: true },
    }),
  ])

  if (!programRow) notFound()

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
    program_url: programRow.program_url,
    application_url: programRow.application_url,
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
      name: `${pl.location.city}, ${pl.location.country}`,
    })),
  }

  const locationOptions = allLocations.map((l) => ({
    id: l.id,
    name: `${l.city}, ${l.country}`,
  }))

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href={`/programs/${slug}`}
        className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        Back to {program.name}
      </Link>

      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
        Edit Program
      </h1>
      <p className="mt-2 text-base text-slate-500">
        Help keep this information accurate. Your changes will be applied immediately.
      </p>

      <div className="mt-8 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
        <EditProgramForm
          program={program}
          allInstruments={sortInstruments(allInstruments)}
          allCategories={allCategories}
          allLocations={locationOptions}
        />
      </div>
    </div>
  )
}
