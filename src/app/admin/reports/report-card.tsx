'use client'

import { useActionState } from 'react'
import { updateReportStatus, deleteReport, type UpdateReportState } from './actions'

export function ReportCard({
  report,
}: {
  report: {
    id: string
    report_type: string
    description: string
    reporter_email: string | null
    status: string
    admin_notes: string | null
    created_at: string
    program_name: string | null
    program_id: string | null
    review_id: string | null
    review_snippet: string | null
  }
}) {
  const [state, action, pending] = useActionState<UpdateReportState | null, FormData>(
    updateReportStatus,
    null,
  )

  const typeLabel: Record<string, string> = {
    inaccurate_data: 'Inaccurate data',
    inappropriate_content: 'Inappropriate content',
    other: 'Other',
  }

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-50 text-yellow-800',
    reviewed: 'bg-blue-50 text-blue-800',
    resolved: 'bg-green-50 text-green-800',
    dismissed: 'bg-gray-100 text-gray-600',
  }

  return (
    <div className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-gray-200">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[report.status] ?? 'bg-gray-100 text-gray-600'}`}>
              {report.status}
            </span>
            <span className="text-xs font-medium text-gray-500">
              {typeLabel[report.report_type] ?? report.report_type}
            </span>
            <span className="text-xs text-gray-400">
              {new Date(report.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </span>
          </div>

          {report.program_name && (
            <p className="mt-1 text-sm font-medium text-gray-900">
              Program: {report.program_name}
              {report.review_id && (
                <span className="ml-1 text-gray-500">(on a review)</span>
              )}
            </p>
          )}

          {report.review_snippet && (
            <p className="mt-1 truncate text-xs italic text-gray-400">
              Review: &ldquo;{report.review_snippet}&rdquo;
            </p>
          )}

          <p className="mt-2 whitespace-pre-line text-sm text-gray-700">
            {report.description}
          </p>

          {report.reporter_email && (
            <p className="mt-1 text-xs text-gray-400">
              From: {report.reporter_email}
            </p>
          )}
        </div>

        <form action={deleteReport}>
          <input type="hidden" name="report_id" value={report.id} />
          <button
            type="submit"
            className="text-xs text-gray-400 hover:text-red-600 transition-colors"
            title="Delete report"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>
        </form>
      </div>

      {/* Admin action form */}
      <form action={action} className="mt-4 border-t border-gray-100 pt-3">
        <input type="hidden" name="report_id" value={report.id} />

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor={`notes-${report.id}`} className="block text-xs font-medium text-gray-500 mb-1">
              Admin notes
            </label>
            <input
              id={`notes-${report.id}`}
              name="admin_notes"
              type="text"
              defaultValue={report.admin_notes ?? ''}
              className="w-full rounded-md border-0 bg-gray-50 px-2.5 py-1.5 text-sm text-gray-900 ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor={`status-${report.id}`} className="block text-xs font-medium text-gray-500 mb-1">
              Status
            </label>
            <select
              id={`status-${report.id}`}
              name="status"
              defaultValue={report.status}
              className="rounded-md border-0 bg-gray-50 px-2.5 py-1.5 text-sm text-gray-900 ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500"
            >
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {pending ? 'Saving...' : 'Save'}
          </button>
        </div>

        {state?.message && <p className="mt-1 text-xs text-green-600">{state.message}</p>}
        {state?.error && <p className="mt-1 text-xs text-red-600">{state.error}</p>}
      </form>
    </div>
  )
}
