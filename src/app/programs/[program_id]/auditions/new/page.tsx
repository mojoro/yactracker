import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AuditionForm } from './audition-form'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ program_id: string }>
}) {
  const { program_id } = await params
  const program = await prisma.program.findUnique({
    where: { id: program_id },
    select: { name: true },
  })
  if (!program) return { title: 'Not Found — YACTracker' }
  return {
    title: `Add Audition — ${program.name} — YACTracker`,
    description: `Submit an audition location for ${program.name}.`,
  }
}

export default async function NewAuditionPage({
  params,
}: {
  params: Promise<{ program_id: string }>
}) {
  const { program_id } = await params

  const program = await prisma.program.findUnique({
    where: { id: program_id },
    select: { id: true, name: true },
  })
  if (!program) notFound()

  const [instruments, locations] = await Promise.all([
    prisma.instrument.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.location.findMany({
      orderBy: [{ country: 'asc' }, { city: 'asc' }],
      select: { id: true, city: true, country: true },
    }),
  ])

  const locationOptions = locations.map((l) => ({
    id: l.id,
    name: `${l.city}, ${l.country}`,
  }))

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href={`/programs/${program.id}`}
        className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        Back to {program.name}
      </Link>

      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
        Add Audition
      </h1>
      <p className="mt-2 text-base text-slate-500">
        Submit an audition location for <span className="font-medium text-slate-700">{program.name}</span>.
      </p>

      <div className="mt-8 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
        <AuditionForm
          programId={program.id}
          instruments={instruments}
          locations={locationOptions}
        />
      </div>
    </div>
  )
}
