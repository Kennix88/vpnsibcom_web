'use client'

import { config } from '@app/config/client'
import { useEffect, useRef } from 'react'

let isTaddyInterstitialRunning = false

type Props = {
  pubId?: string
  payload?: Record<string, unknown>
  onClosed?: () => void
  onViewThrough?: (id: string) => void
  onShow?: (success: boolean) => void
  onStartFailed?: () => void
  waitForMs?: number
}

export default function TaddyInterstitial({
  pubId = config.taddyPubId,
  payload,
  onClosed,
  onViewThrough,
  onShow,
  onStartFailed,
  waitForMs = 3000,
}: Props) {
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    let cancelled = false

    const waitForTaddy = async (): Promise<typeof window.Taddy | undefined> => {
      const startedAt = Date.now()

      return await new Promise((resolve) => {
        const tick = () => {
          if (window.Taddy) {
            resolve(window.Taddy)
            return
          }
          if (Date.now() - startedAt >= waitForMs) {
            resolve(undefined)
            return
          }
          window.setTimeout(tick, 50)
        }
        tick()
      })
    }

    const run = async () => {
      let interstitialStarted = false
      try {
        if (isTaddyInterstitialRunning) {
          console.warn('Taddy interstitial already running, skip duplicate call')
          onStartFailed?.()
          return
        }
        isTaddyInterstitialRunning = true

        const taddy = await waitForTaddy()

        if (!taddy) {
          console.warn('Taddy SDK not available on window')
          onStartFailed?.()
          return
        }

        if (!pubId) {
          console.warn('Taddy pubId is not configured')
          onStartFailed?.()
          return
        }

        if (!taddy.isInit) {
          await taddy.init(pubId, {
            // debug: process.env.NODE_ENV === 'development',
          })
        }

        if (!taddy.isReady) {
          await taddy.ready()
        }

        interstitialStarted = true
        const success = await taddy.ads().interstitial({
          payload,
          onClosed: () => {
            if (!cancelled) {
              onClosed?.()
            }
          },
          onViewThrough: (id) => {
            if (!cancelled) {
              onViewThrough?.(id)
            }
          },
        })

        if (!cancelled) {
          onShow?.(success)
        }
      } catch (error) {
        console.error('Failed to show Taddy interstitial', error)
        if (!cancelled && !interstitialStarted) {
          onStartFailed?.()
        }
      } finally {
        isTaddyInterstitialRunning = false
      }
    }

    const timerId = window.setTimeout(run, 0)

    return () => {
      cancelled = true
      window.clearTimeout(timerId)
    }
  }, [
    onClosed,
    onShow,
    onStartFailed,
    onViewThrough,
    payload,
    pubId,
    waitForMs,
  ])

  return null
}
