'use client'
import { authApiClient } from '@app/core/authApiClient'
import { AdsNetworkEnum } from '@app/enums/ads-network.enum'
import { AdsPlaceEnum } from '@app/enums/ads-place.enum'
import { AdsDataInterface } from '@app/enums/ads-res.interface'
import { AdsTypeEnum } from '@app/enums/ads-type.enum'
import { useUserStore } from '@app/store/user.store'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'
import { FaPlay } from 'react-icons/fa6'
import Currency from '../Currency'
import { CountdownTimer } from './CountdownTimer'

const AdsgramButton = dynamic(() => import('./AdsgramButton'), { ssr: false })
const AdsonarButton = dynamic(() => import('./AdsonarButton'), { ssr: false })

export function TaskAdsReward() {
  const [ad, setAd] = useState<AdsDataInterface | null>(null)
  const didFetchRef = useRef(false)
  const { user } = useUserStore()
  const t = useTranslations('earning')

  const fetchAd = useCallback(async (): Promise<void> => {
    try {
      const response = await authApiClient.getAds(
        AdsPlaceEnum.REWARD_TASK,
        AdsTypeEnum.REWARD,
      )
      if (!response.isNoAds && response.ad) setAd(response.ad)
      else setAd(null)
    } catch (error) {
      console.error('Failed to load ad', error)
      // toast.error(t('errors.loadFailed'))
    }
  }, [setAd])

  useEffect(() => {
    if (didFetchRef.current) return
    didFetchRef.current = true
    fetchAd()
  }, [fetchAd])

  if (!ad || !user) {
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
          {ad.rewards.stars > 0 && (
            <div className="inline-flex gap-1 items-center px-1 py-1 rounded-md bg-[var(--star-container-rgba)] w-fit">
              <Currency w={18} type={'star'} />+{ad.rewards.stars}
            </div>
          )}
          {ad.rewards.traffic > 0 && (
            <div className="inline-flex gap-1 items-center px-1 py-1 rounded-md bg-[var(--traffic-container-rgba)] w-fit">
              <Currency w={18} type={'traffic'} />+{ad.rewards.traffic}
            </div>
          )}
          {ad.rewards.tickets > 0 && (
            <div className="inline-flex gap-1 items-center px-1 py-1 rounded-md bg-[var(--ticket-container-rgba)] w-fit">
              <Currency w={18} type={'ticket'} />+{ad.rewards.tickets}
            </div>
          )}
          {ad.rewards.ad > 0 && (
            <div className="inline-flex gap-1 items-center px-1 py-1 rounded-md bg-[var(--ad-container-rgba)] w-fit">
              <Currency w={18} type={'ad'} />+{ad.rewards.ad}
            </div>
          )}
        </div>
      </div>
      {user.nextAdsRewardAt && new Date(user.nextAdsRewardAt) > new Date() ? (
        <CountdownTimer
          expiryDate={user.nextAdsRewardAt}
          onTimerEnd={fetchAd}
        />
      ) : (
        <>
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
        </>
      )}
    </div>
  )
}
