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
import { releaseAdDisplayLock, tryAcquireAdDisplayLock } from './adDisplayLock'

/** Задержка перед первым показом полноэкранной рекламы после входа (мс) */
const STARTUP_DELAY_MS = 5000

const createAdContainer = () => {
  const div = document.createElement('div')
  div.style.position = 'fixed'
  div.style.inset = '0'
  div.style.pointerEvents = 'none'
  document.body.appendChild(div)
  return div
}

export function useFullscreenAd() {
  const FULLSCREEN_AD_OWNER = 'fullscreen-ad'
  const OVERLAY_TIMEOUT_MS = 25000
  const isTaddyEnabled = config.isTaddyEnabled as boolean

  const { user } = useUserStore()

  const executedRef = useRef(false)
  const mountedRootRef = useRef<Root | null>(null)
  const adRef = useRef<AdsDataInterface | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const overlayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const setTaddyOverlayVisible = useCallback((visible: boolean) => {
    if (!containerRef.current) return
    containerRef.current.style.width = visible ? '100vw' : '0'
    containerRef.current.style.height = visible ? '100vh' : '0'
    containerRef.current.style.zIndex = visible ? '99999' : '-1'
    containerRef.current.style.background = visible
      ? 'rgba(0,0,0,1)'
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
      if (!adRef.current) return
      await authApiClient.confirmAds(
        adRef.current.verifyKey,
        undefined,
        isTaddy,
      )
    } catch (error) {
      console.error('[useFullscreenAd] reward confirm failed:', error)
    } finally {
      adRef.current = null
    }
  }, [])

  const cleanup = useCallback(() => {
    resetOverlayTimeout()
    const root = mountedRootRef.current
    const container = containerRef.current
    mountedRootRef.current = null
    containerRef.current = null
    adRef.current = null
    releaseAdDisplayLock(FULLSCREEN_AD_OWNER)
    window.setTimeout(() => {
      root?.unmount()
      container?.remove()
    }, 0)
  }, [resetOverlayTimeout])

  const scheduleCleanup = useCallback(() => {
    setTimeout(() => cleanup(), 0)
  }, [cleanup])

  useEffect(() => {
    // Пользователь ещё не загружен — ждём
    if (!user) return
    // Уже запускался в этом инстансе хука
    if (executedRef.current) return
    executedRef.current = true

    const run = async () => {
      try {
        // Rate limit: 3 минуты с последнего полноэкранного показа
        if (
          user.lastFullscreenViewedAt &&
          !isAfter(
            new Date(),
            addMinutes(new Date(user.lastFullscreenViewedAt), 3),
          )
        ) {
          return
        }

        // Атомарный захват лока — защита от одновременного запуска
        // двух инстансов (напр., при быстрой навигации)
        if (!tryAcquireAdDisplayLock(FULLSCREEN_AD_OWNER)) return

        const response = await authApiClient.getAds(
          AdsPlaceEnum.FULLSCREEN,
          AdsTypeEnum.VIEW,
        )
        if (response.isNoAds || !response.ad) {
          releaseAdDisplayLock(FULLSCREEN_AD_OWNER)
          return
        }

        const { ad } = response
        adRef.current = ad

        if (!containerRef.current) containerRef.current = createAdContainer()
        if (mountedRootRef.current) return

        const root = createRoot(containerRef.current)
        mountedRootRef.current = root

        setTaddyOverlayVisible(isTaddyEnabled)
        resetOverlayTimeout()
        overlayTimeoutRef.current = setTimeout(
          () => scheduleCleanup(),
          OVERLAY_TIMEOUT_MS,
        )

        const handleClose = async (isTaddy = false) => {
          await reward(isTaddy)
          scheduleCleanup()
        }

        const showFallbackAd = async () => {
          setTaddyOverlayVisible(false)

          if (ad.network === AdsNetworkEnum.TADDY) {
            const { default: TaddyInterstitialForSDK } =
              await import('./TaddyInterstitialForSDK')
            root.render(
              <TaddyInterstitialForSDK
                onClosed={() => void handleClose()}
                onViewThrough={() => void handleClose()}
                onError={() => void handleClose()}
                onNoFill={() => void handleClose()}
              />,
            )
          } else if (ad.network === AdsNetworkEnum.ADSGRAM) {
            const { default: AdsgramAd } = await import('./AdsgramAd')
            root.render(
              <AdsgramAd
                blockId={String(ad.blockId)}
                onClose={() => void handleClose()}
              />,
            )
          } else if (ad.network === AdsNetworkEnum.ADSONAR) {
            const { default: AdsonarFullscreen } =
              await import('./AdsonarFullscreen')
            root.render(
              <AdsonarFullscreen
                blockId={String(ad.blockId)}
                onClose={() => void handleClose()}
              />,
            )
          } else if (ad.network === AdsNetworkEnum.RICHADS) {
            const { default: RichadsReward } = await import('./RichadsReward')
            root.render(
              <RichadsReward
                onReward={() => void handleClose()}
                onClose={() => void handleClose()}
              />,
            )
          } else {
            scheduleCleanup()
          }
        }

        if (isTaddyEnabled && ad.network !== AdsNetworkEnum.TADDY) {
          const { default: TaddyInterstitial } =
            await import('./TaddyInterstitial')
          root.render(
            <TaddyInterstitial
              canCloseImmediately={true}
              requiredViewSeconds={10}
              autoCloseOnViewed={false}
              onClosed={() => void handleClose(true)}
              onShow={(isShow) => {
                if (isShow) void handleClose(true)
              }}
              onStartFailed={() => void showFallbackAd()}
              onError={() => void showFallbackAd()}
              onNoFill={() => void showFallbackAd()}
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

    // Задержка перед первым показом — приложение должно устояться
    startupTimerRef.current = setTimeout(run, STARTUP_DELAY_MS)

    return () => {
      if (startupTimerRef.current) {
        clearTimeout(startupTimerRef.current)
        startupTimerRef.current = null
      }
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
