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
  const calculateTimeLeft = () => {
    const difference = new Date(expiryDate).getTime() - new Date().getTime()
    let timeLeft = {
      minutes: 0,
      seconds: 0,
    }

    if (difference > 0) {
      timeLeft = {
        minutes: Math.floor(difference / 1000 / 60),
        seconds: Math.floor((difference / 1000) % 60),
      }
    } else {
      onTimerEnd()
    }

    return timeLeft
  }

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft())

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearTimeout(timer)
  })

  const timerComponents: string[] = []

  timerComponents.push(timeLeft.minutes.toString().padStart(2, '0'))
  timerComponents.push(timeLeft.seconds.toString().padStart(2, '0'))

  return (
    <div className="font-bold flex items-center justify-center bg-[var(--error)] text-[var(--on-error)] px-2 py-1 rounded-md uppercase cursor-not-allowed w-[52px] text-sm">
      {timerComponents.join(':')}
    </div>
  )
}
