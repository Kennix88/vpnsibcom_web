'use client'

import { useAdsgram } from '@adsgram/react'
import { useCallback, useRef } from 'react'

export default function AdsgramReward({
  blockId,
  onReward,
  onClose,
}: {
  blockId: `${number}` | `int-${number}`
  onReward: () => void
  onClose: () => void
}) {
  const errorCountRef = useRef(0)

  const onError = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (result?: any) => {
      console.warn('Adsgram error result:', result)
      errorCountRef.current++
      onClose()
    },
    [onClose],
  )

  // используем наш хук — он вернёт функцию showAd
  const { show } = useAdsgram({
    blockId: blockId,
    debug: false,
    // debugBannerType: 'RewardedVideo',
    onReward,
    onError,
  })

  show?.()

  return null
}
