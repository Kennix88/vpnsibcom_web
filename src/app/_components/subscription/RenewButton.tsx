'use client'

import { authApiClient } from '@app/core/authApiClient'
import { CurrencyEnum } from '@app/enums/currency.enum'
import { PaymentMethodEnum } from '@app/enums/payment-method.enum'
import { PlansEnum } from '@app/enums/plans.enum'
import { SubscriptionPeriodEnum } from '@app/enums/subscription-period.enum'
import { TrafficResetEnum } from '@app/enums/traffic-reset.enum'
import { useCurrencyStore } from '@app/store/currency.store'
import { useSubscriptionsStore } from '@app/store/subscriptions.store'
import { useUserStore } from '@app/store/user.store'
import { SubscriptionDataInterface } from '@app/types/subscription-data.interface'
import {
  calculateDaysByPeriod,
  calculateSubscriptionCost,
  calculateSubscriptionCostNoDiscount,
  roundUp,
} from '@app/utils/calculate-subscription-cost.util'
import { fxUtil } from '@app/utils/fx.util'
import { invoice } from '@telegram-apps/sdk-react'
import { beginCell, toNano } from '@ton/core'
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react'
import { addDays, eachDayOfInterval } from 'date-fns'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { MdAutoMode } from 'react-icons/md'
import { toast } from 'react-toastify'
import { PeriodButtonInterface } from '../add-subscription/AddSubscription'
import { PERIOD_MULTIPLIERS } from '../add-subscription/constants'
import { getButtonColor } from '../add-subscription/functions'
import Currency from '../Currency'
import Modal from '../Modal'

export interface TrafficPeriodButtonInterface {
  key: TrafficResetEnum
  label: string
  minDays: number
}

