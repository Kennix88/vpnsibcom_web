'use client'

import { useEffect } from 'react'

type Props = {
  blockId: string
  onClose?: () => void
}

export default function AdsonarFullscreen({ blockId, onClose }: Props) {
  useEffect(() => {
    let cancelled = false

    const showSonarAd = async () => {
      try {
        /* eslint-disable @typescript-eslint/ban-ts-comment */
        // @ts-ignore
        const sonar = window.Sonar
        if (!sonar || typeof sonar.show !== 'function') {
          console.warn('Sonar SDK not available')
          onClose?.()
          return
        }

        // Sonar.show returns a Promise; handle lifecycle and reward callback
        await sonar.show({
          adUnit: blockId,
          loader: true,
        })
      } catch (err) {
        console.error('showSonarAd error', err)
      } finally {
        if (!cancelled) onClose?.()
      }
    }

    showSonarAd()

    return () => {
      cancelled = true
      // No standard Sonar cleanup known; if available, call it here.
    }
  }, [blockId, onClose])

  return null
}
