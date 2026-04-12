'use server'

import { prisma } from '@/lib/prisma'

export interface SubscribeState {
  message?: string
  error?: string
}

export async function subscribe(
  _prev: SubscribeState | null,
  formData: FormData,
): Promise<SubscribeState> {
  const email = (formData.get('email') as string)?.trim().toLowerCase()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Please enter a valid email address.' }
  }

  try {
    await prisma.subscriber.create({ data: { email } })
    return { message: "You're on the list! We'll be in touch." }
  } catch (e: unknown) {
    if (
      typeof e === 'object' &&
      e !== null &&
      'code' in e &&
      (e as { code: string }).code === 'P2002'
    ) {
      return { message: "You're already subscribed!" }
    }
    console.error('[subscribe] failed:', e)
    return { error: 'Something went wrong. Please try again.' }
  }
}
