'use client'

/**
 * PremiumPurchase — компонент оформления Telegram Premium подписки.
 *
 * Рассчитан на рендер внутри <Modal variant="premium">, но не завязан
 * жёстко на модалку — просто получает onClose/onSuccess.
 *
 * Данные о ценах/методах/периодах берутся из user.premium в userStore
 * (обновляется бэкендом периодически) — компонент их не запрашивает сам.
 *
 * ПРЕДПОЛОЖЕНИЯ, которые стоит проверить под свой проект:
 *  - Currency лежит в '@app/components/Currency' (default export, как в
 *    TaskAdsReward.tsx, там путь был '../Currency').
 *  - PayPremiumMethodsEnum / PayPremiumPeriodEnum — поправь путь импорта,
 *    если они лежат не в '@app/enums/pay-premium.enum', а как отдельные
 *    файлы (pay-premium-methods.enum / pay-premium-period.enum).
 *  - authApiClient.payPremium(method, period) уже реализован (сигнатура
 *    взята из твоего черновика).
 *  - periodMonthsCalculateUtil переводит period enum в число месяцев —
 *    используется как для расчёта полной цены, так и для примерной даты
 *    окончания подписки после оплаты (см. computeExpiryDate).
 */

import { authApiClient } from '@app/core/authApiClient'
import { useUserStore } from '@app/store/user.store'
import { SubscriptionExtensionsWithConditionsInterface } from '@app/types/new-era.types'
import {
  PayPremiumMethodsEnum,
  PayPremiumPeriodEnum,
  PremiumStatusMethodInterface,
  PremiumStatusPeriodInterface,
} from '@app/types/user-data.interface'
import { periodMonthsCalculateUtil } from '@app/utils/period-hours.util'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  Calendar,
  Check,
  Crown,
  Loader2,
  Sparkles,
  Wallet,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import Currency from './Currency'
import { buildRewards } from './Extensions'

/* ────────────────────────────────────────────────────────────────── */
/*  Static labels / styling per payment method                        */
/* ────────────────────────────────────────────────────────────────── */

const METHOD_LABEL: Record<PayPremiumMethodsEnum, string> = {
  [PayPremiumMethodsEnum.BALANCE_STARS]: 'Stars',
  [PayPremiumMethodsEnum.BALANCE_USDT]: 'USDT',
}

const METHOD_ACCENT: Record<
  PayPremiumMethodsEnum,
  { color: string; gradient: string; glow: string }
> = {
  [PayPremiumMethodsEnum.BALANCE_STARS]: {
    color: 'var(--star)',
    gradient: 'var(--star-gradient)',
    glow: 'rgba(245,166,35,0.28)',
  },
  [PayPremiumMethodsEnum.BALANCE_USDT]: {
    color: 'var(--usdt)',
    gradient: 'linear-gradient(135deg, #3f8f79, var(--usdt))',
    glow: 'rgba(80,175,149,0.28)',
  },
}

/* fallback benefits shown if no matching PREMIUM extension entry was
   passed in (e.g. component used standalone, without the Extensions list) */
const FALLBACK_BENEFITS = [
  {
    icon: <Sparkles size={12} />,
    label: 'Больше устройств',
    colorVar: 'var(--info)',
  },
  {
    icon: <Sparkles size={12} />,
    label: 'Расширенный трафик',
    colorVar: 'var(--traffic)',
  },
  {
    icon: <Sparkles size={12} />,
    label: 'Премиум серверы',
    colorVar: 'var(--primary)',
  },
  {
    icon: <Sparkles size={12} />,
    label: 'Без рекламы',
    colorVar: 'var(--cta)',
  },
]

/* ────────────────────────────────────────────────────────────────── */
/*  Helpers                                                            */
/* ────────────────────────────────────────────────────────────────── */

/** Округление до 2 знаков после запятой, без хвостовых нулей при выводе. */
function round2(n: number) {
  return Math.round(n * 100) / 100
}

function formatAmount(n: number) {
  const r = round2(n)
  return Number.isInteger(r) ? String(r) : r.toFixed(2)
}

function computeTotal(
  method: PremiumStatusMethodInterface,
  period?: PremiumStatusPeriodInterface,
) {
  const discountMultiplier = period ? round2(period.discount) : 1
  const periodMultiplier = period ? periodMonthsCalculateUtil(period.period) : 1

  return round2(method.finalPrice * periodMultiplier * discountMultiplier)
}

function computeSavingsPct(
  method: PremiumStatusMethodInterface,
  period?: PremiumStatusPeriodInterface,
) {
  if (method.price <= 0) return 0

  const periodMultiplier = period ? periodMonthsCalculateUtil(period.period) : 1

  const fullPrice = method.price * periodMultiplier
  const total = computeTotal(method, period)

  const pct = Math.round((1 - total / fullPrice) * 100)
  return pct > 0 ? pct : 0
}

