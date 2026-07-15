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
import { createPortal } from 'react-dom'

type Placement = 'top' | 'bottom' | 'left' | 'right'
type ColorKey = 'info' | 'warning' | 'error' | 'success' | 'default'

type TooltipProps = PropsWithChildren<{
  prompt: string
  color?: ColorKey
  placement?: Placement
}>

/* ─── Color tokens ───────────────────────────────────────────────── */
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

/* ─── Motion variants ────────────────────────────────────────────── */
const OFFSET = 6

const VARIANTS: Record<
  Placement,
  {
    hidden: TargetAndTransition
    show: TargetAndTransition
    exit: TargetAndTransition
  }
> = {
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
}

/* ─── Arrow ──────────────────────────────────────────────────────── */
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
  const styles: Record<Placement, CSSProperties> = {
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
  return <span aria-hidden style={styles[placement]} />
}

/* ─── Component ──────────────────────────────────────────────────── */
export default function TooltipWrapper({
  children,
  prompt,
  color = 'default',
  placement = 'top',
}: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState<CSSProperties>({})
  const [resolvedPlacement, setResolved] = useState<Placement>(placement)
  /* Портал монтируется только на клиенте */
  const [mounted, setMounted] = useState(false)

  const wrapperRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const touchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* Тач-устройства шлют synthetic click сразу после touchend, а также
     иногда — "ghost" mouseenter/mouseleave. Оба флага не дают этим
     событиям тут же закрыть только что открытый по тапу тултип. */
  const suppressNextClick = useRef(false)
  const ignoreMouseUntil = useRef(0)

  const cfg = COLOR_CFG[color]

  /* SSR guard — createPortal недоступен на сервере */
  useEffect(() => {
    setMounted(true)
  }, [])

  /* Пересчитываем позицию каждый раз, когда тултип становится видимым,
     а также при ресайзе и скролле. */
  const recalcPos = () => {
    if (!tooltipRef.current || !wrapperRef.current) return

    const anchor = wrapperRef.current.getBoundingClientRect()
    const tt = tooltipRef.current
    const vw = window.innerWidth
    const vh = window.innerHeight
    const GAP = 8 // отступ от anchor
    const MARGIN = 10 // min отступ от края экрана

    const tw = tt.offsetWidth
    const th = tt.offsetHeight

    /* Auto-flip: если не влезает с нужной стороны — переворачиваем */
    let next: Placement = placement
    if (next === 'top' && anchor.top < th + GAP + MARGIN) next = 'bottom'
    else if (next === 'bottom' && anchor.bottom + th + GAP + MARGIN > vh)
      next = 'top'
    else if (next === 'left' && anchor.left < tw + GAP + MARGIN) next = 'right'
    else if (next === 'right' && anchor.right + tw + GAP + MARGIN > vw)
      next = 'left'

    setResolved(next)

    let top = 0
    let left = 0

    switch (next) {
      case 'top':
        top = anchor.top - th - GAP
        left = anchor.left + anchor.width / 2 - tw / 2
        break
      case 'bottom':
        top = anchor.bottom + GAP
        left = anchor.left + anchor.width / 2 - tw / 2
        break
      case 'left':
        top = anchor.top + anchor.height / 2 - th / 2
        left = anchor.left - tw - GAP
        break
      case 'right':
        top = anchor.top + anchor.height / 2 - th / 2
        left = anchor.right + GAP
        break
    }

    /* Прижимаем к экрану, чтобы не вылезал за края */
    setPos({
      top: Math.max(MARGIN, Math.min(vh - th - MARGIN, top)),
      left: Math.max(MARGIN, Math.min(vw - tw - MARGIN, left)),
    })
  }

  /* Запускаем пересчёт сразу после появления тултипа в DOM */
  useLayoutEffect(() => {
    if (!visible) return
    recalcPos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  /* Скрываем при прокрутке / ресайзе */
  useEffect(() => {
    if (!visible) return
    const hide = () => setVisible(false)
    window.addEventListener('scroll', hide, { passive: true, capture: true })
    window.addEventListener('resize', hide, { passive: true })
    return () => {
      window.removeEventListener('scroll', hide, true)
      window.removeEventListener('resize', hide)
    }
  }, [visible])

  /* Закрываем по тапу снаружи (мобильный) */
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
    return () => document.removeEventListener('touchstart', handler)
  }, [visible])

  /* Чистим висящий таймер при размонтировании */
  useEffect(() => {
    return () => {
      if (touchTimer.current) clearTimeout(touchTimer.current)
    }
  }, [])

  /* Touch handlers — короткий тап открывает тултип напрямую, без
     ожидания клика. 80мс — защита от случайного показа при свайпе. */
  const onTouchStart = () => {
    ignoreMouseUntil.current = Date.now() + 500
    touchTimer.current = setTimeout(() => {
      suppressNextClick.current = true
      setVisible(true)
    }, 80)
  }

  const onTouchMove = () => {
    // Палец сдвинулся — это скролл/свайп, а не тап. Отменяем показ.
    if (touchTimer.current) {
      clearTimeout(touchTimer.current)
      touchTimer.current = null
    }
  }

  const onTouchEnd = () => {
    if (touchTimer.current) {
      clearTimeout(touchTimer.current)
      touchTimer.current = null
    }
    // Если synthetic click так и не придёт — не блокируем следующий
    // реальный клик навсегда.
    if (suppressNextClick.current) {
      setTimeout(() => {
        suppressNextClick.current = false
      }, 500)
    }
  }

  const onMouseEnter = () => {
    if (Date.now() < ignoreMouseUntil.current) return
    setVisible(true)
  }

  const onMouseLeave = () => {
    if (Date.now() < ignoreMouseUntil.current) return
    setVisible(false)
  }

  const onClick = () => {
    if (suppressNextClick.current) {
      suppressNextClick.current = false
      return
    }
    setVisible((v) => !v)
  }

  /* ── Tooltip node ──
     position: fixed + координаты из getBoundingClientRect → не зависит
     ни от каких родителей: overflow, transform, will-change, isolation и т.д.
     Портал гарантирует, что узел живёт прямо в <body> и не обрезается
     ни одним промежуточным контейнером.
  */
  const tooltipNode = (
    <AnimatePresence>
      {visible && (
        <motion.div
          ref={tooltipRef}
          role="tooltip"
          variants={VARIANTS[resolvedPlacement]}
          initial="hidden"
          animate="show"
          exit="exit"
          transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
          style={{
            ...pos,
            position: 'fixed' /* ← не absolute, именно fixed */,
            zIndex: 99999 /* ← поверх любых модалов / drawer'ов */,
            maxWidth: 'min(90vw, 280px)',
            width: 'max-content',
            padding: '7px 12px',
            borderRadius: 10,
            fontSize: 12,
            lineHeight: 1.55,
            textAlign: 'center',
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
            fontFamily: 'var(--font-mono, monospace)',
            background: cfg.bg,
            color: cfg.text,
            border: `1px solid ${cfg.border}`,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow:
              '0 8px 28px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.07)',
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
  )

  return (
    <div
      ref={wrapperRef}
      className="relative inline-flex items-center justify-center font-mono"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onClick={onClick}>
      {children}

      {/* Портал: тултип рендерится в document.body — вне любого родителя */}
      {mounted && createPortal(tooltipNode, document.body)}
    </div>
  )
}
