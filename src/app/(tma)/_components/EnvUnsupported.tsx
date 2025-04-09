import {
  isColorDark,
  isRGB,
  retrieveLaunchParams,
} from '@telegram-apps/sdk-react'
import { useMemo } from 'react'

export function EnvUnsupported() {
  const [platform, isDark] = useMemo(() => {
    try {
      const lp = retrieveLaunchParams()
      const { bg_color: bgColor } = lp.tgWebAppThemeParams
      return [
        lp.tgWebAppPlatform,
        bgColor && isRGB(bgColor) ? isColorDark(bgColor) : false,
      ]
    } catch {
      return ['android', false]
    }
  }, [])

  return (
    <div key={'unsupported'}>
      <h1>Oops</h1>
      <div>You are using too old Telegram client to run this application</div>
      <img
        alt="Telegram sticker"
        src="https://xelene.me/telegram.gif"
        style={{ display: 'block', width: '144px', height: '144px' }}
      />
    </div>
  )
}
