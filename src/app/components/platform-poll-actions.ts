'use server'

import { revalidatePath } from 'next/cache'
import { cookies, headers } from 'next/headers'
import { extractIp, hashIp } from '@/lib/ip-hash'
import { prisma } from '@/lib/prisma'

export const PLATFORMS = ['facebook', 'instagram', 'discord', 'reddit'] as const
export type Platform = (typeof PLATFORMS)[number]

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

  const existing = await prisma.platformVote.findUnique({
    where: { platform_ip_hash: { platform, ip_hash } },
  })

  if (existing) {
    await prisma.platformVote.delete({ where: { id: existing.id } })
  } else {
    await prisma.platformVote.create({ data: { platform, ip_hash } })
  }

  const count = await prisma.platformVote.count({ where: { platform } })

  const cookieStore = await cookies()
  const raw = cookieStore.get(COOKIE_NAME)?.value
  let voted: string[] = []
  try {
    voted = raw ? JSON.parse(raw) : []
  } catch {
    // malformed cookie — treat as no votes
  }
  const updated = existing
    ? voted.filter((p) => p !== platform)
    : voted.includes(platform)
      ? voted
      : [...voted, platform]

  cookieStore.set(COOKIE_NAME, JSON.stringify(updated), {
    path: '/',
    maxAge: COOKIE_MAX_AGE,
    sameSite: 'lax',
  })

  revalidatePath('/')

  return { platform, count, voted: !existing }
}
