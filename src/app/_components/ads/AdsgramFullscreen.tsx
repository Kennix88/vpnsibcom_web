'use client'

import { useAdsgram } from '@adsgram/react'
import { useCallback } from 'react'

type Props = {
  blockId: `${number}` | `int-${number}`
  onClose?: () => void
}

export default function AdsgramFullscreen({ blockId, onClose }: Props) {
  const handleReward = useCallback(() => {
    onClose?.()
  }, [onClose])

  const { show } = useAdsgram({
    blockId,
    debug: false,
    onReward: handleReward,
  })

  show()

  return null
}
