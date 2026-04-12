import type { ImportSource } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { fetchSource, type FetchResult } from './fetcher'
import { extractProgram, type ExtractionResult } from './extractor'

export interface RunSourceResult {
  import_run_id: string
  source_id: string
  result: 'success' | 'unchanged' | 'fetch_error' | 'extraction_error'
  fetch: FetchResult
  extraction?: ExtractionResult
}

/**
 * Fetch one ImportSource and write an ImportRun row recording the outcome.
 *
 * - On `unchanged`, raw_html_gz is null to save storage.
 * - On `success`, raw_html_gz holds the gzipped body and the source's
 *   last_fetched_at + last_content_hash are updated.
 * - When `extract` is true and fetch succeeds, runs the LLM extractor and
 *   records model/token usage on the ImportRun row.
 */
export async function runFetchForSource(
  source: ImportSource,
  opts?: { extract?: boolean },
): Promise<RunSourceResult> {
  const started_at = new Date()
  const fetch = await fetchSource(source.url, source.last_content_hash)

  const base = {
    import_source_id: source.id,
    started_at,
    finished_at: new Date(),
  }

  if (fetch.kind === 'success') {
    const run = await prisma.importRun.create({
      data: {
        ...base,
        result: 'success',
        http_status: fetch.http_status,
        content_hash: fetch.content_hash,
        raw_html_gz: fetch.raw_html_gz as Uint8Array<ArrayBuffer>,
        raw_html_size: fetch.raw_html_size,
      },
      select: { id: true },
    })
    await prisma.importSource.update({
      where: { id: source.id },
      data: {
        last_fetched_at: base.finished_at,
        last_content_hash: fetch.content_hash,
      },
    })

    // Optional LLM extraction on successful fetch
    if (opts?.extract) {
      const extraction = await extractProgram(fetch.raw_html)
      await prisma.importRun.update({
        where: { id: run.id },
        data: {
          extraction_model: extraction.model,
          extraction_tokens_in: extraction.tokens_in,
          extraction_tokens_out: extraction.tokens_out,
          ...(extraction.kind === 'error' && {
            result: 'extraction_error',
            error_message: extraction.message,
          }),
        },
      })

      const result = extraction.kind === 'error' ? 'extraction_error' as const : 'success' as const
      return { import_run_id: run.id, source_id: source.id, result, fetch, extraction }
    }

    return { import_run_id: run.id, source_id: source.id, result: 'success', fetch }
  }

  if (fetch.kind === 'unchanged') {
    const run = await prisma.importRun.create({
      data: {
        ...base,
        result: 'unchanged',
        http_status: fetch.http_status,
        content_hash: fetch.content_hash,
      },
      select: { id: true },
    })
    await prisma.importSource.update({
      where: { id: source.id },
      data: { last_fetched_at: base.finished_at },
    })
    return { import_run_id: run.id, source_id: source.id, result: 'unchanged', fetch }
  }

  const http_status = fetch.kind === 'fetch_error' ? fetch.http_status : null
  const run = await prisma.importRun.create({
    data: {
      ...base,
      result: 'fetch_error',
      http_status: http_status ?? undefined,
      error_message: fetch.message,
    },
    select: { id: true },
  })
  return { import_run_id: run.id, source_id: source.id, result: 'fetch_error', fetch }
}
