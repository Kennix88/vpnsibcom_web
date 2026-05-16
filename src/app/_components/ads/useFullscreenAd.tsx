'use client'

import { addMinutes, isAfter } from 'date-fns'
import { useCallback, useEffect, useRef } from 'react'
import { createRoot, Root } from 'react-dom/client'

import { config } from '@app/config/client'
import { authApiClient } from '@app/core/authApiClient'
import { AdsNetworkEnum } from '@app/enums/ads-network.enum'
import { AdsPlaceEnum } from '@app/enums/ads-place.enum'
import { AdsDataInterface } from '@app/enums/ads-res.interface'
import { AdsTypeEnum } from '@app/enums/ads-type.enum'
import { useUserStore } from '@app/store/user.store'

const createAdContainer = () => {
  const div = document.createElement('div')
  div.style.position = 'fixed'
  div.style.inset = '0'
  div.style.pointerEvents = 'none'
  document.body.appendChild(div)
  return div
}

export function useFullscreenAd() {
  const OVERLAY_TIMEOUT_MS = 25000
  const isTaddyEnabled = config.isTaddyEnabled as boolean
  const { user } = useUserStore()
  const executedRef = useRef(false)
  const mountedRootRef = useRef<Root | null>(null)
  const adRef = useRef<AdsDataInterface | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const overlayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const setTaddyOverlayVisible = useCallback((visible: boolean) => {
    if (!containerRef.current) return
    containerRef.current.style.width = visible ? '100vw' : '0'
    containerRef.current.style.height = visible ? '100vh' : '0'
    containerRef.current.style.zIndex = visible ? '99' : '-1'
    containerRef.current.style.background = visible
      ? 'rgba(0, 0, 0, 1)'
      : 'transparent'
  }, [])

  const resetOverlayTimeout = useCallback(() => {
    if (overlayTimeoutRef.current) {
      clearTimeout(overlayTimeoutRef.current)
      overlayTimeoutRef.current = null
    }
  }, [])

  const reward = useCallback(async (isTaddy = false) => {
    try {
      if (adRef.current == null) return
      await authApiClient.confirmAds(
        adRef.current.verifyKey,
        undefined,
        isTaddy,
      )
    } catch (error) {
      console.error('Failed to load ad', error)
    } finally {
      adRef.current = null
    }
  }, [])

  const cleanup = useCallback(() => {
    resetOverlayTimeout()
    if (mountedRootRef.current) {
      mountedRootRef.current.unmount()
      mountedRootRef.current = null
    }
    if (containerRef.current) {
      containerRef.current.remove()
      containerRef.current = null
    }
    adRef.current = null
  }, [resetOverlayTimeout])

  const scheduleCleanup = useCallback(() => {
    setTimeout(() => {
      cleanup()
    }, 0)
  }, [cleanup])

  useEffect(() => {
    if (!user || executedRef.current) return
    executedRef.current = true

    const run = async () => {
      try {
        // rate limit: 3 минуты с последнего показа
        if (
          user.lastFullscreenViewedAt &&
          !isAfter(
            new Date(),
            addMinutes(new Date(user.lastFullscreenViewedAt), 3),
          )
        ) {
          return
        }

        const response = await authApiClient.getAds(
          AdsPlaceEnum.FULLSCREEN,
          AdsTypeEnum.VIEW,
        )
        if (response.isNoAds || !response.ad) {
          scheduleCleanup()
          return
        }

        const { ad } = response
        adRef.current = ad

        // создаём динамический контейнер
        if (!containerRef.current) {
          containerRef.current = createAdContainer()
        }

        if (mountedRootRef.current) return // уже смонтирован
        const root = createRoot(containerRef.current)
        mountedRootRef.current = root
        setTaddyOverlayVisible(isTaddyEnabled)
        resetOverlayTimeout()
        overlayTimeoutRef.current = setTimeout(() => {
          scheduleCleanup()
        }, OVERLAY_TIMEOUT_MS)

        const handleClose = async (isTaddy = false) => {
          await reward(isTaddy)
          scheduleCleanup()
        }

        const showFallbackAd = async () => {
          setTaddyOverlayVisible(false)
          if (ad.network === AdsNetworkEnum.ADSGRAM) {
            const { default: AdsgramFullscreen } =
              await import('./AdsgramFullscreen')
            root.render(
              <AdsgramFullscreen
                blockId={ad.blockId as `${number}` | `int-${number}`}
                onClose={handleClose}
              />,
            )
          } else if (ad.network === AdsNetworkEnum.ADSONAR) {
            const { default: AdsonarFullscreen } =
              await import('./AdsonarFullscreen')
            root.render(
              <AdsonarFullscreen
                blockId={String(ad.blockId)}
                onClose={handleClose}
              />,
            )
          } else if (ad.network === AdsNetworkEnum.RICHADS) {
            const { default: RichadsReward } = await import('./RichadsReward')
            root.render(
              <RichadsReward onReward={handleClose} onClose={handleClose} />,
            )
          } else {
            scheduleCleanup()
          }
        }

        if (isTaddyEnabled) {
          const { default: TaddyInterstitial } =
            await import('./TaddyInterstitial')

          root.render(
            <TaddyInterstitial
              onClosed={() => {
                void handleClose(true)
              }}
              onShow={(success) => {
                if (!success) {
                  void showFallbackAd()
                }
              }}
            />,
          )
        } else {
          void showFallbackAd()
        }
      } catch (err) {
        console.error('[useFullscreenAd] failed:', err)
        scheduleCleanup()
      }
    }

    // run после первой отрисовки
    requestAnimationFrame(() => setTimeout(run, 0))

    // cleanup при размонтировании страницы
    return () => {
      scheduleCleanup()
    }
  }, [
    isTaddyEnabled,
    resetOverlayTimeout,
    reward,
    scheduleCleanup,
    setTaddyOverlayVisible,
    user,
  ])
}
