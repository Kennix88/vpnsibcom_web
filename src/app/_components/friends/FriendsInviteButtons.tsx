'use client'
import { useRefferlsStore } from '@app/store/referrals.store'
import { useCopyToClipboard } from '@app/utils/copy-to-clipboard.util'
import Link from 'next/link'
import { FaCopy, FaShareNodes } from 'react-icons/fa6'
import { useTranslations } from 'use-intl'

export default function FriendsInviteButtons() {
  const copyToClipboard = useCopyToClipboard()
  const { referralsData } = useRefferlsStore()
  const t = useTranslations('friends')

  return (
    <div className="flex flex-col gap-1 items-center font-extralight font-mono max-w-[400px] w-full">
      <div className="px-4 opacity-50 flex flex-row gap-2 items-center w-full ">
        {t('invite.title')}
      </div>
      <div
        className={
          'text-sm bg-[var(--surface-container-lowest)] rounded-md flex flex-col gap-2 py-2 px-4 max-w-[400px] w-full'
        }>
        {/*<div className={'flex flex-row gap-2 items-center px-4'}>Топ 100</div>*/}
        <div className="flex flex-col divide-y divide-[var(--on-surface)]/50">
          <div className={'flex flex-row justify-between py-2'}>
            <div className={'opacity-50 flex flex-row gap-2 items-center'}>
              {t('invite.inTelegram')}
            </div>
            <div className={'flex flex-row gap-2 items-center '}>
              {referralsData && (
                <Link
                  href={referralsData.inviteBotTgDeeplink}
                  className={
                    'flex flex-row gap-1 h-8 items-center bg-[var(--primary)] text-[var(--on-primary)] font-medium text-sm px-2 rounded-md transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer'
                  }>
                  {t('invite.invite')} <FaShareNodes />
                </Link>
              )}
              <button
                onClick={() =>
                  copyToClipboard(referralsData?.inviteBotUrl || '')
                }
                className={
                  'bg-[var(--primary)] flex items-center justify-center h-8 w-8 text-[var(--on-primary)] font-medium text-sm rounded-md transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer'
                }>
                <FaCopy />
              </button>
            </div>
          </div>
          <div className={'flex flex-row justify-between py-2'}>
            <div className={'opacity-50 flex flex-row gap-2 items-center'}>
              {t('invite.inTMA')}
            </div>
            <div className={'flex flex-row gap-2 items-center '}>
              {referralsData && (
                <Link
                  href={referralsData.inviteTmaTgDeeplink}
                  className={
                    'flex flex-row gap-1 h-8 items-center bg-[var(--primary)] text-[var(--on-primary)] font-medium text-sm px-2 rounded-md transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer'
                  }>
                  {t('invite.invite')} <FaShareNodes />
                </Link>
              )}
              <button
                onClick={() =>
                  copyToClipboard(referralsData?.inviteTmaUrl || '')
                }
                className={
                  'bg-[var(--primary)] flex items-center justify-center h-8 w-8 text-[var(--on-primary)] font-medium text-sm rounded-md transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer'
                }>
                <FaCopy />
              </button>
            </div>
          </div>
          <div className={'flex flex-row justify-between py-2'}>
            <div className={'opacity-50 flex flex-row gap-2 items-center'}>
              {t('invite.inWebApp')}
            </div>
            <div className={'flex flex-row gap-2 items-center '}>
              {referralsData && (
                <Link
                  href={referralsData.inviteAppTgDeeplink}
                  className={
                    'flex flex-row gap-1 h-8 items-center bg-[var(--primary)] text-[var(--on-primary)] font-medium text-sm px-2 rounded-md transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer'
                  }>
                  {t('invite.invite')} <FaShareNodes />
                </Link>
              )}
              <button
                onClick={() =>
                  copyToClipboard(referralsData?.inviteAppUrl || '')
                }
                className={
                  'bg-[var(--primary)] flex items-center justify-center h-8 w-8 text-[var(--on-primary)] font-medium text-sm rounded-md transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer'
                }>
                <FaCopy />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
