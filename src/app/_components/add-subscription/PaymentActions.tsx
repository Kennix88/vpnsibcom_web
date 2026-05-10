'use client'

import { CurrencyEnum } from '@app/enums/currency.enum'
import { PaymentMethodEnum } from '@app/enums/payment-method.enum'
import { useCurrencyStore } from '@app/store/currency.store'
import { UserDataInterface } from '@app/types/user-data.interface'
import { roundUp } from '@app/utils/calculate-subscription-cost.util'
import { fxUtil } from '@app/utils/fx.util'
import { useTranslations } from 'next-intl'
import { FaCircleInfo } from 'react-icons/fa6'
import Currency from '../Currency'
import Split from '../payments/Split'

// Компонент: Кнопки оплаты
export const PaymentActions = ({
  isAllBaseServers,
  isAllPremiumServers,
  serversSelected,
  balance,
  price,
  isLoading,
  onPayment,
  usdtBalance,
  tgStarsToUSD,
  user,
  pendingMethod = null,
}: {
  isAllBaseServers: boolean
  isAllPremiumServers: boolean
  serversSelected: string[]
  balance: number
  price: number
  priceNoDiscount: number
  isLoading: boolean
  usdtBalance: number
  user: UserDataInterface
  tgStarsToUSD: number
  onPayment: (method: PaymentMethodEnum | 'BALANCE' | 'USDT') => Promise<void>
  pendingMethod?: PaymentMethodEnum | 'BALANCE' | 'USDT' | null
}) => {
  const { rates } = useCurrencyStore()
  const t = useTranslations('billing.subscription')
  const hasSelectedServers =
    isAllBaseServers || isAllPremiumServers || serversSelected.length > 0

  const isPending = Boolean(isLoading)

  return (
    <div className="flex flex-col gap-2 w-full">
      {!hasSelectedServers ? (
        <div className="bg-[var(--warning-container)] text-[var(--on-warning-container)] rounded-md flex flex-col gap-2 py-2 px-4 w-full max-w-[400px]">
          <div className="flex flex-row gap-2 items-center text-xs">
            <FaCircleInfo />
            {t('selectServer')}
          </div>
        </div>
      ) : (
        <>
          <div className="px-4 opacity-50 flex flex-wrap items-center gap-2 font-mono">
            {t('pay')}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                onPayment('BALANCE')
              }}
              disabled={isPending || price > balance}
              className={`py-2 px-4 rounded-md bg-[var(--star-container-rgba)]  transition-all duration-200 hover:brightness-110 active:scale-[0.97] ${
                isPending || price > balance
                  ? 'opacity-50 cursor-not-allowed'
                  : ' cursor-pointer'
              } flex gap-2 items-center justify-center font-bold font-mono text-sm grow`}>
              {pendingMethod === 'BALANCE' && isPending ? (
                'Processing...'
              ) : price <= 0 ? (
                t('addFree')
              ) : (
                <>
                  <Currency type={'star'} w={18} />
                  <div>{price}</div>
                </>
              )}
            </button>
            <button
              onClick={() => {
                onPayment(PaymentMethodEnum.STARS)
              }}
              disabled={isPending || price <= 0 || price < user.minPayStars}
              className={`py-2 px-4 rounded-md bg-[var(--star-container-rgba)]  transition-all duration-200 hover:brightness-110 active:scale-[0.97] ${
                isPending || price <= 0 || price < user.minPayStars
                  ? 'opacity-50 cursor-not-allowed'
                  : ' cursor-pointer'
              } flex gap-2 items-center justify-center font-bold font-mono text-sm grow`}>
              {pendingMethod === PaymentMethodEnum.STARS && isPending ? (
                'Processing...'
              ) : (
                <>
                  <Currency type={'tg-star'} w={18} />
                  <div>{price}</div>
                </>
              )}
            </button>
            {rates && (
              <button
                onClick={() => {
                  onPayment(PaymentMethodEnum.TON_TON)
                }}
                disabled={isPending || price <= 0 || price < user.minPayStars}
                className={`py-2 px-4 rounded-md bg-[var(--ton-container-rgba)]  transition-all duration-200 hover:brightness-110 active:scale-[0.97] ${
                  isPending || price <= 0 || price < user.minPayStars
                    ? 'opacity-50 cursor-not-allowed'
                    : ' cursor-pointer'
                } flex gap-2 items-center justify-center font-bold font-mono text-sm grow`}>
                {pendingMethod === PaymentMethodEnum.TON_TON && isPending ? (
                  'Processing...'
                ) : (
                  <>
                    <Currency type={'ton'} w={18} />
                    <div>
                      {roundUp(
                        fxUtil(price, CurrencyEnum.XTR, CurrencyEnum.TON, rates),
                      )}
                    </div>
                  </>
                )}
              </button>
            )}
            <button
              onClick={() => {
                onPayment('USDT')
              }}
              disabled={
                isPending ||
                roundUp(price * tgStarsToUSD) > usdtBalance ||
                price <= 0
              }
              className={`py-2 px-4 rounded-md bg-[var(--usdt-container-rgba)]  transition-all duration-200 hover:brightness-110 active:scale-[0.97] ${
                isPending ||
                roundUp(price * tgStarsToUSD) > usdtBalance ||
                price <= 0
                  ? 'opacity-50 cursor-not-allowed'
                  : ' cursor-pointer'
              } flex gap-2 items-center justify-center font-bold font-mono text-sm grow`}>
              {pendingMethod === 'USDT' && isPending ? (
                'Processing...'
              ) : (
                <>
                  <Currency type={'usdt'} w={18} />
                  {price <= 0 ? 0 : roundUp(price * tgStarsToUSD)}
                </>
              )}
            </button>
          </div>
        </>
      )}

      <br />
      <Split />
    </div>
  )
}
