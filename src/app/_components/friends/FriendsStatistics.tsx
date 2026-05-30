'use client'

/**
 * FriendsStatistics — реферальная статистика.
 *
 * Redesigned as a premium "achievement card":
 *  - Hero number (total USDT) с крупной типографикой и свечением
 *  - Tier-система (Bronze → Silver → Gold → Diamond) по сумме дохода
 *  - Анимированные level-bars с процентами
 *  - Сетка по людям с иконками
 *  - Декоративные corner-accents, gradient border
 *  - Всё на framer-motion
 */

import Currency from '@app/app/_components/Currency'
import TooltipWrapper from '@app/app/_components/TooltipWrapper'
import { useRefferlsStore } from '@app/store/referrals.store'
import addSuffixToNumberUtil from '@app/utils/add-suffix-to-number.util'
import { motion } from 'framer-motion'
import { Info } from 'lucide-react'
import { useMemo } from 'react'

/* ─── Tier system ────────────────────────────────────────────────── */
type Tier = 'bronze' | 'silver' | 'gold' | 'diamond'

const TIERS: {
  key: Tier
  label: string
  minUsdt: number
  color: string
  glow: string
  border: string
  bg: string
  emoji: string
}[] = [
  {
    key: 'bronze',
    label: 'Бронзовый',
    minUsdt: 0,
    color: '#cd7f32',
    glow: 'rgba(205,127,50,0.22)',
    border: 'rgba(205,127,50,0.35)',
    bg: 'rgba(205,127,50,0.08)',
    emoji: '🥉',
  },
  {
    key: 'silver',
    label: 'Серебряный',
    minUsdt: 50,
    color: '#c0c0c0',
    glow: 'rgba(192,192,192,0.22)',
    border: 'rgba(192,192,192,0.35)',
    bg: 'rgba(192,192,192,0.07)',
    emoji: '🥈',
  },
  {
    key: 'gold',
    label: 'Золотой',
    minUsdt: 250,
    color: '#febd04',
    glow: 'rgba(254,189,4,0.25)',
    border: 'rgba(254,189,4,0.4)',
    bg: 'rgba(254,189,4,0.08)',
    emoji: '🥇',
  },
  {
    key: 'diamond',
    label: 'Бриллиант',
    minUsdt: 1000,
    color: '#6ae3ff',
    glow: 'rgba(106,227,255,0.25)',
    border: 'rgba(106,227,255,0.4)',
    bg: 'rgba(106,227,255,0.07)',
    emoji: '💎',
  },
]

function getTier(usdt: number) {
  return [...TIERS].reverse().find((t) => usdt >= t.minUsdt) ?? TIERS[0]
}

/* ─── Level bar ──────────────────────────────────────────────────── */
function LevelBar({
  level,
  usdt,
  count,
  pct,
  delay,
}: {
  level: 1 | 2 | 3
  usdt: number | undefined
  count: number | undefined
  pct: number
  delay: number
}) {
  const colors: Record<number, { bar: string; badge: string; text: string }> = {
    1: {
      bar: 'var(--usdt)',
      badge: 'rgba(80,175,149,0.15)',
      text: 'var(--usdt)',
    },
    2: {
      bar: 'var(--primary)',
      badge: 'rgba(195,166,255,0.12)',
      text: 'var(--primary)',
    },
    3: {
      bar: 'var(--accent-network)',
      badge: 'rgba(106,227,255,0.10)',
      text: 'var(--accent-network)',
    },
  }
  const c = colors[level]

  return (
    <div className="flex flex-col gap-1">
      {/* Label row */}
      <div className="flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <span
            className="px-2 py-0.5 rounded-md font-bold text-[10px]"
            style={{ background: c.badge, color: c.text }}>
            LVL {level}
          </span>
          <span style={{ color: 'var(--on-surface-variant)', opacity: 0.6 }}>
            {count !== undefined ? `${count} чел.` : '—'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold" style={{ color: c.text }}>
            {usdt !== undefined ? addSuffixToNumberUtil(usdt, 2) : '—'}
          </span>
          <Currency w={13} type="usdt" />
          <span
            className="text-[10px] ml-1"
            style={{ color: 'var(--on-surface-variant)', opacity: 0.45 }}>
            {pct > 0 ? `${Math.round(pct)}%` : '0%'}
          </span>
        </div>
      </div>
      {/* Bar track */}
      <div
        className="h-1.5 rounded-full overflow-hidden w-full"
        style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, delay, ease: [0.2, 0, 0, 1] }}
          style={{ background: c.bar }}
        />
      </div>
    </div>
  )
}

