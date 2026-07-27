'use client'
import { motion } from 'framer-motion'
import { useMemo } from 'react'
import Currency from '../Currency'

export type CurrencyType = 'star' | 'usdt'

const CYCLE_MS = 5800 // 2.6s движение + 3.2s пауза
const SOFT_DELAY_MS = 150

export function RewardChip({
  amount,
  type,
  size = 'md',
}: {
  amount: number
  type: CurrencyType
  size?: 'sm' | 'md'
}) {
  const isStar = type === 'star'
  const palette = isStar
    ? {
        bg: 'rgba(245,166,35,0.15)',
        color: 'var(--star)',
        border: 'rgba(245,166,35,0.3)',
      }
    : {
        bg: 'rgba(80,175,149,0.15)',
        color: 'var(--usdt)',
        border: 'rgba(80,175,149,0.3)',
      }
  const padY = size === 'sm' ? '2px' : '3px'
  const padX = size === 'sm' ? '7px' : '9px'
  const fontSize = size === 'sm' ? 11 : 12.5

  // фаза анимации привязана к реальному времени, а не к моменту mount —
  // переживает любые перемонтирования компонента без "залипания"
  const { mainDelay, softDelay } = useMemo(() => {
    const now = Date.now()
    const phase = now % CYCLE_MS
    return {
      mainDelay: -phase,
      softDelay: -((now + SOFT_DELAY_MS) % CYCLE_MS),
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400 }}
      className="relative inline-flex items-center gap-1 rounded-lg font-mono font-bold w-fit overflow-hidden"
      style={{
        background: palette.bg,
        color: palette.color,
        border: `1px solid ${palette.border}`,
        letterSpacing: '0.02em',
        padding: `${padY} ${padX}`,
        fontSize,
      }}>
      <div
        className="reward-shine pointer-events-none absolute inset-y-0 w-2/3"
        style={{
          background:
            'linear-gradient(100deg, transparent 0%, rgba(255,255,255,0.28) 45%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.28) 55%, transparent 100%)',
          filter: 'blur(0.5px)',
          animationDelay: `${mainDelay}ms`,
        }}
      />
      <div
        className="reward-shine pointer-events-none absolute inset-y-0 w-1/4"
        style={{
          background:
            'linear-gradient(100deg, transparent, rgba(255,255,255,0.18), transparent)',
          animationDelay: `${softDelay}ms`,
        }}
      />
      <span className="relative flex items-center gap-1">
        <Currency w={size === 'sm' ? 11 : 12} type={type} />+{amount}
      </span>

      <style jsx>{`
        .reward-shine {
          transform: translateX(-140%);
          animation-name: reward-shine-move;
          animation-duration: ${CYCLE_MS}ms;
          animation-timing-function: cubic-bezier(0.37, 0, 0.63, 1);
          animation-iteration-count: infinite;
        }
        @keyframes reward-shine-move {
          0% {
            transform: translateX(-140%);
          }
          30.7% {
            transform: translateX(420%);
          }
          100% {
            transform: translateX(420%);
          }
        }
      `}</style>
    </motion.div>
  )
}
