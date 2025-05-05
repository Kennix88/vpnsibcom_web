import fs from 'fs/promises'
import path from 'path'
import { defaultLocale, locales } from './config'
import { deepMergeWithFallback, loadTranslations } from './utils'

/**
 * Builds and saves all translations to consolidated files
 * @param isDev - Whether running in development mode
 */
export async function buildTranslations(isDev: boolean = false): Promise<void> {
  try {
    const localesBasePath = path.join(process.cwd(), 'public', 'locales')
    const outputDir = path.join(
      process.cwd(),
      'public',
      'locales',
      '_generated',
    )

    // Ensure output directory exists
    try {
      await fs.access(outputDir)
    } catch {
      await fs.mkdir(outputDir, { recursive: true })
    }

    // Load default locale messages first (for fallback)
    const defaultLocalePath = path.join(localesBasePath, defaultLocale)
    let defaultMessages: Record<string, any> = {}

    try {
      defaultMessages = await loadTranslations(defaultLocalePath)

      // Check if default locale file exists
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
      // console.error(`Error loading default locale:`, error)
    }

    // Save default locale
    await fs.writeFile(
      path.join(outputDir, `${defaultLocale}.json`),
      JSON.stringify(defaultMessages, null, isDev ? 2 : undefined),
    )

    // console.log(`Built translations for ${defaultLocale}`)

    // Process each locale
    for (const locale of locales) {
      if (locale === defaultLocale) continue // Already processed

      let messages: Record<string, any> = {}
      const localeDirPath = path.join(localesBasePath, locale)
      let localeFileExists = false

      try {
        // Check if locale directory exists
        await fs.access(localeDirPath)

        // Load all translations from locale directory
        messages = await loadTranslations(localeDirPath)

        // Check if locale file exists (e.g., en.json)
        const localeFilePath = path.join(localesBasePath, `${locale}.json`)
        try {
          await fs.access(localeFilePath)
          localeFileExists = true

          // Load and merge locale file
          const content = await fs.readFile(localeFilePath, 'utf-8')
          const fileTranslations = JSON.parse(content)
          messages = { ...messages, ...fileTranslations }
        } catch {
          // Locale file doesn't exist, continue with directory translations
        }
      } catch {
        // Locale directory doesn't exist, try to load locale file
        const localeFilePath = path.join(localesBasePath, `${locale}.json`)
        try {
          await fs.access(localeFilePath)
          localeFileExists = true

          // Load locale file
          const content = await fs.readFile(localeFilePath, 'utf-8')
          messages = JSON.parse(content)
        } catch {
          // Neither locale directory nor file exists
          // console.warn(`No translations found for locale: ${locale}`)
        }
      }

      // If no translations found for locale, use default locale
      if (!localeFileExists && Object.keys(messages).length === 0) {
        messages = defaultMessages
      }
      // If we have both locale and default messages, merge them with fallback
      else if (Object.keys(defaultMessages).length > 0) {
        messages = deepMergeWithFallback(messages, defaultMessages)
      }

      // Save merged translations
      await fs.writeFile(
        path.join(outputDir, `${locale}.json`),
        JSON.stringify(messages, null, isDev ? 2 : undefined),
      )

      // console.log(`Built translations for ${locale}`)
    }

    // console.log('All translations built successfully!')
  } catch (error) {
    // console.error('Error building translations:', error)
  }
}

// Allow running directly from command line
if (require.main === module) {
  const isDev = process.env.NODE_ENV !== 'production'
  buildTranslations(isDev).catch(console.error)
}
