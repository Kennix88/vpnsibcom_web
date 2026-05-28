'use client'

import {
  AnimatePresence,
  motion,
  type TargetAndTransition,
} from 'framer-motion'
import {
  type CSSProperties,
  type PropsWithChildren,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

type Placement = 'top' | 'bottom' | 'left' | 'right'
type ColorKey = 'info' | 'warning' | 'error' | 'success' | 'default'

type TooltipProps = PropsWithChildren<{
  prompt: string
  color?: ColorKey
  placement?: Placement
}>

/* ────────────────────────────────────────────────────────────── */
/* Color config */
/* ────────────────────────────────────────────────────────────── */

const COLOR_CFG: Record<
  ColorKey,
  { bg: string; text: string; border: string }
> = {
  info: {
    bg: 'var(--info-container)',
    text: 'var(--on-info-container)',
    border: 'rgba(89,191,255,0.3)',
  },
  warning: {
    bg: 'var(--warning-container)',
    text: 'var(--on-warning-container)',
    border: 'rgba(255,171,64,0.3)',
  },
  error: {
    bg: 'var(--error-container)',
    text: 'var(--on-error-container)',
    border: 'rgba(255,107,102,0.3)',
  },
  success: {
    bg: 'var(--success-container)',
    text: 'var(--on-success-container)',
    border: 'rgba(55,227,162,0.3)',
  },
  default: {
    bg: 'var(--surface-container-highest)',
    text: 'var(--on-surface)',
    border: 'rgba(255,255,255,0.1)',
  },
}

/* ────────────────────────────────────────────────────────────── */
/* Motion variants */
/* ────────────────────────────────────────────────────────────── */

type TooltipVariants = {
  hidden: TargetAndTransition
  show: TargetAndTransition
  exit: TargetAndTransition
}

const OFFSET = 6

const VARIANTS = {
  top: {
    hidden: { opacity: 0, y: OFFSET, scale: 0.93 },
    show: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: OFFSET / 2, scale: 0.95 },
  },
  bottom: {
    hidden: { opacity: 0, y: -OFFSET, scale: 0.93 },
    show: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -OFFSET / 2, scale: 0.95 },
  },
  left: {
    hidden: { opacity: 0, x: OFFSET, scale: 0.93 },
    show: { opacity: 1, x: 0, scale: 1 },
    exit: { opacity: 0, x: OFFSET / 2, scale: 0.95 },
  },
  right: {
    hidden: { opacity: 0, x: -OFFSET, scale: 0.93 },
    show: { opacity: 1, x: 0, scale: 1 },
    exit: { opacity: 0, x: -OFFSET / 2, scale: 0.95 },
  },
} satisfies Record<Placement, TooltipVariants>

/* ────────────────────────────────────────────────────────────── */
/* Arrow */
/* ────────────────────────────────────────────────────────────── */

const ARROW_SIZE = 7

function Arrow({
  placement,
  bg,
  border,
}: {
  placement: Placement
  bg: string
  border: string
}) {
  const base: CSSProperties = {
    position: 'absolute',
    width: ARROW_SIZE,
    height: ARROW_SIZE,
    background: bg,
    transform: 'rotate(45deg)',
    zIndex: -1,
  }

  const placements: Record<Placement, CSSProperties> = {
    top: {
      ...base,
      bottom: -(ARROW_SIZE / 2),
      left: '50%',
      marginLeft: -(ARROW_SIZE / 2),
      borderRight: `1px solid ${border}`,
      borderBottom: `1px solid ${border}`,
    },
    bottom: {
      ...base,
      top: -(ARROW_SIZE / 2),
      left: '50%',
      marginLeft: -(ARROW_SIZE / 2),
      borderLeft: `1px solid ${border}`,
      borderTop: `1px solid ${border}`,
    },
    left: {
      ...base,
      right: -(ARROW_SIZE / 2),
      top: '50%',
      marginTop: -(ARROW_SIZE / 2),
      borderTop: `1px solid ${border}`,
      borderRight: `1px solid ${border}`,
    },
    right: {
      ...base,
      left: -(ARROW_SIZE / 2),
      top: '50%',
      marginTop: -(ARROW_SIZE / 2),
      borderLeft: `1px solid ${border}`,
      borderBottom: `1px solid ${border}`,
    },
  }

  return <span aria-hidden style={placements[placement]} />
}

