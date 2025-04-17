'use client'
import { TmaPage } from '@app/app/(tma)/_components/TmaPage'
import Avatar from '@app/app/_components/Avatar'
import Balance from '@app/app/_components/Balance'
import LanguageSwitcher from '@app/app/_components/LanguageSwitcher'
import { TonWalletConnect } from '@app/app/_components/TonWalletConnect'
import { TonWalletManager } from '@app/app/_components/TonWalletManager'
import { authApiClient } from '@app/core/apiClient'
import { useSlicedAddress } from '@app/hooks/useSlicedAddress'
import { useUserStore } from '@app/store/user.store'
import { copyToClipboard } from '@app/utils/copy-to-clipboard.util'
import limitLengthString from '@app/utils/limit-length-string.util'
import { Address } from '@ton/ton'
import { useEffect } from 'react'
import { FaCopy } from 'react-icons/fa6'
import { useTranslations } from 'use-intl'

export default function Page() {
  const { user, setUser } = useUserStore()
  const t = useTranslations('user')
  const address = useSlicedAddress(user?.tonWallet)
  const fullAddress = Address.parseRaw(user?.tonWallet || '').toString({
    testOnly: false,
    bounceable: false,
  })

  useEffect(() => {
    const updateUser = async () => {
      try {
        const user = await authApiClient.getMe()
        setUser(user)
      } catch {
        return
      }
    }
    updateUser()
  }, [])

  return (
    <TmaPage back={true}>
      <div className="flex flex-col gap-4 items-center">
        <div className={'flex flex-row gap-2 items-center w-full'}>
          <Avatar w={40} />
          <div className={'flex flex-col'}>
            <div className="font-bold text-md font-mono">
              {user && limitLengthString(user.fullName)}
            </div>
            <div className="font-bold text-xs text-[var(--on-background)]/80 font-mono">
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
            'flex flex-col text-sm divide-y divide-[var(--secondary)] max-w-[400px] py-2 px-4 rounded-md bg-[var(--surface-container-lowest)] w-full'
          }>
          <div
            className={
              'flex flex-row flex-wrap items-center justify-between gap-2 py-2'
            }>
            <div
              className={
                'font-medium text-[var(--on-background)]/80 font-mono'
              }>
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
            <div
              className={
                'font-medium text-[var(--on-background)]/80 font-mono'
              }>
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
          <div
            className={
              'flex flex-row flex-wrap items-center justify-between gap-2 py-2'
            }>
            <div
              className={
                'font-medium text-[var(--on-background)]/80 font-mono'
              }>
              {t('role')}:
            </div>
            <div
              className={
                'text-sm font-bold font-mono text-[var(--on-primary-container)] flex flex-row gap-2 transition-all duration-200 hover:brightness-110 active:scale-[0.97]'
              }>
              {user && user.roleName.toUpperCase()}
            </div>
          </div>
          {user?.roleDiscount && user?.roleDiscount > 0 && (
            <div
              className={
                'flex flex-row flex-wrap items-center justify-between gap-2 py-2'
              }>
              <div
                className={
                  'font-medium text-[var(--on-background)]/80 font-mono'
                }>
                {t('discount')}:
              </div>
              <div
                className={
                  'text-sm font-bold font-mono text-[var(--on-primary-container)] flex flex-row gap-2 transition-all duration-200 hover:brightness-110 active:scale-[0.97]'
                }>
                {user && 100 - 100 * user.roleDiscount}%
              </div>
            </div>
          )}

          <div className={'flex flex-col gap-2 py-2'}>
            <div
              className={
                'flex flex-row flex-wrap items-center justify-between gap-2 py-2'
              }>
              <div
                className={
                  'font-medium text-[var(--on-background)]/80 font-mono'
                }>
                {t('wallet')}:
              </div>
              {address ? (
                <div
                  onClick={() => copyToClipboard(fullAddress)}
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
        <LanguageSwitcher />
      </div>
    </TmaPage>
  )
}
