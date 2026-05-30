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
import { invoice } from '@tma.js/sdk-react'
import { beginCell, toNano } from '@ton/core'
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react'
import { addDays, eachDayOfInterval } from 'date-fns'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

/* ─── Section label ──────────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-1 mb-1">
      <span
        className="block w-1 h-1 rounded-full"
        style={{ background: 'var(--primary)' }}
      />
      <span
        className="text-[11px] font-mono tracking-widest uppercase"
        style={{ color: 'var(--on-background)', opacity: 0.42 }}>
        {children}
      </span>
    </div>
  )
}

/* ─── Glass chip button ──────────────────────────────────────────── */
function Chip({
  active,
  children,
  onClick,
  disabled,
}: {
  active: boolean
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.04, y: -1 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      className="px-3 py-2 rounded-xl text-xs font-bold font-mono grow cursor-pointer"
      style={{
        background: active
          ? 'rgba(195,166,255,0.22)'
          : 'rgba(255,255,255,0.05)',
        border: active
          ? '1px solid rgba(195,166,255,0.5)'
          : '1px solid rgba(255,255,255,0.08)',
        color: active ? 'var(--primary)' : 'var(--on-surface)',
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: active ? '0 0 12px rgba(195,166,255,0.18)' : 'none',
        transition: 'all 140ms ease',
      }}>
      {children}
    </motion.button>
  )
}

/* ─── Pay button ─────────────────────────────────────────────────── */
function PayBtn({
  onClick,
  disabled,
  isLoading,
  colorVar,
  glowRgb,
  children,
}: {
  onClick: () => void
  disabled: boolean
  isLoading: boolean
  colorVar: string
  glowRgb: string
  children: React.ReactNode
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.02, y: -1 }}
      whileTap={disabled ? {} : { scale: 0.96 }}
      className="grow flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold font-mono text-sm"
      style={{
        background: `rgba(${glowRgb},0.13)`,
        border: `1px solid rgba(${glowRgb},0.3)`,
        color: colorVar,
        opacity: disabled ? 0.45 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: disabled ? 'none' : `0 4px 16px rgba(${glowRgb},0.14)`,
        transition: 'opacity 150ms ease',
      }}>
      <AnimatePresence mode="wait" initial={false}>
        {isLoading ? (
          <motion.span
            key="spin"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}>
            <Loader2 size={15} className="animate-spin" />
          </motion.span>
        ) : (
          <motion.span
            key="content"
            className="flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}>
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

/* ─── Summary row ────────────────────────────────────────────────── */
function SummaryRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div
      className="flex items-center justify-between gap-2 py-2.5 px-4"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span
        className="text-xs font-mono"
        style={{ color: 'var(--on-background)', opacity: 0.5 }}>
        {label}
      </span>
      <div
        className="text-xs font-mono font-bold"
        style={{ color: 'var(--on-surface)' }}>
        {value}
      </div>
    </div>
  )
}

/* ─── Glass card wrapper ─────────────────────────────────────────── */
function GlassCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(var(--glass-blur))',
        border: '1px solid rgba(255,255,255,0.07)',
      }}>
      {children}
    </div>
  )
}

