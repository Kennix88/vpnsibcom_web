'use client'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Clock, Loader2, Sparkle } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import TooltipWrapper from '../TooltipWrapper'
import { CountdownTimer } from './CountdownTimer'
import { RewardChip, type CurrencyType } from './RewardChip'
import { TASK_ICON_PRESETS, type TaskIconPreset } from './taskIconPresets'

export type TaskState = 'ready' | 'pending' | 'completed'

export interface TaskReward {
  amount: number
  type: CurrencyType
}

export interface TaskCardProps {
  /** Заголовок задачи */
  title: string
  /** Доп. описание/подсказка — рендерится как info-тултип рядом с заголовком */
  tooltip?: string
  /** Кастомное изображение вместо иконки-пресета */
  imageUrl?: string
  /** Пресет иконки + цветовой схемы, если imageUrl не задан */
  icon?: TaskIconPreset
  /** Награды за выполнение */
  rewards: TaskReward[]
  /**
   * Дата, до которой задача недоступна (кулдаун).
   * Пока не истекла — состояние 'ready' рендерится как countdown, клик недоступен.
   */
  cooldownUntil?: string | Date | null
  /** Колбэк в момент истечения кулдауна — например рефетч пользователя, чтобы обновить nextAdsRewardAt и переключить карточку обратно в активное состояние */
  onCooldownExpire?: () => void
  /** Текущее состояние выполнения задачи */
  state: TaskState
  /** Вызывается при клике в состояниях ready/pending — переход к действию (канал/ссылка/бот) */
  onAction: () => void
  /** Внешний лоадер (например пока идёт запрос на бэк) */
  isLoading?: boolean
  /** Полностью заблокировать карточку (например нет сети) */
  disabled?: boolean
  /** Переопределить подпись в pending-состоянии, дефолт "Проверяем..." */
  pendingLabel?: string
}

