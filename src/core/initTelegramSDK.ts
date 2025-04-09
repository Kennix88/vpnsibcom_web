import { useTelegramMock } from '@app/hooks/useTelegramMock'
import {
  initData,
  init as initSDK,
  miniApp,
  mountBackButton,
  setDebug,
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
      eruda.position({ x: window.innerWidth - 50, y: 0 })
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
}
