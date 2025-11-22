'use client'

import { useAdsgram } from '@adsgram/react'
import { authApiClient } from '@app/core/authApiClient'
import { useUserStore } from '@app/store/user.store'
import { useTranslations } from 'next-intl'
import { useCallback } from 'react'
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

  const onReward = useCallback(async () => {
    try {
      const response = await authApiClient.confirmAds(verifyKey)
      await setUser(response.user)
      if (response.success) {
        toast.success(t('earned'))
      }
    } catch (error) {
      console.error('Failed to load ad', error)
      //
    } finally {
      fetchAd()
    }
  }, [verifyKey, setUser, t, fetchAd])

  const onError = useCallback(() => {
    // alert('Error')
    fetchAd()
  }, [fetchAd])
  const { show } = useAdsgram({
    blockId,
    onReward,
    onError,
    // debug: true,
  })
  return (
    <button
      onClick={show}
      className="font-medium flex items-center justify-center bg-[var(--primary)] text-[var(--on-primary)] px-2 py-1 rounded-md uppercase cursor-pointer w-[52px]">
      <MdDoubleArrow size={18} />
    </button>
  )
}
