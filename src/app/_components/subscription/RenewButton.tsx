'use client'

import { authApiClient } from '@app/core/authApiClient'
import { CurrencyEnum } from '@app/enums/currency.enum'
import { PaymentMethodEnum } from '@app/enums/payment-method.enum'
import { SubscriptionPeriodEnum } from '@app/enums/subscription-period.enum'
import { TrafficResetEnum } from '@app/enums/traffic-reset.enum'
import { useCurrencyStore } from '@app/store/currency.store'
import { useSubscriptionsStore } from '@app/store/subscriptions.store'
import { useUserStore } from '@app/store/user.store'
import { SubscriptionDataInterface } from '@app/types/subscription-data.interface'
import {
  calculateDaysByPeriod,
  calculateSubscriptionCost,
  roundUp,
} from '@app/utils/calculate-subscription-cost.util'
import { fxUtil } from '@app/utils/fx.util'
import { addDays, eachDayOfInterval } from 'date-fns'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { MdAutoMode } from 'react-icons/md'
import { toast } from 'react-toastify'
import { PeriodButtonInterface } from '../add-subscription/AddSubscription'
import { PERIOD_MULTIPLIERS } from '../add-subscription/constants'
import { getButtonColor } from '../add-subscription/functions'
import Currency from '../Currency'
import Modal from '../Modal'
import FormatPeriod from './FromatPeriod'

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
  const t = useTranslations('subscriptions')
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

  const trafficPeriodButtons: TrafficPeriodButtonInterface[] = [
    {
      key: TrafficResetEnum.DAY,
      label: 'Ежедневно',
      minDays: 0,
    },
    {
      key: TrafficResetEnum.WEEK,
      label: 'Еженедельно',
      minDays: 7,
    },
    {
      key: TrafficResetEnum.MONTH,
      label: 'Ежемесячно',
      minDays: 30,
    },
    {
      key: TrafficResetEnum.YEAR,
      label: 'Ежегодно',
      minDays: 360,
    },
  ]

  useEffect(() => {
    if (!subscriptions || !user) return

    const buttons: PeriodButtonInterface[] = [
      {
        key: SubscriptionPeriodEnum.HOUR,
        label: '1 час',
        discount: subscriptions.hourRatioPayment,
      },
      {
        key: SubscriptionPeriodEnum.DAY,
        label: '1 день',
        discount: subscriptions.dayRatioPayment,
      },
      {
        key: SubscriptionPeriodEnum.WEEK,
        label: '1 неделя',
        discount: subscriptions.weekRatioPayment,
      },
      { key: SubscriptionPeriodEnum.MONTH, label: '1 месяц', discount: 1 },
      {
        key: SubscriptionPeriodEnum.THREE_MONTH,
        label: '3 месяца',
        discount: subscriptions.threeMouthesRatioPayment,
      },
      {
        key: SubscriptionPeriodEnum.SIX_MONTH,
        label: '6 месяцев',
        discount: subscriptions.sixMouthesRatioPayment,
      },
      {
        key: SubscriptionPeriodEnum.YEAR,
        label: '1 год',
        discount: subscriptions.oneYearRatioPayment,
      },
      {
        key: SubscriptionPeriodEnum.TWO_YEAR,
        label: '2 года',
        discount: subscriptions.twoYearRatioPayment,
      },
      {
        key: SubscriptionPeriodEnum.THREE_YEAR,
        label: '3 года',
        discount: subscriptions.threeYearRatioPayment,
      },
      {
        key: SubscriptionPeriodEnum.INDEFINITELY,
        label: 'Бессрочно',
        discount: subscriptions.indefinitelyRatio,
      },
    ]

    const findTrafficPeriodButton = trafficPeriodButtons.find(
      (btn) => btn.key === subscription.trafficReset,
    )

    setTrafficPeriodButton(findTrafficPeriodButton || null)
    setPeriodButtons(buttons)
    setPeriodButton(buttons[3])
  }, [subscriptions, user])

  if (!user || !subscriptions || !periodButton) return null

  const renewSubscription = async (
    subscription: SubscriptionDataInterface,
    method: PaymentMethodEnum | 'BALANCE' | 'TRAFFIC',
  ) => {
    try {
      setIsLoading(true)
      const data = await authApiClient.renewSubscription(
        subscription.id,
        method,
        isUpdatePeriod,
        periodButton?.key || subscription.period,
        periodMultiplier,
      )

      setUser(data.user)
      setSubscriptions(data.subscriptions)
      toast.success(t('subscriptionRenewed'))
    } catch {
      toast.error(t('errors.renewSubscriptionFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  const balance = user.balance.payment
  const price = calculateSubscriptionCost({
    period: periodButton?.key || subscription.period,
    periodMultiplier,
    isPremium: user.isPremium,
    isTgProgramPartner: user.isTgProgramPartner,
    devicesCount: subscription.devicesCount,
    serversCount: subscription.baseServersCount,
    premiumServersCount: subscription.premiumServersCount,
    trafficLimitGb: subscription.trafficLimitGb || 0,
    isAllBaseServers: subscription.isAllBaseServers,
    isAllPremiumServers: subscription.isAllPremiumServers,
    isUnlimitTraffic: subscription.isUnlimitTraffic,
    userDiscount: user.roleDiscount,
    plan: subscription.plan,
    settings: subscriptions,
  })
  const getFinalPercent = (ratio: number) => 100 - ratio * 100

  return (
    <>
      {subscription.period !== SubscriptionPeriodEnum.TRIAL &&
        subscription.period !== SubscriptionPeriodEnum.TRAFFIC &&
        subscription.period !== SubscriptionPeriodEnum.INDEFINITELY &&
        subscription.nextRenewalStars && (
          <>
            <button
              onClick={() => {
                setIsOpenModal(true)
              }}
              disabled={isLoading}
              className={`grow p-2 rounded-md bg-[var(--secondary-container)] text-[var(--on-secondary-container)] transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer flex gap-2 items-center `}>
              <MdAutoMode size={18} />
              Продление
            </button>

            <Modal
              isOpen={isOpenModal}
              onClose={() => setIsOpenModal(false)}
              title={'Продление подписки'}>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2 items-center font-extralight font-mono w-full">
                  <div className="flex gap-2 items-end justify-between w-full px-4 ">
                    <div className="opacity-50 flex flex-row gap-2 items-center">
                      Выберите период
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
                          Множитель периода
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
                          <div className="opacity-50">Запомнить период:</div>
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
                          Обнуление трафика
                        </div>
                        <div>
                          {trafficPeriodButton?.key == TrafficResetEnum.DAY
                            ? subscription.trafficLimitGb
                            : trafficPeriodButton?.key == TrafficResetEnum.WEEK
                              ? subscription.trafficLimitGb * 7
                              : trafficPeriodButton?.key ==
                                  TrafficResetEnum.MONTH
                                ? subscription.trafficLimitGb * 30
                                : trafficPeriodButton?.key ==
                                    TrafficResetEnum.YEAR
                                  ? subscription.trafficLimitGb * 365
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

                <div className="grow flex flex-col gap-2">
                  <div className="px-4 opacity-50 flex flex-wrap items-center gap-2 font-mono">
                    Продлить на <FormatPeriod period={periodButton.key} />{' '}
                    {periodMultiplier > 1 && (
                      <div className="text-xs rounded-md py-1 px-1 justify-center items-center flex bg-[var(--primary)] text-[var(--on-primary)] font-bold ">
                        x{periodMultiplier}
                      </div>
                    )}
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
                      <Currency type={'star'} w={18} />
                      {price}
                    </button>
                    <button
                      onClick={() => {
                        renewSubscription(subscription, PaymentMethodEnum.STARS)
                      }}
                      disabled={isLoading}
                      className={`py-2 px-4 rounded-md bg-[var(--star-container-rgba)]  transition-all duration-200 hover:brightness-110 active:scale-[0.97] ${
                        isLoading
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
                        disabled={isLoading}
                        className={`py-2 px-4 rounded-md bg-[var(--ton-container-rgba)]  transition-all duration-200 hover:brightness-110 active:scale-[0.97] ${
                          isLoading
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
