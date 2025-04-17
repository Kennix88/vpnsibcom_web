'use server'

import { config } from '@app/config/client'
import { cookies } from 'next/headers'
import { defaultLocale } from './config'
import type { Locale } from './types'

export const getServerLocale = async () => {
  const locale = (await cookies()).get(config.COOKIE_NAME)
  return locale?.value || defaultLocale
}

export const setServerLocale = async (locale?: string) => {
  ;(await cookies()).set(
    config.COOKIE_NAME,
    (locale as Locale) || defaultLocale,
  )
}
