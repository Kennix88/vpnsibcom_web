'use client'
import { motion } from 'framer-motion'
import { Gauge } from 'lucide-react'
import { BonusBadge } from './BonusBadge'
import { formatBytes } from './format.util'

export function TrafficBar({
  isUnlimited,
  usedBytes,
  limitBytes,
  lifetimeUsedBytes,
  accentRgb,
  defaultIsUnlimited,
  defaultLimitBytes,
}: {
  isUnlimited: boolean
  usedBytes: number
  limitBytes?: number
  lifetimeUsedBytes?: number
  accentRgb: string
  // Дефолтные значения (без выполненных заданий) — если переданы и
  // текущий лимит их превышает, рядом с лейблом показывается бейдж
  // с разницей, чтобы пользователь видел, что он уже что-то расширил.
  defaultIsUnlimited?: boolean
  defaultLimitBytes?: number
}) {
  // Безлимит был открыт заданиями (по умолчанию его не было)
  const unlimitedUnlocked = isUnlimited && defaultIsUnlimited === false

  // Числовой бонус имеет смысл сравнивать, только если обе стороны —
  // конечные лимиты (иначе "безлимит минус что-то" не считается)
  const limitBonusBytes =
    !isUnlimited && !defaultIsUnlimited && limitBytes && defaultLimitBytes
      ? limitBytes - defaultLimitBytes
      : 0

  const bonusBadge = unlimitedUnlocked ? (
    <BonusBadge
      amount="Безлимит открыт"
      tooltip="Дневной лимит трафика снят выполненными заданиями"
    />
  ) : limitBonusBytes > 0 ? (
    <BonusBadge
      amount={`+${formatBytes(limitBonusBytes)}`}
      tooltip={`Дневной лимит трафика расширен заданиями — по умолчанию было ${formatBytes(defaultLimitBytes as number)}`}
    />
  ) : null

  if (isUnlimited) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Gauge size={13} /> Ежедневный трафик
            <span
              className="text-xs font-mono truncate"
              style={{ color: 'var(--on-surface-variant)' }}></span>
            {bonusBadge}
          </div>
          <span
            className="text-xs font-mono font-bold shrink-0"
            style={{ color: `rgb(${accentRgb})` }}>
            Безлимит · {formatBytes(usedBytes)} сегодня
          </span>
        </div>
        {typeof lifetimeUsedBytes === 'number' && (
          <span
            className="text-[11px] self-end"
            style={{ color: 'var(--on-surface-variant)', opacity: 0.55 }}>
            За всё время: {formatBytes(lifetimeUsedBytes)}
          </span>
        )}
      </div>
    )
  }
  const limit = limitBytes ?? 0
  const fraction = limit > 0 ? Math.min(1, usedBytes / limit) : 0
  const isLow = fraction >= 0.9
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Gauge size={13} />
          <span
            className="text-xs font-mono truncate"
            style={{ color: 'var(--on-surface-variant)' }}>
            Ежедневный трафик
          </span>
        </div>
        {bonusBadge}
      </div>
      <div
        className="h-2 w-full rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          className="h-full rounded-full"
          initial={false}
          animate={{ width: `${fraction * 100}%` }}
          transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
          style={{
            background: isLow ? 'var(--warning)' : `rgb(${accentRgb})`,
          }}
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        {typeof lifetimeUsedBytes === 'number' && (
          <span
            className="text-[11px] self-end"
            style={{ color: 'var(--on-surface-variant)', opacity: 0.55 }}>
            За всё время: {formatBytes(lifetimeUsedBytes)}
          </span>
        )}
        <span
          className="text-xs font-mono font-bold shrink-0"
          style={{ color: isLow ? 'var(--warning)' : 'var(--on-surface)' }}>
          {formatBytes(usedBytes)} / {formatBytes(limit)}
        </span>
      </div>
    </div>
  )
}
