'use client'

import { useAdsgram } from '@adsgram/react'
import { authApiClient } from '@app/core/authApiClient'
import { useUserStore } from '@app/store/user.store'
import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'
import { MdDoubleArrow } from 'react-icons/md'
import { toast } from 'react-toastify'

export default function AdsgramButton({
  blockId,
  verifyKey,
}: {
  blockId: `${number}` | `int-${number}`
  verifyKey: string
}) {
  const [loading, setLoading] = useState(false)
  const { setUser } = useUserStore()
  const t = useTranslations('earning')
  const handleReward = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      const response = await authApiClient.confirmAds(verifyKey)
      setUser(response.user)
      if (response.success) {
        toast.success(t('earned'))
      }
    } catch (error) {
      console.error('Failed to load ad', error)
      //
    } finally {
      setLoading(false)
    }
  }, [setLoading, verifyKey, setUser, t])

  const onReward = useCallback(() => {
    // alert('Reward')
    handleReward()
  }, [])
  const onError = useCallback(() => {
    // alert('Error')
  }, [])
  const { show } = useAdsgram({
    blockId,
    onReward,
    onError,
    debug: false,
  })
  return (
    <button
      onClick={show}
      className="font-medium flex items-center justify-center bg-[var(--primary)] text-[var(--on-primary)] px-2 py-1 rounded-md uppercase cursor-pointer w-[52px]">
      <MdDoubleArrow size={18} />
    </button>
  )
}
