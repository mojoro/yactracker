'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

export interface UpdateFeedbackState {
  message?: string
  error?: string
}

export async function updateFeedbackStatus(
  _prev: UpdateFeedbackState | null,
  formData: FormData,
): Promise<UpdateFeedbackState> {
  const feedback_id = String(formData.get('feedback_id') ?? '').trim()
  if (!feedback_id) return { error: 'Missing feedback ID.' }

  const status = String(formData.get('status') ?? '').trim()
  if (!['pending', 'read', 'resolved'].includes(status)) {
    return { error: 'Invalid status.' }
  }

  const admin_notes = String(formData.get('admin_notes') ?? '').trim() || null

  await prisma.feedback.update({
    where: { id: feedback_id },
    data: { status, admin_notes },
  })

  revalidatePath('/admin/feedback')
  return { message: 'Updated.' }
}

export async function deleteFeedback(formData: FormData): Promise<void> {
  const feedback_id = String(formData.get('feedback_id') ?? '').trim()
  if (!feedback_id) return

  await prisma.feedback.delete({ where: { id: feedback_id } })
  revalidatePath('/admin/feedback')
}
