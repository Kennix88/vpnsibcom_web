'use client'

import { useAdsgram } from '@adsgram/react'
import { authApiClient } from '@app/core/authApiClient'
import { useUserStore } from '@app/store/user.store'
import { useTranslations } from 'next-intl'
import { useCallback, useRef } from 'react'
import { MdDoubleArrow } from 'react-icons/md'
import { toast } from 'react-toastify'

export default function AdsgramButton({
  blockId,
  verifyKey,
  fetchAd,
}: {
  blockId: `${number}` | `int-${number}`
  verifyKey: string
  fetchAd: () => Promise<void>
}) {
  const { setUser } = useUserStore()
  const t = useTranslations('earning')
  const calledRef = useRef(false)
  const errorCountRef = useRef(0)

  const onReward = useCallback(async () => {
    try {
      const response = await authApiClient.confirmAds(verifyKey)
      // если setUser — асинхронная функция, await допустим; иначе он просто сработает быстро
      await setUser(response.user)
      if (response.success) {
        toast.success(t('earned'))
      }
    } catch (error) {
      console.error('Failed to confirm ad reward', error)
    }
  }, [verifyKey, setUser, t])

  const onError = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (result?: any) => {
      console.warn('Adsgram error result:', result)
      if (errorCountRef.current < 3) {
        errorCountRef.current++
        fetchAd()
      }
    },
    [fetchAd],
  )

  // используем наш хук — он вернёт функцию showAd
  const { show } = useAdsgram({
    blockId: blockId,
    debug: false,
    // debugBannerType: 'RewardedVideo',
    onReward,
    onError,
  })

  const handleClick = () => {
    if (calledRef.current) return
    calledRef.current = true
    show?.()
  }

  return (
    <button
      onClick={handleClick}
      className="font-medium flex items-center justify-center bg-[var(--primary)] text-[var(--on-primary)] px-2 py-1 rounded-md uppercase cursor-pointer w-[52px]">
      <MdDoubleArrow size={18} />
    </button>
  )
}
