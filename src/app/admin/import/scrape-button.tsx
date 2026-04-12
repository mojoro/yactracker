'use client'

import { useActionState } from 'react'
import { runScrape } from './actions'

export function ScrapeButton() {
  const [state, action, pending] = useActionState(runScrape, null)

  return (
    <form action={action}>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? 'Scraping...' : 'Run scrape'}
      </button>
      {state?.error && (
        <p className="mt-1 text-xs text-red-600">{state.error}</p>
      )}
      {state?.summary && (
        <p className="mt-1 whitespace-pre-line text-xs text-gray-600">{state.summary}</p>
      )}
    </form>
  )
}
