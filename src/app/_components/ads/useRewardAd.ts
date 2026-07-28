'use client'
import { config } from '@app/config/client'
import { AdsPlaceEnum } from '@app/enums/ads-place.enum'
import { AdsTypeEnum } from '@app/enums/ads-type.enum'
import { useUserStore } from '@app/store/user.store'
import { useCallback, useState } from 'react'
import { toast } from 'react-toastify'
import { renderNetworkAd } from './renderAdWidgets'
import { useAdSession } from './useAdSession'

const REWARD_AD_OWNER_PREFIX = 'reward-ad'
const MAX_AD_ATTEMPTS = 4

export function useRewardAd(place: AdsPlaceEnum) {
  const isTaddyEnabled = config.isTaddyEnabled as boolean
  const { setUser } = useUserStore()
  const session = useAdSession(`${REWARD_AD_OWNER_PREFIX}-${place}`)
  const [isLoading, setIsLoading] = useState(false)

  const trigger = useCallback(async () => {
    if (isLoading) return
    setIsLoading(true)
    let sawAnyAd = false

    const attempt = async (attemptsLeft: number): Promise<void> => {
      const result = await session.start({
        place,
        type: AdsTypeEnum.REWARD,
        onAd: async (ad, root) => {
          const finish = () => {
            setIsLoading(false)
            session.close()
          }

          if (!ad) {
            // Первая попытка и сразу null — этому юзеру реклама не положена вовсе.
            // Если null пришёл ПОСЛЕ хотя бы одной сети — значит backend исчерпал варианты.
            toast.warn(
              sawAnyAd
                ? 'Не удалось показать рекламу, попробуйте позже'
                : 'Нет рекламы на текущий момент!',
            )
            finish()
            return
          }

          sawAnyAd = true

          const confirmAndFinish = async (viaTaddyWrapper?: boolean) => {
            const response = await session.confirm(Boolean(viaTaddyWrapper))
            if (response) {
              await setUser(response.user)
              if (response.success) toast.success('Награда получена!')
            }
            finish()
          }

          const retryOrFinish = () => {
            session.close()
            if (attemptsLeft > 1) {
              void attempt(attemptsLeft - 1)
              return
            }
            setIsLoading(false)
            toast.warn('Не удалось показать рекламу, попробуйте позже')
          }

          await renderNetworkAd(
            root,
            ad,
            {
              onWatched: (viaTaddyWrapper) =>
                void confirmAndFinish(viaTaddyWrapper),
              // Реклама не отрисовалась / закрыта без награды — пробуем ещё раз,
              // backend сам решит какую сеть/блок отдать в следующий getAds.
              onDismissed: retryOrFinish,
            },
            'reward',
          )
        },
      })

      // 'locked' или 'error' на уровне самой сессии (не смогли даже получить
      // рекламу/захватить лок) — ретраить бессмысленно, останавливаемся.
      if (result !== 'ok') setIsLoading(false)
    }

    await attempt(MAX_AD_ATTEMPTS)
  }, [isTaddyEnabled, place, session, setUser])

  return { trigger, isLoading }
}
