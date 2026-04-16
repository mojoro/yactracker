'use client'

import { useActionState } from 'react'
import { updateFeedbackStatus, deleteFeedback, type UpdateFeedbackState } from './actions'

export function FeedbackCard({
  feedback,
}: {
  feedback: {
    id: string
    message: string
    email: string | null
    status: string
    admin_notes: string | null
    created_at: string
  }
}) {
  const [state, action, pending] = useActionState<UpdateFeedbackState | null, FormData>(
    updateFeedbackStatus,
    null,
  )

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-50 text-yellow-800',
    read: 'bg-blue-50 text-blue-800',
    resolved: 'bg-green-50 text-green-800',
  }

  return (
    <div className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-gray-200">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[feedback.status] ?? 'bg-gray-100 text-gray-600'}`}
            >
              {feedback.status}
            </span>
            <span className="text-xs text-gray-400">
              {new Date(feedback.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </span>
          </div>

          <p className="mt-2 text-sm whitespace-pre-line text-gray-700">{feedback.message}</p>

          {feedback.email && (
            <p className="mt-1 text-xs text-gray-400">
              From: <a href={`mailto:${feedback.email}`} className="underline">{feedback.email}</a>
            </p>
          )}
        </div>

        <form action={deleteFeedback}>
          <input type="hidden" name="feedback_id" value={feedback.id} />
          <button
            type="submit"
            className="text-xs text-gray-400 transition-colors hover:text-red-600"
            title="Delete feedback"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
              />
            </svg>
          </button>
        </form>
      </div>

      <form action={action} className="mt-4 border-t border-gray-100 pt-3">
        <input type="hidden" name="feedback_id" value={feedback.id} />

        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <label
              htmlFor={`notes-${feedback.id}`}
              className="mb-1 block text-xs font-medium text-gray-500"
            >
              Admin notes
            </label>
            <input
              id={`notes-${feedback.id}`}
              name="admin_notes"
              type="text"
              defaultValue={feedback.admin_notes ?? ''}
              className="w-full rounded-md border-0 bg-gray-50 px-2.5 py-1.5 text-sm text-gray-900 ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor={`status-${feedback.id}`}
              className="mb-1 block text-xs font-medium text-gray-500"
            >
              Status
            </label>
            <select
              id={`status-${feedback.id}`}
              name="status"
              defaultValue={feedback.status}
              className="rounded-md border-0 bg-gray-50 px-2.5 py-1.5 text-sm text-gray-900 ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500"
            >
              <option value="pending">Pending</option>
              <option value="read">Read</option>
              <option value="resolved">Resolved</option>
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
