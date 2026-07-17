'use client'

import { authApiClient } from '@app/core/authApiClient'
import { AdsPlaceEnum } from '@app/enums/ads-place.enum'
import { AdsDataInterface } from '@app/enums/ads-res.interface'
import { AdsTypeEnum } from '@app/enums/ads-type.enum'
import { useCallback, useRef } from 'react'
import { createRoot, Root } from 'react-dom/client'
import {
  releaseAdDisplayLock,
  renewAdDisplayLock,
  tryAcquireAdDisplayLock,
} from './adDisplayLock'

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

export type AdSessionStartResult = 'ok' | 'locked' | 'error'

interface StartParams {
  place: AdsPlaceEnum
  type: AdsTypeEnum
  /** Вызывается, когда ad получен (может быть null, если реклама не найдена) и root готов к рендеру. */
  onAd: (ad: AdsDataInterface | null, root: Root) => void | Promise<void>
}

/**
 * Общая "механика" показа рекламы: лок с TTL, контейнер/root,
 * вызовы getAds/confirmAds, гарантированный cleanup.
 * Ничего не знает про конкретные рекламные сети — это в renderAdWidgets.
 */
export function useAdSession(ownerId: string) {
  const adRef = useRef<AdsDataInterface | null>(null)
  const rootRef = useRef<Root | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const lockHeldRef = useRef(false)
  const renewTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopRenew = useCallback(() => {
    if (renewTimerRef.current) {
      clearInterval(renewTimerRef.current)
      renewTimerRef.current = null
    }
  }, [])

  const releaseLock = useCallback(() => {
    stopRenew()
    if (lockHeldRef.current) {
      releaseAdDisplayLock(ownerId)
      lockHeldRef.current = false
    }
  }, [ownerId, stopRenew])

  /** Убирает рекламу с экрана и освобождает лок. Безопасно вызывать многократно. */
  const close = useCallback(() => {
    const root = rootRef.current
    const container = containerRef.current
    rootRef.current = null
    containerRef.current = null
    adRef.current = null
    releaseLock()
    window.setTimeout(() => {
      root?.unmount()
      container?.remove()
    }, 0)
  }, [releaseLock])

  /** Отменяет сессию извне (например, при размонтировании компонента). */
  const cancel = useCallback(() => close(), [close])

  /** Подтверждает награду по текущей рекламе. Возвращает ответ API или null при ошибке/отсутствии рекламы. */
  const confirm = useCallback(
    async (isTaddy = false) => {
      if (!adRef.current) return null
      try {
        return await authApiClient.confirmAds(
          adRef.current.verifyKey,
          undefined,
          isTaddy,
        )
      } catch (error) {
        console.error(`[useAdSession:${ownerId}] confirm failed:`, error)
        return null
      } finally {
        adRef.current = null
      }
    },
    [ownerId],
  )

  const start = useCallback(
    async ({
      place,
      type,
      onAd,
    }: StartParams): Promise<AdSessionStartResult> => {
      if (!tryAcquireAdDisplayLock(ownerId, LOCK_TTL_MS)) return 'locked'
      lockHeldRef.current = true
      renewTimerRef.current = setInterval(() => {
        renewAdDisplayLock(ownerId, LOCK_TTL_MS)
      }, LOCK_RENEW_INTERVAL_MS)

      try {
        const response = await authApiClient.getAds(place, type)
        const ad = response.isNoAds ? null : (response.ad ?? null)
        adRef.current = ad

        if (!containerRef.current) containerRef.current = createAdContainer()
        if (rootRef.current) {
          releaseLock()
          return 'ok'
        }
        const root = createRoot(containerRef.current)
        rootRef.current = root

        await onAd(ad, root)
        return 'ok'
      } catch (err) {
        console.error(`[useAdSession:${ownerId}] start failed:`, err)
        close()
        return 'error'
      }
    },
    [ownerId, releaseLock, close],
  )

  return { start, confirm, close, cancel }
}
