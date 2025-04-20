'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { PropsWithChildren, useState } from 'react'

type TooltipProps = PropsWithChildren<{
  prompt: string
  color?: 'info' | 'warning' | 'error' | 'success' | 'default'
  placement?: 'top' | 'bottom' | 'left' | 'right'
}>

const colorMap: Record<NonNullable<TooltipProps['color']>, string> = {
  info: 'bg-[var(--info)] text-[var(--on-info)]',
  warning: 'bg-[var(--warning)] text-[var(--on-warning)]',
  error: 'bg-[var(--error)] text-[var(--on-error)]',
  success: 'bg-[var(--success)] text-[var(--on-success)]',
  default:
    'bg-[var(--surface-container-high)] text-[var(--on-surface)] border border-[var(--outline)]',
}

const placementStyleMap: Record<
  NonNullable<TooltipProps['placement']>,
  string
> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
}

export default function TooltipWrapper({
  children,
  prompt,
  color = 'default',
  placement = 'top',
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div
      className="relative inline-block font-mono cursor-pointer"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}>
      {children}

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -2 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -2 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 px-3 py-1 rounded-md text-xs whitespace-nowrap shadow-lg ${colorMap[color]} ${placementStyleMap[placement]}`}>
            {prompt}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
