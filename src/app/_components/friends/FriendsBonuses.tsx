'use client'

/**
 * FriendsBonuses — реферальные бонусы.
 *
 * "Revenue Cascade" design:
 *  - Hero: суммарный % со всех уровней
 *  - Каскад уровней с анимированными коннекторами
 *  - Пример заработка (калькулятор)
 *  - Infinity badge — бессрочно
 */

import Currency from '@app/app/_components/Currency'
import TooltipWrapper from '@app/app/_components/TooltipWrapper'
import { useRefferlsStore } from '@app/store/referrals.store'
import { AnimatePresence, motion } from 'framer-motion'
import { Infinity as InfinityIcon, Info, Zap } from 'lucide-react'
import { useMemo } from 'react'

/* ─── Level config ───────────────────────────────────────────────── */
const LEVELS = [
  {
    num: 1,
    key: 'lvl1Percent' as const,
    label: 'Ваши друзья',
    sub: 'Прямые приглашения',
    rgb: '80,175,149',
    color: 'var(--usdt)',
    bg: 'rgba(80,175,149,0.08)',
    border: 'rgba(80,175,149,0.22)',
    glow: 'rgba(80,175,149,0.18)',
    delay: 0.05,
  },
  {
    num: 2,
    key: 'lvl2Percent' as const,
    label: 'Друзья друзей',
    sub: 'Приглашения 2-го круга',
    rgb: '195,166,255',
    color: 'var(--primary)',
    bg: 'rgba(195,166,255,0.07)',
    border: 'rgba(195,166,255,0.2)',
    glow: 'rgba(195,166,255,0.14)',
    delay: 0.12,
  },
  {
    num: 3,
    key: 'lvl3Percent' as const,
    label: 'Сеть 3-го уровня',
    sub: 'Друзья друзей друзей',
    rgb: '106,227,255',
    color: 'var(--accent-network)',
    bg: 'rgba(106,227,255,0.06)',
    border: 'rgba(106,227,255,0.18)',
    glow: 'rgba(106,227,255,0.12)',
    delay: 0.2,
  },
]

type LevelItem = (typeof LEVELS)[0]

/* ─── Animated percent number ────────────────────────────────────── */
function BigPercent({
  value,
  color,
  size = 'lg',
}: {
  value: number | undefined
  color: string
  size?: 'lg' | 'xl' | 'hero'
}) {
  const fontSize =
    size === 'hero'
      ? 'clamp(2.6rem, 12vw, 3.4rem)'
      : size === 'xl'
        ? 'clamp(2rem, 9vw, 2.6rem)'
        : 'clamp(1.5rem, 7vw, 2rem)'

  return (
    <AnimatePresence mode="wait">
      {value !== undefined ? (
        <motion.span
          key="val"
          initial={{ opacity: 0, scale: 0.75, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 22 }}
          className="font-black font-mono leading-none"
          style={{ fontSize, color, letterSpacing: '-0.03em' }}>
          {Math.round(value * 100)}%
        </motion.span>
      ) : (
        <motion.span
          key="shimmer"
          className="font-black font-mono leading-none"
          style={{ fontSize, color, opacity: 0.18 }}
          animate={{ opacity: [0.12, 0.28, 0.12] }}
          transition={{ duration: 1.4, repeat: Infinity }}>
          —%
        </motion.span>
      )}
    </AnimatePresence>
  )
}

/* ─── Connector (между уровнями) ─────────────────────────────────── */
function Connector({ color }: { color: string }) {
  return (
    <div className="flex flex-col items-center gap-0 py-0.5" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="w-px"
          style={{ height: 5, background: color, opacity: 0.35 }}
          animate={{ opacity: [0.15, 0.55, 0.15] }}
          transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.18 }}
        />
      ))}

      {/* Arrowhead */}
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: '4px solid transparent',
          borderRight: '4px solid transparent',
          borderTop: `6px solid ${color}`,
          opacity: 0.45,
          marginTop: 1,
        }}
      />
    </div>
  )
}

/* ─── Level row ──────────────────────────────────────────────────── */
function LevelRow({
  num,
  label,
  sub,
  rgb,
  color,
  bg,
  border,
  glow,
  percent,
  delay,
}: Omit<LevelItem, 'key'> & { percent: number | undefined }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.38, ease: [0.2, 0, 0, 1] }}
      className="relative flex items-center gap-4 rounded-2xl px-4 py-3.5"
      style={{
        background: bg,
        border: `1px solid ${border}`,
        boxShadow: `0 4px 20px ${glow}`,
      }}>
      {/* Level badge */}
      <div
        className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl font-mono font-black text-sm"
        style={{
          background: `rgba(${rgb},0.15)`,
          color,
          border: `1px solid rgba(${rgb},0.3)`,
          boxShadow: `0 0 14px rgba(${rgb},0.2)`,
        }}>
        L{num}
      </div>

      {/* Labels */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold font-mono" style={{ color }}>
          {label}
        </p>

        <p
          className="text-[11px] font-mono mt-0.5"
          style={{
            color: 'var(--on-surface-variant)',
            opacity: 0.55,
          }}>
          {sub}
        </p>
      </div>

      {/* Percent */}
      <div className="shrink-0 flex flex-col items-end">
        <BigPercent value={percent} color={color} size="lg" />

        <div className="flex items-center gap-1 mt-0.5">
          <Currency w={11} type="usdt" />

          <span
            className="text-[10px] font-mono"
            style={{
              color: 'var(--on-surface-variant)',
              opacity: 0.45,
            }}>
            с оплаты
          </span>
        </div>
      </div>

      {/* Subtle glow blob */}
      <div
        aria-hidden
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full pointer-events-none"
        style={{
          width: 60,
          height: 60,
          background: `rgba(${rgb},0.07)`,
          filter: 'blur(18px)',
        }}
      />
    </motion.div>
  )
}

