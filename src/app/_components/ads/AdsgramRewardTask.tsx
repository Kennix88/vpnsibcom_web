/* eslint-disable @typescript-eslint/ban-ts-comment */
'use client'
import { BlockId } from '@adsgram/common'
import { AdsgramTask } from '@adsgram/react'
import { authApiClient } from '@app/core/authApiClient'
import { AdsPlaceEnum } from '@app/enums/ads-place.enum'
import { AdsResInterface } from '@app/enums/ads-res.interface'
import { AdsTaskTypeEnum } from '@app/enums/ads-task-type.enum'
import { useUserStore } from '@app/store/user.store'
import { useTranslations } from 'next-intl'
import { JSX, useCallback, useEffect, useRef, useState } from 'react'
import { HiGift } from 'react-icons/hi'
import { MdDoubleArrow, MdFileDownloadDone } from 'react-icons/md'
import { toast } from 'react-toastify'
import Currency from '../Currency'

export function AdsgramRewardTask() {
  const [ad, setAd] = useState<AdsResInterface | null>(null)
  const { setUser } = useUserStore()
  const taskRef = useRef<JSX.IntrinsicElements['adsgram-task']>(null)
  const t = useTranslations('earning')

  const fetchAd = useCallback(async (): Promise<void> => {
    try {
      const response = await authApiClient.getAds(
        AdsPlaceEnum.TASK,
        AdsTaskTypeEnum.TASK,
      )
      setAd(response)
    } catch (error) {
      console.error('Failed to load ad', error)
      // toast.error(t('errors.loadFailed'))
    }
  }, [setAd])

  useEffect(() => {
    fetchAd()
  }, [fetchAd])

  const handleReward = useCallback(async (): Promise<void> => {
    try {
      const response = await authApiClient.confirmAds(ad?.verifyKey as string)
      await setUser(response.user)
      if (response.success) {
        toast.success(t('earned'))
      }
    } catch (error) {
      console.error('Failed to load ad', error)
    } finally {
      fetchAd()
    }
  }, [ad, setUser, t, fetchAd])

  const handleError = (event: CustomEvent<string>): void => {
    fetchAd()
    console.error('Task error:', event.detail)
  }

  if (!ad) {
    return null
  }

  // if (!customElements.get('adsgram-task')) {
  //   return null
  // }

  return (
    <AdsgramTask
      blockId={ad.blockId as BlockId}
      // debug={true}
      className="adsgram-task p-2 bg-[var(--surface-container-lowest)] rounded-md font-bold"
      // @ts-expect-error
      ref={taskRef}
      onReward={handleReward}
      onError={handleError}>
      <span slot="reward" className="text-[12px] mt-2 flex gap-2 flex-wrap">
        {ad.rewards.stars > 0 && (
          <div className="inline-flex gap-1 items-center px-2 py-1 rounded-md bg-[var(--star-container-rgba)] w-fit">
            <Currency w={18} type={'star'} />+{ad.rewards.stars}
          </div>
        )}
        {ad.rewards.traffic > 0 && (
          <div className="inline-flex gap-1 items-center px-2 py-1 rounded-md bg-[var(--traffic-container-rgba)] w-fit">
            <Currency w={18} type={'traffic'} />+{ad.rewards.traffic}
          </div>
        )}
        {ad.rewards.tickets > 0 && (
          <div className="inline-flex gap-1 items-center px-2 py-1 rounded-md bg-[var(--ticket-container-rgba)] w-fit">
            <Currency w={18} type={'ticket'} />+{ad.rewards.tickets}
          </div>
        )}
      </span>
      <div
        slot="button"
        className="font-medium flex items-center justify-center bg-[var(--primary)] text-[var(--on-primary)] px-2 py-1 rounded-md ml-2 uppercase cursor-pointer">
        <MdDoubleArrow size={18} />
      </div>
      <div
        slot="claim"
        className="font-medium flex items-center justify-center bg-[var(--warning)] text-[var(--on-warning)] px-2 py-1 rounded-md ml-2 uppercase cursor-pointer">
        <HiGift size={18} />
      </div>
      <div
        slot="done"
        className="font-medium flex items-center justify-center bg-[var(--success)] text-[var(--on-success)] px-2 py-1 rounded-md ml-2 uppercase cursor-not-allowed">
        <MdFileDownloadDone size={18} />
      </div>
    </AdsgramTask>
  )
}
