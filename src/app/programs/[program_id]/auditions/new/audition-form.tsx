'use client'

import { useActionState } from 'react'
import { createAudition, type CreateAuditionState } from './actions'
import { Combobox, LocationCombobox } from '@/app/components/combobox'

interface Props {
  programId: string
  instruments: { id: string; name: string }[]
  locations: { id: string; name: string }[]
}

export function AuditionForm({ programId, instruments, locations }: Props) {
  const [state, formAction, pending] = useActionState<CreateAuditionState | null, FormData>(
    createAudition,
    null,
  )

  return (
    <form action={formAction}>
      <input type="hidden" name="program_id" value={programId} />
      <input type="text" name="url_confirm" tabIndex={-1} autoComplete="off" aria-hidden="true" className="sr-only" />

      {state?.error && (
        <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          {state.error}
        </div>
      )}

      {/* Location */}
      <div>
        <LocationCombobox
          name="location"
          label="Location"
          options={locations}
          placeholder="Search locations..."
          required
        />
      </div>

      {/* Time slot */}
      <div className="mt-5">
        <label
          htmlFor="time_slot"
          className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5"
        >
          Time slot
        </label>
        <input
          id="time_slot"
          name="time_slot"
          type="datetime-local"
          className="w-full rounded-lg border-0 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-colors"
        />
      </div>

      {/* Fee */}
      <div className="mt-5">
        <label
          htmlFor="audition_fee"
          className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5"
        >
          Audition fee (USD)
        </label>
        <input
          id="audition_fee"
          name="audition_fee"
          type="number"
          min="0"
          step="1"
          className="w-full rounded-lg border-0 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-colors"
        />
      </div>

      {/* Instructions */}
      <div className="mt-5">
        <label
          htmlFor="instructions"
          className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5"
        >
          Instructions
        </label>
        <textarea
          id="instructions"
          name="instructions"
          rows={3}
          className="w-full rounded-lg border-0 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-colors"
        />
      </div>

      {/* Registration URL */}
      <div className="mt-5">
        <label
          htmlFor="registration_url"
          className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5"
        >
          Registration URL
        </label>
        <input
          id="registration_url"
          name="registration_url"
          type="url"
          placeholder="https://..."
          className="w-full rounded-lg border-0 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-colors"
        />
      </div>

      {/* Instruments */}
      <div className="mt-5">
        <Combobox
          name="instruments"
          label="Instruments"
          options={instruments}
          placeholder="Search instruments..."
        />
      </div>

      {/* Submit */}
      <div className="mt-8 border-t border-slate-100 pt-5">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? 'Submitting...' : 'Add audition'}
        </button>
      </div>
    </form>
  )
}
