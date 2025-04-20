'use client'
import Avatar from '@app/app/_components/Avatar'
import TgStar from '@app/app/_components/TgStar'
import { useRefferlsStore } from '@app/store/referrals.store'
import addSuffixToNumberUtil from '@app/utils/add-suffix-to-number.util'
import limitLengthString from '@app/utils/limit-length-string.util'
import { useState } from 'react'
import { useTranslations } from 'use-intl'

export default function FriendsList() {
  const [tab, setTab] = useState<'lvl1' | 'lvl2' | 'lvl3'>('lvl1')
  const { referralsData } = useRefferlsStore()
  const t = useTranslations('friends')

  const changeTab = (tab: 'lvl1' | 'lvl2' | 'lvl3') => {
    setTab(tab)
  }

  return (
    <div className="flex flex-col gap-1 items-center font-extralight font-mono max-w-[400px] w-full">
      <div className="px-4 opacity-50 flex flex-row gap-2 items-center w-full ">
        {t('list.title')}
      </div>
      <div
        className={
          'text-sm bg-[var(--surface-container-lowest)] rounded-md flex flex-col gap-2 py-4 max-w-[400px] w-full'
        }>
        <div className={'flex flex-row gap-2 items-center px-4'}>
          {t('list.top')} 100
        </div>
        <div
          className={
            'flex flex-row mt-2 gap-2 items-center border-b border-[var(--on-surface)]/50 px-4'
          }>
          <button
            onClick={() => changeTab('lvl1')}
            className={
              'grow cursor-pointer px-2 py-1 rounded-t-md transition-all duration-200 hover:brightness-110 active:scale-[0.97]'
            }
            style={{
              backgroundColor:
                tab === 'lvl1' ? 'var(--primary)' : 'var(--surface-container)',
              color: tab === 'lvl1' ? 'var(--on-primary)' : 'var(--on-surface)',
            }}>
            1 {t('level')}
          </button>
          <button
            onClick={() => changeTab('lvl2')}
            className={
              'grow cursor-pointer px-2 py-1 rounded-t-md transition-all duration-200 hover:brightness-110 active:scale-[0.97]'
            }
            style={{
              backgroundColor:
                tab === 'lvl2' ? 'var(--primary)' : 'var(--surface-container)',
              color: tab === 'lvl2' ? 'var(--on-primary)' : 'var(--on-surface)',
            }}>
            2 {t('level')}
          </button>
          <button
            onClick={() => changeTab('lvl3')}
            className={
              'grow cursor-pointer px-2 py-1 rounded-t-md transition-all duration-200 hover:brightness-110 active:scale-[0.97]'
            }
            style={{
              backgroundColor:
                tab === 'lvl3' ? 'var(--primary)' : 'var(--surface-container)',
              color: tab === 'lvl3' ? 'var(--on-primary)' : 'var(--on-surface)',
            }}>
            3 {t('level')}
          </button>
        </div>

        <div className="flex flex-col divide-y divide-[var(--on-surface)]/50  px-4">
          {referralsData &&
          referralsData[
            tab === 'lvl1'
              ? 'lvl1List'
              : tab === 'lvl2'
                ? 'lvl2List'
                : 'lvl3List'
          ].length <= 0 ? (
            <div className={'text-center'}>{t('list.empty')}</div>
          ) : (
            referralsData &&
            referralsData[
              tab === 'lvl1'
                ? 'lvl1List'
                : tab === 'lvl2'
                  ? 'lvl2List'
                  : 'lvl3List'
            ].map((ref) => (
              <div
                key={ref.id}
                className={'flex flex-row gap-2 py-2 items-center w-full'}>
                <Avatar w={40} url={ref.photoUrl} />
                <div className={'grow flex flex-col'}>
                  <div className="font-bold text-md font-mono">
                    {limitLengthString(ref.fullName)}
                  </div>
                  <div className="font-bold text-xs text-[var(--on-background)]/80 font-mono flex flex-row gap-2 justify-between items-center w-full">
                    <div>@{ref.username ? ref.username : 'Anonymous'}</div>
                    <div
                      className={
                        'flex flex-row justify-between gap-4 items-center'
                      }>
                      <div className={'flex flex-row gap-1 items-center'}>
                        <TgStar w={15} type={'gold'} />
                        {addSuffixToNumberUtil(ref.totalPaymentsRewarded)}
                      </div>
                      <div className={'flex flex-row gap-1 items-center'}>
                        <TgStar w={15} type={'purple'} />
                        {addSuffixToNumberUtil(ref.totalWithdrawalsRewarded)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
