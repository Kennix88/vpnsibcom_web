'use server'

import { cookies } from 'next/headers'
import { defaultLocale } from './config'
import type { Locale } from './types'

const COOKIE_NAME = 'LOCALE_KEY'

export const getServerLocale = async () => {
  const locale = (await cookies()).get(COOKIE_NAME)
  return locale?.value || defaultLocale
}

export const setServerLocale = async (locale?: string) => {
  ;(await cookies()).set(COOKIE_NAME, (locale as Locale) || defaultLocale)
}
