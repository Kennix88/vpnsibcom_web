import { useTelegramMock } from '@app/hooks/useTelegramMock'
import {
  BackgroundColor,
  initData,
  init as initSDK,
  miniApp,
  mountBackButton,
  retrieveLaunchParams,
  setDebug,
  settingsButton,
  swipeBehavior,
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

  options.eruda &&
    void import('eruda').then(({ default: eruda }) => {
      eruda.init()
      eruda.position({
        x: window.innerWidth - 70,
        y: 100,
      })
    })

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
  if (swipeBehavior.mount.isAvailable()) {
    swipeBehavior.mount()
    swipeBehavior.isMounted() // true
  }

  if (settingsButton.mount.isAvailable()) {
    settingsButton.mount()
    settingsButton.isMounted() // true
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

  if (swipeBehavior.disableVertical.isAvailable()) {
    swipeBehavior.disableVertical()
    swipeBehavior.isVerticalEnabled() // false
  }

  const getInitData = retrieveLaunchParams()

  if (
    !getInitData.tgWebAppPlatform.includes('web') &&
    getInitData.tgWebAppPlatform !== 'tdesktop'
  ) {
    if (viewport.requestFullscreen.isAvailable()) {
      await viewport.requestFullscreen()
    }
  } else {
    if (viewport.expand.isAvailable()) {
      viewport.expand()
    }
  }

  if (settingsButton.show.isAvailable()) {
    settingsButton.show()
    settingsButton.isVisible() // true
  }

  // if (themeParams.bindCssVars.isAvailable()) {
  //   themeParams.bindCssVars()
  // }
  // if (miniApp.bindCssVars.isAvailable()) {
  //   miniApp.bindCssVars()
  //   miniApp.isCssVarsBound() // true
  // }
}
