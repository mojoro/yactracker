'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const COOKIE_NAME = 'admin_token'
const MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export async function adminLogin(formData: FormData) {
  const token = formData.get('token') as string
  const expected = process.env.ADMIN_TOKEN

  if (!expected) throw new Error('ADMIN_TOKEN not configured')
  if (!token || token !== expected) {
    redirect('/admin?error=invalid')
  }

  const jar = await cookies()
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/admin',
  })

  redirect('/admin/import')
}

export async function adminLogout() {
  const jar = await cookies()
  jar.delete(COOKIE_NAME)
  redirect('/admin')
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const expected = process.env.ADMIN_TOKEN
  if (!expected) return false
  const jar = await cookies()
  return jar.get(COOKIE_NAME)?.value === expected
}
