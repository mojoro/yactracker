'use client'

import { useOptimistic, useTransition } from 'react'
import { PLATFORMS, type Platform } from './platform-poll-constants'
import { togglePlatformVote } from './platform-poll-actions'

const LABELS: Record<Platform, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  discord: 'Discord',
  reddit: 'Reddit',
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

  return (
    <div>
      <h3 className="text-sm font-medium text-slate-600">
        Where should the Young Artist Community live?
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        We&apos;re thinking of starting a social space. Vote for any platforms you&apos;d actually
        use — pick as many as you like.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {PLATFORMS.map((platform) => {
          const voted = state.voted[platform]
          const count = state.counts[platform]
          const base =
            'rounded-full px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 ring-1'
          const styles = voted
            ? 'bg-brand-600 text-white ring-brand-600 hover:bg-brand-700'
            : 'bg-white text-slate-700 ring-slate-900/10 hover:text-brand-600 hover:ring-brand-600/40'
          return (
            <button
              key={platform}
              type="button"
              onClick={() => handleClick(platform)}
              disabled={isPending}
              aria-pressed={voted}
              aria-label={
                voted ? `Remove vote for ${LABELS[platform]}` : `Vote for ${LABELS[platform]}`
              }
              className={`${base} ${styles}`}
            >
              {LABELS[platform]} ({count})
            </button>
          )
        })}
      </div>
    </div>
  )
}
