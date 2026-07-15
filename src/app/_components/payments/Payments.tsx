'use client'

import TgStar from '@app/app/_components/Currency'
import PaymentInvoiceButton from '@app/app/_components/payments/PaymentInvoiceButton'
import { authApiClient } from '@app/core/authApiClient'
import { CurrencyEnum } from '@app/enums/currency.enum'
import { useCurrencyStore } from '@app/store/currency.store'
import { useUserStore } from '@app/store/user.store'
import { BonusesInterface } from '@app/types/bonuses.interface'
import addSuffixToNumberUtil from '@app/utils/add-suffix-to-number.util'
import { fxUtil } from '@app/utils/fx.util'
import { AnimatePresence, motion } from 'framer-motion'
import { Gift, Sparkles, TrendingUp } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'use-intl'

/* ─── Constants ──────────────────────────────────────────────────── */
const quickAmounts = [
  50, 100, 500, 700, 1000, 2000, 3000, 5000, 10000, 25000, 50000,
]

const MIN_FALLBACK = 50
const MAX_AMOUNT = 5_000_000
const SLIDER_MAX = 50_000

type Tier = {
  key: 'starter' | 'gold' | 'premium' | 'vip'
  rgb: string
  label: string
  glow: string
}

const TIERS: Tier[] = [
  {
    key: 'starter',
    rgb: '31,156,86',
    label: 'Старт',
    glow: 'rgba(31,156,86,0.22)',
  },
  {
    key: 'gold',
    rgb: '159,114,34',
    label: 'Голд',
    glow: 'rgba(159,114,34,0.24)',
  },
  {
    key: 'premium',
    rgb: '157,113,255',
    label: 'Премиум',
    glow: 'rgba(157,113,255,0.28)',
  },
  { key: 'vip', rgb: '193,53,44', label: 'VIP', glow: 'rgba(193,53,44,0.26)' },
]

function getTier(amount: number): Tier {
  if (amount < 1000) return TIERS[0]
  if (amount < 10000) return TIERS[1]
  if (amount < 25000) return TIERS[2]
  return TIERS[3]
}

function getBonusAmount(val: number, b: BonusesInterface): number {
  if (val < 250) return 0
  if (val < 500) return val * b.bonusPayment250
  if (val < 1000) return val * b.bonusPayment500
  if (val < 2500) return val * b.bonusPayment1000
  if (val < 5000) return val * b.bonusPayment2500
  if (val < 10000) return val * b.bonusPayment5000
  if (val < 20000) return val * b.bonusPayment10000
  if (val < 50000) return val * b.bonusPayment20000
  return val * b.bonusPayment50000
}

/** Округляет и клэмпит присланную извне (query) сумму в допустимый диапазон. */
function parseIncomingAmount(raw: string | null, min: number): number | null {
  if (!raw) return null
  const parsed = Math.ceil(Number(raw))
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  return Math.min(Math.max(parsed, min), MAX_AMOUNT)
}

