'use client'
import TgStar from '@app/app/_components/Currency'
import TooltipWrapper from '@app/app/_components/TooltipWrapper'
import { useRefferlsStore } from '@app/store/referrals.store'
import addSuffixToNumberUtil from '@app/utils/add-suffix-to-number.util'
import { FaCircleInfo } from 'react-icons/fa6'
import { useTranslations } from 'use-intl'

export default function FriendsStatistics() {
  const { referralsData } = useRefferlsStore()
  // const { user } = useUserStore()
  const t = useTranslations('friends')

  return (
    <div className="flex flex-col gap-1 font-extralight font-mono max-w-[400px] w-full">
      <div className="px-4 opacity-50 flex flex-row gap-2 items-center">
        {t('statistics.title')}
      </div>
      <div className=" flex flex-col gap-4 text-sm">
        <div
          className={
            'bg-[var(--surface-container-lowest)] rounded-md flex flex-col gap-2 p-4'
          }>
          <div className={'flex flex-row gap-2 items-center'}>
            {t('statistics.earnTitle')}{' '}
            <TooltipWrapper
              prompt={t('statistics.earnInfo')}
              color="info"
              placement="top">
              <FaCircleInfo />
            </TooltipWrapper>
          </div>
          <div className="flex flex-col divide-y divide-[var(--on-surface)]/50">
            <div
              className={
                'bg-[var(--surface-container-high)] rounded-t-md flex justify-between py-2 px-4'
              }>
              <div
                className={
                  'opacity-80 font-bold flex flex-row gap-2 items-center'
                }>
                {t('total')}
              </div>
              <div
                className={
                  'flex justify-center flex-row gap-1 items-center px-2 py-1 min-w-1/2 rounded-md bg-[var(--usdt-container-rgba)] '
                }>
                <TgStar w={18} type={'usdt'} />
                {referralsData &&
                  addSuffixToNumberUtil(
                    referralsData.lvl1TotalUsdtRewarded +
                      referralsData.lvl2TotalUsdtRewarded +
                      referralsData.lvl3TotalUsdtRewarded,
                    2,
                  )}
              </div>
            </div>
            <div className={'flex justify-between py-2 px-4'}>
              <div className={'opacity-50 flex flex-row gap-2 items-center'}>
                1 {t('level')}
              </div>
              <div
                className={
                  'flex justify-center flex-row gap-1 items-center px-2 py-1 min-w-1/2 rounded-md bg-[var(--usdt-container-rgba)]'
                }>
                <TgStar w={18} type={'usdt'} />
                {referralsData &&
                  addSuffixToNumberUtil(referralsData.lvl1TotalUsdtRewarded)}
              </div>
            </div>
            <div className={'flex justify-between py-2 px-4'}>
              <div className={'opacity-50 flex flex-row gap-2 items-center'}>
                2 {t('level')}
              </div>
              <div
                className={
                  'flex justify-center flex-row gap-1 items-center px-2 py-1 min-w-1/2 rounded-md bg-[var(--usdt-container-rgba)]'
                }>
                <TgStar w={18} type={'usdt'} />
                {referralsData &&
                  addSuffixToNumberUtil(referralsData.lvl2TotalUsdtRewarded)}
              </div>
            </div>
            <div className={'flex justify-between py-2 px-4'}>
              <div className={'opacity-50 flex flex-row gap-2 items-center'}>
                3 {t('level')}
              </div>
              <div
                className={
                  'flex justify-center flex-row gap-1 items-center px-2 py-1 min-w-1/2 rounded-md bg-[var(--usdt-container-rgba)]'
                }>
                <TgStar w={18} type={'usdt'} />
                {referralsData &&
                  addSuffixToNumberUtil(referralsData.lvl3TotalUsdtRewarded)}
              </div>
            </div>
          </div>
        </div>
        <div
          className={
            'bg-[var(--surface-container-lowest)] rounded-md flex flex-col gap-2 p-4'
          }>
          <div className={'flex flex-row gap-2 items-center'}>
            {t('statistics.inviteTitle')}{' '}
            {/*<TooltipWrapper
              prompt={t('statistics.inviteInfo')}
              color="info"
              placement="top">
              <FaCircleInfo />
            </TooltipWrapper>*/}
          </div>
          <div className="flex flex-col divide-y divide-[var(--on-surface)]/50">
            <div
              className={
                'bg-[var(--surface-container-high)] rounded-t-md flex flex-row justify-between py-2 px-4'
              }>
              <div
                className={
                  'opacity-80 font-bold flex flex-row gap-2 items-center'
                }>
                {t('total')}
              </div>
              <div
                className={
                  'flex px-2 justify-center flex-row gap-1 items-center'
                }>
                {referralsData &&
                  `${addSuffixToNumberUtil(
                    referralsData.lvl1Count +
                      referralsData.lvl2Count +
                      referralsData.lvl3Count,
                    2,
                  )}`}
              </div>
            </div>
            <div className={'flex flex-row justify-between py-2 px-4'}>
              <div className={'opacity-50 flex flex-row gap-2 items-center'}>
                1 {t('level')}
              </div>
              <div
                className={
                  'flex px-2 justify-center flex-row gap-1 items-center'
                }>
                {referralsData &&
                  `${addSuffixToNumberUtil(referralsData.lvl1Count, 2)}`}
              </div>
            </div>
            <div className={'flex flex-row justify-between py-2 px-4'}>
              <div className={'opacity-50 flex flex-row gap-2 items-center'}>
                2 {t('level')}
              </div>
              <div
                className={
                  'flex px-2 justify-center flex-row gap-1 items-center'
                }>
                {referralsData &&
                  `${addSuffixToNumberUtil(referralsData.lvl2Count, 2)}`}
              </div>
            </div>
            <div className={'flex flex-row justify-between py-2 px-4'}>
              <div className={'opacity-50 flex flex-row gap-2 items-center'}>
                3 {t('level')}
              </div>
              <div
                className={
                  'flex px-2 justify-center flex-row gap-1 items-center'
                }>
                {referralsData &&
                  `${addSuffixToNumberUtil(referralsData.lvl3Count, 2)}`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
