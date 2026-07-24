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

/* ── Brand marks (inlined so they can inherit currentColor / sit in badges) ── */

function SbpMark({ size = 18 }: { size?: number }) {
  // Original multicolor SBP glyph — keep native brand colors, no currentColor override.
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10 12.4417L13.0402 17.8531V21.1539L10.0036 26.5548L10 12.4417Z"
        fill="#5B57A2"
      />
      <path
        d="M21.673 15.8839L24.5217 14.1452L30.3519 14.1398L21.673 19.4344V15.8839Z"
        fill="#D90751"
      />
      <path
        d="M21.6568 12.4098L21.6729 19.5744L18.6255 17.7098V7L21.6568 12.4098Z"
        fill="#FAB718"
      />
      <path
        d="M30.3517 14.1398L24.5214 14.1452L21.6568 12.4098L18.6255 7L30.3517 14.1398Z"
        fill="#ED6F26"
      />
      <path
        d="M21.6729 26.5848V23.1087L18.6255 21.2795L18.6272 32L21.6729 26.5848Z"
        fill="#63B22F"
      />
      <path
        d="M24.5146 24.8619L13.04 17.8531L10 12.4417L30.3396 24.8548L24.5146 24.8619Z"
        fill="#1487C9"
      />
      <path
        d="M18.6278 32L21.673 26.5848L24.5146 24.8619L30.3395 24.8548L18.6278 32Z"
        fill="#017F36"
      />
      <path
        d="M10.0035 26.5549L18.6505 21.2799L15.7435 19.5036L13.0401 21.154L10.0035 26.5549Z"
        fill="#984995"
      />
    </svg>
  )
}

function CardsMark({ size = 18 }: { size?: number }) {
  // Original glyph is solid white — swapped to currentColor so it can sit on any badge color.
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <path
        d="M23.717 12.7294H11.7799C11.4258 12.7294 11.0971 12.742 10.7936 12.7547C7.79665 12.9317 7 14.0318 7 17.4461V18.1795C7 18.875 7.56904 19.444 8.26452 19.444H27.2324C27.9279 19.444 28.4969 18.875 28.4969 18.1795V17.4461C28.4969 13.6778 27.5359 12.7294 23.717 12.7294Z"
        fill="currentColor"
      />
      <path
        d="M8.26452 21.3391C7.56904 21.3391 7 21.9081 7 22.6036V26.2833C7 30.0516 7.96104 31 11.7799 31H23.717C27.4727 31 28.459 30.0896 28.4969 26.4857V22.6036C28.4969 21.9081 27.9279 21.3391 27.2324 21.3391H8.26452ZM13.272 27.9146H11.1097C10.5913 27.9146 10.1613 27.4846 10.1613 26.9662C10.1613 26.4477 10.5913 26.0178 11.1097 26.0178H13.2847C13.8031 26.0178 14.2331 26.4477 14.2331 26.9662C14.2331 27.4846 13.8031 27.9146 13.272 27.9146ZM20.3407 27.9146H15.9908C15.4723 27.9146 15.0424 27.4846 15.0424 26.9662C15.0424 26.4477 15.4723 26.0178 15.9908 26.0178H20.3407C20.8592 26.0178 21.2891 26.4477 21.2891 26.9662C21.2891 27.4846 20.8718 27.9146 20.3407 27.9146Z"
        fill="currentColor"
      />
      <path
        d="M32.2926 21.3039V14.6777C32.2926 10.7198 30.0291 9 26.6149 9H15.3226C14.3616 9 13.5017 9.1391 12.743 9.42994C12.1486 9.64491 11.6175 9.96104 11.1876 10.3783C10.96 10.5933 11.137 10.9474 11.4658 10.9474H25.2112C28.0564 10.9474 30.3578 13.2488 30.3578 16.094V25.1607C30.3578 25.4768 30.6993 25.6538 30.9269 25.4262C31.7994 24.5031 32.2926 23.1501 32.2926 21.3039Z"
        fill="currentColor"
      />
    </svg>
  )
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

      {/* Corner badge (e.g. "ex-TON", "СКОРО") */}
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
                color: colorVar,
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

        {/* ── СБП — stub, pending bank/acquiring approval ── */}
        <PayButton
          onClick={() => handleClick(PaymentMethodEnum.SBP)}
          disabled={isLoading}
          isLoading={false}
          isDone={false}
          colorVar="var(--sbp)"
          glowRgb="91,87,162"
          icon={<SbpMark size={18} />}
          label="СБП"
          sublabel="Система быстрых платежей"
          value={amount.toLocaleString()}
          badge="СКОРО"
        />

        {/* ── Карты РФ (Мир / Visa / MC) — stub, pending bank/acquiring approval ── */}
        <PayButton
          onClick={() => handleClick(PaymentMethodEnum.CARD_RU)}
          disabled={isLoading}
          isLoading={false}
          isDone={false}
          colorVar="var(--mir-card)"
          glowRgb="77,180,94"
          icon={<CardsMark size={18} />}
          label="Карта РФ"
          sublabel="Мир · Visa · MC"
          value={amount.toLocaleString()}
          badge="СКОРО"
        />
      </div>

      <Split />
    </motion.div>
  )
}
