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
  const executedRef = useRef(false)
  const mountedRootRef = useRef<Root | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const { user } = useUserStore()

  useEffect(() => {
    if (!user || executedRef.current) return
    executedRef.current = true

    const run = async () => {
      try {
        // rate limit: 5 minutes from last viewed
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

        // create container and mount appropriate component imperatively
        // (useAdsgram is a hook and must be used inside a component)
        /* eslint-disable @typescript-eslint/ban-ts-comment */
        // @ts-ignore
        const mountAdComponent = (node: JSX.Element) => {
          // create container
          const container = document.createElement('div')
          container.setAttribute('data-ads-portal', 'true')
          document.body.appendChild(container)
          containerRef.current = container
          const root = createRoot(container)
          mountedRootRef.current = root
          root.render(node)
        }

        const unmount = () => {
          try {
            if (mountedRootRef.current) {
              mountedRootRef.current.unmount()
              mountedRootRef.current = null
            }
            if (containerRef.current) {
              containerRef.current.remove()
              containerRef.current = null
            }
          } catch (err) {
            console.warn('Unmount ad portal failed', err)
          }
        }

        const handleClose = () => {
          unmount()
        }

        if (ad.network === AdsNetworkEnum.ADSGRAM) {
          const { default: AdsgramFullscreen } =
            await import('./AdsgramFullscreen')
          mountAdComponent(
            <AdsgramFullscreen
              blockId={ad.blockId as `${number}` | `int-${number}`}
              onClose={handleClose}
            />,
          )
        } else if (ad.network === AdsNetworkEnum.ADSONAR) {
          // Sonar or other imperative SDKs
          const { default: AdsonarFullscreen } =
            await import('./AdsonarFullscreen')
          mountAdComponent(
            <AdsonarFullscreen
              blockId={String(ad.blockId)}
              onClose={handleClose}
            />,
          )
        }
      } catch (e) {
        console.error('[useFullscreenAd] failed:', e)
      }
    }

    // ensure run AFTER first paint
    requestAnimationFrame(() => {
      setTimeout(run, 0)
    })

    // cleanup if page unmounts before ad finishes
    return () => {
      try {
        if (mountedRootRef.current) {
          mountedRootRef.current.unmount()
          mountedRootRef.current = null
        }
        if (containerRef.current) {
          containerRef.current.remove()
          containerRef.current = null
        }
      } catch (err) {
        console.warn('Unmount ad portal failed', err)
      }
    }
  }, [user])
}
