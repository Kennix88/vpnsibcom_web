'use client'

import { authApiClient } from '@app/core/authApiClient'
import { AdsPlaceEnum } from '@app/enums/ads-place.enum'
import { useUserStore } from '@app/store/user.store'
import { useCallback, useEffect, useState } from 'react'
import { TaskCard } from '../tasks/TaskCard'
import { useRewardAd } from './useRewardAd'

export function TaskAdsReward() {
  const { user, setUser } = useUserStore()
  const [amountReward, setAmountReward] = useState<number | null>(null)
  const { trigger, isLoading } = useRewardAd(AdsPlaceEnum.REWARD_TASK)

  const fetchReward = useCallback(async () => {
    try {
      const response = await authApiClient.getAdTaskReward('reward')
      setAmountReward(response ? response.amount : null)
    } catch (err) {
      console.error('Failed to load reward', err)
    }
  }, [])

  useEffect(() => {
    fetchReward()
  }, [fetchReward])

  if (amountReward == null || !user) return null

  return (
    <TaskCard
      title="Смотри рекламу — получай Stars"
      icon="video-watch"
      rewards={[{ amount: amountReward, type: 'star' }]}
      cooldownUntil={user.nextAdsRewardAt}
      onCooldownExpire={() => void authApiClient.getMe().then(setUser)}
      state="ready"
      onAction={trigger}
      isLoading={isLoading}
    />
  )
}
