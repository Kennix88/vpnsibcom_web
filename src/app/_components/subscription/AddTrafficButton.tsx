'use client'

import { authApiClient } from '@app/core/authApiClient'
import { CurrencyEnum } from '@app/enums/currency.enum'
import { PaymentMethodEnum } from '@app/enums/payment-method.enum'
import { SubscriptionPeriodEnum } from '@app/enums/subscription-period.enum'
import { useCurrencyStore } from '@app/store/currency.store'
import { useSubscriptionsStore } from '@app/store/subscriptions.store'
import { useUserStore } from '@app/store/user.store'
import { SubscriptionDataInterface } from '@app/types/subscription-data.interface'
import {
  calculateSubscriptionCost,
  calculateSubscriptionCostNoDiscount,
  roundUp,
} from '@app/utils/calculate-subscription-cost.util'
import { fxUtil } from '@app/utils/fx.util'
import { invoice } from '@telegram-apps/sdk-react'
import { beginCell, toNano } from '@ton/core'
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { FaPlus } from 'react-icons/fa6'
import { toast } from 'react-toastify'
import Currency from '../Currency'
import Modal from '../Modal'
import { TRAFFIC_GBS } from '../add-subscription/constants'
import { getTrafficCountButtonColor } from '../add-subscription/functions'