export default function RenewButton({
  subscription,
}: {
  subscription: SubscriptionDataInterface
}) {
  const { rates } = useCurrencyStore()
  const { subscriptions, setSubscriptions } = useSubscriptionsStore()
  const { user, setUser } = useUserStore()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isOpenModal, setIsOpenModal] = useState<boolean>(false)
  const [isUpdatePeriod, setIsUpdatePeriod] = useState<boolean>(false)
  const [periodButton, setPeriodButton] =
    useState<PeriodButtonInterface | null>(null)
  const [periodButtons, setPeriodButtons] = useState<PeriodButtonInterface[]>(
    [],
  )
  const [periodMultiplier, setPeriodMultiplier] = useState(1)
  const [trafficPeriodButton, setTrafficPeriodButton] =
    useState<TrafficPeriodButtonInterface | null>(null)
  const wallet = useTonWallet()
  const [tonConnectUI] = useTonConnectUI()
  const t = useTranslations('billing.subscription')

  const trafficPeriodButtons = useMemo(
    () => [
      {
        key: TrafficResetEnum.DAY,
        label: t('trafficReset.daily'),
        minDays: 0,
      },
      {
        key: TrafficResetEnum.WEEK,
        label: t('trafficReset.weekly'),
        minDays: 7,
      },
      {
        key: TrafficResetEnum.MONTH,
        label: t('trafficReset.monthly'),
        minDays: 30,
      },
      {
        key: TrafficResetEnum.YEAR,
        label: t('trafficReset.yearly'),
        minDays: 360,
      }
    ],
    [t]
  )

  useEffect(() => {
    if (!subscriptions || !user) return

    const buttons: PeriodButtonInterface[] = [
      {
        key: SubscriptionPeriodEnum.HOUR,
        label: t('period.hour'),
        discount: subscriptions.hourRatioPayment,
      },
      {
        key: SubscriptionPeriodEnum.DAY,
        label: t('period.day'),
        discount: subscriptions.dayRatioPayment,
      },
      {
        key: SubscriptionPeriodEnum.WEEK,
        label: t('period.week'),
        discount: subscriptions.weekRatioPayment,
      },
      {
        key: SubscriptionPeriodEnum.MONTH,
        label: t('period.month'),
        discount: 1,
      },
      {
        key: SubscriptionPeriodEnum.THREE_MONTH,
        label: t('period.threeMonth'),
        discount: subscriptions.threeMouthesRatioPayment,
      },
      {
        key: SubscriptionPeriodEnum.SIX_MONTH,
        label: t('period.sixMonth'),
        discount: subscriptions.sixMouthesRatioPayment,
      },
      {
        key: SubscriptionPeriodEnum.YEAR,
        label: t('period.year'),
        discount: subscriptions.oneYearRatioPayment,
      },
      {
        key: SubscriptionPeriodEnum.TWO_YEAR,
        label: t('period.twoYear'),
        discount: subscriptions.twoYearRatioPayment,
      },
      {
        key: SubscriptionPeriodEnum.THREE_YEAR,
        label: t('period.threeYear'),
        discount: subscriptions.threeYearRatioPayment,
      },
      {
        key: SubscriptionPeriodEnum.INDEFINITELY,
        label: t('period.indefinitely'),
        discount: subscriptions.indefinitelyRatio,
      },
    ]

    const findTrafficPeriodButton = trafficPeriodButtons.find(
      (btn) => btn.key === subscription.trafficReset,
    )

    setTrafficPeriodButton(findTrafficPeriodButton || null)
    setPeriodButtons(buttons)
    setPeriodButton(buttons[3])
  }, [subscriptions, user, subscription.trafficReset, t, trafficPeriodButtons])

  // Стабильная функция, чтобы не ломать зависимости
  const getFinalPercent = useCallback((ratio: number) => 100 - ratio * 100, [])

  // price и priceNoDiscount — не хуки, можно считать сразу (всегда)
  const price = calculateSubscriptionCost({
    period: periodButton?.key || subscription.period,
    periodMultiplier,
    isPremium: user!.isPremium,
    isTgProgramPartner: user!.isTgProgramPartner,
    devicesCount: subscription.devicesCount,
    serversCount: subscription.baseServersCount,
    premiumServersCount: subscription.premiumServersCount,
    trafficLimitGb: subscription.trafficLimitGb || 0,
    isAllBaseServers: subscription.isAllBaseServers,
    isAllPremiumServers: subscription.isAllPremiumServers,
    isUnlimitTraffic: subscription.isUnlimitTraffic,
    userDiscount: user!.roleDiscount,
    plan: subscription.plan,
    settings: subscriptions!,
  })

  const priceNoDiscount = calculateSubscriptionCostNoDiscount({
    period: periodButton?.key || subscription.period,
    periodMultiplier,
    isPremium: user!.isPremium,
    isTgProgramPartner: user!.isTgProgramPartner,
    devicesCount: subscription.devicesCount,
    serversCount: subscription.baseServersCount,
    premiumServersCount: subscription.premiumServersCount,
    trafficLimitGb: subscription.trafficLimitGb || 0,
    isAllBaseServers: subscription.isAllBaseServers,
    isAllPremiumServers: subscription.isAllPremiumServers,
    isUnlimitTraffic: subscription.isUnlimitTraffic,
    plan: subscription.plan,
    settings: subscriptions!,
  })

  // useMemo — вызываем всегда, внутри безопасно обрабатываем отсутствие данных
  const summaryItems = useMemo(() => {
    if (!user || !subscriptions || !periodButton) return []

    return [
      {
        name: t('summary.traffic'),
        value: (
          <div>
            {subscription.isUnlimitTraffic
              ? t('summary.unlimit')
              : subscription.plan.key === PlansEnum.TRAFFIC
                ? `${subscription.trafficLimitGb} GB`
                : trafficPeriodButton?.key === TrafficResetEnum.DAY
                  ? `${subscription.trafficLimitGb} GB ${t('summary.daily')}`
                  : trafficPeriodButton?.key === TrafficResetEnum.WEEK
                    ? `${(subscription.trafficLimitGb || 0) * 7} GB ${t('summary.weekly')}`
                    : trafficPeriodButton?.key === TrafficResetEnum.MONTH
                      ? `${(subscription.trafficLimitGb || 0) * 30} GB ${t('summary.monthly')}`
                      : `${(subscription.trafficLimitGb || 0) * 365} GB ${t('summary.yearly')}`}
          </div>
        ),
        isVisible: true,
      },
      {
        name: t('summary.period'),
        value: (
          <div className="flex gap-1 items-center">
            <div>{periodButton.label}</div>
            {periodMultiplier > 1 && (
              <div className="rounded-md w-[22px] h-[22px] justify-center items-center flex bg-[var(--primary)] text-[var(--on-primary)] text-xs font-bold">
                x{periodMultiplier}
              </div>
            )}
          </div>
        ),
        isVisible: subscription.plan.key !== PlansEnum.TRAFFIC,
      },
      {
        name: t('summary.periodDiscount'),
        value: <div>{getFinalPercent(periodButton.discount)}%</div>,
        isVisible:
          periodButton.key !== SubscriptionPeriodEnum.INDEFINITELY &&
          getFinalPercent(periodButton.discount) > 0,
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
    ]
  }, [
    subscription,
    trafficPeriodButton,
    periodButton,
    periodMultiplier,
    user,
    price,
    priceNoDiscount,
    getFinalPercent,
    subscriptions,
    t
  ])

  // Теперь guard — рендерим null только после того, как все хуки/мемо вызваны
  if (!user || !subscriptions || !periodButton) return null

  const balance = user.balance.payment

  const renewSubscription = async (
    subscription: SubscriptionDataInterface,
    method: PaymentMethodEnum | 'BALANCE',
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
      const data = await authApiClient.renewSubscription(
        subscription.id,
        method,
        isUpdatePeriod,
        periodButton?.key || subscription.period,
        periodMultiplier,
        trafficPeriodButton?.key ?? subscription.trafficReset,
      )

      if (!data.invoice) {
        setUser(data.user)
        setSubscriptions(data.subscriptions)
        toast.success('Subsctription renewed')
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
      toast.error('Error when renewing a subscription')
    } finally {
      setIsLoading(false)
      setIsOpenModal(false)
    }
  }

  return (
    <>
      {subscription.period !== SubscriptionPeriodEnum.TRIAL &&
        subscription.period !== SubscriptionPeriodEnum.TRAFFIC &&
        subscription.period !== SubscriptionPeriodEnum.INDEFINITELY &&
        subscription.nextRenewalStars !== undefined && (
          <>
            <button
              onClick={() => {
                setIsOpenModal(true)
              }}
              disabled={isLoading}
              className={`grow p-2 rounded-md bg-[var(--secondary-container)] text-[var(--on-secondary-container)] transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer flex gap-2 items-center `}>
              <MdAutoMode size={18} />
              {t('extension')}
            </button>

            <Modal
              isOpen={isOpenModal}
              onClose={() => setIsOpenModal(false)}
              title={t('subscriptionExtension')}>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2 items-center font-extralight font-mono w-full">
                  <div className="flex gap-2 items-end justify-between w-full px-4 ">
                    <div className="opacity-50 flex flex-row gap-2 items-center">
                      {t('selectPeriod')}
                    </div>
                    <div className="flex gap-2 items-center ">
                      <Currency type="star" w={18} />
                      {price}
                    </div>
                  </div>

                  <motion.div
                    layout
                    className="text-sm bg-[var(--surface-container-lowest)] rounded-xl flex flex-row flex-wrap gap-2 items-center p-4 w-full shadow-md">
                    {periodButtons.map((btn) => {
                      const isActive = btn.key === periodButton.key
                      const bgOpacity = isActive ? 0.3 : 0.15
                      return (
                        <motion.button
                          key={btn.key}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            if (
                              btn.key === SubscriptionPeriodEnum.INDEFINITELY
                            ) {
                              setPeriodMultiplier(1)
                            }
                            setPeriodButton(btn)
                          }}
                          className="flex flex-row gap-2 grow items-center justify-center text-white px-3 py-1.5 rounded-md text-sm font-mono cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.97]"
                          style={{
                            backgroundColor: `rgba(216, 197, 255, ${bgOpacity})`,
                            border: isActive
                              ? `1px solid rgba(216, 197, 255, 0.7)`
                              : '1px solid transparent',
                          }}>
                          {btn.label}{' '}
                          {btn.discount < 1 &&
                            `(-${getFinalPercent(btn.discount)}%)`}
                        </motion.button>
                      )
                    })}

                    {periodButton?.key !==
                      SubscriptionPeriodEnum.INDEFINITELY && (
                      <>
                        <div className="w-full flex flex-col gap-1 opacity-50">
                          {t('periodMultiplier')}
                        </div>
                        <button
                          onClick={() =>
                            setPeriodMultiplier(
                              Math.max(1, periodMultiplier - 1),
                            )
                          }
                          className="flex grow items-center justify-center text-white px-3 py-1.5 rounded-md cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.97] "
                          style={{
                            backgroundColor: 'rgba(216, 197, 255, 0.15)',
                          }}>
                          -
                        </button>
                        <input
                          type="number"
                          value={periodMultiplier}
                          onChange={(e) =>
                            setPeriodMultiplier(
                              Math.max(1, parseInt(e.target.value) || 1),
                            )
                          }
                          className="border max-w-[100px] border-[var(--on-surface)]/50 rounded-md px-2 py-1 bg-transparent focus:border-[var(--primary)] focus:outline-none"
                        />
                        <button
                          onClick={() =>
                            setPeriodMultiplier(periodMultiplier + 1)
                          }
                          className="flex grow items-center justify-center text-white px-3 py-1.5 rounded-md cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.97] "
                          style={{
                            backgroundColor: 'rgba(216, 197, 255, 0.15)',
                          }}>
                          +
                        </button>

                        {PERIOD_MULTIPLIERS.map((val) => {
                          const isActive = periodMultiplier === val
                          const rgb = getButtonColor(val)
                          const bgOpacity = isActive ? 0.3 : 0.15
                          return (
                            <motion.button
                              key={val}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setPeriodMultiplier(val)}
                              className="flex flex-row gap-2 grow items-center justify-center text-white px-3 py-1.5 rounded-md text-sm font-mono cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.97]"
                              style={{
                                backgroundColor: `rgba(${rgb}, ${bgOpacity})`,
                                border: isActive
                                  ? `1px solid rgba(${rgb}, 0.7)`
                                  : '1px solid transparent',
                              }}>
                              x{val}
                            </motion.button>
                          )
                        })}
                      </>
                    )}
                  </motion.div>
                </div>

                {periodButton?.key !== SubscriptionPeriodEnum.INDEFINITELY && (
                  <div className="flex flex-col gap-2 items-center font-extralight font-mono w-full">
                    <motion.div
                      layout
                      className="text-sm bg-[var(--surface-container-lowest)] divide-y divide-[var(--primary)] rounded-xl flex flex-col p-4 py-2 w-full shadow-md">
                      <motion.div className="flex flex-row gap-3 items-center justify-between py-2 text-sm font-mono">
                        <div className="flex gap-2 items-center">
                          <div className="opacity-50">
                            {t('options.period')}:
                          </div>
                        </div>
                        <div className="relative flex items-center">
                          <input
                            type="checkbox"
                            id="autoRenewalCheckbox"
                            checked={isUpdatePeriod}
                            onChange={() => setIsUpdatePeriod(!isUpdatePeriod)}
                            className="sr-only peer"
                          />
                          <label
                            htmlFor="autoRenewalCheckbox"
                            className="flex items-center justify-center w-5 h-5 bg-transparent border border-[var(--on-surface)]/50 rounded-md cursor-pointer peer-focus:border-[var(--primary)] peer-focus:ring-2 peer-focus:ring-[var(--primary)]/20 peer-checked:bg-[var(--primary)] peer-checked:border-[var(--primary)] transition-all duration-200 hover:brightness-110 active:scale-[0.97]">
                            {isUpdatePeriod && (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 text-[var(--on-primary)]"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}>
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </label>
                        </div>
                      </motion.div>
                    </motion.div>
                  </div>
                )}

                {subscription.trafficReset !== TrafficResetEnum.NO_RESET &&
                  subscription.trafficLimitGb !== undefined &&
                  !subscription.isUnlimitTraffic && (
                    <div className="flex flex-col gap-2 items-center font-extralight font-mono w-full">
                      <div className="flex gap-2 items-end justify-between w-full px-4 ">
                        <div className="opacity-50 flex flex-row gap-2 items-center">
                          {t('trafficReset.title')}
                        </div>
                        <div>
                          {trafficPeriodButton?.key === TrafficResetEnum.DAY
                            ? subscription.trafficLimitGb
                            : trafficPeriodButton?.key === TrafficResetEnum.WEEK
                              ? (subscription.trafficLimitGb || 0) * 7
                              : trafficPeriodButton?.key ===
                                  TrafficResetEnum.MONTH
                                ? (subscription.trafficLimitGb || 0) * 30
                                : trafficPeriodButton?.key ===
                                    TrafficResetEnum.YEAR
                                  ? (subscription.trafficLimitGb || 0) * 365
                                  : ''}{' '}
                          GB
                        </div>
                      </div>

                      <motion.div
                        layout
                        className="text-sm bg-[var(--surface-container-lowest)] rounded-xl flex flex-row flex-wrap gap-2 items-center p-4 w-full shadow-md">
                        {trafficPeriodButtons.map((btn) => {
                          const isActive = btn.key === trafficPeriodButton?.key
                          const expiresDays = eachDayOfInterval({
                            start: new Date(),
                            end: addDays(
                              new Date(subscription.expiredAt || new Date()),
                              calculateDaysByPeriod(
                                periodButton.key,
                                periodMultiplier,
                              ) || 0,
                            ),
                          }).length
                          const isDisabled = btn.minDays >= expiresDays
                          const bgOpacity = isActive ? 0.3 : 0.15
                          return (
                            <motion.button
                              key={btn.key}
                              disabled={isDisabled}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                setTrafficPeriodButton(btn)
                              }}
                              className={`flex flex-row gap-2 grow items-center justify-center text-white px-3 py-1.5 rounded-md text-sm font-mono transition-all duration-200 hover:brightness-110 active:scale-[0.97] ${
                                isDisabled
                                  ? 'opacity-50 cursor-not-allowed'
                                  : ' cursor-pointer'
                              }`}
                              style={{
                                backgroundColor: `rgba(216, 197, 255, ${bgOpacity})`,
                                border: isActive
                                  ? `1px solid rgba(216, 197, 255, 0.7)`
                                  : '1px solid transparent',
                              }}>
                              {btn.label}
                            </motion.button>
                          )
                        })}
                      </motion.div>
                    </div>
                  )}

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
                    {t('extension')}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => {
                        renewSubscription(subscription, 'BALANCE')
                      }}
                      disabled={isLoading || price > balance}
                      className={`py-2 px-4 rounded-md bg-[var(--star-container-rgba)]  transition-all duration-200 hover:brightness-110 active:scale-[0.97] ${
                        price > balance
                          ? 'opacity-50 cursor-not-allowed'
                          : ' cursor-pointer'
                      } flex gap-2 items-center justify-center font-bold font-mono text-sm grow`}>
                      {price <= 0 ? (
                        t('freeExtension')
                      ) : (
                        <>
                          <Currency type={'star'} w={18} />
                          {price}
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        renewSubscription(subscription, PaymentMethodEnum.STARS)
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
                          renewSubscription(
                            subscription,
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
                          fxUtil(
                            price,
                            CurrencyEnum.XTR,
                            CurrencyEnum.TON,
                            rates,
                          ),
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Modal>
          </>
        )}
    </>
  )
}
