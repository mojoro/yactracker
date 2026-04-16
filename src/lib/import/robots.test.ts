import { describe, it, expect, vi, beforeEach } from 'vitest'
import { isAllowed, _clearRobotsCache } from '@/lib/import/robots'

const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)

function robotsResponse(body: string, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(body),
  })
}

beforeEach(() => {
  fetchMock.mockReset()
  _clearRobotsCache()
})

describe('isAllowed', () => {
  it('allows URL when robots.txt has no matching rule', async () => {
    fetchMock.mockReturnValue(robotsResponse('User-agent: *\nAllow: /'))
    expect(await isAllowed('https://example.com/programs')).toBe(true)
  })

  it('disallows URL blocked by robots.txt', async () => {
    fetchMock.mockReturnValue(
      robotsResponse('User-agent: YoungArtistCommunityBot\nDisallow: /private/'),
    )
    expect(await isAllowed('https://example.com/private/page')).toBe(false)
  })

  it('allows URL when robots.txt returns 404', async () => {
    fetchMock.mockReturnValue(robotsResponse('', 404))
    expect(await isAllowed('https://notfound.com/page')).toBe(true)
  })

  it('allows URL when robots.txt returns 410', async () => {
    fetchMock.mockReturnValue(robotsResponse('', 410))
    expect(await isAllowed('https://gone.com/page')).toBe(true)
  })

  it('allows URL when fetch throws a network error', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'))
    expect(await isAllowed('https://down.com/page')).toBe(true)
  })

  it('caches robots.txt per origin', async () => {
    fetchMock.mockReturnValue(robotsResponse('User-agent: *\nAllow: /'))
    await isAllowed('https://cached.com/a')
    await isAllowed('https://cached.com/b')
    const calls = fetchMock.mock.calls.filter(
      (c: [string]) => typeof c[0] === 'string' && c[0].includes('cached.com'),
    )
    expect(calls).toHaveLength(1)
  })

  it('allows when robots.txt has non-OK status other than 404/410', async () => {
    fetchMock.mockReturnValue(robotsResponse('', 500))
    expect(await isAllowed('https://error.com/page')).toBe(true)
  })
})
