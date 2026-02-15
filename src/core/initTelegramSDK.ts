export async function initTelegramSDK(options: {
  debug: boolean
  eruda: boolean
  mockForMacOS: boolean
}): Promise<void> {
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

  options.eruda &&
    void import('eruda').then(({ default: eruda }) => {
      eruda.init()
      eruda.position({
        x: window.innerWidth - 70,
        y: 100,
      })
    })

  // await useTelegramMock({ mockForMacOS: options.mockForMacOS })
  // initData.restore()

  // Mount all components used in the project.
  backButton.mount.ifAvailable()
  initData.restore()

  if (miniApp.mount.isAvailable()) {
    themeParams.mount()
    miniApp.mount()
    // themeParams.bindCssVars()
  }

  
}
