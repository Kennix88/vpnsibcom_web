import chokidar from 'chokidar'
import fs from 'fs/promises'
import path from 'path'
import { buildTranslations } from '../src/core/i18n/build-translations.js' // <- .js обязательно для ESM

if (process.env.NODE_ENV === 'production') {
  // safety: never run watcher in production
  console.log('[i18n] Translations watcher disabled in production.')
  process.exit(0)
}

const localesDir = path.join(process.cwd(), 'public', 'locales')
const DEBOUNCE_MS = 400
const AWAIT_WRITE = { stabilityThreshold: 250, pollInterval: 100 }

let debounceTimer: NodeJS.Timeout | null = null
let running = false
let queued = false

async function runBuild(isDev = true) {
  if (running) {
    // mark that we need another run after current finishes
    queued = true
    return
  }

  running = true
  try {
    console.log(`[i18n] Building translations (${new Date().toISOString()})`)
    await buildTranslations(isDev)
    console.log(`[i18n] Build complete (${new Date().toISOString()})`)
  } catch (err) {
    console.error('[i18n] Build failed:', err)
  } finally {
    running = false
    if (queued) {
      queued = false
      // next tick to avoid deep recursion
      setImmediate(() => runBuild(isDev))
    }
  }
}

function scheduleBuild(filePath?: string) {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debounceTimer = null
    runBuild(true)
  }, DEBOUNCE_MS)
  if (filePath) {
    console.log(`[i18n] Change detected: ${filePath}`)
  }
}

async function startWatcher() {
  try {
    await fs.access(localesDir) // убедимся, что папка существует
  } catch {
    console.warn(
      `[i18n] Locales directory not found: ${localesDir}. Creating...`,
    )
    try {
      await fs.mkdir(localesDir, { recursive: true })
    } catch (err) {
      console.error('[i18n] Failed to create locales directory:', err)
      process.exit(1)
    }
  }

  const watcher = chokidar.watch(`${localesDir}/**/*.json`, {
    ignored: /_generated/,
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: AWAIT_WRITE,
    ignorePermissionErrors: true,
    depth: 5,
  })

  // events
  watcher.on('add', scheduleBuild)
  watcher.on('change', scheduleBuild)
  watcher.on('unlink', scheduleBuild)

  watcher.on('ready', () => {
    console.log(
      '[i18n] Watcher ready — watching translation files in',
      localesDir,
    )
  })

  watcher.on('error', (err) => {
    console.error('[i18n] Watcher error:', err)
  })

  // graceful shutdown
  const shutdown = async () => {
    console.log('[i18n] Shutting down watcher...')
    try {
      await watcher.close()
    } catch (err) {
      console.warn('[i18n] Error closing watcher:', err)
    } finally {
      process.exit(0)
    }
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
  process.on('uncaughtException', (err) => {
    console.error('[i18n] Uncaught exception:', err)
    shutdown()
  })
}

// initial build + start watcher
runBuild(true)
  .catch((e) => console.error('[i18n] Initial build failed:', e))
  .finally(() => {
    startWatcher().catch((e) => {
      console.error('[i18n] Failed to start watcher:', e)
      process.exit(1)
    })
  })

// export for testing (optional)
export {}
