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
  // Honeypot
  const honeypot = (formData.get('url_confirm') as string)?.trim()
  if (honeypot) return { message: "You're on the list! We'll be in touch." }

  const email = (formData.get('email') as string)?.trim().toLowerCase()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Please enter a valid email address.' }
  }
  if (email.length > 254) {
    return { error: 'Email address is too long.' }
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
