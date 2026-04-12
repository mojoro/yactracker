import { createHash } from 'node:crypto'
import { gzipSync } from 'node:zlib'
import { REQUEST_TIMEOUT_MS, USER_AGENT } from './constants'
import { isAllowed } from './robots'
import { waitForHostSlot } from './throttle'

export type FetchResult =
  | {
      kind: 'success'
      http_status: number
      content_hash: string
      raw_html: string
      raw_html_gz: Uint8Array
      raw_html_size: number
    }
  | {
      kind: 'unchanged'
      http_status: number
      content_hash: string
    }
  | {
      kind: 'blocked_by_robots'
      message: string
    }
  | {
      kind: 'fetch_error'
      http_status: number | null
      message: string
    }

function sha256(text: string): string {
  return createHash('sha256').update(text).digest('hex')
}

/**
 * Fetch one source URL politely.
 *
 * - Checks robots.txt before the request.
 * - Waits for the per-host rate-limit slot.
 * - Times out after REQUEST_TIMEOUT_MS.
 * - Hashes the response body and compares against `lastHash`; returns
 *   `unchanged` when the content is byte-identical so the caller can skip
 *   extraction and storage.
 */
export async function fetchSource(
  url: string,
  lastHash: string | null,
): Promise<FetchResult> {
  if (!(await isAllowed(url))) {
    return {
      kind: 'blocked_by_robots',
      message: `robots.txt disallows ${USER_AGENT} on ${url}`,
    }
  }

  await waitForHostSlot(url)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: controller.signal,
      redirect: 'follow',
    })

    if (!res.ok) {
      return {
        kind: 'fetch_error',
        http_status: res.status,
        message: `HTTP ${res.status} ${res.statusText}`,
      }
    }

    const raw_html = await res.text()
    const content_hash = sha256(raw_html)

    if (lastHash && lastHash === content_hash) {
      return { kind: 'unchanged', http_status: res.status, content_hash }
    }

    const gz = gzipSync(Buffer.from(raw_html, 'utf8'))
    const raw_html_gz = new Uint8Array(gz.byteLength)
    raw_html_gz.set(gz)
    const raw_html_size = Buffer.byteLength(raw_html, 'utf8')

    return {
      kind: 'success',
      http_status: res.status,
      content_hash,
      raw_html,
      raw_html_gz,
      raw_html_size,
    }
  } catch (e) {
    let message = e instanceof Error ? e.message : String(e)
    // Node/undici wraps the real error in .cause
    if (e instanceof Error && e.cause instanceof Error) {
      message = `${message}: ${e.cause.message}`
    }
    return { kind: 'fetch_error', http_status: null, message }
  } finally {
    clearTimeout(timer)
  }
}
