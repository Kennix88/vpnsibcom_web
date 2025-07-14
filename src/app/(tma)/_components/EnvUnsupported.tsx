import { retrieveLaunchParams } from '@telegram-apps/sdk-react'
import Image from 'next/image'
import { useMemo } from 'react'

export function EnvUnsupported() {
  useMemo(() => {
    try {
      const lp = retrieveLaunchParams()
      // Just retrieve launch params to check if they're available
      return lp.tgWebAppPlatform
    } catch {
      return 'android'
    }
  }, [])

  return (
    <div key={'unsupported'}>
      <h1>Oops</h1>
      <div>You are using too old Telegram client to run this application</div>
      <Image
        alt="Telegram sticker"
        src="https://xelene.me/telegram.gif"
        width={144}
        height={144}
        style={{ display: 'block' }}
      />
    </div>
  )
}
