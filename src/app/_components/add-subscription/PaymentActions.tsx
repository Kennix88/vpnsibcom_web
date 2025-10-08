'use client'

import { CurrencyEnum } from '@app/enums/currency.enum'
import { PaymentMethodEnum } from '@app/enums/payment-method.enum'
import { useCurrencyStore } from '@app/store/currency.store'
import { roundUp } from '@app/utils/calculate-subscription-cost.util'
import { fxUtil } from '@app/utils/fx.util'
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
}: {
  isAllBaseServers: boolean
  isAllPremiumServers: boolean
  serversSelected: string[]
  balance: number
  price: number
  isLoading: boolean
  onPayment: (method: PaymentMethodEnum | 'BALANCE') => Promise<void>
}) => {
  const { rates } = useCurrencyStore()
  const hasSelectedServers =
    isAllBaseServers || isAllPremiumServers || serversSelected.length > 0

  return (
    <div className="flex flex-col gap-2 w-full">
      {!hasSelectedServers ? (
        <div className="bg-[var(--warning-container)] text-[var(--on-warning-container)] rounded-md flex flex-col gap-2 py-2 px-4 w-full max-w-[400px]">
          <div className="flex flex-row gap-2 items-center text-xs">
            <FaCircleInfo />
            Выберите сервер!
          </div>
        </div>
      ) : (
        <>
          <div className="px-4 opacity-50 flex flex-wrap items-center gap-2 font-mono">
            Оплатить
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                onPayment('BALANCE')
              }}
              disabled={isLoading || price > balance}
              className={`py-2 px-4 rounded-md bg-[var(--star-container-rgba)]  transition-all duration-200 hover:brightness-110 active:scale-[0.97] ${
                price > balance
                  ? 'opacity-50 cursor-not-allowed'
                  : ' cursor-pointer'
              } flex gap-2 items-center justify-center font-bold font-mono text-sm grow`}>
              <Currency type={'star'} w={18} />
              {price}
            </button>
            <button
              onClick={() => {
                onPayment(PaymentMethodEnum.STARS)
              }}
              disabled={isLoading || price <= 0}
              className={`py-2 px-4 rounded-md bg-[var(--star-container-rgba)]  transition-all duration-200 hover:brightness-110 active:scale-[0.97] ${
                isLoading || price <= 0
                  ? 'opacity-50 cursor-not-allowed'
                  : ' cursor-pointer'
              } flex gap-2 items-center justify-center font-bold font-mono text-sm grow`}>
              <Currency type={'tg-star'} w={18} />
              {price}
            </button>
            {rates && (
              <button
                onClick={() => {
                  onPayment(PaymentMethodEnum.TON_TON)
                }}
                disabled={isLoading || price <= 0}
                className={`py-2 px-4 rounded-md bg-[var(--ton-container-rgba)]  transition-all duration-200 hover:brightness-110 active:scale-[0.97] ${
                  isLoading || price <= 0
                    ? 'opacity-50 cursor-not-allowed'
                    : ' cursor-pointer'
                } flex gap-2 items-center justify-center font-bold font-mono text-sm grow`}>
                <Currency type={'ton'} w={18} />
                {roundUp(
                  fxUtil(price, CurrencyEnum.XTR, CurrencyEnum.TON, rates),
                )}
              </button>
            )}
          </div>
        </>
      )}

      <br />
      <Split />
    </div>
  )
}
