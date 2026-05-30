'use client'

import { authApiClient } from '@app/core/authApiClient'
import { CurrencyEnum } from '@app/enums/currency.enum'
import { PaymentMethodEnum } from '@app/enums/payment-method.enum'
import { PlansEnum } from '@app/enums/plans.enum'
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
import { invoice } from '@tma.js/sdk-react'
import { beginCell, toNano } from '@ton/core'
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ReactNode, useMemo, useRef, useState } from 'react'
import { FaPlus } from 'react-icons/fa6'
import { toast } from 'react-toastify'
import Currency from '../Currency'
import Modal from '../Modal'
import { TRAFFIC_GBS } from '../add-subscription/constants'
import { getTrafficCountButtonColor } from '../add-subscription/functions'

function SectionLabel({ children }: { children: ReactNode }) {
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

function Chip({
  active,
  children,
  onClick,
  disabled,
}: {
  active: boolean
  children: ReactNode
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

function GlassCard({ children }: { children: ReactNode }) {
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

function SummaryRow({ label, value }: { label: string; value: ReactNode }) {
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
  children: ReactNode
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || isLoading}
      whileHover={!disabled && !isLoading ? { scale: 1.02, y: -1 } : {}}
      whileTap={!disabled && !isLoading ? { scale: 0.96 } : {}}
      className="grow flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold font-mono text-sm"
      style={{
        background: `rgba(${glowRgb},0.13)`,
        border: `1px solid rgba(${glowRgb},0.3)`,
        color: colorVar,
        opacity: disabled && !isLoading ? 0.45 : 1,
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        boxShadow:
          disabled || isLoading ? 'none' : `0 4px 16px rgba(${glowRgb},0.14)`,
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

export default function AddTrafficButton({
  subscription,
}: {
  subscription: SubscriptionDataInterface
}) {
  const { rates } = useCurrencyStore()
  const { subscriptions, setSubscriptions } = useSubscriptionsStore()
  const { user, setUser } = useUserStore()

  const [isLoading, setIsLoading] = useState(false)
  const [isOpenModal, setIsOpenModal] = useState(false)

  const [pendingMethod, setPendingMethod] = useState<
    PaymentMethodEnum | 'BALANCE' | 'USDT' | null
  >(null)

  const [trafficLimitGb, setTrafficLimitGb] = useState(1)

  const addTrafficInFlightRef = useRef(false)

  const wallet = useTonWallet()
  const [tonConnectUI] = useTonConnectUI()

  const t = useTranslations('billing.subscription')

  const isValidSubscription =
    subscription.plan.key === PlansEnum.TRAFFIC ||
    subscription.plan.key === PlansEnum.TRIAL

  const price =
    user && subscriptions
      ? calculateSubscriptionCost({
          period: subscription.period,
          periodMultiplier: subscription.periodMultiplier,
          isPremium: user.isPremium,
          isTgProgramPartner: user.isTgProgramPartner,
          devicesCount: subscription.devicesCount,
          serversCount: subscription.baseServersCount,
          premiumServersCount: subscription.premiumServersCount,
          trafficLimitGb,
          isAllBaseServers: subscription.isAllBaseServers,
          isAllPremiumServers: subscription.isAllPremiumServers,
          isUnlimitTraffic: false,
          userDiscount: user.roleDiscount,
          plan: subscription.plan,
          settings: subscriptions,
        })
      : 0

  const priceNoDiscount =
    user && subscriptions
      ? calculateSubscriptionCostNoDiscount({
          period: subscription.period,
          periodMultiplier: subscription.periodMultiplier,
          isPremium: user.isPremium,
          isTgProgramPartner: user.isTgProgramPartner,
          devicesCount: subscription.devicesCount,
          serversCount: subscription.baseServersCount,
          premiumServersCount: subscription.premiumServersCount,
          trafficLimitGb,
          isAllBaseServers: subscription.isAllBaseServers,
          isAllPremiumServers: subscription.isAllPremiumServers,
          isUnlimitTraffic: false,
          plan: subscription.plan,
          settings: subscriptions,
        })
      : 0

  const getFinalPercent = (ratio: number) => 100 - ratio * 100

  const summaryItems = useMemo(
    () => [
      {
        name: t('summary.traffic'),
        value: <span>{trafficLimitGb} GB</span>,
        isVisible: true,
      },
      {
        name: t('summary.roleDiscount'),
        value: <span>{getFinalPercent(user?.roleDiscount || 1)}%</span>,
        isVisible: getFinalPercent(user?.roleDiscount || 1) > 0,
      },
      {
        name: t('summary.toPaid'),
        value: (
          <span className="flex items-center gap-1.5 font-bold">
            <Currency type="star" w={14} />
            {price}

            {price !== priceNoDiscount && (
              <span className="opacity-40 text-[11px] line-through font-normal">
                {priceNoDiscount}
              </span>
            )}
          </span>
        ),
        isVisible: true,
      },
    ],
    [trafficLimitGb, user?.roleDiscount, price, priceNoDiscount, t],
  )

  if (!isValidSubscription || !user || !subscriptions) {
    return null
  }

  const balance = user.balance?.payment || 0
  const usdtBalance = user.balance?.usdt || 0

  const tonPrice = rates
    ? roundUp(fxUtil(price, CurrencyEnum.XTR, CurrencyEnum.TON, rates))
    : null

  const usdtPrice = roundUp(price * subscriptions.tgStarsToUSD)

  const canBalance = !isLoading && price <= balance
  const canStars = !isLoading && price > 0 && price >= user.minPayStars
  const canTon = !isLoading && price > 0 && price >= user.minPayStars
  const canUsdt = !isLoading && usdtPrice <= usdtBalance && price > 0

  const addTraffic = async (
    sub: SubscriptionDataInterface,
    trafficGb: number,
    method: PaymentMethodEnum | 'BALANCE' | 'USDT',
  ) => {
    if (addTrafficInFlightRef.current) return

    try {
      if (method === PaymentMethodEnum.TON_TON && !wallet?.account?.address) {
        try {
          await tonConnectUI.openModal()
        } catch {
          toast.error('Error when opening a wallet')
        }

        return
      }

      addTrafficInFlightRef.current = true

      setPendingMethod(method)
      setIsLoading(true)

      const data = await authApiClient.addTrafficSubscription(
        sub.id,
        trafficGb,
        method,
      )

      if (!data.invoice) {
        setUser(data.user)
        setSubscriptions(data.subscriptions)

        toast.success('Traffic added successfully')
      } else {
        if (data.invoice.isTonPayment) {
          const amountNano = toNano(data.invoice.amountTon.toString())

          const payload = beginCell()
            .storeUint(0, 32)
            .storeStringTail(data.invoice.token || '')
            .endCell()

          const tx = {
            validUntil: Math.floor(Date.now() / 1000) + 300,
            messages: [
              {
                address: data.invoice.linkPay || '',
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
          await invoice.openUrl(data.invoice.linkPay || '')
        }
      }
    } catch {
      toast.error('Error adding traffic')
    } finally {
      addTrafficInFlightRef.current = false

      setPendingMethod(null)
      setIsOpenModal(false)
      setIsLoading(false)
    }
  }

  return (
    <>
      <motion.button
        onClick={() => setIsOpenModal(true)}
        disabled={isLoading}
        whileHover={isLoading ? {} : { scale: 1.02, y: -1 }}
        whileTap={isLoading ? {} : { scale: 0.97 }}
        className="grow flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold font-mono cursor-pointer"
        style={{
          background: 'rgba(195,166,255,0.1)',
          color: 'var(--primary)',
          border: '1px solid rgba(195,166,255,0.2)',
          opacity: isLoading ? 0.55 : 1,
        }}>
        <FaPlus size={16} />
        {t('addTraffic')}
      </motion.button>

      <Modal
        isOpen={isOpenModal}
        onClose={() => setIsOpenModal(false)}
        title={t('addingTraffic')}
        showCancelButton={false}>
        <div className="flex flex-col gap-4">
          {/* TRAFFIC */}

          <div>
            <SectionLabel>{t('traffic')}</SectionLabel>

            <GlassCard>
              <div className="p-3 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Chip
                    active={false}
                    onClick={() =>
                      setTrafficLimitGb(Math.max(1, trafficLimitGb - 1))
                    }>
                    −
                  </Chip>

                  <div className="flex-1 flex flex-col items-center gap-0.5">
                    <AnimatePresence mode="popLayout">
                      <motion.span
                        key={trafficLimitGb}
                        initial={{
                          opacity: 0,
                          y: -8,
                          scale: 0.9,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          scale: 1,
                        }}
                        exit={{
                          opacity: 0,
                          y: 8,
                          scale: 0.9,
                        }}
                        transition={{
                          type: 'spring',
                          stiffness: 400,
                          damping: 30,
                        }}
                        className="text-2xl font-bold font-mono tabular-nums leading-none"
                        style={{
                          color: 'var(--primary)',
                        }}>
                        {trafficLimitGb}
                      </motion.span>
                    </AnimatePresence>

                    <span className="text-[11px] font-mono opacity-40 uppercase tracking-widest">
                      GB
                    </span>
                  </div>

                  <Chip
                    active={false}
                    onClick={() => setTrafficLimitGb(trafficLimitGb + 1)}>
                    +
                  </Chip>
                </div>

                <input
                  type="number"
                  value={trafficLimitGb}
                  onChange={(e) =>
                    setTrafficLimitGb(
                      Math.max(1, parseInt(e.target.value) || 1),
                    )
                  }
                  className="w-full text-center text-sm font-mono rounded-xl px-3 py-2 bg-transparent focus:outline-none transition-colors"
                  style={{
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: 'var(--on-surface)',
                    caretColor: 'var(--primary)',
                  }}
                />

                <div className="flex flex-wrap gap-2">
                  {TRAFFIC_GBS.map((val) => {
                    const isActive = trafficLimitGb === val

                    const rgb = getTrafficCountButtonColor(val)

                    return (
                      <motion.button
                        key={val}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setTrafficLimitGb(val)}
                        className="grow min-w-[52px] px-3 py-2 rounded-xl text-xs font-mono font-bold cursor-pointer"
                        style={{
                          background: isActive
                            ? `rgba(${rgb},0.22)`
                            : `rgba(${rgb},0.09)`,
                          border: isActive
                            ? `1px solid rgba(${rgb},0.55)`
                            : '1px solid transparent',
                          color: `rgb(${rgb})`,
                          transition: 'all 130ms ease',
                        }}>
                        {val}
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            </GlassCard>
          </div>

          {/* SUMMARY */}

          <div>
            <SectionLabel>{t('summary.title')}</SectionLabel>

            <GlassCard>
              {summaryItems
                .filter((item) => item.isVisible)
                .map((item) => (
                  <SummaryRow
                    key={item.name}
                    label={`${item.name}:`}
                    value={item.value}
                  />
                ))}
            </GlassCard>
          </div>

          {/* PAY */}

          <div>
            <SectionLabel>
              {t('buy')} {trafficLimitGb} GB
            </SectionLabel>

            <div className="grid grid-cols-2 gap-2">
              <PayBtn
                onClick={() =>
                  addTraffic(subscription, trafficLimitGb, 'BALANCE')
                }
                disabled={!canBalance}
                isLoading={pendingMethod === 'BALANCE' && isLoading}
                colorVar="var(--star)"
                glowRgb="245,166,35">
                {price <= 0 ? (
                  <span className="text-xs">{t('addFree')}</span>
                ) : (
                  <>
                    <Currency type="star" w={16} />
                    <span>{price}</span>
                  </>
                )}
              </PayBtn>

              <PayBtn
                onClick={() =>
                  addTraffic(
                    subscription,
                    trafficLimitGb,
                    PaymentMethodEnum.STARS,
                  )
                }
                disabled={!canStars}
                isLoading={
                  pendingMethod === PaymentMethodEnum.STARS && isLoading
                }
                colorVar="var(--star)"
                glowRgb="245,166,35">
                <Currency type="tg-star" w={16} />
                <span>{price}</span>
              </PayBtn>

              {rates && (
                <PayBtn
                  onClick={() =>
                    addTraffic(
                      subscription,
                      trafficLimitGb,
                      PaymentMethodEnum.TON_TON,
                    )
                  }
                  disabled={!canTon}
                  isLoading={
                    pendingMethod === PaymentMethodEnum.TON_TON && isLoading
                  }
                  colorVar="var(--ton)"
                  glowRgb="0,136,204">
                  <Currency type="ton" w={16} />
                  <span>{tonPrice}</span>
                </PayBtn>
              )}

              <PayBtn
                onClick={() => addTraffic(subscription, trafficLimitGb, 'USDT')}
                disabled={!canUsdt}
                isLoading={pendingMethod === 'USDT' && isLoading}
                colorVar="var(--usdt)"
                glowRgb="80,175,149">
                <Currency type="usdt" w={16} />
                <span>{price <= 0 ? 0 : usdtPrice}</span>
              </PayBtn>
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}
