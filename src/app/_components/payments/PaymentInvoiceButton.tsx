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
import { Check, Loader2, ShieldCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'react-toastify'
import Split from './Split'

type Props = {
  amount: number
  rates: RatesInterface
  setUser: (user: UserDataInterface) => void
}

/* ── Single themed pay button (premium card) ─────────────────────── */
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
      whileHover={disabled ? {} : { scale: 1.02, y: -2 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 420, damping: 26 }}
      className="relative grow basis-[150px] flex flex-col items-center justify-center gap-1.5 py-4 px-4 rounded-2xl overflow-hidden cursor-pointer"
      style={{
        background: `linear-gradient(180deg, rgba(${glowRgb},0.14) 0%, rgba(${glowRgb},0.05) 100%)`,
        border: `1px solid rgba(${glowRgb}, ${isDone ? 0.55 : 0.28})`,
        opacity: disabled && !isLoading ? 0.45 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: isDone
          ? `0 0 0 3px rgba(${glowRgb},0.12), 0 6px 24px rgba(${glowRgb},0.22)`
          : disabled
            ? 'none'
            : `0 4px 20px rgba(${glowRgb}, 0.12)`,
        transition:
          'box-shadow 220ms ease, opacity 220ms ease, border 220ms ease',
      }}>
      {/* Diagonal sheen */}
      <span
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(115deg, transparent 38%, rgba(${glowRgb},0.08) 50%, transparent 62%)`,
        }}
      />

      {/* Corner badge (e.g. "ex-TON") */}
      {badge && (
        <span
          className="absolute top-2 right-2 text-[8px] font-bold font-mono tracking-wide px-1.5 py-0.5 rounded-md"
          style={{
            color: colorVar,
            background: `rgba(${glowRgb},0.14)`,
            opacity: 0.85,
          }}>
          {badge}
        </span>
      )}

      <AnimatePresence mode="wait" initial={false}>
        {isLoading ? (
          <motion.div
            key="spin"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col items-center gap-2 py-1.5">
            <Loader2
              size={20}
              className="animate-spin"
              style={{ color: colorVar }}
            />
            <span
              className="text-[10px] font-mono"
              style={{ color: colorVar, opacity: 0.7 }}>
              Обработка…
            </span>
          </motion.div>
        ) : isDone ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            className="flex flex-col items-center gap-2 py-1.5">
            <motion.div
              initial={{ rotate: -90 }}
              animate={{ rotate: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 18 }}
              className="flex items-center justify-center w-7 h-7 rounded-full"
              style={{ background: `rgba(${glowRgb},0.2)` }}>
              <Check size={15} style={{ color: colorVar }} />
            </motion.div>
            <span
              className="text-[10px] font-mono"
              style={{ color: colorVar, opacity: 0.8 }}>
              Открываем…
            </span>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            className="flex flex-col items-center gap-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}>
            {/* Icon in circular badge */}
            <div
              className="flex items-center justify-center w-9 h-9 rounded-full mb-0.5"
              style={{
                background: `rgba(${glowRgb},0.16)`,
                boxShadow: `0 0 16px rgba(${glowRgb},0.18)`,
              }}>
              {icon}
            </div>

            {/* Amount */}
            <span
              className="font-black font-mono text-base leading-none"
              style={{ color: colorVar, letterSpacing: '-0.01em' }}>
              {value}
            </span>

            {/* Label */}
            <span
              className="text-[11px] font-bold font-mono uppercase tracking-wide"
              style={{ color: colorVar, opacity: 0.75 }}>
              {label}
            </span>

            {/* Sublabel */}
            {sublabel && (
              <span
                className="text-[9px] font-mono -mt-0.5"
                style={{ color: colorVar, opacity: 0.4 }}>
                {sublabel}
              </span>
            )}
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
      className="relative grow basis-[150px] flex flex-col items-center justify-center gap-2 py-4 px-4 rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.05)',
      }}>
      <motion.div
        className="w-9 h-9 rounded-full"
        style={{ background: 'rgba(255,255,255,0.06)' }}
        animate={{ opacity: [0.35, 0.6, 0.35] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="w-14 h-3.5 rounded-md"
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

/* ── Main component ───────────────────────────────────────────────── */
export default function PaymentInvoiceButton({
  amount,
  rates,
  setUser,
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

  if (amount < 0) return null

  const isLoading = loadingMethod !== null

  const handleClick = async (method: PaymentMethodEnum) => {
    setLoadingMethod(method)
    try {
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

      {/* Pay buttons */}
      <div className="flex gap-3 flex-wrap">
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
            sublabel="ex-TON"
            value={gramAmount.toString()}
            badge="TON→GRAM"
          />
        ) : (
          <PayButtonSkeleton />
        )}
      </div>

      <Split />
    </motion.div>
  )
}
