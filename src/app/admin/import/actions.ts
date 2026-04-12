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
 * Run fetch+extract for all active ImportSources.
 * Returns a summary string shown via the page's search params.
 */
export async function runScrape() {
  const sources = await prisma.importSource.findMany({
    where: { status: 'active' },
    orderBy: { last_fetched_at: { sort: 'asc', nulls: 'first' } },
  })

  if (sources.length === 0) {
    revalidatePath('/admin/import')
    return
  }

  const results = { success: 0, unchanged: 0, error: 0 }
  for (const source of sources) {
    const r = await runFetchForSource(source, { extract: true })
    if (r.result === 'success') results.success++
    else if (r.result === 'unchanged') results.unchanged++
    else results.error++
  }

  revalidatePath('/admin/import')
}
