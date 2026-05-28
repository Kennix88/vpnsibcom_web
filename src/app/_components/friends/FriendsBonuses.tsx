'use client'
import Currency from '@app/app/_components/Currency'
import TooltipWrapper from '@app/app/_components/TooltipWrapper'
import { useRefferlsStore } from '@app/store/referrals.store'
import { AnimatePresence, motion } from 'framer-motion'
import { Info } from 'lucide-react'

/* ─── Level config ───────────────────────────────────────────────── */
const LEVELS = [
  {
    num: 1,
    label: 'Ваши друзья',
    desc: 'Те, кого пригласили вы',
    rgb: '80,175,149', // --usdt green
    colorVar: 'var(--usdt)',
    bgVar: 'var(--usdt-container-rgba)',
    key: 'lvl1Percent' as const,
    delay: 0,
  },
  {
    num: 2,
    label: 'Друзья друзей',
    desc: 'Те, кого пригласили ваши друзья',
    rgb: '195,166,255', // --primary purple
    colorVar: 'var(--primary)',
    bgVar: 'rgba(195,166,255,0.12)',
    key: 'lvl2Percent' as const,
    delay: 0.08,
  },
  {
    num: 3,
    label: 'Сеть 3-го уровня',
    desc: 'Те, кого пригласили друзья друзей 😁',
    rgb: '106,227,255', // --accent-network cyan
    colorVar: 'var(--accent-network)',
    bgVar: 'rgba(106,227,255,0.09)',
    key: 'lvl3Percent' as const,
    delay: 0.16,
  },
]

const tooltips: Record<number, string> = {
  1: 'Те кого пригласили вы',
  2: 'Те кого пригласили друзья',
  3: 'Те кого пригласили друзья друзей 😁',
}

/* ─── Single level card ──────────────────────────────────────────── */
interface LevelCardProps {
  num: number
  label: string
  desc: string
  rgb: string
  colorVar: string
  bgVar: string
  percent: number | undefined
  delay: number
}

function LevelCard({
  num,
  label,
  rgb,
  colorVar,
  bgVar,
  percent,
  delay,
}: LevelCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.38, ease: [0.2, 0, 0, 1] }}
      className="flex-1 min-w-0 flex flex-col gap-3 p-4 rounded-2xl"
      style={{
        background: bgVar,
        border: `1px solid rgba(${rgb},0.25)`,
        boxShadow: `0 4px 20px rgba(${rgb},0.1)`,
      }}>
      {/* Level badge + info */}
      <div className="flex items-center justify-between">
        <span
          className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full tracking-widest"
          style={{
            background: `rgba(${rgb},0.18)`,
            color: colorVar,
            border: `1px solid rgba(${rgb},0.3)`,
          }}>
          LVL {num}
        </span>
        <TooltipWrapper prompt={tooltips[num]} color="info" placement="top">
          <Info size={14} style={{ color: colorVar, opacity: 0.55 }} />
        </TooltipWrapper>
      </div>

      {/* Percent — big and prominent */}
      <div className="flex items-end gap-1.5">
        <AnimatePresence mode="wait">
          {percent !== undefined ? (
            <motion.span
              key="val"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 350 }}
              className="text-4xl font-bold font-mono leading-none"
              style={{ color: colorVar }}>
              {Math.round(100 * percent)}%
            </motion.span>
          ) : (
            <motion.span
              key="skeleton"
              className="text-4xl font-bold font-mono leading-none opacity-20"
              style={{ color: colorVar }}
              animate={{ opacity: [0.15, 0.35, 0.15] }}
              transition={{ duration: 1.2, repeat: Infinity }}>
              —%
            </motion.span>
          )}
        </AnimatePresence>
        <Currency w={18} type="usdt" />
      </div>

      {/* Labels */}
      <div className="flex flex-col gap-0.5">
        <span
          className="text-xs font-mono font-bold"
          style={{ color: colorVar, opacity: 0.9 }}>
          {label}
        </span>
      </div>
    </motion.div>
  )
}

/* ─── Main component ─────────────────────────────────────────────── */
export default function FriendsBonuses() {
  const { referralsData } = useRefferlsStore()

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Section label */}
      <div className="px-1 flex items-center gap-2">
        <span
          className="block w-1 h-1 rounded-full"
          style={{ background: 'var(--usdt)' }}
        />
        <span
          className="text-xs font-mono tracking-widest uppercase"
          style={{ color: 'var(--on-background)', opacity: 0.42 }}>
          Ваш доход за каждую оплату
        </span>
      </div>

      {/* Cards row */}
      <div className="flex gap-2">
        {LEVELS.map(({ key, ...lvl }) => (
          <LevelCard key={key} {...lvl} percent={referralsData?.[key]} />
        ))}
      </div>

      {/* Fine print */}
      <p
        className="text-[11px] font-mono px-1"
        style={{ color: 'var(--on-background)', opacity: 0.35 }}>
        Начисления происходят бессрочно с каждой оплаты реферала
      </p>
    </div>
  )
}
