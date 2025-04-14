import { getRequestConfig } from 'next-intl/server'

import { defaultLocale, locales } from './config'
import { getServerLocale } from './locale.server'
import type { Locale } from './types'

const i18nRequestConfig = getRequestConfig(async () => {
  const locale = (await getServerLocale()) as Locale

  return {
    locale,
    messages:
      locale === defaultLocale || !locales.includes(locale)
        ? (await import(`@public/locales/${defaultLocale}.json`)).default
        : (await import(`@public/locales/${locale}.json`)).default,
    fallbackLocale: defaultLocale,
  }
})

export default i18nRequestConfig
