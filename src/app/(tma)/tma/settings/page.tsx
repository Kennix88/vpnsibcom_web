'use client'
import { TmaPage } from '@app/app/(tma)/_components/TmaPage'
import Avatar from '@app/app/_components/Avatar'
import Balance from '@app/app/_components/Balance'
import CurrencySwitcher from '@app/app/_components/CurrencySwitcher'
import LanguageSwitcher from '@app/app/_components/LanguageSwitcher'
import TgStar from '@app/app/_components/TgStar'
import { TonWalletConnect } from '@app/app/_components/ton/TonWalletConnect'
import { TonWalletManager } from '@app/app/_components/ton/TonWalletManager'
import WithdrawalSwitch from '@app/app/_components/WithdrawalSwitch'
import { authApiClient } from '@app/core/authApiClient'
import { useSlicedAddress } from '@app/hooks/useSlicedAddress'
import { useUserStore } from '@app/store/user.store'
import { useCopyToClipboard } from '@app/utils/copy-to-clipboard.util'
import limitLengthString from '@app/utils/limit-length-string.util'
import { Address } from '@ton/ton'
import { useTonWallet } from '@tonconnect/ui-react'
import { useEffect } from 'react'
import { FaCopy } from 'react-icons/fa6'
import { useTranslations } from 'use-intl'

export default function Page() {
  const { user, setUser } = useUserStore()
  const copyToClipboard = useCopyToClipboard()
  const wallet = useTonWallet()
  const t = useTranslations('user')
  const address = useSlicedAddress(wallet?.account.address)
  const fullAddress = wallet?.account.address
    ? Address.parseRaw(wallet?.account.address || '').toString({
        testOnly: false,
        bounceable: false,
      })
    : null

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
  }, [setUser])

  return (
    <TmaPage back={true}>
      <div className="flex flex-col gap-4 items-center">
        <div className={'flex flex-row gap-2 items-center w-full'}>
          <Avatar w={40} url={user?.photoUrl} />
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
            'flex flex-col text-sm divide-y divide-[var(--on-background)]/80 max-w-[400px] py-2 px-4 rounded-md bg-[var(--surface-container-lowest)] w-full'
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
          {user?.roleDiscount &&
            (user && 100 - 100 * user.roleDiscount) > 0 && (
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
              {address && fullAddress ? (
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
          <div
            className={
              'flex flex-row flex-wrap items-center justify-between gap-2 py-2'
            }>
            <div
              className={
                'font-medium text-[var(--on-background)]/80 font-mono flex flex-row gap-1 items-center flex-wrap'
              }>
              {t('usage')} <TgStar w={15} type={'purple'} /> {t('inPayments')}:
            </div>
            <div
              className={
                'text-sm font-bold font-mono text-[var(--on-primary-container)] flex flex-row gap-2 transition-all duration-200 hover:brightness-110 active:scale-[0.97]'
              }>
              <WithdrawalSwitch size={0.75} />
            </div>
          </div>
        </div>
        <div className={'flex flex-row gap-2 flex-wrap justify-center'}>
          <LanguageSwitcher />
          <CurrencySwitcher />
        </div>
      </div>
    </TmaPage>
  )
}
