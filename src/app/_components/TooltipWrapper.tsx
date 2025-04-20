'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  PropsWithChildren,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

type TooltipProps = PropsWithChildren<{
  prompt: string
  color?: 'info' | 'warning' | 'error' | 'success' | 'default'
  placement?: 'top' | 'bottom' | 'left' | 'right'
}>

const colorMap: Record<NonNullable<TooltipProps['color']>, string> = {
  info: 'bg-[var(--info-container)] text-[var(--on-info-container)]',
  warning: 'bg-[var(--warning)] text-[var(--on-warning)]',
  error: 'bg-[var(--error)] text-[var(--on-error)]',
  success: 'bg-[var(--success)] text-[var(--on-success)]',
  default:
    'bg-[var(--surface-container-high)] text-[var(--on-surface)] border border-[var(--outline)]',
}

export default function TooltipWrapper({
  children,
  prompt,
  color = 'default',
  placement = 'top',
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [style, setStyle] = useState<React.CSSProperties>({})
  const wrapperRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const hideOnScroll = () => {
      setIsVisible(false)
    }

    if (isVisible) {
      window.addEventListener('scroll', hideOnScroll, true)
    }

    return () => {
      window.removeEventListener('scroll', hideOnScroll, true)
    }
  }, [isVisible])

  useLayoutEffect(() => {
    if (!isVisible || !tooltipRef.current || !wrapperRef.current) return

    const tooltip = tooltipRef.current
    const wrapper = wrapperRef.current
    // const tooltipRect = tooltip.getBoundingClientRect()
    const wrapperRect = wrapper.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const margin = 8

    let top = 0
    let left = 0

    // начальная позиция тултипа
    switch (placement) {
      case 'top':
        top = wrapperRect.top - tooltip.offsetHeight - margin
        left =
          wrapperRect.left + wrapperRect.width / 2 - tooltip.offsetWidth / 2
        break
      case 'bottom':
        top = wrapperRect.bottom + margin
        left =
          wrapperRect.left + wrapperRect.width / 2 - tooltip.offsetWidth / 2
        break
      case 'left':
        top =
          wrapperRect.top + wrapperRect.height / 2 - tooltip.offsetHeight / 2
        left = wrapperRect.left - tooltip.offsetWidth - margin
        break
      case 'right':
        top =
          wrapperRect.top + wrapperRect.height / 2 - tooltip.offsetHeight / 2
        left = wrapperRect.right + margin
        break
    }

    // ограничение по экранам (все 4 стороны)
    const clampedTop = Math.max(
      margin,
      Math.min(viewportHeight - tooltip.offsetHeight - margin, top),
    )
    const clampedLeft = Math.max(
      margin,
      Math.min(viewportWidth - tooltip.offsetWidth - margin, left),
    )

    setStyle({
      top: clampedTop,
      left: clampedLeft,
    })
  }, [isVisible, placement])

  return (
    <div
      ref={wrapperRef}
      className="relative inline-flex items-center justify-center font-mono"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}>
      {children}

      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`fixed z-50 px-3 py-2 rounded-md text-xs shadow-xl text-center 
              max-w-[min(90vw,300px)] w-max break-words whitespace-pre-wrap ${colorMap[color]}`}
            style={style}>
            {prompt}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
