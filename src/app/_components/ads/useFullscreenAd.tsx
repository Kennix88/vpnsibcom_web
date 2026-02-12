'use client'

import { addMinutes, isAfter } from 'date-fns'
import { useEffect, useRef } from 'react'
import { createRoot, Root } from 'react-dom/client'

import { authApiClient } from '@app/core/authApiClient'
import { AdsNetworkEnum } from '@app/enums/ads-network.enum'
import { AdsPlaceEnum } from '@app/enums/ads-place.enum'
import { AdsTypeEnum } from '@app/enums/ads-type.enum'
import { useUserStore } from '@app/store/user.store'

export function useFullscreenAd() {
  const { user } = useUserStore()
  const executedRef = useRef(false)
  const mountedRootRef = useRef<Root | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

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
        if (response.isNoAds || !response.ad) return

        const { ad } = response

        // создаём динамический контейнер
        if (!containerRef.current) {
          const div = document.createElement('div')
          div.id = 'ads-fullscreen-container'
          document.body.appendChild(div)
          containerRef.current = div
        }

        if (mountedRootRef.current) return // уже смонтирован
        const root = createRoot(containerRef.current)
        mountedRootRef.current = root

        const handleClose = () => {
          if (mountedRootRef.current) {
            mountedRootRef.current.unmount()
            mountedRootRef.current = null
          }
          if (containerRef.current) {
            containerRef.current.remove()
            containerRef.current = null
          }
        }

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
        }
      } catch (err) {
        console.error('[useFullscreenAd] failed:', err)
      }
    }

    // run после первой отрисовки
    requestAnimationFrame(() => setTimeout(run, 0))

    // cleanup при размонтировании страницы
    return () => {
      if (mountedRootRef.current) {
        mountedRootRef.current.unmount()
        mountedRootRef.current = null
      }
      if (containerRef.current) {
        containerRef.current.remove()
        containerRef.current = null
      }
    }
  }, [user])
}
