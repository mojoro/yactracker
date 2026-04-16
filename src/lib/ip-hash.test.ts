import { describe, it, expect } from 'vitest'
import { hashIp, extractIp } from '@/lib/ip-hash'

describe('hashIp', () => {
  it('produces a 64-char hex string (SHA-256)', async () => {
    const hash = await hashIp('192.168.1.1')
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('returns the same hash for the same IP', async () => {
    const a = await hashIp('10.0.0.1')
    const b = await hashIp('10.0.0.1')
    expect(a).toBe(b)
  })

  it('returns different hashes for different IPs', async () => {
    const a = await hashIp('10.0.0.1')
    const b = await hashIp('10.0.0.2')
    expect(a).not.toBe(b)
  })
})

describe('extractIp', () => {
  it('reads x-forwarded-for header', () => {
    const headers = new Headers({ 'x-forwarded-for': '203.0.113.50' })
    expect(extractIp(headers)).toBe('203.0.113.50')
  })

  it('takes the first IP from a comma-separated x-forwarded-for', () => {
    const headers = new Headers({ 'x-forwarded-for': '203.0.113.50, 70.41.3.18, 150.172.238.178' })
    expect(extractIp(headers)).toBe('203.0.113.50')
  })

  it('falls back to x-real-ip', () => {
    const headers = new Headers({ 'x-real-ip': '198.51.100.1' })
    expect(extractIp(headers)).toBe('198.51.100.1')
  })

  it('returns "unknown" when no IP headers present', () => {
    const headers = new Headers()
    expect(extractIp(headers)).toBe('unknown')
  })
})
