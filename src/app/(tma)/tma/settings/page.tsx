'use client'
import { TmaPage } from '@app/app/(tma)/_components/TmaPage'
import Avatar from '@app/app/_components/Avatar'
import Balance from '@app/app/_components/Balance'
import { TonWalletConnect } from '@app/app/_components/TonWalletConnect'
import { TonWalletManager } from '@app/app/_components/TonWalletManager'
import { useSlicedAddress } from '@app/hooks/useSlicedAddress'
import { useUserStore } from '@app/store/user.store'
import { copyToClipboard } from '@app/utils/copy-to-clipboard.util'
import limitLengthString from '@app/utils/limit-length-string.util'
import { FaCopy } from 'react-icons/fa6'

export default function Page() {
  const { user } = useUserStore()
  const address = useSlicedAddress(user?.tonWallet)

  return (
    <TmaPage back={true}>
      <div className="flex flex-col gap-4 ">
        <div className={'flex flex-row gap-2 items-center'}>
          <Avatar w={40} />
          <div className={'flex flex-col'}>
            <div className="font-bold text-md">
              {user && limitLengthString(user.fullName)}
            </div>
            <div className="font-bold text-xs text-[var(--on-background)]/80">
              @{user && user.username ? user.username : 'Anonymous'}
            </div>
          </div>
        </div>
        <div className={'flex flex-row gap-2 items-center justify-center'}>
          <Balance type={'payment'} />
          <Balance type={'withdraw'} />
          <Balance type={'hold'} />
        </div>
        <div
          className={
            'flex flex-col text-sm divide-y divide-[var(--secondary)]'
          }>
          <div
            className={
              'flex flex-row flex-wrap items-center justify-between gap-2 py-2'
            }>
            <div className={'font-medium text-[var(--on-background)]/80'}>
              Telegram ID:
            </div>
            <div
              onClick={() => copyToClipboard(user?.telegramId || '')}
              className={
                'text-sm font-bold font-mono text-[var(--on-primary-container)] flex flex-row gap-2  cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.97]'
              }>
              {user && user.telegramId} <FaCopy />
            </div>
          </div>
          <div
            className={
              'flex flex-row flex-wrap items-center justify-between gap-2 py-2'
            }>
            <div className={'font-medium text-[var(--on-background)]/80'}>
              User ID:
            </div>
            <div
              onClick={() => copyToClipboard(user?.id || '')}
              className={
                'text-sm font-bold font-mono text-[var(--on-primary-container)] flex flex-row gap-2 cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.97]'
              }>
              {user && limitLengthString(user.id)} <FaCopy />
            </div>
          </div>
          <div className={'flex flex-col gap-2 py-2'}>
            <div
              className={
                'flex flex-row flex-wrap items-center justify-between gap-2 py-2'
              }>
              <div className={'font-medium text-[var(--on-background)]/80'}>
                Wallet:
              </div>
              {address ? (
                <div
                  onClick={() => copyToClipboard(address)}
                  className="text-sm font-bold font-mono text-[var(--on-primary-container)] text-center flex flex-row gap-2 cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.97]">
                  {address} <FaCopy />
                </div>
              ) : (
                <TonWalletConnect />
              )}
            </div>
            <TonWalletManager />
          </div>
        </div>
      </div>
    </TmaPage>
  )
}
