'use client'
import { authApiClient } from '@app/core/authApiClient'
import { useUserStore } from '@app/store/user.store'
import { AnimatePresence, motion } from 'framer-motion'
import { Timer } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface CountdownTimerProps {
  expiryDate: string | Date
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
export function CountdownTimer({ expiryDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({ minutes: 0, seconds: 0 })
  const [isUrgent, setIsUrgent] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const { setUser } = useUserStore()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const update = () => {
      const diff = new Date(expiryDate).getTime() - Date.now()
      if (diff <= 0) {
        setTimeLeft({ minutes: 0, seconds: 0 })
        setIsDone(true)
        void authApiClient.getMe().then((res) => setUser(res))
        return false
      }
      const minutes = Math.floor(diff / 60000)
      const seconds = Math.floor((diff / 1000) % 60)
      setTimeLeft({ minutes, seconds })
      setIsUrgent(diff < 60_000) // pulse when under 1 minute
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
  }, [expiryDate, setUser])

  const mm = timeLeft.minutes.toString().padStart(2, '0')
  const ss = timeLeft.seconds.toString().padStart(2, '0')

  /* Done state */
  if (isDone) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-mono text-[11px] font-bold"
        style={{
          background: 'rgba(55,227,162,0.1)',
          color: 'var(--success)',
          border: '1px solid rgba(55,227,162,0.25)',
        }}>
        ✓ Готово
      </motion.div>
    )
  }

  return (
    <motion.div
      animate={
        isUrgent
          ? {
              boxShadow: [
                '0 0 0 0 rgba(255,171,64,0)',
                '0 0 0 4px rgba(255,171,64,0.2)',
                '0 0 0 0 rgba(255,171,64,0)',
              ],
            }
          : { boxShadow: '0 0 0 0 rgba(255,171,64,0)' }
      }
      transition={{
        duration: 1.4,
        repeat: isUrgent ? Infinity : 0,
        ease: 'easeOut',
      }}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-mono font-bold cursor-not-allowed"
      style={{
        background: isUrgent
          ? 'rgba(255,171,64,0.12)'
          : 'rgba(255,171,64,0.07)',
        color: isUrgent ? 'var(--warning)' : 'var(--on-surface-variant)',
        border: `1px solid ${isUrgent ? 'rgba(255,171,64,0.35)' : 'rgba(255,255,255,0.08)'}`,
        fontSize: 12,
        transition:
          'background 400ms ease, color 400ms ease, border-color 400ms ease',
      }}>
      <Timer size={11} aria-hidden style={{ opacity: 0.7, flexShrink: 0 }} />
      {/* Animated digit pairs */}
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
