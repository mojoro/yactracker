'use client'

import { useActionState } from 'react'
import { updateProgram } from './actions'

interface ProgramData {
  id: string
  name: string
  description: string | null
  start_date: string | null
  end_date: string | null
  application_deadline: string | null
  tuition: number | null
  application_fee: number | null
  age_min: number | null
  age_max: number | null
  offers_scholarship: boolean
  application_url: string | null
  program_url: string | null
  instruments: string
  categories: string
  locations: string
}

function Field({
  label,
  name,
  defaultValue,
  type = 'text',
  placeholder,
}: {
  label: string
  name: string
  defaultValue: string
  type?: string
  placeholder?: string
}) {
  return (
    <div>
      <label htmlFor={`prog_${name}`} className="block text-xs text-gray-600">
        {label}
      </label>
      <input
        id={`prog_${name}`}
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
      />
    </div>
  )
}

export function ProgramEditor({
  program,
  validInstruments,
  validCategories,
  validLocations,
}: {
  program: ProgramData
  validInstruments: string[]
  validCategories: string[]
  validLocations: string[]
}) {
  const [state, action, pending] = useActionState(updateProgram, null)

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="program_id" value={program.id} />

      {state?.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      {state?.message && (
        <p className="text-sm text-green-700">{state.message}</p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Name" name="name" defaultValue={program.name} />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="prog_description" className="block text-xs text-gray-600">
            Description
          </label>
          <textarea
            id="prog_description"
            name="description"
            defaultValue={program.description ?? ''}
            rows={3}
            className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          />
        </div>

        <Field
          label="Start date"
          name="start_date"
          type="date"
          defaultValue={program.start_date ?? ''}
        />
        <Field
          label="End date"
          name="end_date"
          type="date"
          defaultValue={program.end_date ?? ''}
        />
        <Field
          label="Application deadline"
          name="application_deadline"
          type="date"
          defaultValue={program.application_deadline ?? ''}
        />
        <Field
          label="Tuition (USD)"
          name="tuition"
          type="number"
          defaultValue={program.tuition?.toString() ?? ''}
          placeholder="0 = free"
        />
        <Field
          label="Application fee (USD)"
          name="application_fee"
          type="number"
          defaultValue={program.application_fee?.toString() ?? ''}
        />
        <Field
          label="Age min"
          name="age_min"
          type="number"
          defaultValue={program.age_min?.toString() ?? ''}
        />
        <Field
          label="Age max"
          name="age_max"
          type="number"
          defaultValue={program.age_max?.toString() ?? ''}
        />

        <div className="flex items-end">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              name="offers_scholarship"
              value="true"
              defaultChecked={program.offers_scholarship}
              className="h-4 w-4 rounded border-gray-300"
            />
            Offers scholarship
          </label>
        </div>

        <Field
          label="Program URL"
          name="program_url"
          type="url"
          defaultValue={program.program_url ?? ''}
        />
        <Field
          label="Application URL"
          name="application_url"
          type="url"
          defaultValue={program.application_url ?? ''}
        />

        <div className="sm:col-span-2">
          <Field
            label="Instruments (comma-separated)"
            name="instruments"
            defaultValue={program.instruments}
            placeholder="Voice, Piano, Violin"
          />
          <p className="mt-1 text-xs text-gray-400">
            Valid: {validInstruments.join(', ')}
          </p>
        </div>
        <div className="sm:col-span-2">
          <Field
            label="Categories (comma-separated)"
            name="categories"
            defaultValue={program.categories}
            placeholder="Opera, Chamber Music"
          />
          <p className="mt-1 text-xs text-gray-400">
            Valid: {validCategories.join(', ')}
          </p>
        </div>
        <div className="sm:col-span-2">
          <Field
            label="Locations (city/country, comma-separated)"
            name="locations"
            defaultValue={program.locations}
            placeholder="Salzburg/Austria, Aspen/US"
          />
          <p className="mt-1 text-xs text-gray-400">
            Valid: {validLocations.join(', ')}
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {pending ? 'Saving...' : 'Save program'}
      </button>
    </form>
  )
}
