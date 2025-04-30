'use client'

import TgStar from '@app/app/_components/TgStar'
import { authApiClient } from '@app/core/authApiClient'
import { CurrencyEnum } from '@app/enums/currency.enum'
import { CurrencyInterface } from '@app/types/currency.interface'
import { PaymentMethodsDataInterface } from '@app/types/payment-methods-data.interface'
import { RatesInterface } from '@app/types/rates.interface'
import { UserDataInterface } from '@app/types/user-data.interface'
import { fxUtil } from '@app/utils/fx.util'
import { invoice } from '@telegram-apps/sdk-react'
import clsx from 'clsx'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'react-toastify'
import { useTranslations } from 'use-intl'

type Props = {
  method: PaymentMethodsDataInterface
  currencies: CurrencyInterface[]
  amount: number
  rates: RatesInterface
  setUser: (user: UserDataInterface) => void
  isTma: boolean
}

export default function PaymentInvoiceButton({
  method,
  currencies,
  amount,
  rates,
  setUser,
  isTma,
}: Props) {
  const t = useTranslations('billing.payment')
  const location = usePathname()
  const url = location === '/app' ? '/app' : '/tma'
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  if (amount < 0) return null

  const currency = currencies.find((c) => c.key === method.currency.key)
  if (!currency) return null
  const convertedAmount = fxUtil(
    amount,
    CurrencyEnum.XTR,
    method.currency.key,
    rates,
  )
  const disabled =
    convertedAmount < method.minAmount || convertedAmount > method.maxAmount

  if (disabled) return null

  const handleClick = async () => {
    setIsLoading(true)
    try {
      const getInvs = await authApiClient.createInvoice({
        method: method.key,
        amount,
      })
      setUser(getInvs.user)
      if (getInvs.isTmaIvoice && isTma) {
        await invoice.open(getInvs.linkPay, 'url')
      } else {
        window.open(getInvs.linkPay, '_blank')
      }
    } catch {
      toast.error('Failed create invoice')
    } finally {
      setIsLoading(false)
      router.push(url)
    }
  }

  return (
    <div
      className={
        'fixed z-50 left-4 right-4 bottom-4 rounded-md flex flex-row flex-wrap items-center justify-center p-4 bg-[var(--surface-container)] font-mono gap-4'
      }>
      <div
        className={
          'text-xs flex flex-col gap-2 items-center w-full max-w-[400px]'
        }>
        {method.commission * 100 - 100 > 0 && (
          <div className={'flex flex-row gap-2 items-center justify-between'}>
            <div className={'opacity-50'}>{t('commission')}:</div>
            <div className={'flex flex-row gap-2 items-center'}>
              {(method.commission * 100 - 100).toFixed(2)}%{' '}
              {currency?.key == CurrencyEnum.XTR ? (
                <TgStar type={'gold'} w={15} />
              ) : currency?.key !== currency?.symbol ? (
                `${currency?.key}-${currency?.symbol}`
              ) : (
                `${currency?.symbol}`
              )}
            </div>
          </div>
        )}

        <div className={'flex flex-row gap-2 items-center justify-between'}>
          <div className={'opacity-50'}>{t('toBalance')}:</div>
          <div className={'flex flex-row gap-2 items-center'}>
            {amount.toFixed(2)}
            <TgStar type={'gold'} w={15} />
          </div>
        </div>
      </div>
      <button
        onClick={() => handleClick()}
        disabled={isLoading}
        className={clsx(
          'flex flex-row gap-2 items-center justify-center bg-[var(--primary)] text-[var(--on-primary)] font-medium text-sm px-4 py-2 rounded-md w-full transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer max-w-[400px]',
          isLoading && 'opacity-50 pointer-events-none',
        )}>
        {isLoading && (
          <div
            className={'loader'}
            style={{ width: '15px', height: '15px', borderWidth: '2px' }}></div>
        )}
        {t('pay')} ≈ {convertedAmount.toFixed(2)}{' '}
        {currency?.key == CurrencyEnum.XTR ? (
          <TgStar type={'gold'} w={15} />
        ) : currency?.key !== currency?.symbol ? (
          `${currency?.key}-${currency?.symbol}`
        ) : (
          `${currency?.symbol}`
        )}
      </button>
    </div>
  )
}
