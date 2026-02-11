'use client'

import { CurrencyEnum } from '@app/enums/currency.enum'
import { PaymentMethodEnum } from '@app/enums/payment-method.enum'
import { useCurrencyStore } from '@app/store/currency.store'
import { PlansInterface } from '@app/types/plans.interface'
import { UserDataInterface } from '@app/types/user-data.interface'
import { roundUp, starsToAD } from '@app/utils/calculate-subscription-cost.util'
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
  adPriceStars,
  isLoading,
  onPayment,
  trafficBalance,
  trafficLimitGb,
  planSelected,
  user,
}: {
  planSelected: PlansInterface
  isAllBaseServers: boolean
  isAllPremiumServers: boolean
  serversSelected: string[]
  balance: number
  price: number
  priceNoDiscount: number
  isLoading: boolean
  trafficLimitGb: number
  trafficBalance: number
  user: UserDataInterface
  adPriceStars: number
  onPayment: (
    method: PaymentMethodEnum | 'BALANCE' | 'TRAFFIC' | 'AD',
  ) => Promise<void>
}) => {
  const { rates } = useCurrencyStore()
  const t = useTranslations('billing.subscription')
  const hasSelectedServers =
    isAllBaseServers || isAllPremiumServers || serversSelected.length > 0

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
              disabled={isLoading || price > balance}
              className={`py-2 px-4 rounded-md bg-[var(--star-container-rgba)]  transition-all duration-200 hover:brightness-110 active:scale-[0.97] ${
                price > balance
                  ? 'opacity-50 cursor-not-allowed'
                  : ' cursor-pointer'
              } flex gap-2 items-center justify-center font-bold font-mono text-sm grow`}>
              {price <= 0 ? (
                t('addFree')
              ) : (
                <>
                  <Currency type={'star'} w={18} />
                  <div>
                    {price}
                    {/* {price !== priceNoDiscount && (
                      <span className="opacity-70 text-[12px] line-through">
                        ({priceNoDiscount})
                      </span>
                    )} */}
                  </div>
                </>
              )}
            </button>
            <button
              onClick={() => {
                onPayment(PaymentMethodEnum.STARS)
              }}
              disabled={isLoading || price <= 0 || price < user.minPayStars}
              className={`py-2 px-4 rounded-md bg-[var(--star-container-rgba)]  transition-all duration-200 hover:brightness-110 active:scale-[0.97] ${
                isLoading || price <= 0 || price < user.minPayStars
                  ? 'opacity-50 cursor-not-allowed'
                  : ' cursor-pointer'
              } flex gap-2 items-center justify-center font-bold font-mono text-sm grow`}>
              <Currency type={'tg-star'} w={18} />
              <div>
                {price}
                {/* {price !== priceNoDiscount && (
                  <span className="opacity-70 text-[12px] line-through">
                    ({priceNoDiscount})
                  </span>
                )} */}
              </div>
            </button>
            {rates && (
              <button
                onClick={() => {
                  onPayment(PaymentMethodEnum.TON_TON)
                }}
                disabled={isLoading || price <= 0 || price < user.minPayStars}
                className={`py-2 px-4 rounded-md bg-[var(--ton-container-rgba)]  transition-all duration-200 hover:brightness-110 active:scale-[0.97] ${
                  isLoading || price <= 0 || price < user.minPayStars
                    ? 'opacity-50 cursor-not-allowed'
                    : ' cursor-pointer'
                } flex gap-2 items-center justify-center font-bold font-mono text-sm grow`}>
                <Currency type={'ton'} w={18} />
                <div>
                  {roundUp(
                    fxUtil(price, CurrencyEnum.XTR, CurrencyEnum.TON, rates),
                  )}
                  {/* {price !== priceNoDiscount && (
                    <span className="opacity-70 text-[12px] line-through">
                      (
                      {roundUp(
                        fxUtil(
                          priceNoDiscount,
                          CurrencyEnum.XTR,
                          CurrencyEnum.TON,
                          rates,
                        ),
                      )}
                      )
                    </span>
                  )} */}
                </div>
              </button>
            )}
            {planSelected.key == 'TRAFFIC' && (
              <button
                onClick={() => {
                  onPayment('TRAFFIC')
                }}
                disabled={
                  isLoading ||
                  trafficLimitGb * 1024 > trafficBalance ||
                  price <= 0
                }
                className={`py-2 px-4 rounded-md bg-[var(--traffic-container-rgba)]  transition-all duration-200 hover:brightness-110 active:scale-[0.97] ${
                  isLoading ||
                  trafficLimitGb * 1024 > trafficBalance ||
                  price <= 0
                    ? 'opacity-50 cursor-not-allowed'
                    : ' cursor-pointer'
                } flex gap-2 items-center justify-center font-bold font-mono text-sm grow`}>
                <Currency type={'traffic'} w={18} />
                {price <= 0 ? 0 : trafficLimitGb * 1024}
              </button>
            )}
            <button
              onClick={() => {
                onPayment('AD')
              }}
              disabled={
                isLoading || starsToAD(price, adPriceStars) > user.balance.ad
              }
              className={`py-2 px-4 rounded-md bg-[var(--ad-container-rgba)]  transition-all duration-200 hover:brightness-110 active:scale-[0.97] ${
                isLoading || starsToAD(price, adPriceStars) > user.balance.ad
                  ? 'opacity-50 cursor-not-allowed'
                  : ' cursor-pointer'
              } flex gap-2 items-center justify-center font-bold font-mono text-sm grow`}>
              {price <= 0 ? (
                t('addFree')
              ) : (
                <>
                  <Currency type={'ad'} w={18} />
                  {starsToAD(price, adPriceStars)}
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
