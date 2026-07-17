'use client'

import { authApiClient } from '@app/core/authApiClient'
import { useUserStore } from '@app/store/user.store'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, Play, Sparkle } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import Currency from '../Currency'
import { CountdownTimer } from './CountdownTimer'
import { useTaskRewardAd } from './useTaskRewardAd'

export function TaskAdsReward() {
  const { user } = useUserStore()
  const [amountReward, setAmountReward] = useState<number | null>(null)
  const [isHovering, setIsHovering] = useState(false)
  const { trigger, isLoading } = useTaskRewardAd()

  const fetchReward = useCallback(async () => {
    try {
      const response = await authApiClient.getAdTaskReward('reward')
      setAmountReward(response ? response.amount : null)
    } catch (err) {
      console.error('Failed to load reward', err)
    }
  }, [])

  useEffect(() => {
    fetchReward()
  }, [fetchReward])

  if (amountReward == null || !user) return null

  const isCoolingDown =
    user.nextAdsRewardAt && new Date(user.nextAdsRewardAt) > new Date()
  const isActionable = !isCoolingDown && !isLoading
  const Shell = isActionable ? motion.button : motion.div

  return (
    <Shell
      type={isActionable ? 'button' : undefined}
      onClick={isActionable ? trigger : undefined}
      disabled={isActionable ? false : undefined}
      onHoverStart={isActionable ? () => setIsHovering(true) : undefined}
      onHoverEnd={isActionable ? () => setIsHovering(false) : undefined}
      className="relative flex items-center gap-2.5 w-full rounded-2xl overflow-hidden text-left"
      style={{
        background: isActionable
          ? 'linear-gradient(160deg, rgba(255,140,66,0.1), var(--glass-bg) 60%)'
          : 'var(--glass-bg)',
        backdropFilter: 'blur(var(--glass-blur))',
        WebkitBackdropFilter: 'blur(var(--glass-blur))',
        border: `1px solid ${
          isActionable ? 'rgba(255,140,66,0.18)' : 'rgba(255,255,255,0.06)'
        }`,
        boxShadow: isActionable
          ? [
              '0 6px 24px rgba(0,0,0,0.28)',
              'inset 0 1px 0 rgba(255,255,255,0.06)',
              isHovering
                ? '0 8px 28px rgba(255,140,66,0.16)'
                : '0 0 0 rgba(0,0,0,0)',
            ].join(', ')
          : '0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
        padding: '10px 12px',
        cursor: isActionable ? 'pointer' : 'default',
        opacity: isCoolingDown ? 0.82 : 1,
        transition:
          'border-color 400ms ease, background 400ms ease, opacity 400ms ease',
      }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: isCoolingDown ? 0.82 : 1, y: 0 }}
      whileHover={isActionable ? { scale: 1.014, y: -1 } : undefined}
      whileTap={isActionable ? { scale: 0.98 } : undefined}
      transition={{ duration: 0.35, ease: [0.2, 0, 0, 1] }}>
      {/* ambient glow blob, only when actionable */}
      {isActionable && (
        <motion.div
          className="pointer-events-none absolute -top-8 -right-6 w-24 h-24 rounded-full blur-2xl"
          style={{ background: 'rgba(255,140,66,0.22)' }}
          animate={{ opacity: isHovering ? 0.9 : 0.5 }}
          transition={{ duration: 0.4 }}
        />
      )}

      {/* Left accent stripe */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl"
        style={{
          background: isCoolingDown
            ? 'linear-gradient(to bottom, rgba(255,171,64,0.5), rgba(255,171,64,0.15))'
            : 'linear-gradient(to bottom, var(--cta), rgba(255,140,66,0.3))',
          transition: 'background 500ms ease',
        }}
      />

      {/* Shimmer sweep on actionable state */}
      {isActionable && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(105deg, transparent 40%, rgba(255,140,66,0.08) 50%, transparent 60%)',
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

      {/* floating mini-sparkles, only while hovering */}
      <AnimatePresence>
        {isActionable && isHovering && (
          <>
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="pointer-events-none absolute"
                style={{
                  color: 'var(--cta)',
                  right: `${18 + i * 14}%`,
                  bottom: 6,
                }}
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

      <motion.div
        animate={
          !isCoolingDown && !isLoading
            ? {
                boxShadow: [
                  '0 0 0px rgba(255,140,66,0)',
                  '0 0 14px rgba(255,140,66,0.45)',
                  '0 0 0px rgba(255,140,66,0)',
                ],
              }
            : { boxShadow: '0 0 0px rgba(255,140,66,0)' }
        }
        transition={
          !isCoolingDown && !isLoading
            ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 0.3 }
        }
        whileHover={isActionable ? { scale: 1.06 } : undefined}
        whileTap={isActionable ? { scale: 0.95 } : undefined}
        className="relative flex items-center justify-center w-9 h-9 rounded-xl shrink-0 ml-1"
        style={{
          background: isCoolingDown
            ? 'rgba(255,171,64,0.08)'
            : isHovering
              ? 'linear-gradient(135deg, #ff8c42, #ffab6b)'
              : 'rgba(255,140,66,0.14)',
          color: isCoolingDown
            ? 'var(--warning)'
            : isHovering
              ? '#1a0a00'
              : 'var(--cta)',
          border: `1px solid ${isCoolingDown ? 'rgba(255,171,64,0.2)' : 'rgba(255,140,66,0.25)'}`,
          transition: 'background 350ms ease, color 350ms ease',
        }}>
        <motion.div
          animate={isHovering ? { rotate: 10 } : { rotate: 0 }}
          transition={{ duration: 0.35, ease: [0.2, 0, 0, 1] }}>
          <Play size={13} style={{ marginLeft: 2 }} fill="currentColor" />
        </motion.div>
      </motion.div>

      {/* Center text */}
      <div className="flex flex-col gap-1 grow min-w-0">
        <span
          className="text-[13px] font-bold font-mono"
          style={{ color: 'var(--on-surface)' }}>
          Смотри рекламу — получай Stars
        </span>
        <AnimatePresence mode="wait">
          <motion.div
            key={amountReward}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 400 }}
            className="relative inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-mono text-[12px] font-bold w-fit overflow-hidden"
            style={{
              background: 'rgba(245,166,35,0.15)',
              color: 'var(--star)',
              border: '1px solid rgba(245,166,35,0.3)',
              letterSpacing: '0.02em',
            }}>
            {/* subtle shine sweep across the reward badge */}
            <motion.div
              className="pointer-events-none absolute inset-y-0 w-1/3"
              style={{
                background:
                  'linear-gradient(115deg, transparent, rgba(255,255,255,0.35), transparent)',
              }}
              animate={{ x: ['-120%', '260%'] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                repeatDelay: 2.6,
                ease: 'easeInOut',
              }}
            />
            <span className="relative flex items-center gap-1">
              <Currency w={12} type="star" />+{amountReward}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Right zone */}
      <div className="shrink-0 flex items-center justify-center">
        {isCoolingDown ? (
          <CountdownTimer expiryDate={user.nextAdsRewardAt!} />
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
                style={{ color: 'var(--cta)' }}>
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