/* ─── Corner accent SVG ──────────────────────────────────────────── */
function CornerAccent({
  pos,
  color,
}: {
  pos: 'tl' | 'tr' | 'bl' | 'br'
  color: string
}) {
  const transforms: Record<string, string> = {
    tl: 'none',
    tr: 'scaleX(-1)',
    bl: 'scaleY(-1)',
    br: 'scale(-1,-1)',
  }
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      className="absolute"
      style={{
        top: pos.startsWith('t') ? 0 : 'auto',
        bottom: pos.startsWith('b') ? 0 : 'auto',
        left: pos.endsWith('l') ? 0 : 'auto',
        right: pos.endsWith('r') ? 0 : 'auto',
        transform: transforms[pos],
        opacity: 0.6,
      }}>
      <path
        d="M2 18 L2 2 L18 2"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

/* ─── Skeleton shimmer ───────────────────────────────────────────── */
function Shimmer({ w = '100%', h = 16 }: { w?: string | number; h?: number }) {
  return (
    <motion.div
      className="rounded-lg"
      animate={{ opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        width: w,
        height: h,
        background: 'rgba(255,255,255,0.07)',
      }}
    />
  )
}

/* ─── Main component ─────────────────────────────────────────────── */
export default function FriendsStatistics() {
  const { referralsData } = useRefferlsStore()

  const loading = referralsData == null

  const totalUsdt = useMemo(
    () =>
      referralsData != null
        ? referralsData.lvl1TotalUsdtRewarded +
          referralsData.lvl2TotalUsdtRewarded +
          referralsData.lvl3TotalUsdtRewarded
        : 0,
    [referralsData],
  )

  const totalCount = useMemo(
    () =>
      referralsData != null
        ? referralsData.lvl1Count +
          referralsData.lvl2Count +
          referralsData.lvl3Count
        : 0,
    [referralsData],
  )

  const tier = getTier(totalUsdt)

  /* Процентное распределение дохода по уровням */
  const pcts = useMemo(() => {
    if (!referralsData || totalUsdt === 0) return [0, 0, 0]
    return [
      (referralsData.lvl1TotalUsdtRewarded / totalUsdt) * 100,
      (referralsData.lvl2TotalUsdtRewarded / totalUsdt) * 100,
      (referralsData.lvl3TotalUsdtRewarded / totalUsdt) * 100,
    ]
  }, [referralsData, totalUsdt])

  /* Следующий тир: сколько ещё нужно */
  const nextTier = TIERS[TIERS.findIndex((t) => t.key === tier.key) + 1]
  const progressToNext =
    nextTier && totalUsdt < nextTier.minUsdt
      ? ((totalUsdt - tier.minUsdt) / (nextTier.minUsdt - tier.minUsdt)) * 100
      : 100

  return (
    <div className="w-full flex flex-col gap-3">
      {/* ── Section header ── */}
      <div className="px-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="block w-1 h-1 rounded-full"
            style={{ background: 'var(--primary)' }}
          />
          <span
            className="text-xs font-mono tracking-widest uppercase"
            style={{ color: 'var(--on-background)', opacity: 0.42 }}>
            Статистика
          </span>
        </div>
        {/* Tier badge */}
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold font-mono"
          style={{
            background: tier.bg,
            color: tier.color,
            border: `1px solid ${tier.border}`,
          }}>
          {tier.emoji} {tier.label}
        </motion.span>
      </div>

      {/* ── Main achievement card ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
        className="relative rounded-3xl overflow-hidden"
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(var(--glass-blur))',
          WebkitBackdropFilter: 'blur(var(--glass-blur))',
          border: `1px solid ${tier.border}`,
          boxShadow: `0 8px 40px ${tier.glow}, 0 2px 0 rgba(255,255,255,0.04) inset`,
        }}>
        {/* Corner accents */}
        <CornerAccent pos="tl" color={tier.color} />
        <CornerAccent pos="tr" color={tier.color} />
        <CornerAccent pos="bl" color={tier.color} />
        <CornerAccent pos="br" color={tier.color} />

        {/* Ambient glow blob */}
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: tier.glow,
            filter: 'blur(60px)',
            top: -60,
            right: -40,
          }}
        />

        {/* ── Hero section: total earnings ── */}
        <div
          className="relative flex flex-col items-center px-6 pt-7 pb-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {/* Tiny label */}
          <p
            className="text-[11px] font-mono tracking-widest uppercase mb-2"
            style={{ color: 'var(--on-surface-variant)', opacity: 0.5 }}>
            Заработано всего
          </p>

          {/* Giant number */}
          {loading ? (
            <div className="flex items-center gap-3 my-1">
              <Shimmer w={180} h={48} />
            </div>
          ) : (
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, duration: 0.5, ease: [0.2, 0, 0, 1] }}>
              <Currency w={28} type="usdt" />
              <span
                className="font-mono font-black leading-none"
                style={{
                  fontSize: 'clamp(2rem, 10vw, 2.8rem)',
                  color: 'var(--usdt)',
                  textShadow: `0 0 30px rgba(80,175,149,0.45)`,
                  letterSpacing: '-0.02em',
                }}>
                {addSuffixToNumberUtil(totalUsdt, 2)}
              </span>
            </motion.div>
          )}

          {/* USDT label */}
          <p
            className="text-xs font-mono mt-1"
            style={{ color: 'var(--on-surface-variant)', opacity: 0.35 }}>
            USDT · за всё время
          </p>

          {/* Progress to next tier */}
          {nextTier && !loading && (
            <div className="w-full mt-4 flex flex-col gap-1.5">
              <div
                className="flex justify-between text-[10px] font-mono"
                style={{ color: 'var(--on-surface-variant)', opacity: 0.5 }}>
                <span>
                  {tier.emoji} {tier.label}
                </span>
                <TooltipWrapper
                  prompt={`До ${nextTier.label}: заработайте ещё ${addSuffixToNumberUtil(nextTier.minUsdt - totalUsdt, 2)} USDT`}
                  color="info"
                  placement="top">
                  <span className="flex items-center gap-1 cursor-default">
                    До {nextTier.emoji} {nextTier.label}
                    <Info size={10} style={{ opacity: 0.5 }} />
                  </span>
                </TooltipWrapper>
              </div>
              <div
                className="h-1 rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.07)' }}>
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressToNext}%` }}
                  transition={{ duration: 1, delay: 0.4, ease: [0.2, 0, 0, 1] }}
                  style={{
                    background: `linear-gradient(90deg, ${tier.color}, ${nextTier.color})`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Level breakdown ── */}
        <div
          className="px-5 py-4 flex flex-col gap-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <p
            className="text-[10px] font-mono tracking-widest uppercase"
            style={{ color: 'var(--on-surface-variant)', opacity: 0.4 }}>
            Доход по уровням
          </p>
          {loading ? (
            <div className="flex flex-col gap-3">
              {[0, 1, 2].map((i) => (
                <Shimmer key={i} h={20} />
              ))}
            </div>
          ) : (
            <>
              <LevelBar
                level={1}
                usdt={referralsData?.lvl1TotalUsdtRewarded}
                count={referralsData?.lvl1Count}
                pct={pcts[0]}
                delay={0.1}
              />
              <LevelBar
                level={2}
                usdt={referralsData?.lvl2TotalUsdtRewarded}
                count={referralsData?.lvl2Count}
                pct={pcts[1]}
                delay={0.2}
              />
              <LevelBar
                level={3}
                usdt={referralsData?.lvl3TotalUsdtRewarded}
                count={referralsData?.lvl3Count}
                pct={pcts[2]}
                delay={0.3}
              />
            </>
          )}
        </div>

        {/* ── Network size ── */}
        <div className="px-5 py-4">
          <div className="flex items-center justify-between">
            {/* Total people */}
            <div className="flex flex-col gap-0.5">
              <p
                className="text-[10px] font-mono tracking-widest uppercase"
                style={{ color: 'var(--on-surface-variant)', opacity: 0.4 }}>
                Твоя сеть
              </p>
              {loading ? (
                <Shimmer w={80} h={28} />
              ) : (
                <motion.div
                  className="flex items-baseline gap-1.5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 }}>
                  <span
                    className="font-mono font-black"
                    style={{
                      fontSize: '1.75rem',
                      color: 'var(--primary)',
                      textShadow: '0 0 20px rgba(195,166,255,0.35)',
                      letterSpacing: '-0.02em',
                    }}>
                    {totalCount}
                  </span>
                  <span
                    className="text-sm font-mono"
                    style={{
                      color: 'var(--on-surface-variant)',
                      opacity: 0.5,
                    }}>
                    чел.
                  </span>
                </motion.div>
              )}
            </div>

            {/* Level breakdown pills */}
            {!loading && (
              <motion.div
                className="flex flex-col gap-1.5 items-end"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}>
                {(
                  [
                    { l: 1, v: referralsData?.lvl1Count, color: 'var(--usdt)' },
                    {
                      l: 2,
                      v: referralsData?.lvl2Count,
                      color: 'var(--primary)',
                    },
                    {
                      l: 3,
                      v: referralsData?.lvl3Count,
                      color: 'var(--accent-network)',
                    },
                  ] as const
                ).map(({ l, v, color }) => (
                  <div key={l} className="flex items-center gap-2">
                    <span
                      className="text-[10px] font-mono"
                      style={{
                        color: 'var(--on-surface-variant)',
                        opacity: 0.45,
                      }}>
                      LVL {l}
                    </span>
                    <span
                      className="font-mono font-bold text-xs px-2 py-0.5 rounded-lg min-w-[32px] text-center"
                      style={{
                        color,
                        background: `${color.replace('var(', 'rgba(').replace(')', ',0.12)')}`,
                        border: `1px solid ${color.replace('var(', 'rgba(').replace(')', ',0.2)')}`,
                      }}>
                      {v ?? 0}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
