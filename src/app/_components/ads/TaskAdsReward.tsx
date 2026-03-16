'use client'
import { authApiClient } from '@app/core/authApiClient'
import { AdsNetworkEnum } from '@app/enums/ads-network.enum'
import { AdsPlaceEnum } from '@app/enums/ads-place.enum'
import { AdsDataInterface } from '@app/enums/ads-res.interface'
import { AdsTypeEnum } from '@app/enums/ads-type.enum'
import { useUserStore } from '@app/store/user.store'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { FaPlay } from 'react-icons/fa6'
import { MdDoubleArrow } from 'react-icons/md'
import { toast } from 'react-toastify'
import Currency from '../Currency'
import { CountdownTimer } from './CountdownTimer'

export function TaskAdsReward() {
  const { user, setUser } = useUserStore()
  const t = useTranslations('earning')
  const [amountReward, setAmountReward] = useState<number | null>(null)
  const adRef = useRef<AdsDataInterface | null>(null)
  const mountedRootRef = useRef<Root | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const isShowingRef = useRef(false)

  const cleanup = useCallback(() => {
    if (mountedRootRef.current) {
      mountedRootRef.current.unmount()
      mountedRootRef.current = null
    }
    if (containerRef.current) {
      containerRef.current.remove()
      containerRef.current = null
    }
    isShowingRef.current = false
    adRef.current = null
  }, [])

  const reward = useCallback(async () => {
    try {
      if (adRef.current == null) return
      const response = await authApiClient.confirmAds(adRef.current.verifyKey)
      await setUser(response.user)
      if (response.success) {
        toast.success(t('earned'))
      }
    } catch (error) {
      console.error('Failed to load ad', error)
      //
    } finally {
      adRef.current = null
    }
  }, [setUser, t])

  const fetchAd = useCallback(async (): Promise<void> => {
    try {
      if (isShowingRef.current) return
      isShowingRef.current = true

      const response = await authApiClient.getAds(
        AdsPlaceEnum.REWARD_TASK,
        AdsTypeEnum.REWARD,
      )
      if (!response.isNoAds && response.ad) {
        const nextAd = response.ad
        adRef.current = nextAd

        if (!containerRef.current) {
          const div = document.createElement('div')
          div.id = 'ads-reward-task-container'
          document.body.appendChild(div)
          containerRef.current = div
        }

        if (mountedRootRef.current) return
        const root = createRoot(containerRef.current)
        mountedRootRef.current = root

        const handleClose = () => {
          cleanup()
        }

        const handleReward = async () => {
          await reward()
          handleClose()
        }

        if (nextAd.network === AdsNetworkEnum.ADSGRAM) {
          const { default: AdsgramReward } = await import('./AdsgramReward')
          root.render(
            <AdsgramReward
              blockId={nextAd.blockId as `${number}` | `int-${number}`}
              onReward={handleReward}
            />,
          )
        } else if (nextAd.network === AdsNetworkEnum.ADSONAR) {
          const { default: AdsonarReward } = await import('./AdsonarReward')
          root.render(
            <AdsonarReward
              blockId={String(nextAd.blockId)}
              onReward={handleReward}
            />,
          )
        } else {
          handleClose()
        }
        return
      }
      cleanup()
    } catch (error) {
      console.error('Failed to load ad', error)
      cleanup()
      // toast.error(t('errors.loadFailed'))
    }
  }, [cleanup, reward])

  const fetchReward = useCallback(async (): Promise<void> => {
    try {
      const response = await authApiClient.getAdTaskReward()
      if (response) setAmountReward(response.amount)
      else setAmountReward(null)
    } catch (error) {
      console.error('Failed to load ad', error)
      // toast.error(t('errors.loadFailed'))
    }
  }, [setAmountReward])

  useEffect(() => {
    fetchReward()
  }, [fetchReward])

  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  if (amountReward == null || !user) {
    return null
  }

  return (
    <div className="px-2 py-1 bg-[var(--surface-container-lowest)] rounded-md font-bold flex items-center justify-between gap-2 w-full">
      <div className="w-[40px] h-[40px] rounded-md bg-[var(--tertiary)] text-[var(--on-tertiary)] flex items-center justify-center">
        <FaPlay className="text-xl" />
      </div>
      <div className="flex flex-col gap-0.5 grow">
        <div className="text-[14px] font-bold font-mono">
          {t('rewardTask.title')}
        </div>
        <div className="text-[12px] flex gap-2 flex-wrap font-mono">
          <div className="inline-flex gap-1 items-center px-1 py-1 rounded-md bg-[var(--star-container-rgba)] w-fit">
            <Currency w={18} type={'star'} />+{amountReward}
          </div>
        </div>
      </div>
      {user.nextAdsRewardAt && new Date(user.nextAdsRewardAt) > new Date() ? (
        <CountdownTimer expiryDate={user.nextAdsRewardAt} />
      ) : (
        <>
          <button
            onClick={fetchAd}
            className="font-medium flex items-center justify-center bg-[var(--primary)] text-[var(--on-primary)] px-2 py-1 rounded-md uppercase cursor-pointer w-[52px]">
            <MdDoubleArrow size={18} />
          </button>
        </>
      )}
    </div>
  )
}
