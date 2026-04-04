function compareVersions(left: string, right: string) {
  const leftParts = left.split('.').map(Number)
  const rightParts = right.split('.').map(Number)
  const maxLength = Math.max(leftParts.length, rightParts.length)

  for (let index = 0; index < maxLength; index += 1) {
    const leftValue = leftParts[index] ?? 0
    const rightValue = rightParts[index] ?? 0

    if (leftValue > rightValue) return 1
    if (leftValue < rightValue) return -1
  }

  return 0
}

function toRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : undefined
}

function mapUser(user?: Record<string, unknown>) {
  if (!user) return undefined

  return {
    id: user.id,
    is_bot: user.isBot,
    first_name: user.firstName,
    last_name: user.lastName,
    username: user.username,
    language_code: user.languageCode,
    is_premium: user.isPremium,
    photo_url: user.photoUrl,
  }
}

function mapChat(chat?: Record<string, unknown>) {
  if (!chat) return undefined

  return {
    id: chat.id,
    type: chat.type,
    title: chat.title,
    username: chat.username,
    photo_url: chat.photoUrl,
  }
}

export async function initTelegramWebAppCompat() {
  const {
    miniApp,
    openLink,
    openTelegramLink,
    parseInitDataQuery,
    retrieveLaunchParams,
    retrieveRawInitData,
    themeParams,
  } = await import('@tma.js/sdk-react')

  if (typeof window === 'undefined') return
  if (window.Telegram?.WebApp) return

  const rawInitData = retrieveRawInitData() ?? ''
  const launchParams = retrieveLaunchParams()
  const parsedInitData = rawInitData
    ? parseInitDataQuery(rawInitData)
    : undefined

  const parsedRecord = toRecord(parsedInitData)
  const theme = launchParams.tgWebAppThemeParams ?? {}
  const colorScheme =
    themeParams.isDark() ||
    window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'

  const webApp = {
    initData: rawInitData,
    initDataUnsafe: {
      query_id: parsedRecord?.queryId,
      user: mapUser(toRecord(parsedRecord?.user)),
      receiver: mapUser(toRecord(parsedRecord?.receiver)),
      chat: mapChat(toRecord(parsedRecord?.chat)),
      chat_type: parsedRecord?.chatType,
      chat_instance: parsedRecord?.chatInstance,
      start_param: parsedRecord?.startParam,
      can_send_after: parsedRecord?.canSendAfter,
      auth_date:
        parsedRecord?.authDate instanceof Date
          ? Math.floor(parsedRecord.authDate.getTime() / 1000)
          : undefined,
      hash: parsedRecord?.hash,
      signature: parsedRecord?.signature,
    },
    version: launchParams.tgWebAppVersion,
    platform: launchParams.tgWebAppPlatform,
    colorScheme,
    themeParams: theme,
    isActive: true,
    isExpanded: true,
    viewportHeight: window.innerHeight,
    viewportStableHeight: window.innerHeight,
    headerColor:
      theme.header_bg_color ?? theme.bg_color ?? theme.secondary_bg_color ?? '',
    backgroundColor: theme.bg_color ?? '',
    bottomBarColor: theme.bottom_bar_bg_color ?? theme.bg_color ?? '',
    isClosingConfirmationEnabled: false,
    isVerticalSwipesEnabled: true,
    isFullscreen: false,
    isOrientationLocked: false,
    safeAreaInset: { top: 0, bottom: 0, left: 0, right: 0 },
    contentSafeAreaInset: { top: 0, bottom: 0, left: 0, right: 0 },
    BackButton: {
      show: () => {},
      hide: () => {},
      onClick: () => {},
      offClick: () => {},
    },
    MainButton: {},
    SecondaryButton: {},
    SettingsButton: {
      show: () => {},
      hide: () => {},
      onClick: () => {},
      offClick: () => {},
    },
    HapticFeedback: {},
    CloudStorage: {},
    BiometricManager: {},
    Accelerometer: {},
    DeviceOrientation: {},
    Gyroscope: {},
    LocationManager: {},
    DeviceStorage: {},
    SecureStorage: {},
    isVersionAtLeast: (version: string) =>
      compareVersions(launchParams.tgWebAppVersion, version) >= 0,
    setHeaderColor: () => {},
    setBackgroundColor: () => {},
    setBottomBarColor: () => {},
    enableClosingConfirmation: () => {},
    disableClosingConfirmation: () => {},
    enableVerticalSwipes: () => {},
    disableVerticalSwipes: () => {},
    requestFullscreen: () => {},
    exitFullscreen: () => {},
    lockOrientation: () => {},
    unlockOrientation: () => {},
    addToHomeScreen: () => {},
    checkHomeScreenStatus: () => {},
    onEvent: () => {},
    offEvent: () => {},
    sendData: () => {},
    openLink: (url: string, options?: { try_instant_view?: boolean }) => {
      openLink(url, {
        tryInstantView: options?.try_instant_view,
      })
    },
    openTelegramLink: (url: string) => {
      openTelegramLink(url)
    },
    ready: () => {
      miniApp.ready()
    },
    expand: () => {},
    close: () => {
      miniApp.close()
    },
  }

  // @ts-ignore
  window.Telegram = {
    ...(window.Telegram ?? {}),
    WebApp: webApp,
  } as typeof window.Telegram
}
