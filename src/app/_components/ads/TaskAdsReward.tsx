'use client'
import { authApiClient } from '@app/core/authApiClient'
import { AdsNetworkEnum } from '@app/enums/ads-network.enum'
import { AdsPlaceEnum } from '@app/enums/ads-place.enum'
import { AdsResInterface } from '@app/enums/ads-res.interface'
import { AdsTaskTypeEnum } from '@app/enums/ads-task-type.enum'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'
import { FaPlay } from 'react-icons/fa6'
import Currency from '../Currency'
import AdsgramButton from './AdsgramButton'
import AdsonarButton from './AdsonarButton'

export function TaskAdsReward() {
  const [ad, setAd] = useState<AdsResInterface | null>(null)
  const t = useTranslations('earning')

  const fetchAd = useCallback(async (): Promise<void> => {
    try {
      const response = await authApiClient.getAds(
        AdsPlaceEnum.REWARD_TASK,
        AdsTaskTypeEnum.REWARD,
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

  if (!ad) {
    return null
  }

  return (
    <div className="px-2 py-1 bg-[var(--surface-container-lowest)] rounded-md font-bold flex items-center justify-between gap-2">
      <div className="w-[40px] h-[40px] rounded-md bg-[var(--tertiary)] text-[var(--on-tertiary)] flex items-center justify-center">
        <FaPlay className="text-xl" />
      </div>
      <div className="flex flex-col gap-2 grow">
        <div className="text-[14px] font-bold">{t('rewardTask.title')}</div>
        <div className="text-[12px] flex gap-2 flex-wrap">
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
        </div>
      </div>
      {ad.network === AdsNetworkEnum.ADSGRAM && (
        <AdsgramButton
          blockId={ad.blockId as `${number}` | `int-${number}`}
          verifyKey={ad.verifyKey}
          fetchAd={fetchAd}
        />
      )}
      {ad.network === AdsNetworkEnum.ADSONAR && (
        <AdsonarButton
          blockId={ad.blockId}
          verifyKey={ad.verifyKey}
          fetchAd={fetchAd}
        />
      )}
    </div>
  )
}
