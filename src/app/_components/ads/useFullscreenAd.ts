'use client'
import { config } from '@app/config/client'
import { AdsPlaceEnum } from '@app/enums/ads-place.enum'
import { AdsTypeEnum } from '@app/enums/ads-type.enum'
import { useUserStore } from '@app/store/user.store'
import { addMinutes, isAfter } from 'date-fns'
import { useEffect, useRef } from 'react'
import { renderNetworkAd } from './renderAdWidgets'
import { useAdSession } from './useAdSession'
const STARTUP_DELAY_MS = 5000
const FULLSCREEN_AD_OWNER = 'fullscreen-ad'
const MAX_AD_ATTEMPTS = 4
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
      const attempt = async (attemptsLeft: number): Promise<void> => {
        await session.start({
          place: AdsPlaceEnum.FULLSCREEN,
          type: AdsTypeEnum.VIEW,
          onAd: async (ad, root) => {
            if (!ad) {
              session.close()
              return
            }
            const confirmAndClose = async (viaTaddyWrapper?: boolean) => {
              await session.confirm(Boolean(viaTaddyWrapper))
              session.close()
            }
            const retryOnErrorOrClose = () => {
              session.close()
              if (attemptsLeft > 1) {
                void attempt(attemptsLeft - 1)
              }
              // Лимит попыток исчерпан — просто молча закрываемся.
            }
            await renderNetworkAd(
              root,
              ad,
              {
                onWatched: (viaTaddyWrapper) =>
                  void confirmAndClose(viaTaddyWrapper),
                // Техническая ошибка — можно попробовать ещё раз.
                onError: retryOnErrorOrClose,
                // Юзер закрыл раньше времени — для view это не должно происходить,
                // но на всякий случай просто закрываем сессию без ретрая.
                onClosedEarly: () => session.close(),
              },
              'view',
            )
          },
        })
      }
      await attempt(MAX_AD_ATTEMPTS)
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
