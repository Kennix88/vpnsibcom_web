'use client'

import { authApiClient } from '@app/core/authApiClient'
import { CurrencyEnum } from '@app/enums/currency.enum'
import { PaymentMethodEnum } from '@app/enums/payment-method.enum'
import { PaymentMethodsDataInterface } from '@app/types/payment-methods-data.interface'
import { RatesInterface } from '@app/types/rates.interface'
import { UserDataInterface } from '@app/types/user-data.interface'
import { roundUp } from '@app/utils/calculate-subscription-cost.util'
import { fxUtil } from '@app/utils/fx.util'
import { invoice, openLink } from '@tma.js/sdk-react'
import { beginCell, toNano } from '@ton/core'
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Loader2, RotateCw, ShieldCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import { buildJettonTransferTx } from './jettonbuilder'
import {
  getPaymentMethodPreset,
  PaymentMethodCategoryEnum,
  paymentMethodCategoryLabels,
} from './payment-method-presets'

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
  /**
   * Методы оплаты с бэкенда. Если не переданы пропом — компонент запросит их
   * сам через authApiClient.getPaymentMethods(). Подставь реальное имя метода
   * API-клиента, если оно отличается.
   */
  methods?: PaymentMethodsDataInterface[]
}

/* ── Small pill badge, shared between the preset/bridge badge and the
   commission badge. Pops in on mount/change. ───────────────────────── */
interface BadgeProps {
  colorVar: string
  glowRgb: string
  pulse?: boolean
  children: React.ReactNode
}

function Badge({ colorVar, glowRgb, pulse, children }: BadgeProps) {
  return (
    <motion.span
      layout
      initial={{ opacity: 0, scale: 0.75 }}
      animate={{
        opacity: 1,
        scale: pulse ? [1, 1.05, 1] : 1,
      }}
      exit={{ opacity: 0, scale: 0.75 }}
      transition={
        pulse
          ? { scale: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } }
          : { type: 'spring', stiffness: 500, damping: 20 }
      }
      className="text-[7px] font-bold font-mono tracking-wide px-1 py-0.5 rounded-full leading-none whitespace-nowrap"
      style={{
        color: colorVar,
        background: 'var(--surface-container-high)',
        border: `1px solid rgba(${glowRgb},0.4)`,
      }}>
      {children}
    </motion.span>
  )
}

/* ── Single themed pay row ─────────────────────────────────────────
   Icon in a small corner badge on the left, label/sublabel in the middle,
   price right-aligned. */
interface PayButtonProps {
  onClick: () => void
  disabled: boolean
  isLoading: boolean
  isDone: boolean
  colorVar: string
  glowRgb: string
  icon: React.ReactNode
  label: string
  sublabel?: string
  value: string
  badge?: string
  commissionBadge?: string | null
  disabledReason?: string | null
  index: number
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
  commissionBadge,
  disabledReason,
  index,
}: PayButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={disabled ? {} : { scale: 1.008 }}
      whileTap={disabled ? {} : { scale: 0.985 }}
      transition={{
        opacity: { duration: 0.28, delay: index * 0.035 },
        y: {
          type: 'spring',
          stiffness: 420,
          damping: 30,
          delay: index * 0.035,
        },
        scale: { type: 'spring', stiffness: 420, damping: 26 },
      }}
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
            <div
              className="relative flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
              style={{
                background: `rgba(${glowRgb},0.18)`,
                color: colorVar,
              }}>
              {icon}
            </div>

            <div className="flex flex-col items-start min-w-0 flex-1">
              <span
                className="text-[12px] font-semibold font-mono uppercase tracking-wide truncate w-full flex gap-1.5 items-center"
                style={{ color: colorVar }}>
                {label}
                <AnimatePresence mode="popLayout">
                  {badge && (
                    <Badge key="badge" colorVar={colorVar} glowRgb={glowRgb}>
                      {badge}
                    </Badge>
                  )}
                  {commissionBadge && (
                    <Badge
                      key="commission"
                      colorVar="var(--error)"
                      glowRgb="255,107,102"
                      pulse>
                      {commissionBadge}
                    </Badge>
                  )}
                </AnimatePresence>
              </span>

              <AnimatePresence mode="wait" initial={false}>
                {disabledReason ? (
                  <motion.span
                    key="reason"
                    initial={{ opacity: 0, y: -2 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 2 }}
                    transition={{ duration: 0.18 }}
                    className="text-[10px] font-mono truncate w-full"
                    style={{ color: 'var(--warning)' }}>
                    {disabledReason}
                  </motion.span>
                ) : sublabel ? (
                  <motion.span
                    key="sublabel"
                    initial={{ opacity: 0, y: -2 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 2 }}
                    transition={{ duration: 0.18 }}
                    className="text-[10px] font-mono truncate w-full"
                    style={{
                      color: 'var(--on-surface-variant)',
                      opacity: 0.65,
                    }}>
                    {sublabel}
                  </motion.span>
                ) : null}
              </AnimatePresence>
            </div>

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

