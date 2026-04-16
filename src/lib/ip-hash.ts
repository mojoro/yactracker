import { createHash } from 'node:crypto'

export async function hashIp(ip: string): Promise<string> {
  return createHash('sha256').update(ip).digest('hex')
}

export function extractIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()

  const realIp = headers.get('x-real-ip')
  if (realIp) return realIp.trim()

  return 'unknown'
}