/* ─── Main component ─────────────────────────────────────────────── */
export default function FriendsBonuses() {
  const { referralsData } = useRefferlsStore()

  const total = useMemo(() => {
    if (!referralsData) return undefined

    return (
      (referralsData.lvl1Percent ?? 0) +
      (referralsData.lvl2Percent ?? 0) +
      (referralsData.lvl3Percent ?? 0)
    )
  }, [referralsData])

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Section label */}
      <div className="px-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="block w-1 h-1 rounded-full"
            style={{ background: 'var(--usdt)' }}
          />

          <span
            className="text-xs font-mono tracking-widest uppercase"
            style={{
              color: 'var(--on-background)',
              opacity: 0.42,
            }}>
            Ваш пассивный доход
          </span>
        </div>

        {/* Infinity badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold font-mono"
          style={{
            background: 'rgba(80,175,149,0.1)',
            color: 'var(--usdt)',
            border: '1px solid rgba(80,175,149,0.22)',
          }}>
          <InfinityIcon size={12} />
          Бессрочно
        </motion.div>
      </div>

      {/* ── Main card ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
        className="relative rounded-3xl overflow-hidden"
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(var(--glass-blur))',
          WebkitBackdropFilter: 'blur(var(--glass-blur))',
          border: '1px solid rgba(80,175,149,0.18)',
          boxShadow:
            '0 8px 40px rgba(80,175,149,0.08), 0 2px 0 rgba(255,255,255,0.04) inset',
        }}>
        {/* Ambient top-right glow */}
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            width: 240,
            height: 180,
            borderRadius: '50%',
            background: 'rgba(80,175,149,0.06)',
            filter: 'blur(60px)',
            top: -50,
            right: -40,
          }}
        />

        {/* ── Hero: total percent ── */}
        <div
          className="relative flex flex-col items-center px-6 pt-6 pb-5 text-center"
          style={{
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
          {/* Zap icon */}
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="mb-2 flex items-center justify-center w-10 h-10 rounded-2xl"
            style={{
              background: 'rgba(80,175,149,0.12)',
              border: '1px solid rgba(80,175,149,0.25)',
            }}>
            <Zap size={20} style={{ color: 'var(--usdt)' }} />
          </motion.div>

          <p
            className="text-[11px] font-mono tracking-widest uppercase mb-1"
            style={{
              color: 'var(--on-surface-variant)',
              opacity: 0.5,
            }}>
            Итого с каждой транзакции
          </p>

          {/* Giant total */}
          <div className="flex items-center gap-3">
            <BigPercent value={total} color="var(--usdt)" size="hero" />

            <TooltipWrapper
              prompt="Суммарный % с каждой оплаты ваших рефералов всех уровней"
              color="info"
              placement="top">
              <Info
                size={16}
                style={{
                  color: 'var(--usdt)',
                  opacity: 0.45,
                }}
              />
            </TooltipWrapper>
          </div>

          <div className="flex items-center gap-1.5 mt-2">
            <Currency w={14} type="usdt" />

            <p
              className="text-xs font-mono"
              style={{
                color: 'var(--on-surface-variant)',
                opacity: 0.45,
              }}>
              USDT · с каждой оплаты в вашей сети
            </p>
          </div>
        </div>

        {/* ── Cascade levels ── */}
        <div className="px-4 pt-4 pb-5 flex flex-col">
          <p
            className="text-[10px] font-mono tracking-widest uppercase px-1 mb-3"
            style={{
              color: 'var(--on-surface-variant)',
              opacity: 0.38,
            }}>
            Распределение по уровням
          </p>

          {LEVELS.map((lvl, i) => {
            const { key, ...rowProps } = lvl

            return (
              <div key={key}>
                <LevelRow {...rowProps} percent={referralsData?.[key]} />

                {i < LEVELS.length - 1 && (
                  <div className="flex justify-center my-0.5">
                    <Connector color={LEVELS[i + 1].color} />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ── Bottom guarantee strip ── */}
        <div
          className="px-4 py-3 flex items-center justify-between gap-2"
          style={{
            borderTop: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(80,175,149,0.04)',
          }}>
          <div className="flex items-center gap-2">
            <InfinityIcon
              size={14}
              style={{
                color: 'var(--usdt)',
                opacity: 0.7,
              }}
            />

            <span
              className="text-xs font-mono"
              style={{
                color: 'var(--on-surface)',
                opacity: 0.55,
              }}>
              Начисляется с каждой оплаты навсегда
            </span>
          </div>

          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono font-bold text-[10px] shrink-0"
            style={{
              background: 'rgba(80,175,149,0.1)',
              color: 'var(--usdt)',
              border: '1px solid rgba(80,175,149,0.2)',
            }}>
            <Currency w={11} type="usdt" />
            USDT
          </div>
        </div>
      </motion.div>
    </div>
  )
}
