'use client'
import TgStar from '@app/app/_components/TgStar'
import TooltipWrapper from '@app/app/_components/TooltipWrapper'
import { useRefferlsStore } from '@app/store/referrals.store'
import { FaCircleInfo } from 'react-icons/fa6'
import { useTranslations } from 'use-intl'

export default function FriendsBonuses() {
  const { referralsData } = useRefferlsStore()
  const t = useTranslations('friends')

  return (
    <div className="flex flex-col gap-1 items-center font-extralight font-mono max-w-[400px] w-full">
      <div className="px-4 opacity-50 flex flex-row gap-2 items-center w-full ">
        {t('bonuses.title')}
      </div>
      <div className="flex flex-row gap-4 text-sm w-full flex-wrap justify-center">
        <div
          className={
            'bg-[var(--surface-container-lowest)] rounded-md flex flex-col gap-2 p-4 max-w-[400px] w-full'
          }>
          <div className={'flex flex-row gap-2 items-center'}>
            {t('bonuses.inviteTitle')}{' '}
            <TooltipWrapper
              prompt={t('bonuses.inviteInfo')}
              color="info"
              placement="top">
              <FaCircleInfo />
            </TooltipWrapper>
          </div>
          <div className="flex flex-col divide-y divide-[var(--on-surface)]/50">
            <div className={'flex flex-row justify-between py-2 px-4'}>
              <div className={'opacity-50 flex flex-row gap-2 items-center'}>
                Standard
              </div>
              <div className={'flex flex-row gap-1 items-center'}>
                <TgStar w={15} type={'gold'} />
                {referralsData?.inviteReward}
              </div>
            </div>
            <div className={'flex flex-row justify-between py-2 px-4'}>
              <div className={'opacity-50 flex flex-row gap-2 items-center'}>
                Premium
              </div>
              <div className={'flex flex-row gap-1 items-center'}>
                <TgStar w={15} type={'gold'} />
                {referralsData?.invitePremiumReward}
              </div>
            </div>
          </div>
        </div>
        <div
          className={
            'bg-[var(--surface-container-lowest)] rounded-md flex flex-col gap-2 p-4 max-w-[400px] w-full'
          }>
          <div className={'flex flex-row gap-2 items-center'}>
            {t('bonuses.paymentTitle')}{' '}
            <TooltipWrapper
              prompt={t('bonuses.paymentInfo')}
              color="info"
              placement="top">
              <FaCircleInfo />
            </TooltipWrapper>
          </div>
          <div className="flex flex-col divide-y divide-[var(--on-surface)]/50">
            <div className={'flex flex-row justify-between py-2 px-4'}>
              <div className={'flex flex-row gap-2 items-center'}>
                <span className={'opacity-50'}>1 {t('level')}</span>
                <TooltipWrapper
                  prompt={t('bonuses.lvl1Info')}
                  color="info"
                  placement="top">
                  <FaCircleInfo />
                </TooltipWrapper>
              </div>
              <div className={'flex flex-row gap-1 items-center'}>
                {referralsData && 100 * referralsData.lvl1Percent}%
                <TgStar w={15} type={'purple'} />
              </div>
            </div>
            <div className={'flex flex-row justify-between py-2 px-4'}>
              <div className={'flex flex-row gap-2 items-center'}>
                <span className={'opacity-50'}>2 {t('level')}</span>
                <TooltipWrapper
                  prompt={t('bonuses.lvl2Info')}
                  color="info"
                  placement="top">
                  <FaCircleInfo />
                </TooltipWrapper>
              </div>
              <div className={'flex flex-row gap-1 items-center'}>
                {referralsData && 100 * referralsData.lvl2Percent}%
                <TgStar w={15} type={'purple'} />
              </div>
            </div>
            <div className={'flex flex-row justify-between py-2 px-4'}>
              <div className={'flex flex-row gap-2 items-center'}>
                <span className={'opacity-50'}>3 {t('level')}</span>
                <TooltipWrapper
                  prompt={t('bonuses.lvl3Info')}
                  color="info"
                  placement="top">
                  <FaCircleInfo />
                </TooltipWrapper>
              </div>
              <div className={'flex flex-row gap-1 items-center'}>
                {referralsData && 100 * referralsData.lvl3Percent}%
                <TgStar w={15} type={'purple'} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
