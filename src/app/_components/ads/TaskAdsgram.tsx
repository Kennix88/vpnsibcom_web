'use client'

import { authApiClient } from '@app/core/authApiClient'
import { AdsPlaceEnum } from '@app/enums/ads-place.enum'
import { AdsTypeEnum } from '@app/enums/ads-type.enum'
import { useUserStore } from '@app/store/user.store'
import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import Currency from '../Currency'
import { CountdownTimer } from './CountdownTimer'

// ─── Обходим отсутствие типов для <adsgram-task> ─────────────────────────────
const AdsgramTask = 'adsgram-task' as unknown as React.ElementType

interface TaskAdsgramTaskProps {
  blockId?: string
  debug?: boolean
}

export function TaskAdsgramTask({
  blockId: blockIdProp,
  debug = false,
}: TaskAdsgramTaskProps) {
  const { user, setUser } = useUserStore()

  const [isReady, setIsReady] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [amountReward, setAmountReward] = useState<number | null>(null)
  const [resolvedBlockId, setResolvedBlockId] = useState<string | null>(
    blockIdProp ?? null,
  )
  const [resolvedVerefyKey, setResolvedVerefyKey] = useState<string | null>(
    null,
  )

  const taskRef = useRef<HTMLElement | null>(null)
  const rewardCalledRef = useRef(false)

  const checkAdAvailability = useCallback(async () => {
    try {
      const response = await authApiClient.getAds(
        AdsPlaceEnum.TASK,
        AdsTypeEnum.TASK,
      )
      if (response.isNoAds || !response.ad) {
        setIsVisible(false)
        return
      }
      if (!resolvedBlockId && response.ad.blockId) {
        setResolvedBlockId(String(response.ad.blockId))
      }
      setResolvedVerefyKey(response.ad.verifyKey)

      if (typeof window !== 'undefined' && customElements.get('adsgram-task')) {
        setIsReady(true)
        return
      }
      const waitForCustomElement = (retries = 20) => {
        if (customElements.get('adsgram-task')) {
          setIsReady(true)
          return
        }
        if (retries <= 0) {
          setIsVisible(false)
          return
        }
        setTimeout(() => waitForCustomElement(retries - 1), 200)
      }
      waitForCustomElement()
    } catch (err) {
      console.error('Failed to check ad availability', err)
      setIsVisible(false)
    }
  }, [resolvedBlockId])

  const fetchReward = useCallback(async () => {
    try {
      const response = await authApiClient.getAdTaskReward('adsgram')
      setAmountReward(response ? response.amount : null)
    } catch (err) {
      console.error('Failed to load reward', err)
    }
  }, [])

  const handleReward = useCallback(async () => {
    if (rewardCalledRef.current) return
    rewardCalledRef.current = true
    try {
      const response = await authApiClient.confirmAds(resolvedVerefyKey ?? '')
      await setUser(response.user)
      if (response.success) toast.success('Награда получена!')
    } catch (err) {
      console.error('Failed to confirm task ad', err)
    }
  }, [resolvedVerefyKey, setUser])

  useEffect(() => {
    if (!isReady) return
    const el = taskRef.current
    if (!el) return
    const onReward = () => void handleReward()
    const onBannerNotFound = () => setIsVisible(false)
    const onError = () => setIsVisible(false)
    const onTooLongSession = () => {
      toast.warn('Перезапустите приложение для получения новых заданий')
      setIsVisible(false)
    }
    el.addEventListener('reward', onReward)
    el.addEventListener('onBannerNotFound', onBannerNotFound)
    el.addEventListener('onError', onError)
    el.addEventListener('onTooLongSession', onTooLongSession)
    return () => {
      el.removeEventListener('reward', onReward)
      el.removeEventListener('onBannerNotFound', onBannerNotFound)
      el.removeEventListener('onError', onError)
      el.removeEventListener('onTooLongSession', onTooLongSession)
    }
  }, [isReady, handleReward])

  useEffect(() => {
    fetchReward()
    checkAdAvailability()
  }, [fetchReward, checkAdAvailability])

  if (!isVisible || !user || amountReward == null) return null

  const isCoolingDown =
    user.nextAdsgramTaskAt && new Date(user.nextAdsgramTaskAt) > new Date()

  // ── Cooldown view ─────────────────────────────────────────────────────────
  if (isCoolingDown) {
    return (
      <motion.div
        key="cooldown"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.35, ease: [0.2, 0, 0, 1] }}
        className="relative flex items-center gap-2.5 w-full rounded-2xl overflow-hidden"
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(var(--glass-blur))',
          WebkitBackdropFilter: 'blur(var(--glass-blur))',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow:
            '0 6px 24px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.06)',
          padding: '10px 12px',
        }}>
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl"
          style={{
            background:
              'linear-gradient(to bottom, rgba(255,171,64,0.5), rgba(255,171,64,0.15))',
          }}
        />
        <div
          className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0 ml-1"
          style={{
            background: 'rgba(255,171,64,0.08)',
            color: 'var(--warning)',
            border: '1px solid rgba(255,171,64,0.2)',
          }}>
          <Clock size={15} />
        </div>
        <div className="flex flex-col gap-1 grow min-w-0">
          <span
            className="text-[13px] font-bold font-mono"
            style={{ color: 'var(--on-surface)' }}>
            Следующее задание через
          </span>
          <div
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-mono text-[11px] font-bold w-fit"
            style={{
              background: 'rgba(245,166,35,0.12)',
              color: 'var(--star)',
              border: '1px solid rgba(245,166,35,0.25)',
            }}>
            <Currency w={12} type="star" />+{amountReward}
          </div>
        </div>
        <div className="shrink-0 flex items-center justify-center">
          <CountdownTimer expiryDate={user.nextAdsgramTaskAt!} />
        </div>
      </motion.div>
    )
  }

  if (!isReady || !resolvedBlockId) return null

  // ── Task view ─────────────────────────────────────────────────────────────
  return (
    <motion.div
      key="task"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: [0.2, 0, 0, 1] }}
      className="relative w-full rounded-2xl overflow-hidden"
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(var(--glass-blur))',
        WebkitBackdropFilter: 'blur(var(--glass-blur))',
        border: '1px solid rgba(255,255,255,0.09)',
        boxShadow:
          '0 6px 24px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}>
      {/* Left accent stripe */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl z-10"
        style={{
          background:
            'linear-gradient(to bottom, var(--cta), rgba(255,140,66,0.3))',
        }}
      />

      {/* Soft inner glow */}
      <motion.div
        className="absolute z-10 pointer-events-none"
        style={{
          left: 15,
          top: '50%',
          width: 38,
          height: 38,
          transform: 'translateY(-50%)',
          borderRadius: 11,
          border: '1px solid rgba(255,140,66,0.25)',
        }}
        animate={
          !isCoolingDown
            ? {
                opacity: [0.35, 0, 0.35],
                scale: [1, 1.12, 1],
              }
            : { opacity: 0 }
        }
        transition={{
          duration: 2.2,
          repeat: !isCoolingDown ? Infinity : 0,
          ease: 'easeOut',
          delay: 0.25,
        }}
      />

      {/* Subtle shimmer sweep across the card */}
      <motion.div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background:
            'linear-gradient(105deg, transparent 40%, rgba(255,140,66,0.06) 50%, transparent 60%)',
        }}
        animate={{ x: ['-100%', '200%'] }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          repeatDelay: 4,
          ease: 'easeInOut',
        }}
      />

      <AdsgramTask
        ref={taskRef}
        data-block-id={resolvedBlockId}
        data-debug={debug ? 'true' : 'false'}
        data-debug-console="false"
        className="adsgram-task-override">
        {/* reward slot — more prominent badge */}
        <span slot="reward" className="adsgram-slot-reward">
          <Currency w={12} type="star" />
          <span>+{amountReward}</span>
        </span>

        {/* button slot — arrow chevron instead of text */}
        <div
          slot="button"
          className="adsgram-slot-button"
          aria-label="Смотреть">
          <svg
            width="15"
            height="15"
            viewBox="0 0 15 15"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true">
            <path
              d="M5.5 3.5L9.5 7.5L5.5 11.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* claim slot */}
        <div slot="claim" className="adsgram-slot-button adsgram-slot-claim">
          Забрать
        </div>

        {/* done slot */}
        <div slot="done" className="adsgram-slot-button adsgram-slot-done">
          ✓
        </div>
      </AdsgramTask>

      <style>{`
        .adsgram-task-override {
            --adsgram-task-font-size: 13px;
            --adsgram-task-icon-size: 38px;
            --adsgram-task-icon-border-radius: 11px;
            --adsgram-task-icon-title-gap: 10px;
            --adsgram-task-button-width: 36px;

            display: block;
            width: 100%;
            padding: 10px 10px 10px 15px;
            color: var(--on-surface);
            font-family: ui-monospace, SFMono-Regular, monospace;
            position: relative;
            z-index: 2;
        }

        .adsgram-slot-reward {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 9px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          font-family: ui-monospace, SFMono-Regular, monospace;
          background: rgba(245,166,35,0.15);
          color: var(--star);
          border: 1px solid rgba(245,166,35,0.3);
          margin-top: 4px;
          letter-spacing: 0.02em;
        }

        /* Square arrow button */
        .adsgram-slot-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          font-size: 11px;
          font-weight: 700;
          font-family: ui-monospace, SFMono-Regular, monospace;
          color: var(--cta);
          cursor: pointer;
          transition: all 150ms ease;
        }

        .adsgram-slot-button:active {
          transform: scale(0.92);
          background: rgba(255,140,66,0.25);
        }

        .adsgram-slot-claim {
          background: rgba(255,140,66,0.22);
          color: var(--cta);
          border-color: rgba(255,140,66,0.4);
          font-size: 10px;
          white-space: nowrap;
          width: auto;
          padding: 0 10px;
        }

        .adsgram-slot-done {
          background: rgba(55,227,162,0.12);
          color: var(--success);
          border-color: rgba(55,227,162,0.3);
          cursor: default;
          width: 34px;
        }
      `}</style>
    </motion.div>
  )
}
