'use client'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Timer } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface CountdownTimerProps {
  expiryDate: string | Date
  /** Вызывается один раз в момент истечения таймера — сюда выносится любая side-effect логика (рефетч юзера и т.п.), сам компонент больше ничего не знает про API. */
  onExpire?: () => void
  /** Показывать ли готовое состояние с чекой после истечения, или просто скрыться (пусть решает родитель через unmount) */
  showDoneState?: boolean
  doneLabel?: string
  /** Цвет акцента в спокойном режиме — по умолчанию нейтральный "ожидание" */
  accentColor?: string
  /** Цвет в urgent-режиме (< 1 минуты) */
  urgentColor?: string
  urgentGlow?: string
  size?: 'sm' | 'md'
}

/* ─── Animated digit slot ────────────────────────────────────────── */
function Digit({ value }: { value: string }) {
  return (
    <span
      className="relative inline-block overflow-hidden"
      style={{ lineHeight: 1 }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 10, opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
          className="block">
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

/* ─── Component ──────────────────────────────────────────────────── */
export function CountdownTimer({
  expiryDate,
  onExpire,
  showDoneState = true,
  doneLabel = 'Готово',
  accentColor = 'var(--on-surface-variant)',
  urgentColor = 'var(--warning)',
  urgentGlow = 'rgba(255,171,64,',
  size = 'md',
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({ minutes: 0, seconds: 0 })
  const [isUrgent, setIsUrgent] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire

  useEffect(() => {
    setIsDone(false)
    const update = () => {
      const diff = new Date(expiryDate).getTime() - Date.now()
      if (diff <= 0) {
        setTimeLeft({ minutes: 0, seconds: 0 })
        setIsDone(true)
        onExpireRef.current?.()
        return false
      }
      const minutes = Math.floor(diff / 60000)
      const seconds = Math.floor((diff / 1000) % 60)
      setTimeLeft({ minutes, seconds })
      setIsUrgent(diff < 60_000) // пульс в последнюю минуту
      return true
    }

    if (!update()) return
    intervalRef.current = setInterval(() => {
      if (!update() && intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [expiryDate])

  const mm = timeLeft.minutes.toString().padStart(2, '0')
  const ss = timeLeft.seconds.toString().padStart(2, '0')
  const padY = size === 'sm' ? 'py-1' : 'py-1.5'
  const padX = size === 'sm' ? 'px-2' : 'px-2.5'
  const fontSize = size === 'sm' ? 10.5 : 12
  const iconSize = size === 'sm' ? 10 : 11

  /* Done state */
  if (isDone) {
    if (!showDoneState) return null
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 22 }}
        className={`flex items-center gap-1 ${padX} ${padY} rounded-lg font-mono font-bold`}
        style={{
          background: 'rgba(55,227,162,0.1)',
          color: 'var(--success)',
          border: '1px solid rgba(55,227,162,0.25)',
          fontSize,
        }}>
        <Check size={iconSize} strokeWidth={2.5} />
        {doneLabel}
      </motion.div>
    )
  }

  return (
    <motion.div
      animate={
        isUrgent
          ? {
              boxShadow: [
                `0 0 0 0 ${urgentGlow}0)`,
                `0 0 0 4px ${urgentGlow}0.2)`,
                `0 0 0 0 ${urgentGlow}0)`,
              ],
            }
          : { boxShadow: `0 0 0 0 ${urgentGlow}0)` }
      }
      transition={{
        duration: 1.4,
        repeat: isUrgent ? Infinity : 0,
        ease: 'easeOut',
      }}
      className={`flex items-center gap-1.5 ${padX} ${padY} rounded-lg font-mono font-bold cursor-not-allowed`}
      style={{
        background: isUrgent ? `${urgentGlow}0.12)` : `${urgentGlow}0.07)`,
        color: isUrgent ? urgentColor : accentColor,
        border: `1px solid ${isUrgent ? `${urgentGlow}0.35)` : 'rgba(255,255,255,0.08)'}`,
        fontSize,
        transition:
          'background 400ms ease, color 400ms ease, border-color 400ms ease',
      }}>
      <Timer
        size={iconSize}
        aria-hidden
        style={{ opacity: 0.7, flexShrink: 0 }}
      />
      <span className="flex items-center gap-0.5 tabular-nums">
        <Digit value={mm[0]} />
        <Digit value={mm[1]} />
        <span style={{ opacity: 0.5, marginBottom: 1 }}>:</span>
        <Digit value={ss[0]} />
        <Digit value={ss[1]} />
      </span>
    </motion.div>
  )
}
