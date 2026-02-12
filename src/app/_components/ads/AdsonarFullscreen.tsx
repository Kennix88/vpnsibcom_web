'use client'

import { useEffect, useRef } from 'react'

type Props = {
  blockId: string
  onClose?: () => void
}

export default function AdsonarFullscreen({ blockId, onClose }: Props) {
  const calledRef = useRef(false)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (calledRef.current) return
    calledRef.current = true

    let cancelled = false

    const showSonarAd = async () => {
      try {
        /* eslint-disable @typescript-eslint/ban-ts-comment */
        // @ts-ignore
        const sonar = window.Sonar

        if (!sonar?.show) {
          console.warn('Sonar SDK not available')
          return
        }

        await sonar.show({
          adUnit: blockId,
          loader: false,
        })
      } catch (err) {
        console.error('showSonarAd error', err)
      } finally {
        if (!cancelled) {
          onCloseRef.current?.()
        }
      }
    }

    // defer to avoid race with hydration
    const id = setTimeout(showSonarAd, 0)

    return () => {
      cancelled = true
      clearTimeout(id)
    }
  }, [blockId])

  return null
}
