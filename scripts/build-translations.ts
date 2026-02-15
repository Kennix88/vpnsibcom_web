import { buildTranslations } from '../src/core/i18n/build-translations.js'

async function main() {
  console.log('[i18n] Building translations for production...')
  await buildTranslations(false)
  console.log('[i18n] Translations build finished')
}

main().catch((err) => {
  console.error('[i18n] Build failed:', err)
  process.exit(1)
})
