import robotsParser, { type Robot } from 'robots-parser'
import { REQUEST_TIMEOUT_MS, ROBOTS_CACHE_TTL_MS, USER_AGENT } from './constants'

interface CachedRobot {
  robot: Robot | null
  fetched_at: number
}

// In-memory cache. Persists for the life of the serverless invocation,
// which is fine: one cron run touches each host's robots.txt at most once.
const cache = new Map<string, CachedRobot>()

/** Exposed for testing only — clears the robots.txt cache. */
export function _clearRobotsCache() {
  cache.clear()
}

function originOf(url: string): string {
  const u = new URL(url)
  return `${u.protocol}//${u.host}`
}

async function fetchRobotsTxt(origin: string): Promise<string | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const res = await fetch(`${origin}/robots.txt`, {
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal,
      redirect: 'follow',
    })
    // 404/410 → "allow all"
    if (res.status === 404 || res.status === 410) return ''
    if (!res.ok) return null
    return await res.text()
  } catch {
    // Network errors default to "allow" — we already rate-limit and ID ourselves.
    return null
  } finally {
    clearTimeout(timer)
  }
}

async function getRobot(origin: string): Promise<Robot | null> {
  const cached = cache.get(origin)
  if (cached && Date.now() - cached.fetched_at < ROBOTS_CACHE_TTL_MS) {
    return cached.robot
  }
  const body = await fetchRobotsTxt(origin)
  const robot = body !== null ? robotsParser(`${origin}/robots.txt`, body) : null
  cache.set(origin, { robot, fetched_at: Date.now() })
  return robot
}

export async function isAllowed(targetUrl: string): Promise<boolean> {
  const origin = originOf(targetUrl)
  const robot = await getRobot(origin)
  if (!robot) return true // unreachable robots.txt → allow (best-effort)
  const allowed = robot.isAllowed(targetUrl, USER_AGENT)
  // robots-parser returns undefined when no applicable rule exists → allow.
  return allowed !== false
}
