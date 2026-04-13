'use client'

import { useActionState } from 'react'
import { submitReviewGeneric, type SubmitReviewState } from './actions'
import { ProgramCombobox } from '@/app/components/program-combobox'

interface Props {
  programs: { id: string; name: string }[]
}

export function ReviewForm({ programs }: Props) {
  const [state, formAction, pending] = useActionState<SubmitReviewState | null, FormData>(
    submitReviewGeneric,
    null,
  )

  return (
    <form action={formAction}>
      <input type="text" name="url_confirm" tabIndex={-1} autoComplete="off" aria-hidden="true" className="sr-only" />

      {state?.error && (
        <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          {state.error}
        </div>
      )}

      <ProgramCombobox
        name="program"
        options={programs}
        placeholder="Search for a program or type a new name..."
      />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="reviewer_name"
            className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5"
          >
            Your name
          </label>
          <input
            id="reviewer_name"
            name="reviewer_name"
            type="text"
            className="w-full rounded-lg border-0 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-colors"
          />
        </div>

        <div>
          <label
            htmlFor="rating"
            className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5"
          >
            Rating <span className="text-red-500">*</span>
          </label>
          <select
            id="rating"
            name="rating"
            required
            defaultValue=""
            className="w-full rounded-lg border-0 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-colors"
          >
            <option value="" disabled>
              Select a rating
            </option>
            <option value="5">5 — Excellent</option>
            <option value="4">4 — Very good</option>
            <option value="3">3 — Average</option>
            <option value="2">2 — Below average</option>
            <option value="1">1 — Poor</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="year_attended"
            className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5"
          >
            Year attended
          </label>
          <input
            id="year_attended"
            name="year_attended"
            type="number"
            min={1950}
            max={2100}
            step={1}
            className="w-full rounded-lg border-0 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-colors"
          />
        </div>

        <div>
          <label
            htmlFor="title"
            className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5"
          >
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            className="w-full rounded-lg border-0 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-colors"
          />
        </div>
      </div>

      <div className="mt-4">
        <label
          htmlFor="body"
          className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5"
        >
          Review <span className="text-red-500">*</span>
        </label>
        <textarea
          id="body"
          name="body"
          required
          rows={4}
          className="w-full rounded-lg border-0 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-colors"
        />
      </div>

      <div className="mt-5">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? 'Submitting...' : 'Submit review'}
        </button>
      </div>
    </form>
  )
}
