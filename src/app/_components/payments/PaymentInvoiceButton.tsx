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
import { Loader2 } from 'lucide-react'
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

/* ── Single themed pay button ─────────────────────────────────────── */
interface PayButtonProps {
  onClick: () => void
  disabled: boolean
  isLoading: boolean
  /** CSS variable string, e.g. 'var(--star)' */
  colorVar: string
  /** RGB triplet for rgba(), e.g. '254,189,4' */
  glowRgb: string
  children: React.ReactNode
}

function PayButton({
  onClick,
  disabled,
  isLoading,
  colorVar,
  glowRgb,
  children,
}: PayButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.025, y: -2 }}
      whileTap={disabled ? {} : { scale: 0.965 }}
      className="relative grow flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl font-bold font-mono text-sm overflow-hidden cursor-pointer"
      style={{
        background: `rgba(${glowRgb}, 0.12)`,
        border: `1px solid rgba(${glowRgb}, 0.32)`,
        color: colorVar,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: disabled ? 'none' : `0 4px 20px rgba(${glowRgb}, 0.14)`,
        transition: 'box-shadow 200ms ease, opacity 200ms ease',
      }}>
      {/* Diagonal sheen */}
      <span
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(115deg, transparent 38%, rgba(${glowRgb},0.07) 50%, transparent 62%)`,
        }}
      />

      <AnimatePresence mode="wait" initial={false}>
        {isLoading ? (
          <motion.span
            key="spin"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.15 }}>
            <Loader2 size={16} className="animate-spin" />
          </motion.span>
        ) : (
          <motion.span
            key="content"
            className="flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}>
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
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
  const [isLoading, setIsLoading] = useState(false)
  const wallet = useTonWallet()
  const router = useRouter()
  const t = useTranslations('billing.payment')

  if (amount < 0) return null

  const handleClick = async (method: PaymentMethodEnum) => {
    setIsLoading(true)
    try {
      if (method === PaymentMethodEnum.TON_TON && !wallet?.account?.address) {
        try {
          await tonConnectUI.openModal()
        } catch {
          toast.error('Error when opening a wallet')
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
          await tonConnectUI.sendTransaction(tx)
        } catch (err) {
          console.error('Ошибка при оплате', err)
        }
      } else {
        await invoice.openUrl(getInvs.linkPay)
      }
    } catch {
      toast.error('Failed create invoice')
    } finally {
      setIsLoading(false)
      router.push(url)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08, duration: 0.38, ease: [0.2, 0, 0, 1] }}
      className="w-full flex flex-col gap-3">
      {/* Section label */}
      <div className="px-1 flex items-center gap-2">
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

      {/* Pay buttons */}
      <div className="flex gap-3 flex-wrap">
        <PayButton
          onClick={() => handleClick(PaymentMethodEnum.STARS)}
          disabled={isLoading}
          isLoading={isLoading}
          colorVar="var(--star)"
          glowRgb="254,189,4">
          <Currency type="tg-star" w={18} />
          {amount.toLocaleString()}
        </PayButton>

        {rates && (
          <PayButton
            onClick={() => handleClick(PaymentMethodEnum.TON_TON)}
            disabled={isLoading}
            isLoading={isLoading}
            colorVar="var(--ton)"
            glowRgb="0,136,204">
            <Currency type="ton" w={18} />
            {roundUp(fxUtil(amount, CurrencyEnum.XTR, CurrencyEnum.TON, rates))}
          </PayButton>
        )}
      </div>

      <Split />
    </motion.div>
  )
}
