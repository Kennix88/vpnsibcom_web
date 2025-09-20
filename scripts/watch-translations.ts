import chokidar from 'chokidar'
import path from 'path'
import { buildTranslations } from '../src/core/i18n/build-translations'
import { logger } from '../src/utils/logger'

// Only run in development mode
if (process.env.NODE_ENV !== 'production') {
  const localesDir = path.join(process.cwd(), 'public', 'locales')

  // console.log(`Watching for changes in ${localesDir}`);

  // Initialize watcher
  const watcher = chokidar.watch(`${localesDir}/**/*.json`, {
    ignored: /_generated/,
    persistent: true,
    ignoreInitial: true,
  })

  // Add event listeners
  watcher
    .on('add', handleChange)
    .on('change', handleChange)
    .on('unlink', handleChange)

  // Build translations initially
  buildTranslations(true).catch(logger.error)

  async function handleChange(filePath: string) {
    // console.log(`Translation file changed: ${filePath}`);
    try {
      await buildTranslations(true)
      // console.log('Translations rebuilt successfully');
    } catch (error) {
      // console.error('Error rebuilding translations:', error);
    }
  }
}
