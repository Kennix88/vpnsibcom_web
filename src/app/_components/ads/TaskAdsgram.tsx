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
        animate={{ opacity: 0.82, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.35, ease: [0.2, 0, 0, 1] }}
        className="relative flex items-center gap-2.5 w-full rounded-2xl overflow-hidden"
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(var(--glass-blur))',
          WebkitBackdropFilter: 'blur(var(--glass-blur))',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow:
            '0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
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
        background:
          'linear-gradient(160deg, rgba(255,140,66,0.08), var(--glass-bg) 60%)',
        backdropFilter: 'blur(var(--glass-blur))',
        WebkitBackdropFilter: 'blur(var(--glass-blur))',
        border: '1px solid rgba(255,140,66,0.16)',
        boxShadow:
          '0 6px 24px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}>
      {/* ambient glow blob — визуально согласовано с TaskAdsReward/PremiumCTA */}
      <div
        className="pointer-events-none absolute -top-8 -right-6 w-24 h-24 rounded-full blur-2xl z-0"
        style={{ background: 'rgba(255,140,66,0.18)' }}
      />

      {/* Left accent stripe */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl z-10"
        style={{
          background:
            'linear-gradient(to bottom, var(--cta), rgba(255,140,66,0.3))',
        }}
      />

      {/* Subtle shimmer sweep across the card */}
      <motion.div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background:
            'linear-gradient(105deg, transparent 40%, rgba(255,140,66,0.07) 50%, transparent 60%)',
        }}
        animate={{ x: ['-100%', '200%'] }}
        transition={{
          duration: 3.6,
          repeat: Infinity,
          repeatDelay: 4.5,
          ease: 'easeInOut',
        }}
      />

      <AdsgramTask
        ref={taskRef}
        data-block-id={resolvedBlockId}
        data-debug={debug ? 'true' : 'false'}
        data-debug-console="false"
        className="adsgram-task-override">
        {/* reward slot — badge with a soft shine sweep, matches TaskAdsReward */}
        <span slot="reward" className="adsgram-slot-reward">
          <span className="adsgram-slot-reward-shine" />
          <span className="adsgram-slot-reward-content">
            <Currency w={12} type="star" />
            <span>+{amountReward}</span>
          </span>
        </span>

        {/* button slot — circular icon container, soft glow on hover/active */}
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
        <div
          slot="claim"
          className="adsgram-slot-claim rotate-45"
          aria-label="Забрать награду">
          Забрать
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

        {/* done slot */}
        <div slot="done" className="adsgram-slot-done">
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true">
            <path
              d="M2.5 7.2L5.6 10.2L11.5 3.8"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
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
                position: relative;
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
                overflow: hidden;
              }

              .adsgram-slot-reward-content {
                position: relative;
                z-index: 1;
                display: inline-flex;
                align-items: center;
                gap: 4px;
              }

              /* тонкий диагональный блик, зациклен через CSS-keyframes —
                 безопаснее framer-motion внутри слотового контента */
              .adsgram-slot-reward-shine {
                position: absolute;
                inset: 0;
                width: 40%;
                background: linear-gradient(
                  115deg,
                  transparent,
                  rgba(255, 255, 255, 0.35),
                  transparent
                );
                transform: translateX(-150%);
                animation: adsgram-shine 4.4s ease-in-out infinite;
                animation-delay: 1s;
                pointer-events: none;
              }

              @keyframes adsgram-shine {
                0% { transform: translateX(-150%); }
                18% { transform: translateX(280%); }
                100% { transform: translateX(280%); }
              }

              /* Square arrow button — теперь с мягким круглым фоном,
                 как у Play-иконки в TaskAdsReward */
              .adsgram-slot-button {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 34px;
                height: 34px;
                border-radius: 11px;
                font-size: 11px;
                font-weight: 700;
                font-family: ui-monospace, SFMono-Regular, monospace;
                background: rgba(255,140,66,0.14);
                color: var(--cta);
                border: 1px solid rgba(255,140,66,0.25);
                cursor: pointer;
                transition: background 300ms cubic-bezier(0.2,0,0,1),
                            box-shadow 300ms cubic-bezier(0.2,0,0,1),
                            transform 200ms cubic-bezier(0.2,0,0,1);
              }

              .adsgram-slot-button:hover {
                background: linear-gradient(135deg, #ff8c42, #ffab6b);
                color: #1a0a00;
                box-shadow: 0 0 14px rgba(255,140,66,0.45);
              }

              .adsgram-slot-button:active {
                transform: scale(0.94);
              }

          .adsgram-slot-claim {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 11px;
          font-size: 11px;
          font-weight: 700;
          font-family: ui-monospace, SFMono-Regular, monospace;
          background: rgba(255,140,66,0.14);
          color: var(--cta);
          border: 1px solid rgba(255,140,66,0.25);
          cursor: pointer;
          transition: background 300ms cubic-bezier(0.2,0,0,1),
                      box-shadow 300ms cubic-bezier(0.2,0,0,1),
                      transform 200ms cubic-bezier(0.2,0,0,1);
          }

          .adsgram-slot-claim:hover {
          background: linear-gradient(135deg, #ff8c42, #ffab6b);
          color: #1a0a00;
          box-shadow: 0 0 14px rgba(255,140,66,0.45);
          transform: scale(0.96);
          }

          .adsgram-slot-done {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 11px;
          font-size: 11px;
          font-weight: 700;
          font-family: ui-monospace, SFMono-Regular, monospace;
          background: rgba(55,227,162,0.14);
          color: var(--success);
          border: 1px solid rgba(55,227,162,0.25);
          cursor: pointer;
          transition: background 300ms cubic-bezier(0.2,0,0,1),
                      box-shadow 300ms cubic-bezier(0.2,0,0,1),
                      transform 200ms cubic-bezier(0.2,0,0,1);
          }

          .adsgram-slot-done:hover {
          box-shadow: 0 0 14px rgba(55,227,162,0.35);
          transform: scale(0.96);
          }

      `}</style>
    </motion.div>
  )
}
