import {
  emitEvent,
  isTMA,
  mockTelegramEnv,
  retrieveLaunchParams,
  ThemeParams,
  themeParamsState,
} from '@telegram-apps/sdk-react'

/**
 * Mocks Telegram environment in development mode.
 */
export async function useTelegramMock(options: { mockForMacOS: boolean }) {
  if (process.env.NODE_ENV === 'development') {
    if (!(await isTMA('complete'))) {
      const themeParams = {
        accent_text_color: '#6ab2f2',
        bg_color: '#17212b',
        button_color: '#5288c1',
        button_text_color: '#ffffff',
        destructive_text_color: '#ec3942',
        header_bg_color: '#17212b',
        hint_color: '#708499',
        link_color: '#6ab3f3',
        secondary_bg_color: '#232e3c',
        section_bg_color: '#17212b',
        section_header_text_color: '#6ab3f3',
        subtitle_text_color: '#708499',
        text_color: '#f5f5f5',
      } as const

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
          launchParams: new URLSearchParams([
            ['tgWebAppThemeParams', JSON.stringify(themeParams)],
            [
              'tgWebAppData',
              new URLSearchParams([
                ['auth_date', Math.floor(Date.now() / 1000).toString()],
                ['hash', 'mock-hash'],
                [
                  'user',
                  JSON.stringify({
                    id: 1,
                    first_name: 'Mock',
                    last_name: 'User',
                    username: 'mock_user',
                  }),
                ],
              ]).toString(),
            ],
            ['tgWebAppVersion', '8.4'],
            ['tgWebAppPlatform', 'tdesktop'],
          ]),
        })
      }

      console.warn(
        '⚠️ As long as the current environment was not considered as the Telegram-based one, it was mocked. Take a note, that you should not do it in production and current behavior is only specific to the development process. Environment mocking is also applied only in development mode. So, after building the application, you will not see this behavior and related warning, leading to crashing the application outside Telegram.',
      )
    }
  }
}
