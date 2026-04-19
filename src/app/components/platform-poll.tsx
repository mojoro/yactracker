'use client'

import { useOptimistic, useTransition } from 'react'
import { PLATFORMS, type Platform } from './platform-poll-constants'
import { togglePlatformVote } from './platform-poll-actions'

const LABELS: Record<Platform, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  discord: 'Discord',
  reddit: 'Reddit',
  other: 'Other',
}

type PollState = {
  counts: Record<Platform, number>
  voted: Record<Platform, boolean>
}

export function PlatformPoll({
  initialCounts,
  initialVoted,
}: {
  initialCounts: Record<Platform, number>
  initialVoted: Platform[]
}) {
  const votedMap: Record<Platform, boolean> = {
    facebook: false,
    instagram: false,
    discord: false,
    reddit: false,
    other: false,
  }
  for (const p of initialVoted) votedMap[p] = true

  const [isPending, startTransition] = useTransition()
  const [state, applyOptimistic] = useOptimistic<PollState, Platform>(
    { counts: initialCounts, voted: votedMap },
    (prev, platform) => {
      const wasVoted = prev.voted[platform]
      return {
        counts: {
          ...prev.counts,
          [platform]: prev.counts[platform] + (wasVoted ? -1 : 1),
        },
        voted: { ...prev.voted, [platform]: !wasVoted },
      }
    },
  )

  function handleClick(platform: Platform) {
    startTransition(async () => {
      applyOptimistic(platform)
      await togglePlatformVote(platform)
    })
  }

  const total = Object.values(state.counts).reduce((a, b) => a + b, 0)

  return (
    <div>
      <h3 className="text-sm font-medium text-slate-600">
        Where should the Young Artist Community live?
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        We&apos;re thinking of starting a social space. Vote for any platforms you&apos;d actually
        use — pick as many as you like.
      </p>
      <ul className="mt-4 flex flex-col gap-3">
        {PLATFORMS.map((platform) => {
          const voted = state.voted[platform]
          const count = state.counts[platform]
          const pct = total > 0 ? (count / total) * 100 : 0
          return (
            <li key={platform}>
              <label className="-mx-3 flex cursor-pointer items-center gap-4 rounded-xl px-3 py-2 transition-colors hover:bg-brand-600/5 sm:gap-3 sm:py-1.5">
                <span className="relative mt-2 inline-block h-6 w-6 shrink-0 self-center sm:mt-0 sm:h-4 sm:w-4">
                  <input
                    type="checkbox"
                    checked={voted}
                    onChange={() => handleClick(platform)}
                    disabled={isPending}
                    className="peer h-full w-full cursor-pointer appearance-none rounded-full border-2 border-slate-300 bg-white transition-colors checked:border-brand-600 checked:bg-brand-600 disabled:opacity-60"
                  />
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="pointer-events-none absolute top-1/2 left-1/2 hidden h-3/5 w-3/5 -translate-x-1/2 -translate-y-1/2 text-white peer-checked:block"
                  >
                    <path d="M4 8.5 6.5 11 12 5.5" />
                  </svg>
                </span>
                <div className="flex flex-1 flex-col gap-1 sm:contents">
                  <div className="flex items-center justify-between gap-3 sm:contents">
                    <span className="text-sm font-medium text-slate-700 sm:w-20 sm:shrink-0">
                      {LABELS[platform]}
                    </span>
                    <span className="text-sm text-slate-500 tabular-nums sm:order-last sm:w-20 sm:shrink-0 sm:text-right">
                      {Math.round(pct)}% ({count})
                    </span>
                  </div>
                  <span
                    aria-hidden="true"
                    className="relative h-2 w-full overflow-hidden rounded-full bg-brand-600/10 sm:w-auto sm:flex-1"
                  >
                    <span
                      className="absolute inset-y-0 left-0 rounded-full bg-brand-600 transition-[width] duration-300 ease-out"
                      style={{ width: `${pct}%` }}
                    />
                  </span>
                </div>
              </label>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
