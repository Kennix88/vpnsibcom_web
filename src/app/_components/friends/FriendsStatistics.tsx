'use client'
import Currency from '@app/app/_components/Currency'
import TooltipWrapper from '@app/app/_components/TooltipWrapper'
import { useRefferlsStore } from '@app/store/referrals.store'
import addSuffixToNumberUtil from '@app/utils/add-suffix-to-number.util'
import { motion } from 'framer-motion'
import { Info, TrendingUp, Users } from 'lucide-react'

/* ─── Types ──────────────────────────────────────────────────────── */
interface StatRowProps {
  label: string
  value: string | number | undefined
  accent?: boolean
  currency?: 'usdt' | 'count'
  tooltip?: string
}

/* ─── Shared stat row ────────────────────────────────────────────── */
function StatRow({
  label,
  value,
  accent = false,
  currency = 'usdt',
  tooltip,
}: StatRowProps) {
  return (
    <div
      className="flex items-center justify-between gap-2 py-2.5 px-4"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="flex items-center gap-2">
        <span
          className="text-xs font-mono"
          style={{
            color: 'var(--on-background)',
            fontWeight: accent ? 700 : 400,
            opacity: accent ? 0.85 : 0.5,
          }}>
          {label}
        </span>
        {tooltip && (
          <TooltipWrapper prompt={tooltip} color="info" placement="top">
            <Info
              size={12}
              style={{ color: 'var(--on-background)', opacity: 0.3 }}
            />
          </TooltipWrapper>
        )}
      </div>

      <div
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-xs font-bold"
        style={{
          background:
            currency === 'usdt'
              ? 'var(--usdt-container-rgba)'
              : 'rgba(195,166,255,0.1)',
          color: accent
            ? currency === 'usdt'
              ? 'var(--usdt)'
              : 'var(--primary)'
            : 'var(--on-background)',
          opacity: value !== undefined ? 1 : 0.4,
        }}>
        {currency === 'usdt' && <Currency w={15} type="usdt" />}
        {value !== undefined ? addSuffixToNumberUtil(Number(value), 2) : '—'}
        {currency === 'count' && (
          <span style={{ opacity: 0.5, fontSize: 10 }}>чел.</span>
        )}
      </div>
    </div>
  )
}

/* ─── Glass panel wrapper ────────────────────────────────────────── */
interface PanelProps {
  title: string
  icon: React.ElementType
  iconColor: string
  children: React.ReactNode
  delay: number
}

function StatPanel({
  title,
  icon: Icon,
  iconColor,
  children,
  delay,
}: PanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.2, 0, 0, 1] }}
      className="flex-1 rounded-2xl overflow-hidden"
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(var(--glass-blur))',
        WebkitBackdropFilter: 'blur(var(--glass-blur))',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 6px 24px rgba(0,0,0,0.25)',
      }}>
      {/* Panel header */}
      <div
        className="flex items-center gap-2 px-4 py-2.5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Icon
          size={14}
          aria-hidden
          style={{ color: iconColor, opacity: 0.8 }}
        />
        <span
          className="text-[11px] font-mono tracking-wide"
          style={{ color: 'var(--on-background)', opacity: 0.42 }}>
          {title}
        </span>
      </div>

      {children}
    </motion.div>
  )
}

/* ─── Main component ─────────────────────────────────────────────── */
export default function FriendsStatistics() {
  const { referralsData } = useRefferlsStore()

  const totalUsdt =
    referralsData != null
      ? referralsData.lvl1TotalUsdtRewarded +
        referralsData.lvl2TotalUsdtRewarded +
        referralsData.lvl3TotalUsdtRewarded
      : undefined

  const totalCount =
    referralsData != null
      ? referralsData.lvl1Count +
        referralsData.lvl2Count +
        referralsData.lvl3Count
      : undefined

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Section label */}
      <div className="px-1 flex items-center gap-2">
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

      {/* Two panels side by side on wide, stacked on narrow */}
      <div className="flex flex-col gap-3">
        {/* Earnings panel */}
        <StatPanel
          title="Ваша добыча"
          icon={TrendingUp}
          iconColor="var(--usdt)"
          delay={0}>
          <StatRow
            label="Всего заработано"
            value={totalUsdt}
            accent
            currency="usdt"
            tooltip="Суммарно за всё время"
          />
          <StatRow
            label="Уровень 1"
            value={referralsData?.lvl1TotalUsdtRewarded}
            currency="usdt"
          />
          <StatRow
            label="Уровень 2"
            value={referralsData?.lvl2TotalUsdtRewarded}
            currency="usdt"
          />
          <div style={{ borderBottom: 'none' }}>
            <StatRow
              label="Уровень 3"
              value={referralsData?.lvl3TotalUsdtRewarded}
              currency="usdt"
            />
          </div>
        </StatPanel>

        {/* Invited panel */}
        <StatPanel
          title="Приглашено"
          icon={Users}
          iconColor="var(--primary)"
          delay={0.1}>
          <StatRow
            label="Всего друзей"
            value={totalCount}
            accent
            currency="count"
          />
          <StatRow
            label="Уровень 1"
            value={referralsData?.lvl1Count}
            currency="count"
          />
          <StatRow
            label="Уровень 2"
            value={referralsData?.lvl2Count}
            currency="count"
          />
          <div style={{ borderBottom: 'none' }}>
            <StatRow
              label="Уровень 3"
              value={referralsData?.lvl3Count}
              currency="count"
            />
          </div>
        </StatPanel>
      </div>
    </div>
  )
}
