'use client'
import Currency from '@app/app/_components/Currency'
import { useUserStore } from '@app/store/user.store'
import addSuffixToNumberUtil from '@app/utils/add-suffix-to-number.util'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FaPlus, FaRegSnowflake } from 'react-icons/fa6'
import { TiWarning } from 'react-icons/ti'

type BalanceType = 'payment' | 'wager' | 'hold' | 'usdt'

const typeConfig: Record<
  BalanceType,
  { accent: string; glow: string; border: string; iconColor: string }
> = {
  payment: {
    accent: 'var(--star)',
    glow: 'var(--star-container-rgba)',
    border: 'rgba(254,189,4,0.35)',
    iconColor: 'var(--star)',
  },
  usdt: {
    accent: 'var(--usdt)',
    glow: 'var(--usdt-container-rgba)',
    border: 'rgba(80,175,149,0.35)',
    iconColor: 'var(--usdt)',
  },
  wager: {
    accent: 'var(--wager)',
    glow: 'var(--wager-container-rgba)',
    border: 'rgba(214,58,58,0.35)',
    iconColor: 'var(--wager)',
  },
  hold: {
    accent: 'var(--ice)',
    glow: 'var(--ice-container-rgba)',
    border: 'rgba(96,144,199,0.35)',
    iconColor: 'var(--ice)',
  },
}

export default function Balance({
  type = 'payment',
  fixedNumber = 3,
}: {
  type?: BalanceType
  fixedNumber?: number
}) {
  const location = usePathname()
  const url = location === '/app' ? '/app' : '/tma'
  const { user } = useUserStore()

  const balance = user?.balance
    ? type === 'payment'
      ? user.balance.payment
      : type === 'hold'
        ? user.balance.hold
        : type === 'usdt'
          ? user.balance.usdt
          : 0
    : 0

  const cfg = typeConfig[type]

  return (
    <motion.div
      className="relative flex items-center gap-2 pl-2.5 pr-2 py-1.5 rounded-xl"
      style={{
        background: `linear-gradient(135deg, color-mix(in srgb, ${cfg.accent} 10%, var(--surface-container)) 0%, var(--surface-container-low) 100%)`,
        border: `1px solid ${cfg.border}`,
        boxShadow: `0 2px 12px ${cfg.glow}, inset 0 1px 0 rgba(255,255,255,0.04)`,
      }}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}>
      {/* Colored left accent */}
      <div
        className="absolute left-0 top-[20%] bottom-[20%] w-[2.5px] rounded-full"
        style={{ background: cfg.accent }}
      />

      {/* Icon */}
      <div
        className="flex items-center justify-center"
        style={{ color: cfg.iconColor }}>
        {type === 'hold' ? (
          <FaRegSnowflake size={16} />
        ) : type === 'wager' ? (
          <TiWarning size={18} />
        ) : (
          <Currency w={18} type={type === 'usdt' ? 'usdt' : 'star'} />
        )}
      </div>

      {/* Amount */}
      <span
        className="font-mono font-bold text-sm"
        style={{ color: 'var(--on-surface)' }}>
        {addSuffixToNumberUtil(balance, fixedNumber)}
      </span>

      {/* Top-up button (payment only) */}
      {type === 'payment' && (
        <Link href={`${url}/payment`}>
          <motion.div
            className="flex items-center justify-center w-6 h-6 rounded-lg"
            style={{
              background: 'var(--secondary-container)',
              color: 'var(--on-secondary-container)',
            }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
            <FaPlus size={11} />
          </motion.div>
        </Link>
      )}
    </motion.div>
  )
}