/* ─── Inner content ──────────────────────────────────────────────── */
function PaymentsContent() {
  const t = useTranslations('billing.payment')
  const { user, setUser } = useUserStore()
  const { rates, currencies } = useCurrencyStore()
  const searchParams = useSearchParams()

  const initialAmount = useMemo(
    () => parseIncomingAmount(searchParams.get('amount'), MIN_FALLBACK) ?? 700,
    [searchParams],
  )

  const [amount, setAmount] = useState<number>(initialAmount)
  const [bonuses, setBonuses] = useState<BonusesInterface>()
  const [appliedQueryAmount, setAppliedQueryAmount] = useState(false)

  useEffect(() => {
    const getBonuses = async () => {
      try {
        const b = await authApiClient.getPaymentBonuses()
        setBonuses(b)
      } catch {
        /* noop */
      }
    }
    getBonuses()
  }, [setUser, user])

  /* Как только известен реальный минимум пользователя — доклэмпливаем
     сумму, пришедшую из query (?amount=), один раз. */
  useEffect(() => {
    if (!user || appliedQueryAmount) return
    const clamped = parseIncomingAmount(
      searchParams.get('amount'),
      user.minPayStars,
    )
    if (clamped) setAmount(clamped)
    setAppliedQueryAmount(true)
  }, [user, searchParams, appliedQueryAmount])

  if (!user || !rates || !currencies) return <PaymentsSkeleton />
  const currency = currencies.find((c) => c.key === user.currencyCode)
  if (!currency || !bonuses) return <PaymentsSkeleton />

  const bonusStarsAmount = getBonusAmount(amount, bonuses)
  const tier = getTier(amount)
  const fiatValue = addSuffixToNumberUtil(
    fxUtil(amount, CurrencyEnum.XTR, user.currencyCode, rates),
    2,
  )

  /* Чип с лучшим соотношением бонус/сумма — помечаем как "выгоднее всего" */
  const bestValueAmount = quickAmounts.reduce((best, val) => {
    const ratio = getBonusAmount(val, bonuses) / val
    const bestRatio = getBonusAmount(best, bonuses) / best
    return ratio > bestRatio ? val : best
  }, quickAmounts[0])

  const handleChange = (raw: string) => {
    if (!raw) return setAmount(user.minPayStars)
    const parsed = parseInt(raw)
    if (isNaN(parsed)) return
    if (parsed > MAX_AMOUNT) return setAmount(MAX_AMOUNT)
    if (parsed < user.minPayStars) return setAmount(user.minPayStars)
    setAmount(parsed)
  }

  return (
    <div className="flex flex-col gap-5 items-center pb-8 w-full max-w-md mx-auto">
      {/* ── Amount section ── */}
      <div className="flex flex-col gap-2 w-full">
        {/* Label */}
        <div className="px-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="block w-1 h-1 rounded-full"
              style={{ background: `rgb(${tier.rgb})` }}
            />
            <span
              className="text-xs font-mono"
              style={{ color: 'var(--on-background)', opacity: 0.42 }}>
              {t('sum')}
            </span>
          </div>
          <AnimatePresence mode="wait">
            <motion.span
              key={tier.key}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.2 }}
              className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full"
              style={{
                background: `rgba(${tier.rgb},0.14)`,
                color: `rgb(${tier.rgb})`,
                border: `1px solid rgba(${tier.rgb},0.3)`,
              }}>
              {tier.label}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Glass hero card */}
        <motion.div
          layout
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(var(--glass-blur))',
            WebkitBackdropFilter: 'blur(var(--glass-blur))',
            border: `1px solid rgba(${tier.rgb},0.22)`,
            boxShadow: `0 8px 32px rgba(0,0,0,0.32), 0 0 40px -12px rgba(${tier.rgb},0.35)`,
            transition: 'border-color 400ms ease, box-shadow 400ms ease',
          }}>
          {/* ambient glow tied to tier */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-16 -right-16 w-40 h-40 rounded-full"
            style={{
              background: `radial-gradient(circle, rgba(${tier.rgb},0.18) 0%, transparent 70%)`,
              filter: 'blur(20px)',
              transition: 'background 400ms ease',
            }}
          />

          {/* Big animated total */}
          <div className="relative flex flex-col items-center gap-1 px-4 pt-5 pb-4">
            <div className="flex items-center gap-2">
              <TgStar w={24} type="star" />
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={amount}
                  initial={{ opacity: 0, y: 10, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.94 }}
                  transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
                  className="font-mono font-bold text-4xl tabular-nums"
                  style={{ color: 'var(--on-background)' }}>
                  {amount.toLocaleString()}
                </motion.span>
              </AnimatePresence>
            </div>
            <span
              className="text-xs font-mono tabular-nums"
              style={{ color: 'var(--on-background)', opacity: 0.4 }}>
              ≈ {fiatValue}{' '}
              {currency.key !== currency.symbol ? `${currency.key}-` : ''}
              {currency.symbol}
            </span>
          </div>

          {/* Bonus banner — slides in when bonus > 0 */}
          <AnimatePresence initial={false}>
            {bonusStarsAmount > 0 && (
              <motion.div
                key="bonus"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="overflow-hidden">
                <div
                  className="relative flex items-center justify-center gap-2 mx-3 mb-3 px-3 py-2 rounded-xl text-xs font-mono font-bold overflow-hidden"
                  style={{
                    background: 'rgba(55,227,162,0.09)',
                    color: 'var(--success)',
                    border: '1px solid rgba(55,227,162,0.22)',
                  }}>
                  <motion.div
                    aria-hidden
                    className="absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(90deg, transparent, rgba(55,227,162,0.14), transparent)',
                    }}
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{
                      duration: 2.2,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                  <Gift size={13} className="relative shrink-0" aria-hidden />
                  <span className="relative">
                    +{bonusStarsAmount.toFixed(0)} бонусных Stars
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Number input */}
          <div
            className="flex items-center gap-3 px-4 py-3 mx-3 mb-3 rounded-xl"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
            <input
              type="number"
              placeholder={t('enterSum')}
              min={user.minPayStars}
              max={MAX_AMOUNT}
              value={amount || ''}
              onChange={(e) => handleChange(e.target.value)}
              className="grow min-w-0 bg-transparent font-bold font-mono text-sm text-center focus:outline-none"
              style={{
                color: 'var(--on-background)',
                caretColor: `rgb(${tier.rgb})`,
              }}
            />
          </div>

          {/* Fine-tune slider */}
          <div className="px-4 pb-4">
            <input
              type="range"
              min={user.minPayStars}
              max={SLIDER_MAX}
              step={50}
              value={Math.min(amount, SLIDER_MAX)}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{
                accentColor: `rgb(${tier.rgb})`,
                background: `linear-gradient(90deg, rgb(${tier.rgb}) ${
                  (Math.min(amount, SLIDER_MAX) / SLIDER_MAX) * 100
                }%, rgba(255,255,255,0.08) ${
                  (Math.min(amount, SLIDER_MAX) / SLIDER_MAX) * 100
                }%)`,
              }}
            />
          </div>

          {/* Quick-amount chips — responsive grid */}
          <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-4 gap-2 px-3 pb-3">
            {quickAmounts.map((val, i) => {
              const isActive = amount === val
              const chipTier = getTier(val)
              const bonus = getBonusAmount(val, bonuses)
              const isBestValue = val === bestValueAmount && bonus > 0

              return (
                <motion.button
                  key={val}
                  initial={{ opacity: 0, scale: 0.82 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: i * 0.025,
                    duration: 0.26,
                    ease: [0.2, 0, 0, 1],
                  }}
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => setAmount(val)}
                  className="relative flex flex-col items-center justify-center gap-0.5 px-2 py-2.5 rounded-xl text-xs font-bold font-mono cursor-pointer"
                  style={{
                    background: isActive
                      ? `rgba(${chipTier.rgb},0.22)`
                      : `rgba(${chipTier.rgb},0.08)`,
                    border: isActive
                      ? `1px solid rgba(${chipTier.rgb},0.65)`
                      : `1px solid rgba(${chipTier.rgb},0.14)`,
                    color: `rgb(${chipTier.rgb})`,
                    boxShadow: isActive
                      ? `0 0 16px rgba(${chipTier.rgb},0.24)`
                      : 'none',
                    transition: 'all 140ms ease',
                  }}>
                  {isBestValue && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        delay: i * 0.025 + 0.12,
                        type: 'spring',
                        stiffness: 420,
                      }}
                      className="absolute -top-2 left-1/2 -translate-x-1/2 flex items-center gap-0.5 text-[8px] px-1.5 py-0.5 rounded-full font-bold leading-none whitespace-nowrap"
                      style={{
                        background: 'var(--cta)',
                        color: 'var(--on-cta)',
                      }}>
                      <TrendingUp size={7} aria-hidden />
                      выгодно
                    </motion.span>
                  )}
                  <span className="flex items-center gap-1">
                    <TgStar w={11} type="star" />
                    {val.toLocaleString()}
                  </span>
                  {bonus > 0 && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        delay: i * 0.025 + 0.15,
                        type: 'spring',
                        stiffness: 450,
                      }}
                      className="flex items-center gap-0.5 text-[9px] font-bold leading-none"
                      style={{ color: 'var(--success)' }}>
                      <Gift size={7} aria-hidden />+{bonus.toFixed(0)}
                    </motion.span>
                  )}
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      </div>

      {/* ── Pay buttons + Split — sticky on mobile ── */}
      <div className="w-full">
        <div className="flex items-center gap-1.5 justify-center mb-2">
          <Sparkles
            size={11}
            style={{ color: `rgb(${tier.rgb})`, opacity: 0.6 }}
          />
          <span
            className="text-[10px] font-mono"
            style={{ color: 'var(--on-background)', opacity: 0.4 }}>
            {amount.toLocaleString()} Stars ≈ {fiatValue} {currency.symbol}
          </span>
        </div>
        <PaymentInvoiceButton amount={amount} rates={rates} setUser={setUser} />
      </div>
    </div>
  )
}

/* ─── Skeleton fallback ──────────────────────────────────────────── */
function PaymentsSkeleton() {
  return (
    <div className="flex flex-col gap-5 items-center pb-[100px] w-full max-w-md mx-auto animate-pulse">
      <div
        className="w-full h-64 rounded-2xl"
        style={{ background: 'var(--surface-container-low)' }}
      />
      <div
        className="w-full h-14 rounded-2xl"
        style={{ background: 'var(--surface-container-low)' }}
      />
    </div>
  )
}

export default function Payments() {
  return (
    <Suspense fallback={<PaymentsSkeleton />}>
      <PaymentsContent />
    </Suspense>
  )
}
