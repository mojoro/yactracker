'use client'

import { useState, useActionState } from 'react'
import { updateCandidate } from './actions'

export function CandidateEditor({
  candidateId,
  extracted,
}: {
  candidateId: string
  extracted: Record<string, unknown>
}) {
  const [open, setOpen] = useState(false)
  const [json, setJson] = useState(() => JSON.stringify(extracted, null, 2))
  const [state, action, pending] = useActionState(updateCandidate, null)

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-blue-600 hover:underline"
      >
        Edit
      </button>
    )
  }

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <form action={action}>
        <input type="hidden" name="candidate_id" value={candidateId} />
        <label className="block text-xs font-medium text-gray-600">
          Extracted JSON
        </label>
        <textarea
          name="extracted_json"
          value={json}
          onChange={(e) => setJson(e.target.value)}
          rows={16}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-xs leading-relaxed"
          spellCheck={false}
        />
        {state?.error && (
          <p className="mt-1 text-xs text-red-600">{state.error}</p>
        )}
        {state?.message && (
          <p className="mt-1 text-xs text-green-700">{state.message}</p>
        )}
        <div className="mt-2 flex items-center gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {pending ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => {
              setJson(JSON.stringify(extracted, null, 2))
              setOpen(false)
            }}
            className="text-xs text-gray-500 hover:text-gray-900"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
