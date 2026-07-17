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
import {
  releaseAdDisplayLock,
  renewAdDisplayLock,
  tryAcquireAdDisplayLock,
} from './adDisplayLock'

const STARTUP_DELAY_MS = 5000
const FULLSCREEN_AD_OWNER = 'fullscreen-ad'
const LOCK_TTL_MS = 30_000
const LOCK_RENEW_INTERVAL_MS = 10_000

const createAdContainer = () => {
  const div = document.createElement('div')
  div.style.position = 'fixed'
  div.style.inset = '0'
  div.style.pointerEvents = 'none'
  div.style.zIndex = '999'
  document.body.appendChild(div)
  return div
}

export function useFullscreenAd() {
  const isTaddyEnabled = config.isTaddyEnabled as boolean
  const { user } = useUserStore()

  // Держим свежие данные юзера в ref, чтобы НЕ триггерить эффект
  // на каждое обновление объекта user (баланс, счётчики и т.п.) —
  // именно это раньше маскировалось через executedRef и ломало
  // повторный запуск после Strict Mode / быстрой навигации.
  const userRef = useRef(user)
  useEffect(() => {
    userRef.current = user
  }, [user])

  const cancelledRef = useRef(false)
  const lockHeldRef = useRef(false)
  const mountedRootRef = useRef<Root | null>(null)
  const adRef = useRef<AdsDataInterface | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const startupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const renewTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopRenewingLock = useCallback(() => {
    if (renewTimerRef.current) {
      clearInterval(renewTimerRef.current)
      renewTimerRef.current = null
    }
  }, [])

  const releaseLock = useCallback(() => {
    stopRenewingLock()
    if (lockHeldRef.current) {
      releaseAdDisplayLock(FULLSCREEN_AD_OWNER)
      lockHeldRef.current = false
    }
  }, [stopRenewingLock])

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
    const root = mountedRootRef.current
    const container = containerRef.current
    mountedRootRef.current = null
    containerRef.current = null
    adRef.current = null
    releaseLock() // всегда освобождаем лок при закрытии — это финальная точка
    window.setTimeout(() => {
      root?.unmount()
      container?.remove()
    }, 0)
  }, [releaseLock])

  const scheduleCleanup = useCallback(() => {
    setTimeout(() => cleanup(), 0)
  }, [cleanup])

  // Реагируем только на факт "юзер загружен", а не на каждое обновление стора
  const hasUser = Boolean(user)

  useEffect(() => {
    if (!hasUser) return
    cancelledRef.current = false

    const run = async () => {
      if (cancelledRef.current) return
      const currentUser = userRef.current
      if (!currentUser) return

      try {
        // Rate limit: 3 минуты с последнего показа
        if (
          currentUser.lastFullscreenViewedAt &&
          !isAfter(
            new Date(),
            addMinutes(new Date(currentUser.lastFullscreenViewedAt), 3),
          )
        ) {
          return
        }

        if (!tryAcquireAdDisplayLock(FULLSCREEN_AD_OWNER, LOCK_TTL_MS)) return
        lockHeldRef.current = true
        // Продлеваем TTL, пока реклама реально висит на экране —
        // иначе долгий показ может пережить свой же лок.
        renewTimerRef.current = setInterval(() => {
          renewAdDisplayLock(FULLSCREEN_AD_OWNER, LOCK_TTL_MS)
        }, LOCK_RENEW_INTERVAL_MS)

        if (cancelledRef.current) {
          releaseLock()
          return
        }

        const response = await authApiClient.getAds(
          AdsPlaceEnum.FULLSCREEN,
          AdsTypeEnum.VIEW,
        )

        if (cancelledRef.current) {
          releaseLock()
          return
        }

        const ad = response.isNoAds ? null : (response.ad ?? null)
        adRef.current = ad

        if (!ad && !isTaddyEnabled) {
          releaseLock()
          return
        }

        if (!containerRef.current) containerRef.current = createAdContainer()
        if (mountedRootRef.current) {
          releaseLock()
          return
        }

        const root = createRoot(containerRef.current)
        mountedRootRef.current = root

        const handleClose = async (isTaddy = false) => {
          await reward(isTaddy)
          scheduleCleanup()
        }

        const showFallbackAd = async () => {
          try {
            if (!ad) {
              scheduleCleanup()
              return
            }
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
          } catch (e) {
            // Раньше исключение здесь могло оставить лок висеть навсегда
            console.error('[useFullscreenAd] showFallbackAd failed:', e)
            scheduleCleanup()
          }
        }

        try {
          if (isTaddyEnabled && ad?.network !== AdsNetworkEnum.TADDY) {
            const { default: TaddyInterstitial } =
              await import('./TaddyInterstitial')
            root.render(
              <TaddyInterstitial
                canCloseImmediately={true}
                requiredViewSeconds={10}
                onClosed={() => void handleClose(true)}
                onViewed={() => void handleClose(true)}
                onError={() => void showFallbackAd()}
                onNoFill={() => void showFallbackAd()}
                showSkeleton={false}
              />,
            )
          } else {
            await showFallbackAd()
          }
        } catch (e) {
          console.error('[useFullscreenAd] render failed:', e)
          scheduleCleanup()
        }
      } catch (err) {
        console.error('[useFullscreenAd] failed:', err)
        releaseLock()
        scheduleCleanup()
      }
    }

    startupTimerRef.current = setTimeout(run, STARTUP_DELAY_MS)

    return () => {
      cancelledRef.current = true
      if (startupTimerRef.current) {
        clearTimeout(startupTimerRef.current)
        startupTimerRef.current = null
      }
      scheduleCleanup()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasUser, isTaddyEnabled, reward, scheduleCleanup, releaseLock])
}
