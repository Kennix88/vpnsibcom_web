'use client'

import { useEffect, useState } from 'react'

interface CountdownTimerProps {
  expiryDate: string | Date
  onTimerEnd: () => void
}

export function CountdownTimer({
  expiryDate,
  onTimerEnd,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({ minutes: 0, seconds: 0 })

  useEffect(() => {
    const updateTimer = () => {
      const difference = new Date(expiryDate).getTime() - new Date().getTime()
      if (difference <= 0) {
        setTimeLeft({ minutes: 0, seconds: 0 })
        onTimerEnd()
        return false // сигнал остановки
      } else {
        setTimeLeft({
          minutes: Math.floor(difference / 1000 / 60),
          seconds: Math.floor((difference / 1000) % 60),
        })
        return true
      }
    }

    // сразу обновляем таймер при монтировании
    const running = updateTimer()

    if (!running) return

    const interval = setInterval(() => {
      const stillRunning = updateTimer()
      if (!stillRunning) clearInterval(interval)
    }, 1000)

    return () => clearInterval(interval)
  }, [expiryDate, onTimerEnd])

  return (
    <div className="font-bold flex items-center justify-center bg-[var(--error)] text-[var(--on-error)] px-2 py-1 rounded-md uppercase cursor-not-allowed w-[52px] text-sm">
      {timeLeft.minutes.toString().padStart(2, '0')}:
      {timeLeft.seconds.toString().padStart(2, '0')}
    </div>
  )
}
