import { initTelegramWebAppCompat } from './initTelegramWebAppCompat'

let initPromise: Promise<void> | null = null

/**
 * Idempotent Telegram SDK initializer.
 * Safe to call multiple times (StrictMode, hot-reload) — only runs once.
 */
export async function initTelegramSDK(options: {
  debug: boolean
  eruda: boolean
  mockForMacOS: boolean
}): Promise<void> {
  // Return the same promise if already in progress or done
  if (initPromise) return initPromise

  initPromise = (async () => {
    const {
      backButton,
      initData,
      init: initSDK,
      miniApp,
      setDebug,
      themeParams,
    } = await import('@tma.js/sdk-react')

    setDebug(options.debug)
    initSDK()

    if (options.eruda) {
      void import('eruda').then(({ default: eruda }) => {
        eruda.init()
        eruda.position({ x: window.innerWidth - 70, y: 100 })
      })
    }

    backButton.mount.ifAvailable()
    initData.restore()

    if (miniApp.mount.isAvailable()) {
      themeParams.mount()
      miniApp.mount()
      themeParams.bindCssVars() // ✅ Пробрасываем CSS-переменные темы Telegram
    }

    await initTelegramWebAppCompat()
  })()

  return initPromise
}
