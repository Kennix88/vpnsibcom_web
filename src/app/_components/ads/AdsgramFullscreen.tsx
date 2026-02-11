'use client'

import { useAdsgram } from '@adsgram/react'
import { useCallback, useEffect } from 'react'

type Props = {
  blockId: `${number}` | `int-${number}`
  onClose?: () => void
}

export default function AdsgramFullscreen({ blockId, onClose }: Props) {
  const onError = useCallback(() => {
    // optionally log or report
    onClose?.()
  }, [onClose])

  // useAdsgram must be called inside a component
  const { show } = useAdsgram({
    blockId,
    onError,
    debug: process.env.NODE_ENV === 'development',
  })

  useEffect(() => {
    let mounted = true
    // вызов после mount
    if (mounted) {
      try {
        show()
      } catch (err) {
        console.error('Adsgram show failed:', err)
        onClose?.()
      }
    }
    return () => {
      mounted = false
      // SDK-specific cleanup можно добавить здесь, если требуется
    }
  }, [show, onClose])

  return null
}
