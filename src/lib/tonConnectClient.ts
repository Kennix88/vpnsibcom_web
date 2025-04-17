import { config } from '@app/config/client'
import { TonConnect } from '@tonconnect/sdk'

export const tonConnect = new TonConnect({
  manifestUrl: `${config.tonManifestUrl}/tonconnect-manifest.json`,
})
