'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

export interface UpdateReportState {
  message?: string
  error?: string
}

export async function updateReportStatus(
  _prev: UpdateReportState | null,
  formData: FormData,
): Promise<UpdateReportState> {
  const id = formData.get('report_id') as string
  if (!id) return { error: 'Missing report_id' }

  const status = formData.get('status') as string
  if (!['pending', 'reviewed', 'resolved', 'dismissed'].includes(status)) {
    return { error: 'Invalid status.' }
  }

  const admin_notes = (formData.get('admin_notes') as string)?.trim() || null

  await prisma.report.update({
    where: { id },
    data: { status, admin_notes },
  })

  revalidatePath('/admin/reports')
  return { message: 'Report updated.' }
}

export async function deleteReport(formData: FormData) {
  const id = formData.get('report_id') as string
  if (!id) throw new Error('Missing report_id')

  await prisma.report.delete({ where: { id } })
  revalidatePath('/admin/reports')
}
