import fs from 'fs/promises'
import { getRequestConfig } from 'next-intl/server'
import path from 'path'
import { defaultLocale } from './config'
import { getServerLocale } from './locale.server'
import type { Locale } from './types'
import { deepMergeWithFallback, loadTranslations } from './utils'

// Cache for translations to avoid repeated file reads
const translationsCache: Record<string, Record<string, any>> = {}

/**
 * Loads translations from the pre-built files or falls back to dynamic loading
 * @param locale - The locale to load
 * @returns Object with translations
 */
async function getTranslationsForLocale(
  locale: string,
): Promise<Record<string, any>> {
  // Check if translations are already in cache
  if (translationsCache[locale]) {
    return translationsCache[locale]
  }

  try {
    // Try to load from pre-built file first
    const generatedPath = path.join(
      process.cwd(),
      'public',
      'locales',
      '_generated',
      `${locale}.json`,
    )

    try {
      const content = await fs.readFile(generatedPath, 'utf-8')
      const translations = JSON.parse(content)

      // Cache the translations
      translationsCache[locale] = translations

      return translations
    } catch (error) {
      console.warn(
        `Pre-built translations not found for ${locale}, falling back to dynamic loading`,
      )

      // Fall back to dynamic loading if pre-built file doesn't exist
      const localesBasePath = path.join(process.cwd(), 'public', 'locales')
      let messages: Record<string, any> = {}
      let defaultMessages: Record<string, any> = {}

      // Load default locale messages (for fallback)
      if (locale !== defaultLocale) {
        const defaultLocalePath = path.join(localesBasePath, defaultLocale)
        try {
          defaultMessages = await loadTranslations(defaultLocalePath)

          const defaultLocaleFilePath = path.join(
            localesBasePath,
            `${defaultLocale}.json`,
          )
          try {
            const content = await fs.readFile(defaultLocaleFilePath, 'utf-8')
            const fileTranslations = JSON.parse(content)
            defaultMessages = { ...defaultMessages, ...fileTranslations }
          } catch {
            // Default locale file doesn't exist, continue with directory translations
          }
        } catch (error) {
          console.error(`Error loading default locale:`, error)
        }
      }

      // Load locale-specific translations
      const localeDirPath = path.join(localesBasePath, locale)
      let localeFileExists = false

      try {
        await fs.access(localeDirPath)
        messages = await loadTranslations(localeDirPath)

        const localeFilePath = path.join(localesBasePath, `${locale}.json`)
        try {
          await fs.access(localeFilePath)
          localeFileExists = true

          const content = await fs.readFile(localeFilePath, 'utf-8')
          const fileTranslations = JSON.parse(content)
          messages = { ...messages, ...fileTranslations }
        } catch {
          // Locale file doesn't exist, continue with directory translations
        }
      } catch {
        const localeFilePath = path.join(localesBasePath, `${locale}.json`)
        try {
          await fs.access(localeFilePath)
          localeFileExists = true

          const content = await fs.readFile(localeFilePath, 'utf-8')
          messages = JSON.parse(content)
        } catch {
          // Neither locale directory nor file exists
        }
      }

      // Apply fallback logic
      if (!localeFileExists && Object.keys(messages).length === 0) {
        messages = defaultMessages
      } else if (
        locale !== defaultLocale &&
        Object.keys(defaultMessages).length > 0
      ) {
        messages = deepMergeWithFallback(messages, defaultMessages)
      }

      // Cache the translations
      translationsCache[locale] = messages

      return messages
    }
  } catch (error) {
    console.error(`Error loading translations for ${locale}:`, error)
    return {}
  }
}

const i18nRequestConfig = getRequestConfig(async () => {
  const locale = (await getServerLocale()) as Locale
  const messages = await getTranslationsForLocale(locale)

  return {
    locale,
    messages,
    fallbackLocale: defaultLocale,
  }
})

export default i18nRequestConfig
