import {
  bindThemeParamsCssVars,
  bindViewportCssVars,
  emitEvent,
  init as initSDK,
  mockTelegramEnv,
  mountBackButton,
  mountMiniApp,
  mountViewport,
  restoreInitData,
  retrieveLaunchParams,
  setDebug,
  ThemeParams,
  themeParamsState,
} from '@telegram-apps/sdk-react'

export async function initTelegramSDK(options: {
  debug: boolean
  eruda: boolean
  mockForMacOS: boolean
}): Promise<void> {
  setDebug(options.debug)
  initSDK()

  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  options.eruda &&
    void import('eruda').then(({ default: eruda }) => {
      eruda.init()
      eruda.position({ x: window.innerWidth - 50, y: 0 })
    })

  if (options.mockForMacOS) {
    let firstThemeSent = false
    mockTelegramEnv({
      onEvent(event, next) {
        if (event[0] === 'web_app_request_theme') {
          let tp: ThemeParams = {}
          if (firstThemeSent) {
            tp = themeParamsState()
          } else {
            firstThemeSent = true
            tp ||= retrieveLaunchParams().tgWebAppThemeParams
          }
          return emitEvent('theme_changed', { theme_params: tp })
        }

        if (event[0] === 'web_app_request_safe_area') {
          return emitEvent('safe_area_changed', {
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
          })
        }

        next()
      },
    })
  }

  mountBackButton.ifAvailable()
  restoreInitData()
  await Promise.all([
    mountMiniApp.isAvailable() &&
      mountMiniApp().then(() => {
        bindThemeParamsCssVars()
      }),
    mountViewport.isAvailable() &&
      mountViewport().then(() => {
        bindViewportCssVars()
      }),
  ])
}
