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
      <ul className="mt-4 flex flex-col gap-2">
        {PLATFORMS.map((platform) => {
          const voted = state.voted[platform]
          const count = state.counts[platform]
          const pct = total > 0 ? (count / total) * 100 : 0
          return (
            <li key={platform}>
              <label className="-mx-3 flex cursor-pointer items-center gap-3 rounded-md px-3 py-1.5 transition-colors hover:bg-brand-600/5">
                <input
                  type="checkbox"
                  checked={voted}
                  onChange={() => handleClick(platform)}
                  disabled={isPending}
                  className="h-4 w-4 shrink-0 cursor-pointer accent-brand-600 disabled:opacity-60"
                />
                <span className="w-20 shrink-0 text-sm font-medium text-slate-700">
                  {LABELS[platform]}
                </span>
                <span
                  aria-hidden="true"
                  className="relative h-2 flex-1 overflow-hidden rounded-full bg-brand-600/10"
                >
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-brand-600 transition-[width] duration-300 ease-out"
                    style={{ width: `${pct}%` }}
                  />
                </span>
                <span className="w-20 shrink-0 text-right text-sm text-slate-600 tabular-nums">
                  {Math.round(pct)}% ({count})
                </span>
              </label>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
