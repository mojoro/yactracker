'use client'

import { useActionState } from 'react'
import { createProgram, type CreateProgramState } from './actions'
import { Combobox, LocationCombobox } from '@/app/components/combobox'

interface Props {
  instruments: { id: string; name: string }[]
  categories: { id: string; name: string }[]
  locations: { id: string; name: string }[]
}

export function ProgramForm({ instruments, categories, locations }: Props) {
  const [state, formAction, pending] = useActionState<CreateProgramState | null, FormData>(
    createProgram,
    null,
  )

  return (
    <form action={formAction}>
      {state?.error && (
        <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          {state.error}
        </div>
      )}

      {/* Name */}
      <div>
        <label
          htmlFor="name"
          className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5"
        >
          Program name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="w-full rounded-lg border-0 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-colors"
        />
      </div>

      {/* Description */}
      <div className="mt-5">
        <label
          htmlFor="description"
          className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          className="w-full rounded-lg border-0 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-colors"
        />
      </div>

      {/* Dates */}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label
            htmlFor="start_date"
            className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5"
          >
            Start date
          </label>
          <input
            id="start_date"
            name="start_date"
            type="date"
            className="w-full rounded-lg border-0 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-colors"
          />
        </div>
        <div>
          <label
            htmlFor="end_date"
            className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5"
          >
            End date
          </label>
          <input
            id="end_date"
            name="end_date"
            type="date"
            className="w-full rounded-lg border-0 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-colors"
          />
        </div>
        <div>
          <label
            htmlFor="application_deadline"
            className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5"
          >
            Application deadline
          </label>
          <input
            id="application_deadline"
            name="application_deadline"
            type="date"
            className="w-full rounded-lg border-0 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Financial */}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="tuition"
            className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5"
          >
            Tuition (USD)
          </label>
          <input
            id="tuition"
            name="tuition"
            type="number"
            min="0"
            step="1"
            placeholder="0 = free"
            className="w-full rounded-lg border-0 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-colors"
          />
        </div>
        <div>
          <label
            htmlFor="application_fee"
            className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5"
          >
            Application fee (USD)
          </label>
          <input
            id="application_fee"
            name="application_fee"
            type="number"
            min="0"
            step="1"
            className="w-full rounded-lg border-0 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Age range */}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="age_min"
            className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5"
          >
            Age min
          </label>
          <input
            id="age_min"
            name="age_min"
            type="number"
            min="0"
            max="100"
            className="w-full rounded-lg border-0 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-colors"
          />
        </div>
        <div>
          <label
            htmlFor="age_max"
            className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5"
          >
            Age max
          </label>
          <input
            id="age_max"
            name="age_max"
            type="number"
            min="0"
            max="100"
            className="w-full rounded-lg border-0 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Scholarship */}
      <div className="mt-5 flex items-center pt-2">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            name="offers_scholarship"
            value="true"
            className="h-4 w-4 rounded border-slate-300 accent-brand-600"
          />
          Offers scholarship / financial aid
        </label>
      </div>

      {/* URLs */}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="program_url"
            className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5"
          >
            Program URL
          </label>
          <input
            id="program_url"
            name="program_url"
            type="url"
            placeholder="https://..."
            className="w-full rounded-lg border-0 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-colors"
          />
        </div>
        <div>
          <label
            htmlFor="application_url"
            className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5"
          >
            Application URL
          </label>
          <input
            id="application_url"
            name="application_url"
            type="url"
            placeholder="https://..."
            className="w-full rounded-lg border-0 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-colors"
          />
        </div>
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

      {/* Categories */}
      <div className="mt-5">
        <Combobox
          name="categories"
          label="Categories"
          options={categories}
          placeholder="Search categories..."
        />
      </div>

      {/* Locations */}
      <div className="mt-5">
        <LocationCombobox
          name="locations"
          label="Locations"
          options={locations}
          placeholder="Search locations..."
        />
      </div>

      {/* Submit */}
      <div className="mt-8 border-t border-slate-100 pt-5">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? 'Submitting...' : 'Submit program'}
        </button>
      </div>
    </form>
  )
}
