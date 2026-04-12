import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { ProgramForm } from './program-form'

export const metadata = {
  title: 'Submit a Program — YACTracker',
  description: 'Submit a young artist program to the YACTracker directory.',
}

export default async function NewProgramPage() {
  const [instruments, categories, locations] = await Promise.all([
    prisma.instrument.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.category.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
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
        href="/programs"
        className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        Back to programs
      </Link>

      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
        Submit a Program
      </h1>
      <p className="mt-2 text-base text-slate-500">
        Know a young artist program that should be listed? Fill out the details below
        and it will be added to the directory.
      </p>

      <div className="mt-8 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
        <ProgramForm
          instruments={instruments}
          categories={categories}
          locations={locationOptions}
        />
      </div>
    </div>
  )
}
