'use server'

import { cookies } from 'next/headers'

/**
 * Server Action — sets locale cookie.
 * Can be called from 'use client' components safely.
 */
export async function setLocale(locale: string): Promise<void> {
  if (!locale) return
  const cookieStore = await cookies()
  cookieStore.set('NEXT_LOCALE', locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
    httpOnly: false, // must be readable client-side for i18n routing
  })
}
