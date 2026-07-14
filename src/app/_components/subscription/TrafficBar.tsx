'use client'

import { motion } from 'framer-motion'
import { formatBytes } from './format.util'

export function TrafficBar({
  isUnlimited,
  usedBytes,
  limitBytes,
  lifetimeUsedBytes,
  accentRgb,
}: {
  isUnlimited: boolean
  usedBytes: number
  limitBytes?: number
  lifetimeUsedBytes?: number
  accentRgb: string
}) {
  if (isUnlimited) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span
            className="text-xs font-mono"
            style={{ color: 'var(--on-surface-variant)' }}>
            Ежедневный трафик
          </span>
          <span
            className="text-xs font-mono font-bold"
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
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-mono"
          style={{ color: 'var(--on-surface-variant)' }}>
          Ежедневный трафик
        </span>
        <span
          className="text-xs font-mono font-bold"
          style={{ color: isLow ? 'var(--warning)' : 'var(--on-surface)' }}>
          {formatBytes(usedBytes)} / {formatBytes(limit)}
        </span>
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