export function TaskCard({
  title,
  tooltip,
  imageUrl,
  icon = 'default',
  rewards,
  cooldownUntil,
  onCooldownExpire,
  state,
  onAction,
  isLoading = false,
  disabled = false,
  pendingLabel = 'На проверке',
}: TaskCardProps) {
  const [isHovering, setIsHovering] = useState(false)
  const scheme = TASK_ICON_PRESETS[icon]
  const { Icon } = scheme

  const isCoolingDown = Boolean(
    cooldownUntil && new Date(cooldownUntil) > new Date(),
  )
  const isCompleted = state === 'completed'
  const isPending = state === 'pending' && !isCompleted
  // Completed и cooldown блокируют клик; pending — намеренно НЕ блокирует,
  // пользователь может повторно перейти к действию (напр. снова открыть канал).
  const isActionable = !isCompleted && !isCoolingDown && !disabled && !isLoading

  const Shell = isActionable ? motion.button : motion.div

  // --- Цветовая схема по состоянию ---
  const accent = isCompleted ? 'var(--success)' : scheme.accent
  const border = isCompleted
    ? 'rgba(55,227,162,0.22)'
    : isPending
      ? 'rgba(255,171,64,0.2)'
      : isCoolingDown
        ? 'rgba(255,255,255,0.06)'
        : scheme.border
  const glow = isCompleted ? 'rgba(55,227,162,0.18)' : scheme.glow

  return (
    <Shell
      type={isActionable ? 'button' : undefined}
      onClick={isActionable ? onAction : undefined}
      disabled={isActionable ? false : undefined}
      onHoverStart={isActionable ? () => setIsHovering(true) : undefined}
      onHoverEnd={isActionable ? () => setIsHovering(false) : undefined}
      className="relative flex items-center gap-2.5 w-full rounded-2xl overflow-hidden text-left"
      style={{
        background:
          isActionable && !isPending
            ? `linear-gradient(160deg, ${glow.replace(/[\d.]+\)$/, '0.1)')}, var(--glass-bg) 60%)`
            : 'var(--glass-bg)',
        backdropFilter: 'blur(var(--glass-blur))',
        WebkitBackdropFilter: 'blur(var(--glass-blur))',
        border: `1px solid ${border}`,
        boxShadow: isActionable
          ? [
              '0 6px 24px rgba(0,0,0,0.28)',
              'inset 0 1px 0 rgba(255,255,255,0.06)',
              isHovering ? `0 8px 28px ${glow}` : '0 0 0 rgba(0,0,0,0)',
            ].join(', ')
          : '0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
        padding: '10px 12px',
        cursor: isActionable ? 'pointer' : 'default',
        opacity: isCompleted ? 0.7 : isCoolingDown ? 0.82 : disabled ? 0.5 : 1,
        transition:
          'border-color 400ms ease, background 400ms ease, opacity 400ms ease',
      }}
      initial={{ opacity: 0, y: 8 }}
      animate={{
        opacity: isCompleted ? 0.7 : isCoolingDown ? 0.82 : disabled ? 0.5 : 1,
        y: 0,
      }}
      whileHover={isActionable ? { scale: 1.014, y: -1 } : undefined}
      whileTap={isActionable ? { scale: 0.98 } : undefined}
      transition={{ duration: 0.35, ease: [0.2, 0, 0, 1] }}>
      {/* ambient glow blob */}
      {isActionable && !isPending && (
        <motion.div
          className="pointer-events-none absolute -top-8 -right-6 w-24 h-24 rounded-full blur-2xl"
          style={{ background: glow }}
          animate={{ opacity: isHovering ? 0.9 : 0.5 }}
          transition={{ duration: 0.4 }}
        />
      )}

      {/* левая акцентная полоса */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl"
        style={{
          background: isCompleted
            ? 'linear-gradient(to bottom, var(--success), rgba(55,227,162,0.15))'
            : isPending
              ? 'linear-gradient(to bottom, rgba(255,171,64,0.5), rgba(255,171,64,0.15))'
              : isCoolingDown
                ? 'linear-gradient(to bottom, rgba(255,171,64,0.5), rgba(255,171,64,0.15))'
                : `linear-gradient(to bottom, ${accent}, transparent)`,
          transition: 'background 500ms ease',
        }}
      />

      {/* shimmer sweep — только в активном "ready" без кулдауна */}
      {isActionable && !isPending && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(105deg, transparent 40%, ${glow.replace(/[\d.]+\)$/, '0.08)')} 50%, transparent 60%)`,
          }}
          animate={{ x: ['-100%', '200%'] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatDelay: 5,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* мини-искры при hover, только для активных не-pending задач */}
      <AnimatePresence>
        {isActionable && !isPending && isHovering && (
          <>
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="pointer-events-none absolute"
                style={{ color: accent, right: `${18 + i * 14}%`, bottom: 6 }}
                initial={{ opacity: 0, y: 0, scale: 0.5 }}
                animate={{ opacity: [0, 1, 0], y: -26, scale: [0.5, 1, 0.7] }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 1.1,
                  delay: i * 0.15,
                  repeat: Infinity,
                  repeatDelay: 0.4,
                  ease: 'easeOut',
                }}>
                <Sparkle size={9} fill="currentColor" strokeWidth={0} />
              </motion.span>
            ))}
          </>
        )}
      </AnimatePresence>

      {/* --- Иконка / изображение --- */}
      <motion.div
        animate={
          isActionable && !isPending
            ? {
                boxShadow: [
                  '0 0 0px rgba(0,0,0,0)',
                  `0 0 14px ${glow}`,
                  '0 0 0px rgba(0,0,0,0)',
                ],
              }
            : { boxShadow: '0 0 0px rgba(0,0,0,0)' }
        }
        transition={
          isActionable && !isPending
            ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 0.3 }
        }
        whileHover={isActionable ? { scale: 1.06 } : undefined}
        whileTap={isActionable ? { scale: 0.95 } : undefined}
        className="relative flex items-center justify-center w-9 h-9 rounded-xl shrink-0 ml-1 overflow-hidden"
        style={{
          background: isCompleted
            ? 'rgba(55,227,162,0.1)'
            : isPending || isCoolingDown
              ? 'rgba(255,171,64,0.08)'
              : isHovering
                ? scheme.gradient
                : scheme.containerBg,
          color: isCompleted
            ? 'var(--success)'
            : isPending || isCoolingDown
              ? 'var(--warning)'
              : isHovering
                ? scheme.onAccent
                : scheme.accent,
          border: `1px solid ${
            isCompleted
              ? 'rgba(55,227,162,0.22)'
              : isPending || isCoolingDown
                ? 'rgba(255,171,64,0.2)'
                : scheme.border
          }`,
          transition: 'background 350ms ease, color 350ms ease',
        }}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            fill
            sizes="36px"
            className="object-cover"
          />
        ) : isCompleted ? (
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}>
            <Check size={16} strokeWidth={2.5} />
          </motion.div>
        ) : isPending ? (
          <Clock size={15} />
        ) : (
          <motion.div
            animate={isHovering ? { rotate: 10 } : { rotate: 0 }}
            transition={{ duration: 0.35, ease: [0.2, 0, 0, 1] }}>
            <Icon size={15} />
          </motion.div>
        )}

        {/* маленький бейдж поверх иконки — не completed, но pending */}
        {isPending && !imageUrl && (
          <span
            className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center w-3.5 h-3.5 rounded-full"
            style={{
              background: 'var(--warning)',
              border: '1.5px solid var(--surface)',
            }}
          />
        )}
      </motion.div>

      {/* --- Центр: заголовок + награды --- */}
      <div className="flex flex-col gap-1 grow min-w-0">
        <div className="min-w-0">
          {tooltip ? (
            <span
              onClick={(e) => e.stopPropagation()}
              className="inline-block align-top">
              <TooltipWrapper prompt={tooltip} color="info">
                <span
                  className="text-[13px] font-bold font-mono cursor-help"
                  style={{
                    color: isCompleted
                      ? 'var(--on-surface-variant)'
                      : 'var(--on-surface)',
                    textDecoration: isCompleted ? 'line-through' : 'underline',
                    textDecorationStyle: isCompleted ? 'solid' : 'dotted',
                    textDecorationColor: isCompleted
                      ? 'rgba(233,230,234,0.35)'
                      : 'rgba(89,191,255,0.4)',
                    textUnderlineOffset: '3px',
                  }}>
                  {title}
                  {'\u00A0'}
                  <span
                    className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-extrabold align-middle border border-(--info)"
                    style={{
                      background: 'rgba(89,191,255,0.08)',
                      color: 'var(--info)',
                    }}>
                    i
                  </span>
                </span>
              </TooltipWrapper>
            </span>
          ) : (
            <span
              className="text-[13px] font-bold font-mono"
              style={{
                color: isCompleted
                  ? 'var(--on-surface-variant)'
                  : 'var(--on-surface)',
                textDecoration: isCompleted ? 'line-through' : 'none',
                textDecorationColor: 'rgba(233,230,234,0.35)',
              }}>
              {title}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {isPending ? (
            <span
              className="text-[11px] font-mono font-semibold"
              style={{ color: 'var(--warning)' }}>
              {pendingLabel}
            </span>
          ) : (
            rewards.map((r, i) => (
              <RewardChip key={i} amount={r.amount} type={r.type} size="sm" />
            ))
          )}
        </div>
      </div>

      {/* --- Правая зона: статус/действие --- */}
      <div className="shrink-0 flex items-center justify-center">
        {isCompleted ? (
          <span
            className="flex items-center justify-center w-9 h-9"
            style={{ color: 'var(--success)' }}>
            <Check size={16} strokeWidth={2.5} />
          </span>
        ) : isCoolingDown && cooldownUntil ? (
          <CountdownTimer
            expiryDate={cooldownUntil}
            onExpire={onCooldownExpire}
            size="sm"
            urgentColor="var(--warning)"
            urgentGlow="rgba(255,171,64,"
          />
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            {isLoading ? (
              <motion.span
                key="spin"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.15 }}
                className="flex items-center justify-center w-9 h-9">
                <Loader2
                  size={16}
                  className="animate-spin"
                  style={{ color: 'var(--on-surface-variant)' }}
                />
              </motion.span>
            ) : (
              <motion.span
                key="arrow"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.15 }}
                className="flex items-center justify-center w-9 h-9"
                style={{ color: isPending ? 'var(--warning)' : accent }}>
                <motion.svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  animate={isHovering ? { x: [0, 3, 0] } : { x: 0 }}
                  transition={{
                    duration: 0.9,
                    repeat: isHovering ? Infinity : 0,
                    ease: 'easeInOut',
                  }}>
                  <path
                    d="M6 4L10 8L6 12"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </motion.svg>
              </motion.span>
            )}
          </AnimatePresence>
        )}
      </div>
    </Shell>
  )
}
