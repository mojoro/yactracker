import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { isAdminAuthenticated, adminLogout } from '../actions'
import { FeedbackCard } from './feedback-card'

type SearchParams = { [key: string]: string | string[] | undefined }

const STATUS_FILTERS = ['all', 'pending', 'read', 'resolved'] as const

export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  if (!(await isAdminAuthenticated())) redirect('/admin')

  const params = await searchParams
  const statusFilter =
    typeof params.status === 'string' &&
    STATUS_FILTERS.includes(params.status as (typeof STATUS_FILTERS)[number])
      ? params.status
      : 'pending'

  const where = statusFilter === 'all' ? {} : { status: statusFilter }

  const [rows, counts] = await Promise.all([
    prisma.feedback.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: 100,
    }),
    prisma.feedback.groupBy({
      by: ['status'],
      _count: { status: true },
    }),
  ])

  const countByStatus: Record<string, number> = {}
  let total = 0
  for (const row of counts) {
    countByStatus[row.status] = row._count.status
    total += row._count.status
  }

  const formatted = rows.map((r) => ({
    id: r.id,
    message: r.message,
    email: r.email,
    status: r.status,
    admin_notes: r.admin_notes,
    created_at: r.created_at.toISOString(),
  }))

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Feedback</h1>
        <div className="flex items-center gap-4">
          <Link
            href="/admin/import"
            prefetch={false}
            className="text-sm text-gray-600 underline hover:text-gray-900"
          >
            Import
          </Link>
          <Link
            href="/admin/data"
            prefetch={false}
            className="text-sm text-gray-600 underline hover:text-gray-900"
          >
            Data
          </Link>
          <Link
            href="/admin/reports"
            prefetch={false}
            className="text-sm text-gray-600 underline hover:text-gray-900"
          >
            Reports
          </Link>
          <Link
            href="/"
            prefetch={false}
            className="text-sm text-gray-600 underline hover:text-gray-900"
          >
            Back to site
          </Link>
          <form action={adminLogout}>
            <button type="submit" className="text-sm text-gray-600 underline hover:text-gray-900">
              Log out
            </button>
          </form>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="mt-6 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => {
          const count = s === 'all' ? total : (countByStatus[s] ?? 0)
          const isActive = s === statusFilter
          return (
            <Link
              key={s}
              href={`/admin/feedback?status=${s}`}
              prefetch={false}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                isActive ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
              {count > 0 && (
                <span className={`ml-1.5 ${isActive ? 'text-gray-300' : 'text-gray-400'}`}>
                  {count}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* Feedback list */}
      {formatted.length === 0 ? (
        <p className="mt-8 text-sm text-gray-500">
          No {statusFilter === 'all' ? '' : statusFilter} feedback.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {formatted.map((fb) => (
            <FeedbackCard key={fb.id} feedback={fb} />
          ))}
        </div>
      )}
    </div>
  )
}