/* ── Skeleton while methods / rates aren't ready yet ──────────────── */
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

/**
 * Считает отображаемое значение для конкретного метода из суммы в XTR (Stars).
 * — Валюта берётся из `method.currency.key`, приходящего с бэкенда.
 * — Если у метода `isPlusCommission: true`, комиссия накидывается на клиенте
 *   поверх конвертированной суммы (если комиссия уже сидит внутри курса на
 *   бэкенде — isPlusCommission будет false, и мы её не трогаем).
 * — Итоговая сумма — это ВСЕГДА только оценка: реальная сумма списания
 *   пересчитывается на сервере при создании инвойса (см. handleClick).
 */
function computeDisplayValue(
  method: PaymentMethodsDataInterface,
  amount: number,
  rates: RatesInterface | null,
): string {
  if (!rates) return '—'

  let raw = fxUtil(amount, CurrencyEnum.XTR, method.currency.key, rates)

  if (method.isPlusCommission && method.commission > 1) {
    raw = raw * method.commission
  }

  const decimals = method.currency.key === CurrencyEnum.XTR ? 0 : 2
  raw = roundUp(raw, decimals)

  const symbol = method.currency.symbol
  return symbol ? `${raw.toLocaleString()} ${symbol}` : raw.toLocaleString()
}

/**
 * Возвращает бейдж комиссии («+N%»), если у метода есть комиссия.
 * Показываем его независимо от isPlusCommission: даже если комиссия уже
 * зашита в курс на бэкенде, пользователю полезно знать, что она есть.
 */
function computeCommissionBadge(
  method: PaymentMethodsDataInterface,
): string | null {
  if (!method.commission || method.commission <= 1) return null
  const percent = Math.round((method.commission - 1) * 100)
  if (percent <= 0) return null
  return `+${percent}%`
}

/**
 * Причина, по которой кнопка недоступна для нажатия — показываем прямо в
 * строке метода вместо/поверх сablabel, чтобы не заставлять пользователя
 * гадать, почему способ оплаты не активен.
 */
function getDisabledReason(
  method: PaymentMethodsDataInterface,
  amount: number,
): string | null {
  if (!method.isActive) {
    return 'недоступен'
  }
  if (amount < method.minStars) {
    return `мин. ${method.minStars.toLocaleString()} ⭐`
  }
  if (amount > method.maxStars) {
    return `макс. ${method.maxStars.toLocaleString()} ⭐`
  }
  return null
}