/* ─── Main component ─────────────────────────────────────────────── */
export default function RenewButton({
  subscription,
}: {
  subscription: SubscriptionDataInterface
}) {
  const { rates } = useCurrencyStore()
  const { subscriptions, setSubscriptions } = useSubscriptionsStore()
  const { user, setUser } = useUserStore()
  const [isLoading, setIsLoading] = useState(false)
  const [pendingMethod, setPendingMethod] = useState<
    PaymentMethodEnum | 'BALANCE' | 'USDT' | null
  >(null)
  const renewInFlightRef = useRef(false)
  const [isOpenModal, setIsOpenModal] = useState(false)
  const [isUpdatePeriod, setIsUpdatePeriod] = useState(false)
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
      { key: TrafficResetEnum.DAY, label: t('trafficReset.daily'), minDays: 0 },
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
      },
    ],
    [t],
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
    setTrafficPeriodButton(
      trafficPeriodButtons.find((b) => b.key === subscription.trafficReset) ??
        null,
    )
    setPeriodButtons(buttons)
    setPeriodButton(buttons[3])
  }, [subscriptions, user, subscription.trafficReset, t, trafficPeriodButtons])

  const getFinalPercent = useCallback((ratio: number) => 100 - ratio * 100, [])

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

  const summaryItems = useMemo(() => {
    if (!user || !subscriptions || !periodButton) return []
    return [
      {
        name: t('summary.traffic'),
        isVisible: true,
        value: subscription.isUnlimitTraffic
          ? t('summary.unlimit')
          : `${subscription.trafficLimitGb} GB`,
      },
      {
        name: t('summary.period'),
        isVisible: subscription.plan.key !== PlansEnum.TRAFFIC,
        value:
          periodButton.label +
          (periodMultiplier > 1 ? ` ×${periodMultiplier}` : ''),
      },
      {
        name: t('summary.periodDiscount'),
        isVisible:
          periodButton.key !== SubscriptionPeriodEnum.INDEFINITELY &&
          getFinalPercent(periodButton.discount) > 0,
        value: `${getFinalPercent(periodButton.discount)}%`,
      },
      {
        name: t('summary.roleDiscount'),
        isVisible: getFinalPercent(user.roleDiscount) > 0,
        value: `${getFinalPercent(user.roleDiscount)}%`,
      },
      {
        name: t('summary.toPaid'),
        isVisible: true,
        value: (
          <div className="flex items-center gap-1.5">
            <Currency type="star" w={14} />
            <span>{price}</span>
            {price !== priceNoDiscount && (
              <span
                className="line-through text-[11px]"
                style={{ opacity: 0.5 }}>
                ({priceNoDiscount})
              </span>
            )}
          </div>
        ),
      },
    ]
  }, [
    subscription,
    periodButton,
    periodMultiplier,
    user,
    price,
    priceNoDiscount,
    getFinalPercent,
    subscriptions,
    t,
  ])

  if (!user || !subscriptions || !periodButton) return null

  if (
    subscription.period === SubscriptionPeriodEnum.TRIAL ||
    subscription.period === SubscriptionPeriodEnum.TRAFFIC ||
    subscription.period === SubscriptionPeriodEnum.INDEFINITELY ||
    subscription.plan.key === PlansEnum.TRAFFIC ||
    subscription.plan.key === PlansEnum.TRIAL ||
    subscription.nextRenewalStars === undefined
  )
    return null

  const balance = user.balance.payment

  const renewSubscription = async (
    sub: SubscriptionDataInterface,
    method: PaymentMethodEnum | 'BALANCE' | 'USDT',
  ) => {
    if (renewInFlightRef.current) return
    try {
      if (method === PaymentMethodEnum.TON_TON && !wallet?.account?.address) {
        await tonConnectUI
          .openModal()
          .catch(() => toast.error('Error when opening a wallet'))
        return
      }
      renewInFlightRef.current = true
      setPendingMethod(method)
      setIsLoading(true)
      const data = await authApiClient.renewSubscription(
        sub.id,
        method,
        isUpdatePeriod,
        periodButton?.key || sub.period,
        periodMultiplier,
        trafficPeriodButton?.key ?? sub.trafficReset,
      )
      if (!data.invoice) {
        setUser(data.user)
        setSubscriptions(data.subscriptions)
        toast.success('Подписка продлена')
      } else if (data.invoice.isTonPayment) {
        const amountNano = toNano(data.invoice.amountTon.toString())
        const payload = beginCell()
          .storeUint(0, 32)
          .storeStringTail(data.invoice.token || '')
          .endCell()
        await tonConnectUI
          .sendTransaction({
            validUntil: Math.floor(Date.now() / 1000) + 300,
            messages: [
              {
                address: data.invoice.linkPay || '',
                amount: amountNano.toString(),
                payload: payload.toBoc().toString('base64'),
              },
            ],
          })
          .catch((err) => console.error(err))
      } else {
        await invoice.openUrl(data.invoice.linkPay || '')
      }
    } catch {
      toast.error('Ошибка продления подписки')
    } finally {
      renewInFlightRef.current = false
      setPendingMethod(null)
      setIsLoading(false)
      setIsOpenModal(false)
    }
  }

  return (
    <>
      <motion.button
        onClick={() => setIsOpenModal(true)}
        disabled={isLoading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        className="grow flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold font-mono cursor-pointer"
        style={{
          background: 'rgba(195,166,255,0.1)',
          color: 'var(--primary)',
          border: '1px solid rgba(195,166,255,0.2)',
        }}>
        <MdAutoMode size={18} />
        {t('extension')}
      </motion.button>

      <Modal
        isOpen={isOpenModal}
        onClose={() => setIsOpenModal(false)}
        title={t('subscriptionExtension')}>
        <div className="flex flex-col gap-4">
          {/* Period selector */}
          <div>
            <SectionLabel>{t('selectPeriod')}</SectionLabel>
            <GlassCard>
              <div className="flex flex-wrap gap-2 p-3">
                {periodButtons.map((btn) => (
                  <Chip
                    key={btn.key}
                    active={btn.key === periodButton.key}
                    onClick={() => {
                      if (btn.key === SubscriptionPeriodEnum.INDEFINITELY)
                        setPeriodMultiplier(1)
                      setPeriodButton(btn)
                    }}>
                    {btn.label}
                    {btn.discount < 1
                      ? ` (-${getFinalPercent(btn.discount)}%)`
                      : ''}
                  </Chip>
                ))}
              </div>

              {/* Multiplier */}
              {periodButton.key !== SubscriptionPeriodEnum.INDEFINITELY && (
                <div
                  style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
                  className="p-3 flex flex-col gap-2">
                  <span
                    className="text-[11px] font-mono"
                    style={{ color: 'var(--on-background)', opacity: 0.4 }}>
                    {t('periodMultiplier')}
                  </span>
                  <div className="flex items-center gap-2">
                    <Chip
                      active={false}
                      onClick={() =>
                        setPeriodMultiplier(Math.max(1, periodMultiplier - 1))
                      }>
                      −
                    </Chip>
                    <input
                      type="number"
                      value={periodMultiplier}
                      onChange={(e) =>
                        setPeriodMultiplier(
                          Math.max(1, parseInt(e.target.value) || 1),
                        )
                      }
                      className="w-16 text-center bg-transparent rounded-lg px-2 py-1.5 text-sm font-mono font-bold focus:outline-none"
                      style={{
                        border: '1px solid rgba(195,166,255,0.3)',
                        color: 'var(--on-surface)',
                        caretColor: 'var(--primary)',
                      }}
                    />
                    <Chip
                      active={false}
                      onClick={() => setPeriodMultiplier(periodMultiplier + 1)}>
                      +
                    </Chip>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {PERIOD_MULTIPLIERS.map((val) => {
                      const rgb = getButtonColor(val)
                      return (
                        <motion.button
                          key={val}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setPeriodMultiplier(val)}
                          className="grow px-3 py-2 rounded-xl text-xs font-mono font-bold cursor-pointer"
                          style={{
                            background:
                              periodMultiplier === val
                                ? `rgba(${rgb},0.22)`
                                : `rgba(${rgb},0.09)`,
                            border:
                              periodMultiplier === val
                                ? `1px solid rgba(${rgb},0.55)`
                                : '1px solid transparent',
                            color: `rgb(${rgb})`,
                            transition: 'all 130ms ease',
                          }}>
                          ×{val}
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              )}
            </GlassCard>
          </div>

          {/* Update period checkbox */}
          {periodButton.key !== SubscriptionPeriodEnum.INDEFINITELY && (
            <GlassCard>
              <div className="flex items-center justify-between px-4 py-3">
                <span
                  className="text-xs font-mono"
                  style={{ color: 'var(--on-background)', opacity: 0.55 }}>
                  {t('options.period')}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isUpdatePeriod}
                    onChange={() => setIsUpdatePeriod(!isUpdatePeriod)}
                    className="sr-only"
                  />
                  <div
                    className="w-10 h-6 rounded-full transition-all duration-200 flex items-center px-0.5"
                    style={{
                      background: isUpdatePeriod
                        ? 'var(--primary)'
                        : 'rgba(255,255,255,0.1)',
                    }}>
                    <motion.div
                      animate={{ x: isUpdatePeriod ? 16 : 0 }}
                      transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 30,
                      }}
                      className="w-5 h-5 rounded-full"
                      style={{ background: 'white' }}
                    />
                  </div>
                </label>
              </div>
            </GlassCard>
          )}

          {/* Traffic period */}
          {subscription.trafficReset !== TrafficResetEnum.NO_RESET &&
            subscription.trafficLimitGb !== undefined &&
            !subscription.isUnlimitTraffic && (
              <div>
                <SectionLabel>{t('trafficReset.title')}</SectionLabel>
                <GlassCard>
                  <div className="flex flex-wrap gap-2 p-3">
                    {trafficPeriodButtons.map((btn) => {
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
                      return (
                        <Chip
                          key={btn.key}
                          active={btn.key === trafficPeriodButton?.key}
                          onClick={() => setTrafficPeriodButton(btn)}
                          disabled={isDisabled}>
                          {btn.label}
                        </Chip>
                      )
                    })}
                  </div>
                </GlassCard>
              </div>
            )}

          {/* Summary */}
          <div>
            <SectionLabel>{t('summary.title')}</SectionLabel>
            <GlassCard>
              {summaryItems
                .filter((i) => i.isVisible)
                .map((item) => (
                  <SummaryRow
                    key={item.name}
                    label={`${item.name}:`}
                    value={item.value}
                  />
                ))}
            </GlassCard>
          </div>

          {/* Pay buttons */}
          <div>
            <SectionLabel>{t('extension')}</SectionLabel>
            <div className="flex flex-wrap gap-2">
              <PayBtn
                onClick={() => renewSubscription(subscription, 'BALANCE')}
                disabled={isLoading || price > balance}
                isLoading={pendingMethod === 'BALANCE' && isLoading}
                colorVar="var(--star)"
                glowRgb="245,166,35">
                {price <= 0 ? (
                  t('freeExtension')
                ) : (
                  <>
                    <Currency type="star" w={16} />
                    {price}
                  </>
                )}
              </PayBtn>
              <PayBtn
                onClick={() =>
                  renewSubscription(subscription, PaymentMethodEnum.STARS)
                }
                disabled={isLoading || price <= 0 || price < user.minPayStars}
                isLoading={
                  pendingMethod === PaymentMethodEnum.STARS && isLoading
                }
                colorVar="var(--star)"
                glowRgb="245,166,35">
                <Currency type="tg-star" w={16} />
                {price}
              </PayBtn>
              {rates && (
                <PayBtn
                  onClick={() =>
                    renewSubscription(subscription, PaymentMethodEnum.TON_TON)
                  }
                  disabled={isLoading || price <= 0 || price < user.minPayStars}
                  isLoading={
                    pendingMethod === PaymentMethodEnum.TON_TON && isLoading
                  }
                  colorVar="var(--ton)"
                  glowRgb="0,136,204">
                  <Currency type="ton" w={16} />
                  {roundUp(
                    fxUtil(price, CurrencyEnum.XTR, CurrencyEnum.TON, rates),
                  )}
                </PayBtn>
              )}
              <PayBtn
                onClick={() => renewSubscription(subscription, 'USDT')}
                disabled={
                  isLoading ||
                  roundUp(price * subscriptions.tgStarsToUSD) >
                    user.balance.usdt ||
                  price <= 0
                }
                isLoading={pendingMethod === 'USDT' && isLoading}
                colorVar="var(--usdt)"
                glowRgb="80,175,149">
                <Currency type="usdt" w={16} />
                {roundUp(price * subscriptions.tgStarsToUSD)}
              </PayBtn>
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}
