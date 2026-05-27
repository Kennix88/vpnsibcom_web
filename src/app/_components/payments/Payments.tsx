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
import { Gift } from 'lucide-react'
import { Suspense, useEffect, useState } from 'react'
import { useTranslations } from 'use-intl'

/* ─── Constants ──────────────────────────────────────────────────── */
const quickAmounts = [
  50, 100, 500, 700, 1000, 2000, 3000, 5000, 10000, 25000, 50000,
]

/** RGB triplet (no spaces) for rgba() — three colour tiers by amount */
function getAmountRgb(amount: number): string {
  if (amount < 1000) return '31,156,86'
  if (amount < 10000) return '159,114,34'
  return '193,53,44'
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

/* ─── Inner content ──────────────────────────────────────────────── */
function PaymentsContent() {
  const t = useTranslations('billing.payment')
  const { user, setUser } = useUserStore()
  const [amount, setAmount] = useState<number>(700)
  const { rates, currencies } = useCurrencyStore()
  const [bonuses, setBonuses] = useState<BonusesInterface>()

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

  if (!user || !rates || !currencies) return null
  const currency = currencies.find((c) => c.key === user.currencyCode)
  if (!currency || !bonuses) return null

  const bonusStarsAmount = getBonusAmount(amount, bonuses)

  const handleChange = (raw: string) => {
    if (!raw) return setAmount(user.minPayStars)
    const parsed = parseInt(raw)
    if (isNaN(parsed)) return
    if (parsed > 5_000_000) return setAmount(5_000_000)
    if (parsed < user.minPayStars) return setAmount(user.minPayStars)
    setAmount(parsed)
  }

  return (
    <div className="flex flex-col gap-5 items-center pb-8 max-w-md">
      {/* ── Amount section ── */}
      <div className="flex flex-col gap-2 w-full">
        {/* Label */}
        <div className="px-1 flex items-center gap-2">
          <span
            className="block w-1 h-1 rounded-full"
            style={{ background: 'var(--primary)' }}
          />
          <span
            className="text-xs font-mono"
            style={{ color: 'var(--on-background)', opacity: 0.42 }}>
            {t('sum')}
          </span>
        </div>

        {/* Glass card */}
        <motion.div
          layout
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(var(--glass-blur))',
            WebkitBackdropFilter: 'blur(var(--glass-blur))',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 6px 28px rgba(0,0,0,0.28)',
          }}>
          {/* Input row */}
          <div
            className="flex items-center gap-3 px-4 py-4"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <TgStar w={20} type="star" />
            <input
              type="number"
              placeholder={t('enterSum')}
              min={user.minPayStars}
              max={5000000}
              value={amount || ''}
              onChange={(e) => handleChange(e.target.value)}
              className="grow min-w-0 bg-transparent font-bold font-mono text-lg focus:outline-none"
              style={{
                color: 'var(--on-background)',
                caretColor: 'var(--primary)',
              }}
            />
            {/* Fiat label */}
            <span
              className="text-xs font-mono shrink-0"
              style={{ color: 'var(--on-background)', opacity: 0.38 }}>
              ≈{' '}
              {addSuffixToNumberUtil(
                fxUtil(amount, CurrencyEnum.XTR, user.currencyCode, rates),
                2,
              )}{' '}
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
                transition={{ duration: 0.2 }}
                className="overflow-hidden">
                <div
                  className="flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold"
                  style={{
                    background: 'rgba(55,227,162,0.07)',
                    color: 'var(--success)',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}>
                  <Gift size={13} aria-hidden />+{bonusStarsAmount.toFixed(0)}{' '}
                  bonus stars
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick-amount chips */}
          <div className="flex flex-wrap gap-2 p-3">
            {quickAmounts.map((val, i) => {
              const isActive = amount === val
              const rgb = getAmountRgb(val)
              const bonus = getBonusAmount(val, bonuses)

              return (
                <motion.button
                  key={val}
                  initial={{ opacity: 0, scale: 0.82 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: i * 0.03,
                    duration: 0.28,
                    ease: [0.2, 0, 0, 1],
                  }}
                  whileHover={{ scale: 1.06, y: -1 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setAmount(val)}
                  className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold font-mono cursor-pointer"
                  style={{
                    background: isActive
                      ? `rgba(${rgb},0.22)`
                      : `rgba(${rgb},0.09)`,
                    border: isActive
                      ? `1px solid rgba(${rgb},0.65)`
                      : `1px solid rgba(${rgb},0.15)`,
                    color: `rgb(${rgb})`,
                    boxShadow: isActive ? `0 0 14px rgba(${rgb},0.22)` : 'none',
                    transition: 'all 140ms ease',
                  }}>
                  <TgStar w={13} type="star" />
                  {val.toLocaleString()}

                  {/* Per-chip bonus badge */}
                  {bonus > 0 && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        delay: i * 0.03 + 0.15,
                        type: 'spring',
                        stiffness: 450,
                      }}
                      className="absolute -top-2.5 -right-1 flex items-center gap-0.5 text-[9px] px-1 py-0.5 rounded-md font-bold leading-none"
                      style={{
                        background: 'var(--success-container)',
                        color: 'var(--success)',
                        border: '1px solid rgba(55,227,162,0.3)',
                      }}>
                      <Gift size={7} aria-hidden />+{bonus.toFixed(0)}
                    </motion.span>
                  )}
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      </div>

      {/* ── Pay buttons + Split ── */}
      <PaymentInvoiceButton amount={amount} rates={rates} setUser={setUser} />
    </div>
  )
}

/* ─── Skeleton fallback ──────────────────────────────────────────── */
function PaymentsSkeleton() {
  return (
    <div className="flex flex-col gap-5 items-center pb-[100px] animate-pulse">
      <div
        className="w-full h-40 rounded-2xl"
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
