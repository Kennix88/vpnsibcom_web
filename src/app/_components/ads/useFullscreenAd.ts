'use client'

import { config } from '@app/config/client'
import { AdsNetworkEnum } from '@app/enums/ads-network.enum'
import { AdsPlaceEnum } from '@app/enums/ads-place.enum'
import { AdsTypeEnum } from '@app/enums/ads-type.enum'
import { useUserStore } from '@app/store/user.store'
import { addMinutes, isAfter } from 'date-fns'
import { useEffect, useRef } from 'react'
import { renderNetworkAd, renderTaddyWrapper } from './renderAdWidgets'
import { useAdSession } from './useAdSession'

const STARTUP_DELAY_MS = 5000
const FULLSCREEN_AD_OWNER = 'fullscreen-ad'

export function useFullscreenAd() {
  const isTaddyEnabled = config.isTaddyEnabled as boolean
  const { user } = useUserStore()
  const userRef = useRef(user)
  useEffect(() => {
    userRef.current = user
  }, [user])

  const session = useAdSession(FULLSCREEN_AD_OWNER)
  const startupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasUser = Boolean(user)

  useEffect(() => {
    if (!hasUser) return

    const run = async () => {
      const currentUser = userRef.current
      if (!currentUser) return

      if (
        currentUser.lastFullscreenViewedAt &&
        !isAfter(
          new Date(),
          addMinutes(new Date(currentUser.lastFullscreenViewedAt), 3),
        )
      ) {
        return
      }

      await session.start({
        place: AdsPlaceEnum.FULLSCREEN,
        type: AdsTypeEnum.VIEW,
        onAd: async (ad, root) => {
          if (!ad && !isTaddyEnabled) {
            session.close()
            return
          }

          // Для VIEW-рекламы любое завершение показа = подтверждение
          const confirmAndClose = async (isTaddy = false) => {
            await session.confirm(isTaddy)
            session.close()
          }
          const handlers = {
            onWatched: () => void confirmAndClose(),
            onDismissed: () => void confirmAndClose(),
          }

          if (isTaddyEnabled && ad?.network !== AdsNetworkEnum.TADDY) {
            await renderTaddyWrapper(root, {
              canCloseImmediately: true,
              requiredViewSeconds: 10,
              onClosed: () => void confirmAndClose(true),
              onViewed: () => void confirmAndClose(true),
              onError: () => void renderNetworkAd(root, ad, handlers, 'view'),
              onNoFill: () => void renderNetworkAd(root, ad, handlers, 'view'),
            })
          } else {
            await renderNetworkAd(root, ad, handlers, 'view')
          }
        },
      })
    }

    startupTimerRef.current = setTimeout(run, STARTUP_DELAY_MS)

    return () => {
      if (startupTimerRef.current) {
        clearTimeout(startupTimerRef.current)
        startupTimerRef.current = null
      }
      session.cancel()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasUser, isTaddyEnabled])
}
