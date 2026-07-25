'use client'

import { default as Currency } from '@app/app/_components/Currency'
import { authApiClient } from '@app/core/authApiClient'
import { CurrencyEnum } from '@app/enums/currency.enum'
import { PaymentMethodEnum } from '@app/enums/payment-method.enum'
import { RatesInterface } from '@app/types/rates.interface'
import { UserDataInterface } from '@app/types/user-data.interface'
import { roundUp } from '@app/utils/calculate-subscription-cost.util'
import { fxUtil } from '@app/utils/fx.util'
import { invoice } from '@tma.js/sdk-react'
import { beginCell, toNano } from '@ton/core'
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Loader2, RotateCw, ShieldCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify'

type Props = {
  amount: number
  rates: RatesInterface
  setUser: (user: UserDataInterface) => void
  /**
   * Optional callback that re-fetches `rates` from the backend and lets the
   * parent update the `rates` prop. If omitted, the manual refresh control
   * and the "stale rate" nudge are simply not shown.
   */
  onRefreshRates?: () => Promise<void> | void
}

/* ── Brand marks (inlined so they can inherit currentColor / sit in badges) ── */

function SbpMark({ size = 16 }: { size?: number }) {
  // Original multicolor SBP glyph — keep native brand colors, no currentColor override.
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4 8.70673L8.86427 17.365V22.6463L4.00569 31.2877L4 8.70673Z"
        fill="#5B57A2"
      />
      <path
        d="M22.6767 14.2143L27.2347 11.4323L36.563 11.4237L22.6767 19.895V14.2143Z"
        fill="#D90751"
      />
      <path
        d="M22.6508 8.65571L22.6766 20.119L17.8008 17.1357V0L22.6508 8.65571Z"
        fill="#FAB718"
      />
      <path
        d="M36.5627 11.4237L27.2343 11.4323L22.6508 8.65571L17.8008 0L36.5627 11.4237Z"
        fill="#ED6F26"
      />
      <path
        d="M22.6766 31.3357V25.7739L17.8008 22.8472L17.8036 39.9999L22.6766 31.3357Z"
        fill="#63B22F"
      />
      <path
        d="M27.2234 28.579L8.86393 17.365L4 8.70673L36.5433 28.5677L27.2234 28.579Z"
        fill="#1487C9"
      />
      <path
        d="M17.8044 40L22.6767 31.3357L27.2233 28.579L36.5431 28.5677L17.8044 40Z"
        fill="#017F36"
      />
      <path
        d="M4.00558 31.2877L17.8408 22.8477L13.1896 20.0057L8.86415 22.6463L4.00558 31.2877Z"
        fill="#984995"
      />
    </svg>
  )
}

function CardsMark({ size = 16 }: { size?: number }) {
  // Original glyph is solid white — swapped to currentColor so it can sit on any badge color.
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <path
        d="M26.4378 8.93304H7.55939C6.99943 8.93304 6.47947 8.95316 5.99951 8.97328C1.2599 9.25492 0 11.0051 0 16.4369V17.6037C0 18.7102 0.899927 19.6154 1.99984 19.6154H31.9974C33.0973 19.6154 33.9972 18.7102 33.9972 17.6037V16.4369C33.9972 10.4419 32.4774 8.93304 26.4378 8.93304Z"
        fill="currentColor"
      />
      <path
        d="M1.99984 22.6302C0.899927 22.6302 0 23.5355 0 24.642V30.4962C0 36.4912 1.51988 38 7.55939 38H26.4378C32.3774 38 33.9372 36.5515 33.9972 30.818V24.642C33.9972 23.5355 33.0973 22.6302 31.9974 22.6302H1.99984ZM9.91919 33.0913H6.49947C5.67954 33.0913 4.99959 32.4073 4.99959 31.5825C4.99959 30.7577 5.67954 30.0737 6.49947 30.0737H9.93919C10.7591 30.0737 11.4391 30.7577 11.4391 31.5825C11.4391 32.4073 10.7591 33.0913 9.91919 33.0913ZM21.0983 33.0913H14.2188C13.3989 33.0913 12.719 32.4073 12.719 31.5825C12.719 30.7577 13.3989 30.0737 14.2188 30.0737H21.0983C21.9182 30.0737 22.5982 30.7577 22.5982 31.5825C22.5982 32.4073 21.9382 33.0913 21.0983 33.0913Z"
        fill="currentColor"
      />
      <path
        d="M40 22.5744V12.0327C40 5.73597 36.4203 3 31.0207 3H13.1621C11.6422 3 10.2823 3.22129 9.08244 3.68399C8.14252 4.02599 7.30259 4.52893 6.62264 5.1928C6.26267 5.5348 6.54265 6.09809 7.06261 6.09809H28.8009C33.3005 6.09809 36.9402 9.75946 36.9402 14.2859V28.7102C36.9402 29.2131 37.4802 29.4948 37.8402 29.1326C39.2201 27.6641 40 25.5115 40 22.5744Z"
        fill="currentColor"
      />
    </svg>
  )
}

