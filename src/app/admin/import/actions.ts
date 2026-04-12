'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { extractedProgramSchema } from '@/lib/import/extractor'
import { upsertProgramFromExtraction } from '@/lib/import/upsert'
import { runFetchForSource } from '@/lib/import/run'

/**
 * Approve a ProgramCandidate: upsert the program from extracted JSON,
 * then mark the candidate as approved with a link to the canonical program.
 */
export async function approveCandidate(formData: FormData) {
  const candidateId = formData.get('candidate_id') as string
  if (!candidateId) throw new Error('Missing candidate_id')

  const candidate = await prisma.programCandidate.findUnique({
    where: { id: candidateId },
    select: {
      id: true,
      extracted_json: true,
      program_id: true,
      status: true,
    },
  })
  if (!candidate) throw new Error('Candidate not found')
  if (candidate.status !== 'pending') throw new Error('Candidate is not pending')

  const parsed = extractedProgramSchema.safeParse(candidate.extracted_json)
  if (!parsed.success) {
    throw new Error(`Invalid extracted_json: ${parsed.error.message}`)
  }

  const programId = await upsertProgramFromExtraction(
    parsed.data,
    candidate.program_id,
  )

  await prisma.programCandidate.update({
    where: { id: candidateId },
    data: {
      status: 'approved',
      approved_at: new Date(),
      program_id: programId,
    },
  })

  revalidatePath('/admin/import')
  revalidatePath('/programs')
}

/**
 * Reject a ProgramCandidate with optional reviewer notes.
 */
export async function rejectCandidate(formData: FormData) {
  const candidateId = formData.get('candidate_id') as string
  const notes = (formData.get('reviewer_notes') as string) || null
  if (!candidateId) throw new Error('Missing candidate_id')

  await prisma.programCandidate.update({
    where: { id: candidateId },
    data: {
      status: 'rejected',
      reviewer_notes: notes,
    },
  })

  revalidatePath('/admin/import')
}

/**
 * Add a new ImportSource.
 */
export async function addSource(formData: FormData) {
  const name = (formData.get('name') as string)?.trim()
  const url = (formData.get('url') as string)?.trim()
  const programId = (formData.get('program_id') as string)?.trim() || null

  if (!name || !url) throw new Error('Name and URL are required')

  await prisma.importSource.create({
    data: {
      name,
      url,
      status: 'active',
      program_id: programId,
    },
  })

  revalidatePath('/admin/import')
}

export interface ScrapeState {
  summary?: string
  error?: string
}

/**
 * Run fetch+extract for all active ImportSources.
 * Returns summary for useActionState display.
 */
export async function runScrape(
  _prev: ScrapeState | null,
): Promise<ScrapeState> {
  try {
    const sources = await prisma.importSource.findMany({
      where: { status: 'active' },
      orderBy: { last_fetched_at: { sort: 'asc', nulls: 'first' } },
    })

    if (sources.length === 0) {
      revalidatePath('/admin/import')
      return { summary: 'No active sources.' }
    }

    const results = { success: 0, unchanged: 0, error: 0 }
    const errors: string[] = []
    for (const source of sources) {
      try {
        const r = await runFetchForSource(source, { extract: true })
        if (r.result === 'success') results.success++
        else if (r.result === 'unchanged') results.unchanged++
        else {
          results.error++
          errors.push(`${source.name}: ${r.result}`)
        }
      } catch (e) {
        results.error++
        errors.push(`${source.name}: ${e instanceof Error ? e.message : String(e)}`)
      }
    }

    revalidatePath('/admin/import')
    const summary = `Done: ${results.success} new, ${results.unchanged} unchanged, ${results.error} errors.`
    return {
      summary: errors.length > 0 ? `${summary}\n${errors.join('\n')}` : summary,
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) }
  }
}
