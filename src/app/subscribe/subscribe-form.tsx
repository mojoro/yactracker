'use client'

import { useActionState } from 'react'
import { subscribe } from './actions'

export function SubscribeForm({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  const [state, action, pending] = useActionState(subscribe, null)

  if (state?.message) {
    return (
      <p className={`text-sm font-medium ${variant === 'dark' ? 'text-green-400' : 'text-success-700'}`}>
        {state.message}
      </p>
    )
  }

  const inputClass =
    variant === 'dark'
      ? 'flex-1 rounded-lg border-0 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-slate-400 ring-1 ring-white/20 focus:ring-2 focus:ring-brand-500 focus:bg-white/15 transition-colors'
      : 'flex-1 rounded-lg border-0 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-colors'

  const buttonClass =
    variant === 'dark'
      ? 'rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors disabled:opacity-50'
      : 'rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors disabled:opacity-50'

  return (
    <form action={action}>
      <div className="flex gap-2">
        <label htmlFor={`email-${variant}`} className="sr-only">
          Email address
        </label>
        <input
          id={`email-${variant}`}
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className={inputClass}
        />
        <button type="submit" disabled={pending}>
          <span className={buttonClass}>
            {pending ? 'Joining...' : 'Subscribe'}
          </span>
        </button>
      </div>
      {state?.error && (
        <p className="mt-2 text-sm text-red-500">{state.error}</p>
      )}
    </form>
  )
}
