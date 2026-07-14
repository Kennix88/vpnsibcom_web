'use client'

import { motion } from 'framer-motion'
import { formatTimeLeft } from './format.util'

/**
 * Полосатая визуализация оставшихся дней подписки.
 * Каждая полоска — один день "запаса". В отличие от прогресс-бара,
 * тут не пустой трек заполняется цветом, а наоборот: весь ещё не
 * потраченный день полностью цветной и "стекает" (сжимается) по мере
 * того, как проходят сутки — так интуитивнее читается как остаток,
 * а не как прогресс использования.
 */
export function DayStrip({
  totalDays,
  expiredAt,
  isExpired,
  accentRgb,
}: {
  totalDays: number
  expiredAt?: Date | string | null
  isExpired: boolean
  accentRgb: string
}) {
  if (!totalDays || totalDays <= 0) return null

  const end = expiredAt ? new Date(expiredAt).getTime() : null
  const start = end ? end - totalDays * 86_400_000 : null
  const msLeft = end ? end - Date.now() : 0

  // Непрерывный прогресс "потраченного" в днях (0..totalDays)
  let progressUnits = totalDays
  if (start && end && !isExpired) {
    const now = Date.now()
    const fraction = Math.min(1, Math.max(0, (now - start) / (end - start)))
    progressUnits = fraction * totalDays
  }
  if (isExpired) progressUnits = totalDays

  const consumedFullDays = Math.min(totalDays, Math.floor(progressUnits))
  const partialConsumed = isExpired ? 1 : progressUnits - consumedFullDays
  const daysLeft = Math.max(0, Math.ceil(totalDays - progressUnits))
  const isCritical = !isExpired && msLeft > 0 && msLeft <= 2 * 86_400_000

  // Ограничиваем число полосок, чтобы не сломать вёрстку на длинных планах
  const MAX_SEGMENTS = 31
  const segmentCount = Math.min(totalDays, MAX_SEGMENTS)
  const collapsed = totalDays > MAX_SEGMENTS
  const scale = collapsed ? totalDays / MAX_SEGMENTS : 1

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center justify-between gap-2">
        <span
          className="text-xs font-mono"
          style={{ color: 'var(--on-surface-variant)' }}>
          Период подписки · {totalDays} {totalDays === 1 ? 'день' : 'дней'}
        </span>
        <motion.span
          className="text-xs font-mono font-bold text-right"
          animate={isCritical ? { opacity: [1, 0.35, 1] } : { opacity: 1 }}
          transition={
            isCritical
              ? { duration: 1.1, repeat: Infinity, ease: 'easeInOut' }
              : undefined
          }
          style={{
            color: isExpired
              ? 'var(--error)'
              : isCritical
                ? 'var(--warning)'
                : 'var(--on-surface)',
          }}>
          {isExpired ? 'Истекла' : formatTimeLeft(msLeft)}
        </motion.span>
      </div>

      <div className="flex gap-[3px] w-full">
        {Array.from({ length: segmentCount }).map((_, i) => {
          const dayIndex = collapsed ? i * scale : i

          // remaining = сколько ещё "запаса" осталось в этой полоске (1 = целый день, 0 = израсходован)
          let remaining: number
          if (dayIndex < consumedFullDays) remaining = 0
          else if (dayIndex < consumedFullDays + 1)
            remaining = 1 - partialConsumed
          else remaining = 1

          const isDraining =
            dayIndex >= consumedFullDays && dayIndex < consumedFullDays + 1

          return (
            <div
              key={i}
              className="relative h-2 flex-1 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.06)' }}>
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                initial={false}
                animate={{
                  width: `${remaining * 100}%`,
                  opacity: isCritical && remaining > 0 ? [1, 0.4, 1] : 1,
                }}
                transition={
                  isCritical && remaining > 0
                    ? {
                        width: { duration: 0.4 },
                        opacity: {
                          duration: 1.1,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        },
                      }
                    : { duration: 0.4 }
                }
                style={{
                  background: isExpired ? 'var(--error)' : `rgb(${accentRgb})`,
                  opacity: isDraining ? 0.9 : 1,
                }}
              />
            </div>
          )
        })}
      </div>

      {!isExpired && (
        <span
          className="text-[11px] self-end"
          style={{ color: 'var(--on-surface-variant)', opacity: 0.55 }}>
          {daysLeft} из {totalDays} {totalDays === 1 ? 'день' : 'дней'}
        </span>
      )}
    </div>
  )
}
