'use client'

import { useOptimistic, useTransition } from 'react'
import { toggleHelpful } from './actions'

export function HelpfulButton({
  reviewId,
  initialCount,
  initialLiked,
}: {
  reviewId: string
  initialCount: number
  initialLiked: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [optimistic, setOptimistic] = useOptimistic(
    { count: initialCount, liked: initialLiked },
    (state) => ({
      count: state.liked ? state.count - 1 : state.count + 1,
      liked: !state.liked,
    }),
  )

  function handleClick() {
    startTransition(async () => {
      setOptimistic(optimistic)
      await toggleHelpful(reviewId)
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="mt-3 inline-flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-red-400 disabled:opacity-50"
      aria-label={optimistic.liked ? 'Remove helpful vote' : 'Mark as helpful'}
    >
      {optimistic.liked ? (
        <svg className="h-4 w-4 text-red-400" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
        </svg>
      ) : (
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
          />
        </svg>
      )}
      <span>
        {optimistic.count > 0 ? `Helpful (${optimistic.count})` : 'Helpful'}
      </span>
    </button>
  )
}