/* ────────────────────────────────────────────────────────────── */
/* Component */
/* ────────────────────────────────────────────────────────────── */

export default function TooltipWrapper({
  children,
  prompt,
  color = 'default',
  placement = 'top',
}: TooltipProps) {
  const [visible, setVisible] = useState(false)

  const [pos, setPos] = useState<CSSProperties>({})

  const [resolvedPlacement, setResolvedPlacement] =
    useState<Placement>(placement)

  const wrapperRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const touchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cfg = COLOR_CFG[color]

  /* Hide on scroll */

  useEffect(() => {
    if (!visible) return

    const hide = () => setVisible(false)

    window.addEventListener('scroll', hide, true)

    return () => {
      window.removeEventListener('scroll', hide, true)
    }
  }, [visible])

  /* Close on outside touch */

  useEffect(() => {
    if (!visible) return

    const handler = (e: TouchEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setVisible(false)
      }
    }

    document.addEventListener('touchstart', handler)

    return () => {
      document.removeEventListener('touchstart', handler)
    }
  }, [visible])

  /* Position + auto flip */

  useLayoutEffect(() => {
    if (!visible || !tooltipRef.current || !wrapperRef.current) return

    const tt = tooltipRef.current
    const wr = wrapperRef.current.getBoundingClientRect()

    const vw = window.innerWidth
    const vh = window.innerHeight

    const margin = 10

    const tw = tt.offsetWidth
    const th = tt.offsetHeight

    let nextPlacement: Placement = placement

    if (nextPlacement === 'top' && wr.top < th + margin) {
      nextPlacement = 'bottom'
    } else if (nextPlacement === 'bottom' && wr.bottom + th + margin > vh) {
      nextPlacement = 'top'
    } else if (nextPlacement === 'left' && wr.left < tw + margin) {
      nextPlacement = 'right'
    } else if (nextPlacement === 'right' && wr.right + tw + margin > vw) {
      nextPlacement = 'left'
    }

    setResolvedPlacement(nextPlacement)

    let top = 0
    let left = 0

    switch (nextPlacement) {
      case 'top':
        top = wr.top - th - margin
        left = wr.left + wr.width / 2 - tw / 2
        break

      case 'bottom':
        top = wr.bottom + margin
        left = wr.left + wr.width / 2 - tw / 2
        break

      case 'left':
        top = wr.top + wr.height / 2 - th / 2
        left = wr.left - tw - margin
        break

      case 'right':
        top = wr.top + wr.height / 2 - th / 2
        left = wr.right + margin
        break
    }

    setPos({
      top: Math.max(margin, Math.min(vh - th - margin, top)),
      left: Math.max(margin, Math.min(vw - tw - margin, left)),
    })
  }, [visible, placement])

  /* Touch */

  const onTouchStart = () => {
    touchTimerRef.current = setTimeout(() => {
      setVisible(true)
    }, 80)
  }

  const onTouchEnd = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current)
    }
  }

  return (
    <div
      ref={wrapperRef}
      className="relative inline-flex items-center justify-center font-mono"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onClick={() => setVisible((v) => !v)}>
      {children}

      <AnimatePresence>
        {visible && (
          <motion.div
            ref={tooltipRef}
            variants={VARIANTS[resolvedPlacement]}
            initial="hidden"
            animate="show"
            exit="exit"
            transition={{
              duration: 0.18,
              ease: [0.2, 0, 0, 1],
            }}
            className="fixed z-[8999]"
            style={{
              ...pos,
              maxWidth: 'min(90vw, 280px)',
              width: 'max-content',
              padding: '7px 12px',
              borderRadius: 10,
              fontSize: 12,
              lineHeight: 1.55,
              textAlign: 'center',
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
              background: cfg.bg,
              color: cfg.text,
              border: `1px solid ${cfg.border}`,
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow:
                '0 8px 28px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)',
            }}>
            <Arrow
              placement={resolvedPlacement}
              bg={cfg.bg}
              border={cfg.border}
            />

            {prompt}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
