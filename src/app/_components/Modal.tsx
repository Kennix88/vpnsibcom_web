'use client'

import clsx from 'clsx'
import {
  PanInfo,
  animate,
  motion,
  useDragControls,
  useMotionValue,
  useTransform,
} from 'framer-motion'
import { X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import ScrollHint from './ScrollHint'

export type ModalVariant = 'default' | 'info' | 'warning' | 'error' | 'success'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string | ReactNode
  variant?: ModalVariant
  cancelText?: string
  actionText?: string
  onAction?: () => void
  showCancelButton?: boolean
  showCloseButton?: boolean
  actionButtonColor?: 'primary' | 'error' | 'warning' | 'success' | 'info'
  closeOnOutsideClick?: boolean
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

/* ─── Variant config ─────────────────────────────────────────────── */
const VARIANT_CFG = {
  default: {
    bg: 'var(--surface-container)',
    header: 'var(--surface-container-high)',
    headerText: 'var(--on-surface)',
    border: 'rgba(255,255,255,0.08)',
    accentRgb: '195,166,255',
    text: 'var(--on-surface)',
    actionColor: 'primary' as const,
  },
  info: {
    bg: 'var(--info-container)',
    header: 'var(--info)',
    headerText: 'var(--on-info)',
    border: 'rgba(89,191,255,0.35)',
    accentRgb: '89,191,255',
    text: 'var(--on-info-container)',
    actionColor: 'info' as const,
  },
  warning: {
    bg: 'var(--warning-container)',
    header: 'var(--warning)',
    headerText: 'var(--on-warning)',
    border: 'rgba(255,171,64,0.35)',
    accentRgb: '255,171,64',
    text: 'var(--on-warning-container)',
    actionColor: 'warning' as const,
  },
  error: {
    bg: 'var(--error-container)',
    header: 'var(--error)',
    headerText: 'var(--on-error)',
    border: 'rgba(255,107,102,0.35)',
    accentRgb: '255,107,102',
    text: 'var(--on-error-container)',
    actionColor: 'error' as const,
  },
  success: {
    bg: 'var(--success-container)',
    header: 'var(--success)',
    headerText: 'var(--on-success)',
    border: 'rgba(55,227,162,0.35)',
    accentRgb: '55,227,162',
    text: 'var(--on-success-container)',
    actionColor: 'success' as const,
  },
}

const ACTION_BUTTON_CFG = {
  primary: {
    bg: 'linear-gradient(135deg, var(--primary-deep), var(--primary))',
    color: 'var(--on-primary)',
    shadow: 'rgba(195,166,255,0.35)',
  },
  error: {
    bg: 'var(--error)',
    color: 'var(--on-error)',
    shadow: 'rgba(255,107,102,0.35)',
  },
  warning: {
    bg: 'var(--warning)',
    color: 'var(--on-warning)',
    shadow: 'rgba(255,171,64,0.35)',
  },
  success: {
    bg: 'var(--success)',
    color: 'var(--on-success)',
    shadow: 'rgba(55,227,162,0.35)',
  },
  info: {
    bg: 'var(--info)',
    color: 'var(--on-info)',
    shadow: 'rgba(89,191,255,0.35)',
  },
}

const MAX_WIDTH_CLASS = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full',
}

/** px dragged down to trigger close */
const DRAG_CLOSE_THRESHOLD = 80
/** px/s swipe velocity to trigger close */
const VELOCITY_CLOSE_THRESHOLD = 400

/* ─── SSR-safe Portal ────────────────────────────────────────────── */
// Mounts children at document.body, completely escaping any parent
// stacking context: position:absolute, overflow:hidden, transform, z-index.
function ModalPortal({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])
  // No document on the server — prevents hydration mismatch.
  if (!mounted) return null
  return createPortal(children, document.body)
}

