'use client'

import { config } from '@app/config/client'
import { AdsNetworkEnum } from '@app/enums/ads-network.enum'
import { AdsPlaceEnum } from '@app/enums/ads-place.enum'
import { AdsTypeEnum } from '@app/enums/ads-type.enum'
import { useUserStore } from '@app/store/user.store'
import { useCallback, useState } from 'react'
import { toast } from 'react-toastify'
import { renderNetworkAd, renderTaddyWrapper } from './renderAdWidgets'
import { useAdSession } from './useAdSession'

const TASK_AD_OWNER = 'task-reward-ad'

export function useTaskRewardAd() {
  const isTaddyEnabled = config.isTaddyEnabled as boolean
  const { setUser } = useUserStore()
  const session = useAdSession(TASK_AD_OWNER)
  const [isLoading, setIsLoading] = useState(false)

  const trigger = useCallback(async () => {
    setIsLoading(true)

    const result = await session.start({
      place: AdsPlaceEnum.REWARD_TASK,
      type: AdsTypeEnum.REWARD,
      onAd: async (ad, root) => {
        const finish = () => {
          setIsLoading(false)
          session.close()
        }
        const confirmAndFinish = async (isTaddy = false) => {
          const response = await session.confirm(isTaddy)
          if (response) {
            await setUser(response.user)
            if (response.success) toast.success('Награда получена!')
          }
          finish()
        }

        if (!ad && !isTaddyEnabled) {
          toast.warn('Нет рекламы на текущий момент!')
          finish()
          return
        }

        const handlers = {
          onWatched: () => void confirmAndFinish(),
          onDismissed: finish, // закрытие без реального просмотра — награды нет
        }

        if (isTaddyEnabled && ad?.network !== AdsNetworkEnum.TADDY) {
          await renderTaddyWrapper(root, {
            canCloseImmediately: false,
            requiredViewSeconds: 10,
            onClosed: finish, // закрыли — но не досмотрели
            onViewed: () => void confirmAndFinish(true),
            onError: () => void renderNetworkAd(root, ad, handlers, 'reward'),
            onNoFill: () => void renderNetworkAd(root, ad, handlers, 'reward'),
          })
        } else {
          await renderNetworkAd(root, ad, handlers, 'reward')
        }
      },
    })

    if (result !== 'ok') setIsLoading(false)
  }, [isTaddyEnabled, session, setUser])

  return { trigger, isLoading }
}