export default function AddTrafficButton({
  subscription,
}: {
  subscription: SubscriptionDataInterface
}) {
  const { rates } = useCurrencyStore()
  const { subscriptions, setSubscriptions } = useSubscriptionsStore()
  const { user, setUser } = useUserStore()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isOpenModal, setIsOpenModal] = useState<boolean>(false)
  const [trafficLimitGb, setTrafficLimitGb] = useState(1)
  const wallet = useTonWallet()
  const [tonConnectUI] = useTonConnectUI()
  const t = useTranslations('billing.subscription')
  
  // Проверяем валидность подписки
  const isValidSubscription = 
    (subscription.period === SubscriptionPeriodEnum.TRIAL ||
     subscription.period === SubscriptionPeriodEnum.TRAFFIC) &&
    user &&
    subscriptions
  
  // Определяем все переменные и хуки до любых условных возвратов
  // Используем дефолтные значения для случая, когда isValidSubscription = false
  const balance = user?.balance?.payment || 0
  const trafficBalance = user?.balance?.traffic || 0
  
  // Вычисляем цены только если подписка валидна
  const price = isValidSubscription ? calculateSubscriptionCost({
    period: subscription.period,
    periodMultiplier: subscription.periodMultiplier,
    isPremium: user.isPremium,
    isTgProgramPartner: user.isTgProgramPartner,
    devicesCount: subscription.devicesCount,
    serversCount: subscription.baseServersCount,
    premiumServersCount: subscription.premiumServersCount,
    trafficLimitGb: trafficLimitGb,
    isAllBaseServers: subscription.isAllBaseServers,
    isAllPremiumServers: subscription.isAllPremiumServers,
    isUnlimitTraffic: false,
    userDiscount: user.roleDiscount,
    plan: subscription.plan,
    settings: subscriptions,
  }) : 0

  const priceNoDiscount = isValidSubscription ? calculateSubscriptionCostNoDiscount({
    period: subscription.period,
    periodMultiplier: subscription.periodMultiplier,
    isPremium: user.isPremium,
    isTgProgramPartner: user.isTgProgramPartner,
    devicesCount: subscription.devicesCount,
    serversCount: subscription.baseServersCount,
    premiumServersCount: subscription.premiumServersCount,
    trafficLimitGb: trafficLimitGb,
    isAllBaseServers: subscription.isAllBaseServers,
    isAllPremiumServers: subscription.isAllPremiumServers,
    isUnlimitTraffic: false,
    plan: subscription.plan,
    settings: subscriptions,
  }) : 0
  
  const getFinalPercent = (ratio: number) => 100 - ratio * 100

  // Используем useMemo безусловно, до любых условных возвратов
  const summaryItems = useMemo(
    () => isValidSubscription ? [
      {
        name: t('summary.traffic'),
        value: <div>{`${trafficLimitGb} GB`}</div>,
        isVisible: true,
      },
      {
        name: t('summary.roleDiscount'),
        value: <div>{getFinalPercent(user.roleDiscount)}%</div>,
        isVisible: getFinalPercent(user.roleDiscount) > 0,
      },
      {
        name: t('summary.toPaid'),
        value: (
          <div className="flex gap-2 items-center">
            <Currency type="star" w={14} />
            <div>
              {price}
              {price !== priceNoDiscount && (
                <span className="opacity-70 text-[12px] line-through">
                  ({priceNoDiscount})
                </span>
              )}
            </div>
          </div>
        ),
        isVisible: true,
      },
    ] : [],
    [trafficLimitGb, user, price, priceNoDiscount, t, isValidSubscription],
  )
  
  // Если подписка невалидна, возвращаем null
  if (!isValidSubscription) return null

  const addTraffic = async (
    subscription: SubscriptionDataInterface,
    trafficLimitGb: number,
    method: PaymentMethodEnum | 'BALANCE' | 'TRAFFIC',
  ) => {
    try {
      if (method === PaymentMethodEnum.TON_TON && !wallet?.account?.address) {
        try {
          await tonConnectUI.openModal()
        } catch {
          toast.error('Error when opening a wallet')
        }
        return
      }
      setIsLoading(true)
      const data = await authApiClient.addTrafficSubscription(
        subscription.id,
        trafficLimitGb,
        method,
      )

      if (!data.invoice) {
        setUser(data.user)
        setSubscriptions(data.subscriptions)
        toast.success('Traffic added successfully')
      } else {
        if (data.invoice?.isTonPayment) {
          const amountNano = toNano(data.invoice?.amountTon.toString())

          // payload с ID платежа в виде комментария
          const payload = beginCell()
            .storeUint(0, 32) // opcode text_comment
            .storeStringTail(data.invoice?.token || '')
            .endCell()

          // транзакция
          const tx = {
            validUntil: Math.floor(Date.now() / 1000) + 300, // 5 минут
            messages: [
              {
                address: data.invoice?.linkPay || '',
                amount: amountNano.toString(),
                payload: payload.toBoc().toString('base64'),
              },
            ],
          }

          try {
            await tonConnectUI.sendTransaction(tx)
          } catch (err) {
            console.error('Ошибка при оплате', err)
          }
        } else {
          await invoice.open(data.invoice?.linkPay || '', 'url')
        }
      }
    } catch {
      toast.error('Error adding traffic')
    } finally {
      setIsOpenModal(false)
      setIsLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => {
          setIsOpenModal(true)
        }}
        disabled={isLoading}
        className={`grow p-2 rounded-md bg-[var(--secondary-container)] text-[var(--on-secondary-container)] transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer flex gap-2 items-center `}>
        <FaPlus size={18} />
        {t('addTraffic')}
      </button>

      <Modal
        isOpen={isOpenModal}
        onClose={() => setIsOpenModal(false)}
        title={t('addingTraffic')}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 items-center font-extralight font-mono w-full">
            <div className="flex gap-2 items-end justify-between w-full px-4 ">
              <div className="opacity-50 flex flex-row gap-2 items-center">
                {t('traffic')}
              </div>
              <div className="flex gap-2 items-center ">
                <Currency type="star" w={18} />
                {price}
              </div>
            </div>

            <motion.div
              layout
              className="text-sm bg-[var(--surface-container-lowest)] rounded-xl flex flex-row flex-wrap gap-2 items-center p-4 w-full shadow-md">
              <button
                onClick={() => {
                  setTrafficLimitGb(Math.max(1, trafficLimitGb - 1))
                }}
                className="flex grow items-center justify-center text-white px-3 py-1.5 rounded-md cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.97] "
                style={{ backgroundColor: 'rgba(216, 197, 255, 0.15)' }}>
                -
              </button>
              <input
                type="number"
                value={trafficLimitGb}
                onChange={(e) => {
                  setTrafficLimitGb(Math.max(1, parseInt(e.target.value) || 1))
                }}
                className="border max-w-[100px] border-[var(--on-surface)]/50 rounded-md px-2 py-1 bg-transparent focus:border-[var(--primary)] focus:outline-none"
              />
              <button
                onClick={() => {
                  setTrafficLimitGb(trafficLimitGb + 1)
                }}
                className="flex grow items-center justify-center text-white px-3 py-1.5 rounded-md cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.97] "
                style={{ backgroundColor: 'rgba(216, 197, 255, 0.15)' }}>
                +
              </button>

              {TRAFFIC_GBS.map((val) => {
                const isActive = trafficLimitGb === val
                const rgb = getTrafficCountButtonColor(val)
                const bgOpacity = isActive ? 0.3 : 0.15
                return (
                  <motion.button
                    key={val}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setTrafficLimitGb(val)
                    }}
                    className="flex flex-row gap-2 grow items-center justify-center text-white px-3 py-1.5 rounded-md text-sm font-mono cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.97]"
                    style={{
                      backgroundColor: `rgba(${rgb}, ${bgOpacity})`,
                      border: isActive
                        ? `1px solid rgba(${rgb}, 0.7)`
                        : '1px solid transparent',
                    }}>
                    {val}
                  </motion.button>
                )
              })}
            </motion.div>
          </div>

          <div className="flex flex-col gap-2 items-center font-extralight font-mono w-full">
            <div className="px-4 opacity-50 flex flex-row gap-2 items-center w-full">
              {t('summary.title')}
            </div>

            <motion.div
              layout
              className="text-sm bg-[var(--surface-container-lowest)] divide-y divide-[var(--primary)] rounded-xl flex flex-col p-4 py-2 w-full shadow-md">
              {summaryItems.map(
                (item) =>
                  item.isVisible && (
                    <motion.div
                      key={item.name}
                      className="flex flex-row gap-3 items-center justify-between px-4 py-2 text-sm font-mono">
                      <div className="opacity-50">{item.name}:</div>
                      {item.value}
                    </motion.div>
                  ),
              )}
            </motion.div>
          </div>

          <div className="grow flex flex-col gap-2">
            <div className="px-4 opacity-50 flex flex-wrap items-center gap-2 font-mono">
              {t('buy')} {trafficLimitGb} GB
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  addTraffic(subscription, trafficLimitGb, 'BALANCE')
                }}
                disabled={isLoading || price > balance}
                className={`py-2 px-4 rounded-md bg-[var(--star-container-rgba)]  transition-all duration-200 hover:brightness-110 active:scale-[0.97] ${
                  isLoading || price > balance
                    ? 'opacity-50 cursor-not-allowed'
                    : ' cursor-pointer'
                } flex gap-2 items-center justify-center font-bold font-mono text-sm grow`}>
                {price <= 0 ? (
                  t('addFree')
                ) : (
                  <>
                    <Currency type={'star'} w={18} />
                    {price}
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  addTraffic(
                    subscription,
                    trafficLimitGb,
                    PaymentMethodEnum.STARS,
                  )
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
                    addTraffic(
                      subscription,
                      trafficLimitGb,
                      PaymentMethodEnum.TON_TON,
                    )
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
              <button
                onClick={() => {
                  addTraffic(subscription, trafficLimitGb, 'TRAFFIC')
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
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}
