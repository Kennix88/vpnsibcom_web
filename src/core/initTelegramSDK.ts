import { useTelegramMock } from '@app/hooks/useTelegramMock'
import {
  BackgroundColor,
  initData,
  init as initSDK,
  miniApp,
  mountBackButton,
  setDebug,
  themeParams,
  viewport,
} from '@telegram-apps/sdk-react'

export async function initTelegramSDK(options: {
  debug: boolean
  eruda: boolean
  mockForMacOS: boolean
}): Promise<void> {
  setDebug(options.debug)
  initSDK()

  // options.eruda &&
  //   void import('eruda').then(({ default: eruda }) => {
  //     eruda.init()
  //     eruda.position({ x: window.innerWidth - 50, y: 0 })
  //   })

  await useTelegramMock({ mockForMacOS: options.mockForMacOS })
  initData.restore()

  // Mount all components used in the project.
  mountBackButton.ifAvailable()
  // if (backButton.mount.isAvailable()) {
  //   backButton.mount()
  //   backButton.isMounted() // true
  // }
  if (miniApp.mountSync.isAvailable()) {
    miniApp.mountSync()
    miniApp.isMounted() // true
  }
  if (themeParams.mountSync.isAvailable()) {
    themeParams.mountSync()
    themeParams.isMounted() // true
  }

  if (viewport.mount.isAvailable()) {
    try {
      const promise = viewport.mount()
      viewport.isMounting() // true
      await promise
      viewport.isMounting() // false
      viewport.isMounted() // true
    } catch (err) {
      viewport.mountError() // equals "err"
      viewport.isMounting() // false
      viewport.isMounted() // false
    }
  }

  if (miniApp.setBackgroundColor.isAvailable()) {
    const bg = getComputedStyle(document.documentElement)
      .getPropertyValue('--background')
      .trim()

    miniApp.setBackgroundColor(bg as BackgroundColor)
    miniApp.backgroundColor()
  }
  if (miniApp.setHeaderColor.isAvailable()) {
    const primary = getComputedStyle(document.documentElement)
      .getPropertyValue('--primary')
      .trim()

    miniApp.setHeaderColor(primary as BackgroundColor)
    miniApp.headerColor()
  }
  // if (themeParams.bindCssVars.isAvailable()) {
  //   themeParams.bindCssVars()
  // }
  // if (miniApp.bindCssVars.isAvailable()) {
  //   miniApp.bindCssVars()
  //   miniApp.isCssVarsBound() // true
  // }
}
