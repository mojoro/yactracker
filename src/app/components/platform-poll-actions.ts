'use server'

import { revalidatePath } from 'next/cache'
import { cookies, headers } from 'next/headers'
import { extractIp, hashIp } from '@/lib/ip-hash'
import { prisma } from '@/lib/prisma'
import { PLATFORMS, type Platform } from './platform-poll-constants'

const COOKIE_NAME = 'platform_votes'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

function isPlatform(value: string): value is Platform {
  return (PLATFORMS as readonly string[]).includes(value)
}

export async function togglePlatformVote(
  platform: string,
): Promise<{ platform: Platform; count: number; voted: boolean }> {
  if (!isPlatform(platform)) {
    throw new Error(`Unknown platform: ${platform}`)
  }

  const headerStore = await headers()
  const ip = extractIp(headerStore)
  const ip_hash = await hashIp(ip)

  const cookieStore = await cookies()
  const raw = cookieStore.get(COOKIE_NAME)?.value
  let voted: string[] = []
  try {
    voted = raw ? JSON.parse(raw) : []
  } catch {
    // malformed cookie — treat as no votes
  }
  const wasVoted = voted.includes(platform)

  if (wasVoted) {
    await prisma.platformVote.deleteMany({ where: { platform, ip_hash } })
  } else {
    await prisma.platformVote.upsert({
      where: { platform_ip_hash: { platform, ip_hash } },
      create: { platform, ip_hash },
      update: {},
    })
  }

  const count = await prisma.platformVote.count({ where: { platform } })

  const updated = wasVoted ? voted.filter((p) => p !== platform) : [...voted, platform]

  cookieStore.set(COOKIE_NAME, JSON.stringify(updated), {
    path: '/',
    maxAge: COOKIE_MAX_AGE,
    sameSite: 'lax',
  })

  revalidatePath('/')

  return { platform, count, voted: !wasVoted }
}