function methodBalance(
  method: PayPremiumMethodsEnum,
  balance: { payment: number; hold: number; usdt: number } | undefined,
) {
  if (!balance) return 0
  return method === PayPremiumMethodsEnum.BALANCE_STARS
    ? balance.payment
    : balance.usdt
}

/** Считает дату, до которой будет действовать Premium после оплаты.
 *  Если премиум уже активен — плюсуем к текущей дате окончания (стакаем),
 *  иначе — от текущего момента. Месяцы — приближённо, через setMonth. */
function computeExpiryDate(
  period: PremiumStatusPeriodInterface | undefined,
  baseDate: Date,
): Date | null {
  if (!period) return null
  const months = periodMonthsCalculateUtil(period.period)
  const result = new Date(baseDate)
  result.setMonth(result.getMonth() + months)
  return result
}

function formatExpiryDate(d: Date): string {
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/* ────────────────────────────────────────────────────────────────── */
/*  Component                                                          */
/* ────────────────────────────────────────────────────────────────── */

export interface PremiumPurchaseProps {
  /** Запись PREMIUM из списка Extensions — используется, чтобы показать
   *  реальные награды именно так, как их отдаёт бэкенд. Необязательна. */
  premiumExtension?: SubscriptionExtensionsWithConditionsInterface
  /** Вызывается после успешной оплаты (например, чтобы обновить список
   *  расширений на странице). Модалку компонент закрывает сам. */
  onSuccess?: () => void
  onClose: () => void
}

export default function PremiumPurchase({
  premiumExtension,
  onSuccess,
  onClose,
}: PremiumPurchaseProps) {
  const { user, setUser } = useUserStore()
  const premium = user?.premium

  const [selectedPeriod, setSelectedPeriod] =
    useState<PayPremiumPeriodEnum | null>(null)
  const [selectedMethod, setSelectedMethod] =
    useState<PayPremiumMethodsEnum | null>(null)
  const [isPaying, setIsPaying] = useState(false)

  const methods = useMemo(() => premium?.methods ?? [], [premium])
  const periods = useMemo(() => premium?.periods ?? [], [premium])

  /* default period: самый первый в списке (обычно MONTH) */
  useEffect(() => {
    if (!selectedPeriod && periods.length > 0) {
      setSelectedPeriod(periods[0].period)
    }
  }, [periods, selectedPeriod])

  /* default method: предпочитаем тот, на который хватает баланса */
  useEffect(() => {
    if (selectedMethod || methods.length === 0 || !selectedPeriod) return
    const period = periods.find((p) => p.period === selectedPeriod)
    const affordable = methods.find(
      (m) => methodBalance(m.method, user?.balance) >= computeTotal(m, period),
    )
    setSelectedMethod((affordable ?? methods[0]).method)
  }, [methods, periods, selectedMethod, selectedPeriod, user?.balance])

  const selectedMethodData = methods.find((m) => m.method === selectedMethod)
  const selectedPeriodData = periods.find((p) => p.period === selectedPeriod)

  const total = selectedMethodData
    ? computeTotal(selectedMethodData, selectedPeriodData)
    : 0
  const balance = selectedMethod
    ? methodBalance(selectedMethod, user?.balance)
    : 0
  const insufficient = selectedMethod ? balance < total : false

  /* ── projected expiry date after payment ── */
  const baseExpiry = useMemo(() => {
    if (user?.premiumExpiredAt) {
      const current = new Date(user.premiumExpiredAt)
      if (current.getTime() > Date.now()) return current
    }
    return new Date()
  }, [user?.premiumExpiredAt])

  const isStacking = baseExpiry.getTime() > Date.now()

  const projectedExpiry = useMemo(
    () => computeExpiryDate(selectedPeriodData, baseExpiry),
    [selectedPeriodData, baseExpiry],
  )

  const benefits = premiumExtension
    ? buildRewards(premiumExtension)
    : FALLBACK_BENEFITS

  const accent = selectedMethod
    ? METHOD_ACCENT[selectedMethod]
    : METHOD_ACCENT[PayPremiumMethodsEnum.BALANCE_STARS]

  const handlePay = async () => {
    if (!selectedMethod || !selectedPeriod || !selectedMethodData) return
    if (insufficient) {
      toast.warn('Недостаточно средств для оплаты этим способом')
      return
    }
    try {
      setIsPaying(true)
      const response = await authApiClient.payPremium(
        selectedMethod,
        selectedPeriod,
      )
      if (response && response.success) {
        if (response.user) setUser(response.user)
        toast.success('Premium активирован! 🎉')
        onSuccess?.()
        onClose()
      } else {
        toast.error('Не удалось оформить Premium')
      }
    } catch (err) {
      console.error('Failed to pay premium', err)
      toast.error('Ошибка при оплате Premium')
    } finally {
      setIsPaying(false)
    }
  }

  if (methods.length === 0 || periods.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center font-mono">
        <Loader2
          size={20}
          className="animate-spin"
          style={{ color: 'var(--on-surface-variant)' }}
        />
        <span
          className="text-[12px]"
          style={{ color: 'var(--on-surface-variant)' }}>
          Условия оплаты Premium временно недоступны — попробуй чуть позже
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 font-mono">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div
        className="relative rounded-2xl p-4 overflow-hidden"
        style={{
          background:
            'linear-gradient(135deg, rgba(245,166,35,0.16), rgba(157,113,255,0.08))',
          border: '1px solid rgba(245,166,35,0.25)',
        }}>
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-12 h-12 rounded-2xl shrink-0"
            style={{
              background: 'var(--star-gradient)',
              color: 'var(--on-star)',
            }}>
            <Crown size={24} />
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span
              className="text-[15px] font-bold"
              style={{ color: 'var(--on-surface)' }}>
              Premium Status
            </span>
            <span
              className="text-[11.5px]"
              style={{ color: 'var(--on-surface-variant)', opacity: 0.85 }}>
              {user?.isPremium
                ? 'Уже активен — продли, чтобы не потерять бонусы'
                : 'Сними лимиты подписки одним оформлением'}
            </span>
          </div>
        </div>

        {/* benefits grid */}
        <div className="grid grid-cols-2 gap-1.5 mt-3.5">
          {benefits.map((b, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-[10.5px] font-bold"
              style={{
                background: `${b.colorVar.replace('var(', 'color-mix(in srgb, var(').replace(')', ') 12%, transparent)')}`,
                color: b.colorVar,
                border: `1px solid ${b.colorVar.replace('var(', 'color-mix(in srgb, var(').replace(')', ') 25%, transparent)')}`,
              }}>
              {b.icon}
              <span className="truncate">{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Period selector ─────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        <span
          className="text-[11px] font-bold px-0.5"
          style={{ color: 'var(--on-surface-variant)', opacity: 0.75 }}>
          Период подписки
        </span>
        <div className="flex flex-wrap gap-1.5 pb-1 -mx-0.5 px-0.5">
          {periods.map((p) => {
            const isSelected = p.period === selectedPeriod
            const pct = Math.round((1 - round2(p.discount)) * 100)
            return (
              <motion.button
                key={p.period}
                whileTap={{ scale: 0.96 }}
                onClick={() => setSelectedPeriod(p.period)}
                className="relative grow flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl shrink-0 min-w-[76px] cursor-pointer"
                style={{
                  background: isSelected
                    ? 'linear-gradient(135deg, var(--primary-deep), var(--primary))'
                    : 'rgba(255,255,255,0.05)',
                  color: isSelected ? 'var(--on-primary)' : 'var(--on-surface)',
                  border: `1px solid ${isSelected ? 'transparent' : 'var(--surface-strong-border)'}`,
                  boxShadow: isSelected
                    ? '0 4px 16px rgba(157,113,255,0.32)'
                    : 'none',
                }}>
                {pct > 0 && (
                  <span
                    className="absolute -top-2 right-1 px-1 py-[1px] rounded-md text-[9px] font-bold"
                    style={{
                      background: isSelected
                        ? 'var(--on-primary)'
                        : 'var(--success)',
                      color: isSelected
                        ? 'var(--primary-deep)'
                        : 'var(--on-success)',
                    }}>
                    -{pct}%
                  </span>
                )}
                <span className="text-[11.5px] font-bold whitespace-nowrap">
                  {p.name}
                </span>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* ── Method selector ─────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        <span
          className="text-[11px] font-bold px-0.5"
          style={{ color: 'var(--on-surface-variant)', opacity: 0.75 }}>
          Способ оплаты
        </span>
        <div className="grid grid-cols-2 gap-2">
          {methods.map((m) => {
            const isSelected = m.method === selectedMethod
            const methodTotal = computeTotal(m, selectedPeriodData)
            const methodSavings = computeSavingsPct(m, selectedPeriodData)
            const methodBal = methodBalance(m.method, user?.balance)
            const methodInsufficient = methodBal < methodTotal
            const methodAccent = METHOD_ACCENT[m.method]
            const fullPrice =
              m.price *
              periodMonthsCalculateUtil(
                selectedPeriodData?.period ?? PayPremiumPeriodEnum.MONTH,
              )

            return (
              <motion.button
                key={m.method}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedMethod(m.method)}
                className="relative flex flex-col gap-1 p-2.5 rounded-xl text-left cursor-pointer overflow-hidden"
                style={{
                  background: isSelected
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(255,255,255,0.03)',
                  border: `1.5px solid ${
                    isSelected
                      ? methodAccent.color
                      : 'var(--surface-strong-border)'
                  }`,
                  boxShadow: isSelected
                    ? `0 4px 18px ${methodAccent.glow}`
                    : 'none',
                }}>
                {methodSavings > 0 && (
                  <span
                    className="absolute top-1.5 right-1.5 px-1 py-[1px] rounded-md text-[8.5px] font-bold"
                    style={{
                      background: 'var(--success)',
                      color: 'var(--on-success)',
                    }}>
                    -{methodSavings}%
                  </span>
                )}
                <div className="flex items-center gap-1.5">
                  <Currency w={16} type={m.icon as never} />
                  <span
                    className="text-[11.5px] font-bold"
                    style={{ color: 'var(--on-surface)' }}>
                    {METHOD_LABEL[m.method] ?? m.method}
                  </span>
                </div>

                <div className="flex items-baseline gap-1">
                  {methodTotal < fullPrice && (
                    <span
                      className="text-[10px] line-through"
                      style={{
                        color: 'var(--on-surface-variant)',
                        opacity: 0.5,
                      }}>
                      {formatAmount(fullPrice)}
                    </span>
                  )}
                  <span
                    className="text-[13.5px] font-bold"
                    style={{ color: methodAccent.color }}>
                    {formatAmount(methodTotal)}
                  </span>
                </div>

                <span
                  className="text-[9.5px] flex items-center gap-1"
                  style={{
                    color: methodInsufficient
                      ? 'var(--error)'
                      : 'var(--on-surface-variant)',
                    opacity: methodInsufficient ? 1 : 0.65,
                  }}>
                  <Wallet size={10} />
                  {methodInsufficient
                    ? `Не хватает ${formatAmount(methodTotal - methodBal)}`
                    : `Баланс: ${formatAmount(methodBal)}`}
                </span>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* ── Projected expiry ─────────────────────────────────────── */}
      {projectedExpiry &&
        selectedPeriod !== PayPremiumPeriodEnum.INDEFINITELY && (
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px]"
            style={{
              background: 'rgba(245,166,35,0.08)',
              border: '1px solid rgba(245,166,35,0.18)',
              color: 'var(--on-surface-variant)',
            }}>
            <Calendar
              size={14}
              style={{ color: 'var(--star, #f5a623)' }}
              className="shrink-0"
            />
            <span>
              {isStacking
                ? 'Premium будет действовать до '
                : 'Premium будет действовать примерно до '}
              <span
                className="font-bold"
                style={{ color: 'var(--on-surface)' }}>
                {formatExpiryDate(projectedExpiry)}
              </span>
            </span>
          </div>
        )}

      {/* ── Insufficient balance notice ─────────────────────────── */}
      <AnimatePresence>
        {insufficient && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11px]"
            style={{
              background: 'var(--error-container)',
              color: 'var(--on-error-container)',
            }}>
            <AlertTriangle size={14} className="shrink-0" />
            Недостаточно средств для выбранного способа оплаты — выбери другой
            метод или пополни баланс.
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <motion.button
        onClick={handlePay}
        disabled={isPaying || insufficient || !selectedMethodData}
        whileHover={!isPaying && !insufficient ? { scale: 1.015 } : undefined}
        whileTap={!isPaying && !insufficient ? { scale: 0.98 } : undefined}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-[13.5px] font-bold cursor-pointer"
        style={{
          background: insufficient ? 'rgba(255,255,255,0.06)' : accent.gradient,
          color: insufficient ? 'var(--on-surface-variant)' : 'var(--on-star)',
          opacity: isPaying ? 0.8 : 1,
          boxShadow: insufficient ? 'none' : `0 6px 20px ${accent.glow}`,
        }}>
        {isPaying ? (
          <Loader2 size={16} className="animate-spin" />
        ) : insufficient ? (
          <AlertTriangle size={15} />
        ) : (
          <Check size={16} strokeWidth={3} />
        )}
        {isPaying ? (
          'Оформляем…'
        ) : insufficient ? (
          'Недостаточно средств'
        ) : (
          <span className="flex items-center gap-1.5">
            {user?.isPremium ? 'Продлить за ' : 'Оформить за '}
            {formatAmount(total)}
            {selectedMethod && (
              <Currency w={14} type={selectedMethodData?.icon as never} />
            )}
          </span>
        )}
      </motion.button>
    </div>
  )
}