/* ─── Modal ──────────────────────────────────────────────────────── */
export default function Modal({
  isOpen,
  onClose,
  children,
  title,
  variant = 'default',
  cancelText,
  actionText,
  onAction,
  showCancelButton = true,
  showCloseButton = true,
  actionButtonColor,
  closeOnOutsideClick = true,
  maxWidth = 'md',
}: ModalProps) {
  const t = useTranslations('common.modal')
  const contentRef = useRef<HTMLDivElement>(null)
  const dragControls = useDragControls()

  // Separate render flag from isOpen so we can animate out before unmounting.
  const [localVisible, setLocalVisible] = useState(false)
  const localVisibleRef = useRef(false)

  // Guard against concurrent close calls (drag + ESC simultaneously, etc.)
  const isClosingRef = useRef(false)

  // Keep a stable ref to onClose so callbacks in async chains never go stale.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  const [isDragging, setIsDragging] = useState(false)

  const cfg = VARIANT_CFG[variant]
  const actionColor = actionButtonColor ?? cfg.actionColor
  const actionBtn = ACTION_BUTTON_CFG[actionColor]

  /* ── Motion values ─────────────────────────────────────────────── */
  const y = useMotionValue(0)

  // Backdrop fades to transparent as the sheet is pulled down.
  const backdropOpacity = useTransform(y, [0, 320], [1, 0])

  // Sheet itself gets a subtle scale + opacity as it's dragged.
  const sheetOpacity = useTransform(y, [0, 260], [1, 0.72])
  const sheetScale = useTransform(y, [0, 320], [1, 0.94])

  // Handle bar widens and brightens while the user is pulling.
  const handleBarWidth = useTransform(y, [0, 120], [32, 56])
  const handleBarOpacity = useTransform(y, [0, 30, 160], [0.22, 0.55, 1.0])

  // Glow appears on the handle bar only after the close threshold is crossed.
  const handleGlowOpacity = useTransform(
    y,
    [0, DRAG_CLOSE_THRESHOLD - 20, DRAG_CLOSE_THRESHOLD, 300],
    [0, 0, 0.85, 1],
  )

  /* ── Animation helpers ─────────────────────────────────────────── */
  const getVH = () => (typeof window !== 'undefined' ? window.innerHeight : 800)

  /** Slide in from the bottom with a spring bounce. */
  const animateIn = useCallback(() => {
    y.set(getVH())
    animate(y, 0, {
      type: 'spring',
      stiffness: 290,
      damping: 28,
      mass: 0.88,
    })
  }, [y])

  /**
   * Slide out to the bottom and return a promise that resolves when done.
   * Pass the drag release velocity for a seamless physics continuation.
   */
  const animateOut = useCallback(
    (velocity = 0): Promise<void> =>
      new Promise((resolve) => {
        animate(y, getVH(), {
          type: 'spring',
          stiffness: 220,
          damping: 26,
          velocity: Math.max(velocity, 3),
        }).then(() => {
          y.set(0)
          resolve()
        })
      }),
    [y],
  )

  /**
   * Internal close: animate out → unmount → notify parent.
   * Call this for all user-initiated dismissals.
   */
  const handleClose = useCallback(
    async (velocity = 0) => {
      if (isClosingRef.current) return
      isClosingRef.current = true
      await animateOut(velocity)
      localVisibleRef.current = false
      setLocalVisible(false)
      isClosingRef.current = false
      onCloseRef.current()
    },
    [animateOut],
  )

  /* ── Sync with isOpen prop ─────────────────────────────────────── */
  // When parent opens: mount component and animate in.
  // When parent closes externally (isOpen → false from outside): animate out
  // WITHOUT calling onClose a second time to avoid an infinite loop.
  useEffect(() => {
    if (isOpen) {
      isClosingRef.current = false
      localVisibleRef.current = true
      setLocalVisible(true)
    } else if (localVisibleRef.current && !isClosingRef.current) {
      isClosingRef.current = true
      animateOut().then(() => {
        localVisibleRef.current = false
        setLocalVisible(false)
        isClosingRef.current = false
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // Once the component is mounted (localVisible=true) kick off the entry animation.
  useEffect(() => {
    if (localVisible) animateIn()
  }, [localVisible, animateIn])

  /* ── Side-effects while open ───────────────────────────────────── */
  useEffect(() => {
    if (!localVisible) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [localVisible, handleClose])

  /* ── Drag handlers ─────────────────────────────────────────────── */
  const onDragStart = useCallback(() => setIsDragging(true), [])

  const onDragEnd = useCallback(
    (_: PointerEvent, info: PanInfo) => {
      setIsDragging(false)
      const shouldClose =
        info.offset.y > DRAG_CLOSE_THRESHOLD ||
        info.velocity.y > VELOCITY_CLOSE_THRESHOLD

      if (shouldClose) {
        if (isClosingRef.current) return
        isClosingRef.current = true
        // Continue with the exact release velocity for seamless physics.
        animate(y, getVH(), {
          type: 'spring',
          stiffness: 220,
          damping: 26,
          velocity: info.velocity.y,
        }).then(() => {
          y.set(0)
          localVisibleRef.current = false
          setLocalVisible(false)
          isClosingRef.current = false
          onCloseRef.current()
        })
      } else {
        // Snap back to resting position.
        animate(y, 0, { type: 'spring', stiffness: 500, damping: 42 })
      }
    },
    [y],
  )

  if (!localVisible) return null

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[9999] flex items-end justify-center font-mono"
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}>
        {/* ── Scrim ── */}
        <motion.div
          className="absolute inset-0"
          style={{
            opacity: backdropOpacity,
            background: 'var(--scrim)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
          }}
          onClick={closeOnOutsideClick ? () => handleClose() : undefined}
        />

        {/* ── Sheet ── */}
        <motion.div
          drag="y"
          dragControls={dragControls}
          // Only the handle activates drag; content scroll is unaffected.
          dragListener={false}
          // Can't drag upward; downward is free (we handle snap-back manually).
          dragConstraints={{ top: 0 }}
          dragElastic={{ top: 0.05, bottom: 0 }}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          style={{
            y,
            scale: sheetScale,
            opacity: sheetOpacity,
            // Scale anchors at the bottom so the sheet shrinks upward.
            transformOrigin: 'bottom center',
            background: cfg.bg,
            color: cfg.text,
            border: `1px solid ${cfg.border}`,
            boxShadow: [
              `0 -6px 40px rgba(0,0,0,0.55)`,
              `0 -1px 0 rgba(255,255,255,0.04)`,
              `inset 0 1px 0 rgba(255,255,255,0.06)`,
              `0 0 0 1px ${cfg.border}`,
            ].join(', '),
          }}
          className={clsx(
            'relative z-10 w-full overflow-hidden',
            'rounded-t-3xl',
            MAX_WIDTH_CLASS[maxWidth],
          )}>
          {/* ── Drag Handle Zone ────────────────────────────────── */}
          {/* touch-none prevents the browser from intercepting pointer events
              on touch devices before framer-motion can capture them. */}
          <div
            className="flex flex-col items-center gap-[5px] pt-3 pb-1.5
                       cursor-grab active:cursor-grabbing select-none touch-none"
            onPointerDown={(e) => {
              e.preventDefault()
              dragControls.start(e)
            }}>
            {/* Bar — widens and brightens as dragged; glows past threshold */}
            <div className="relative flex items-center justify-center">
              <motion.div
                style={{ width: handleBarWidth, opacity: handleBarOpacity }}
                animate={{
                  background: isDragging
                    ? `rgba(${cfg.accentRgb}, 0.6)`
                    : 'rgba(255,255,255,0.22)',
                }}
                transition={{ duration: 0.2 }}
                className="h-[4px] rounded-full"
              />
              {/* Threshold-crossed glow ring */}
              <motion.div
                style={{ opacity: handleGlowOpacity }}
                className="absolute inset-0 rounded-full blur-sm"
                animate={{
                  background: `rgba(${cfg.accentRgb}, 0.45)`,
                }}
              />
            </div>
          </div>

          {/* ── Header ───────────────────────────────────────────── */}
          {title && (
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{
                background: cfg.header,
                color: cfg.headerText,
                borderBottom: '1px solid rgba(0,0,0,0.15)',
              }}>
              <span className="font-semibold text-sm leading-snug">
                {title}
              </span>
              {showCloseButton && (
                <motion.button
                  onClick={() => handleClose()}
                  whileHover={{ scale: 1.12 }}
                  whileTap={{ scale: 0.88 }}
                  className="p-1.5 rounded-lg cursor-pointer shrink-0 ml-2"
                  style={{ background: 'rgba(0,0,0,0.18)' }}
                  aria-label={t('close')}>
                  <X size={15} />
                </motion.button>
              )}
            </div>
          )}

          {/* ── Content ──────────────────────────────────────────── */}
          <div
            ref={contentRef}
            className="relative p-4 overflow-y-auto max-h-[70vh]">
            {children}
            <ScrollHint targetRef={contentRef} />
          </div>

          {/* ── Footer ───────────────────────────────────────────── */}
          {(showCancelButton || onAction) && (
            <div
              className="flex justify-end gap-2 px-4 pb-4 pt-2"
              style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              {showCancelButton && (
                <motion.button
                  onClick={() => handleClose()}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-4 py-2 rounded-xl text-sm font-mono cursor-pointer"
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    color: cfg.text,
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}>
                  {cancelText ?? t('cancel')}
                </motion.button>
              )}
              {onAction && (
                <motion.button
                  onClick={onAction}
                  whileHover={{
                    scale: 1.03,
                    boxShadow: `0 4px 16px ${actionBtn.shadow}`,
                  }}
                  whileTap={{ scale: 0.96 }}
                  className="px-4 py-2 rounded-xl text-sm font-mono font-bold cursor-pointer"
                  style={{ background: actionBtn.bg, color: actionBtn.color }}>
                  {actionText ?? t('accept')}
                </motion.button>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </ModalPortal>
  )
}
