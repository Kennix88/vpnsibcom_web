'use client'

import { useLocale as useNextIntlLocale } from 'next-intl'
import { getDateFnsLocale } from '@app/utils/date-fns-locale.util'
import { Locale } from 'date-fns'

/**
 * Hook to get current locale information
 * @returns Object with locale string and date-fns locale object
 */
export const useLocale = (): { locale: string; dateFnsLocale: Locale } => {
  const locale = useNextIntlLocale()
  const dateFnsLocale = getDateFnsLocale(locale)
  
  return { locale, dateFnsLocale }
}