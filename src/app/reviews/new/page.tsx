import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { ReviewForm } from './review-form'

export const metadata = {
  title: 'Write a Review | Young Artist Community',
  description: 'Share your experience at a young artist program.',
}

export default async function NewReviewPage() {
  const programs = await prisma.program.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })

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
        Write a Review
      </h1>
      <p className="mt-2 text-base text-slate-500">
        Share your experience at a young artist program. If the program
        isn&apos;t listed yet, just type its name and it will be added
        when you submit.
      </p>

      <div className="mt-8 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
        <ReviewForm programs={programs} />
      </div>
    </div>
  )
}