/* ── Main component ───────────────────────────────────────────────── */
export default function PaymentInvoiceButton({
  amount,
  rates,
  setUser,
  onRefreshRates,
  methods: methodsProp,
}: Props) {
  const [tonConnectUI] = useTonConnectUI()
  // const location = usePathname()
  // const url = location.includes('/tma') ? '/tma' : '/app'
  const [loadingMethod, setLoadingMethod] = useState<PaymentMethodEnum | null>(
    null,
  )
  const [doneMethod, setDoneMethod] = useState<PaymentMethodEnum | null>(null)
  const wallet = useTonWallet()
  // const router = useRouter()
  const t = useTranslations('billing.payment')

  // ── Payment methods (from prop, or fetched once if not provided) ──
  const [fetchedMethods, setFetchedMethods] = useState<
    PaymentMethodsDataInterface[] | null
  >(null)
  const methods = methodsProp ?? fetchedMethods

  useEffect(() => {
    if (methodsProp) return // caller already provided the list
    let cancelled = false
    ;(async () => {
      try {
        const list = await authApiClient.getPaymentMethods()
        if (!cancelled) setFetchedMethods(list.methods)
      } catch {
        if (!cancelled) {
          toast.error('Не удалось загрузить способы оплаты')
          setFetchedMethods([])
        }
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [methodsProp])

  // ── Rate freshness tracking ──────────────────────────────────────
  // The displayed values are computed client-side from `rates`, but the
  // amount actually charged is always recalculated server-side at invoice
  // creation. If the user sits on this screen for a while the shown
  // estimate can drift — give them a way to pull a fresh rate instead of
  // being surprised later.
  const [lastUpdated, setLastUpdated] = useState(() => Date.now())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [secondsAgo, setSecondsAgo] = useState(0)
  const rateStaleAfterMs = 45_000
  const rateAutoRefreshMs = 60_000

  useEffect(() => {
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

  const isLoading = loadingMethod !== null

  const handleClick = async (method: PaymentMethodsDataInterface) => {
    const disabledReason = getDisabledReason(method, amount)
    if (disabledReason) {
      // toast.info(/* как было */)
      return
    }

    setLoadingMethod(method.key)
    try {
      if (isRateStale && onRefreshRates) {
        await handleRefreshRates()
      }

      // Универсально для ЛЮБОГО TON-based метода (GRAM, USDT, будущие jetton'ы)
      if (method.isTonBlockchain && !wallet?.account?.address) {
        try {
          await tonConnectUI.openModal()
        } catch {
          toast.error('Не удалось открыть кошелёк')
        }
        return
      }

      const getInvs = await authApiClient.createInvoice({
        method: method.key,
        amount,
        walletAddress: method.isTonBlockchain
          ? wallet?.account?.address
          : undefined,
      })
      setUser(getInvs.user)

      if (getInvs.isTonPayment) {
        const tx = getInvs.isJettonPayment
          ? buildJettonTransferTx({
              senderJettonWallet: getInvs.sendTxAddress!,
              destinationOwner: getInvs.destinationAddress!,
              responseDestination: wallet!.account!.address,
              amountJetton: getInvs.amountJetton!,
              decimals: getInvs.jettonDecimals!,
              comment: getInvs.token,
            })
          : {
              validUntil: Math.floor(Date.now() / 1000) + 300,
              messages: [
                {
                  address: getInvs.linkPay,
                  amount: toNano(getInvs.amountTon.toString()).toString(),
                  payload: beginCell()
                    .storeUint(0, 32)
                    .storeStringTail(getInvs.token)
                    .endCell()
                    .toBoc()
                    .toString('base64'),
                },
              ],
            }

        try {
          setDoneMethod(method.key)
          await tonConnectUI.sendTransaction(tx)
        } catch (err) {
          console.error('Ошибка при оплате', err)
        }
      } else if (getInvs.isStars) {
        setDoneMethod(method.key)
        await invoice.openUrl(getInvs.linkPay)
      } else {
        setDoneMethod(method.key)
        openLink(getInvs.linkPay)
      }
    } catch {
      toast.error('Не удалось создать счёт')
    } finally {
      setTimeout(() => {
        setLoadingMethod(null)
        setDoneMethod(null)
        // router.push(url)
      }, 420)
    }
  }

  // ── Group methods by category, preserving backend order within a group ──
  const groupedMethods = useMemo(() => {
    if (!methods) return null
    const groups = new Map<
      PaymentMethodCategoryEnum,
      PaymentMethodsDataInterface[]
    >()
    for (const method of methods) {
      const preset = getPaymentMethodPreset(method.key)
      const category = method.category ?? preset.defaultCategory
      const list = groups.get(category) ?? []
      list.push(method)
      groups.set(category, list)
    }
    // Стабильный порядок секций независимо от порядка прихода с бэкенда.
    const order = [
      PaymentMethodCategoryEnum.MAIN,
      PaymentMethodCategoryEnum.RUS,
      PaymentMethodCategoryEnum.CRYPTO,
      PaymentMethodCategoryEnum.RESERVE,
    ]
    return order
      .filter((category) => groups.has(category))
      .map((category) => ({ category, methods: groups.get(category)! }))
  }, [methods])

  if (amount < 0) return null

  let globalIndex = 0

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

      {/* Pay rows — one section per category, in fixed order */}
      {!groupedMethods ? (
        <div className="flex flex-col gap-2">
          <PayButtonSkeleton />
          <PayButtonSkeleton />
        </div>
      ) : (
        groupedMethods.map(({ category, methods: categoryMethods }) => (
          <div key={category} className="flex flex-col gap-2">
            <SectionLabel>{paymentMethodCategoryLabels[category]}</SectionLabel>
            {categoryMethods.map((method) => {
              const preset = getPaymentMethodPreset(method.key)
              const disabledReason = getDisabledReason(method, amount)
              const commissionBadge = computeCommissionBadge(method)
              const badge = method.bridge ?? preset.badge
              const rowIndex = globalIndex++

              return rates || method.currency.key === CurrencyEnum.XTR ? (
                <PayButton
                  key={method.key}
                  index={rowIndex}
                  onClick={() => handleClick(method)}
                  disabled={isLoading || disabledReason !== null}
                  isLoading={loadingMethod === method.key}
                  isDone={doneMethod === method.key}
                  colorVar={preset.colorVar}
                  glowRgb={preset.glowRgb}
                  icon={preset.icon}
                  label={method.name ?? preset.label}
                  sublabel={method.description ?? preset.sublabel}
                  value={computeDisplayValue(method, amount, rates)}
                  badge={badge}
                  commissionBadge={commissionBadge}
                  disabledReason={disabledReason}
                />
              ) : (
                <PayButtonSkeleton key={method.key} />
              )
            })}
          </div>
        ))
      )}
    </motion.div>
  )
}