/* ── Single themed pay row ─────────────────────────────────────────
   Switched from a centered square card to a full-width row: icon in a
   small corner badge on the left, label/sublabel in the middle, and the
   price right-aligned. Long RUB amounts (e.g. "1 017 905 ₽") no longer
   have to fight for space inside a half-width grid cell. */
interface PayButtonProps {
  onClick: () => void
  disabled: boolean
  isLoading: boolean
  isDone: boolean
  /** CSS variable string, e.g. 'var(--tg-star)' */
  colorVar: string
  /** RGB triplet for rgba(), e.g. '255,208,0' */
  glowRgb: string
  icon: React.ReactNode
  label: string
  sublabel?: string
  value: string
  badge?: string
}

function PayButton({
  onClick,
  disabled,
  isLoading,
  isDone,
  colorVar,
  glowRgb,
  icon,
  label,
  sublabel,
  value,
  badge,
}: PayButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? {} : { scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 420, damping: 26 }}
      className="relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 overflow-hidden cursor-pointer text-left"
      style={{
        background: 'var(--surface-container)',
        border: `1px solid rgba(${glowRgb}, ${isDone ? 0.65 : 0.32})`,
        opacity: disabled && !isLoading ? 0.45 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: isDone ? `0 0 0 2px rgba(${glowRgb},0.16)` : 'none',
        minHeight: 56,
        transition:
          'box-shadow 200ms ease, opacity 200ms ease, border 200ms ease',
      }}>
      <AnimatePresence mode="wait" initial={false}>
        {isLoading ? (
          <motion.div
            key="spin"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex w-full items-center justify-center gap-2 py-1">
            <Loader2
              size={16}
              className="animate-spin"
              style={{ color: colorVar }}
            />
            <span
              className="text-[11px] font-mono"
              style={{ color: 'var(--on-surface-variant)' }}>
              Обработка…
            </span>
          </motion.div>
        ) : isDone ? (
          <motion.div
            key="done"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            className="flex w-full items-center justify-center gap-2 py-1">
            <motion.div
              initial={{ rotate: -90 }}
              animate={{ rotate: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 18 }}
              className="flex items-center justify-center w-5 h-5 rounded-full"
              style={{ background: `rgba(${glowRgb},0.22)` }}>
              <Check size={12} style={{ color: colorVar }} />
            </motion.div>
            <span
              className="text-[11px] font-mono"
              style={{ color: 'var(--on-surface-variant)' }}>
              Открываем…
            </span>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            className="flex w-full items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}>
            {/* Icon — corner badge, no longer a big centered circle */}
            <div
              className="relative flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
              style={{
                background: `rgba(${glowRgb},0.18)`,
                color: colorVar,
              }}>
              {icon}
            </div>

            {/* Label + sublabel */}
            <div className="flex flex-col items-start min-w-0 flex-1">
              <span
                className="text-[12px] font-semibold font-mono uppercase tracking-wide truncate w-full flex gap-2 items-center"
                style={{ color: colorVar }}>
                {label}
                {badge && (
                  <span
                    className="text-[7px] font-bold font-mono tracking-wide px-1 py-0.5 rounded-full leading-none whitespace-nowrap"
                    style={{
                      color: colorVar,
                      background: 'var(--surface-container-high)',
                      border: `1px solid rgba(${glowRgb},0.4)`,
                    }}>
                    {badge}
                  </span>
                )}
              </span>
              {sublabel && (
                <span
                  className="text-[10px] font-mono truncate w-full"
                  style={{ color: 'var(--on-surface-variant)', opacity: 0.65 }}>
                  {sublabel}
                </span>
              )}
            </div>

            {/* Value — right aligned, gets all the room it needs */}
            <span
              className="font-bold font-mono text-[14px] leading-none shrink-0 whitespace-nowrap"
              style={{ color: 'var(--on-surface)', letterSpacing: '-0.01em' }}>
              ≈ {value}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

/* ── Skeleton for a not-yet-ready payment method ─────────────────── */
function PayButtonSkeleton() {
  return (
    <div
      className="relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 overflow-hidden"
      style={{
        background: 'var(--surface-container)',
        border: '1px solid var(--surface-border)',
        minHeight: 56,
      }}>
      <motion.div
        className="w-9 h-9 rounded-lg shrink-0"
        style={{ background: 'rgba(255,255,255,0.06)' }}
        animate={{ opacity: [0.35, 0.6, 0.35] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="h-3.5 rounded-md flex-1"
        style={{ background: 'rgba(255,255,255,0.06)' }}
        animate={{ opacity: [0.35, 0.6, 0.35] }}
        transition={{
          duration: 1.4,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.1,
        }}
      />
    </div>
  )
}

/* ── Section divider ──────────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-1 pt-1">
      <span
        className="text-[10px] font-mono uppercase tracking-wide"
        style={{ color: 'var(--on-background)', opacity: 0.35 }}>
        {children}
      </span>
    </div>
  )
}

/* ── Main component ───────────────────────────────────────────────── */
export default function PaymentInvoiceButton({
  amount,
  rates,
  setUser,
  onRefreshRates,
}: Props) {
  const [tonConnectUI] = useTonConnectUI()
  const location = usePathname()
  const url = location.includes('/tma') ? '/tma' : '/app'
  const [loadingMethod, setLoadingMethod] = useState<PaymentMethodEnum | null>(
    null,
  )
  const [doneMethod, setDoneMethod] = useState<PaymentMethodEnum | null>(null)
  const wallet = useTonWallet()
  const router = useRouter()
  const t = useTranslations('billing.payment')

  // ── Rate freshness tracking ──────────────────────────────────────
  // The displayed GRAM/RUB values are computed client-side from `rates`,
  // but the amount actually charged is always recalculated server-side
  // at invoice creation. If the user sits on this screen for a while the
  // shown estimate can drift from what the server will charge — give
  // them a way to pull a fresh rate instead of being surprised later.
  const [lastUpdated, setLastUpdated] = useState(() => Date.now())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [secondsAgo, setSecondsAgo] = useState(0)
  const rateStaleAfterMs = 45_000
  const rateAutoRefreshMs = 60_000

  useEffect(() => {
    // `rates` reference changed → parent gave us a fresh quote.
    setLastUpdated(Date.now())
  }, [rates])

  useEffect(() => {
    const tick = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated) / 1000))
    }, 1000)
    return () => clearInterval(tick)
  }, [lastUpdated])

  const refreshInFlight = useRef(false)
  const handleRefreshRates = async () => {
    if (!onRefreshRates || refreshInFlight.current) return
    refreshInFlight.current = true
    setIsRefreshing(true)
    try {
      await onRefreshRates()
    } catch {
      toast.error('Не удалось обновить курс')
    } finally {
      refreshInFlight.current = false
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    if (!onRefreshRates) return
    const interval = setInterval(handleRefreshRates, rateAutoRefreshMs)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRefreshRates])

  const isRateStale = secondsAgo * 1000 >= rateStaleAfterMs

  if (amount < 0) return null

  const isLoading = loadingMethod !== null

  // Methods that are UI-only stubs right now (pending bank/acquiring approval).
  // Tapping them explains the status instead of hitting the invoice API.
  const STUB_METHODS: PaymentMethodEnum[] = [
    PaymentMethodEnum.SBP,
    PaymentMethodEnum.CARD_RU,
  ]

  const handleClick = async (method: PaymentMethodEnum) => {
    if (STUB_METHODS.includes(method)) {
      toast.info(
        'Этот способ оплаты скоро появится — сейчас на проверке у банка',
      )
      return
    }

    setLoadingMethod(method)
    try {
      // If the quote we're showing is stale and the parent gave us a way
      // to refresh it, pull a fresh one before creating the invoice so the
      // user isn't confused by a server-side amount that doesn't match
      // what they just saw on screen.
      if (isRateStale && onRefreshRates) {
        await handleRefreshRates()
      }

      // Note: enum value stays TON_TON for backend/API compatibility during
      // the TON → GRAM rebrand; only the UI label/branding changed to GRAM.
      if (method === PaymentMethodEnum.TON_TON && !wallet?.account?.address) {
        try {
          await tonConnectUI.openModal()
        } catch {
          toast.error('Не удалось открыть кошелёк')
        }
        return
      }
      const getInvs = await authApiClient.createInvoice({ method, amount })
      setUser(getInvs.user)

      if (getInvs.isTonPayment) {
        const amountNano = toNano(getInvs.amountTon.toString())
        const payload = beginCell()
          .storeUint(0, 32)
          .storeStringTail(getInvs.token)
          .endCell()
        const tx = {
          validUntil: Math.floor(Date.now() / 1000) + 300,
          messages: [
            {
              address: getInvs.linkPay,
              amount: amountNano.toString(),
              payload: payload.toBoc().toString('base64'),
            },
          ],
        }
        try {
          setDoneMethod(method)
          await tonConnectUI.sendTransaction(tx)
        } catch (err) {
          console.error('Ошибка при оплате', err)
        }
      } else {
        setDoneMethod(method)
        await invoice.openUrl(getInvs.linkPay)
      }
    } catch {
      toast.error('Не удалось создать счёт')
    } finally {
      setTimeout(() => {
        setLoadingMethod(null)
        setDoneMethod(null)
        router.push(url)
      }, 420)
    }
  }

  const gramAmount = rates
    ? roundUp(fxUtil(amount, CurrencyEnum.XTR, CurrencyEnum.TON, rates))
    : 0

  // Ruble-based methods (SBP / cards) settle in RUB, not Stars — convert
  // the XTR amount straight to RUB so the button shows what will actually
  // be charged.
  const rubAmount = rates
    ? roundUp(fxUtil(amount, CurrencyEnum.XTR, CurrencyEnum.RUB, rates), 2)
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08, duration: 0.38, ease: [0.2, 0, 0, 1] }}
      className="w-full flex flex-col gap-3">
      {/* Section label */}
      <div className="px-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="block w-1 h-1 rounded-full"
            style={{ background: 'var(--primary)' }}
          />
          <span
            className="text-xs font-mono"
            style={{ color: 'var(--on-background)', opacity: 0.42 }}>
            {t('pay')}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Rate freshness + manual refresh */}
          {onRefreshRates && (
            <button
              type="button"
              onClick={handleRefreshRates}
              disabled={isRefreshing}
              className="flex items-center gap-1 opacity-60 hover:opacity-90 transition-opacity"
              style={{ cursor: isRefreshing ? 'default' : 'pointer' }}>
              <RotateCw
                size={11}
                className={isRefreshing ? 'animate-spin' : ''}
                style={{
                  color: isRateStale
                    ? 'var(--warning)'
                    : 'var(--on-background)',
                }}
              />
              <span
                className="text-[10px] font-mono"
                style={{
                  color: isRateStale
                    ? 'var(--warning)'
                    : 'var(--on-background)',
                }}>
                {isRefreshing
                  ? 'обновляем…'
                  : isRateStale
                    ? 'курс устарел'
                    : 'курс актуален'}
              </span>
            </button>
          )}

          {/* Trust signal */}
          <div className="flex items-center gap-1 opacity-40">
            <ShieldCheck size={11} style={{ color: 'var(--success)' }} />
            <span
              className="text-[10px] font-mono"
              style={{ color: 'var(--on-background)' }}>
              безопасно
            </span>
          </div>
        </div>
      </div>

      {/* Pay rows */}
      <div className="flex flex-col gap-2">
        <SectionLabel>Основные</SectionLabel>
        <PayButton
          onClick={() => handleClick(PaymentMethodEnum.STARS)}
          disabled={isLoading}
          isLoading={loadingMethod === PaymentMethodEnum.STARS}
          isDone={doneMethod === PaymentMethodEnum.STARS}
          colorVar="var(--tg-star)"
          glowRgb="255,208,0"
          icon={<Currency type="tg-star" w={18} />}
          label="Stars"
          sublabel="Telegram"
          value={amount.toLocaleString()}
        />

        {rates ? (
          <PayButton
            onClick={() => handleClick(PaymentMethodEnum.TON_TON)}
            disabled={isLoading}
            isLoading={loadingMethod === PaymentMethodEnum.TON_TON}
            isDone={doneMethod === PaymentMethodEnum.TON_TON}
            colorVar="var(--gram)"
            glowRgb="48,161,245"
            icon={<Currency type="gram" w={18} />}
            label="GRAM"
            sublabel="Ton Open Network"
            value={gramAmount.toString()}
            badge="ex-TON"
          />
        ) : (
          <PayButtonSkeleton />
        )}
      </div>

      {/* RU rail — pending bank/acquiring approval, kept visually separate */}
      <SectionLabel>Российские · скоро</SectionLabel>
      <div className="flex flex-col gap-2">
        <PayButton
          onClick={() => handleClick(PaymentMethodEnum.SBP)}
          disabled={isLoading}
          isLoading={false}
          isDone={false}
          colorVar="var(--sbp)"
          glowRgb="91,87,162"
          icon={<SbpMark size={16} />}
          label="СБП"
          sublabel="AuraPay"
          value={rubAmount !== null ? `${rubAmount.toLocaleString()} ₽` : '—'}
          badge="СКОРО"
        />

        <PayButton
          onClick={() => handleClick(PaymentMethodEnum.CARD_RU)}
          disabled={isLoading}
          isLoading={false}
          isDone={false}
          colorVar="var(--mir-card)"
          glowRgb="77,180,94"
          icon={<CardsMark size={16} />}
          label="Карта РФ"
          sublabel="AuraPay"
          value={rubAmount !== null ? `${rubAmount.toLocaleString()} ₽` : '—'}
          badge="СКОРО"
        />
        <SectionLabel>Резерв</SectionLabel>
        <PayButton
          onClick={() => handleClick(PaymentMethodEnum.SBP)}
          disabled={isLoading}
          isLoading={false}
          isDone={false}
          colorVar="var(--sbp)"
          glowRgb="91,87,162"
          icon={<SbpMark size={16} />}
          label="СБП"
          sublabel="Platega"
          value={rubAmount !== null ? `${rubAmount.toLocaleString()} ₽` : '—'}
          badge="СКОРО"
        />

        <PayButton
          onClick={() => handleClick(PaymentMethodEnum.CARD_RU)}
          disabled={isLoading}
          isLoading={false}
          isDone={false}
          colorVar="var(--mir-card)"
          glowRgb="77,180,94"
          icon={<CardsMark size={16} />}
          label="Карта РФ"
          sublabel="Platega"
          value={rubAmount !== null ? `${rubAmount.toLocaleString()} ₽` : '—'}
          badge="СКОРО"
        />
      </div>
    </motion.div>
  )
}
