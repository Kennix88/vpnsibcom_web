'use client'

import { config } from '@app/config/client'
import { authApiClient } from '@app/core/authApiClient'
import { AdsNetworkEnum } from '@app/enums/ads-network.enum'
import { AdsPlaceEnum } from '@app/enums/ads-place.enum'
import { AdsDataInterface } from '@app/enums/ads-res.interface'
import { AdsTypeEnum } from '@app/enums/ads-type.enum'
import { useUserStore } from '@app/store/user.store'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, Play } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { toast } from 'react-toastify'
import Currency from '../Currency'
import { releaseAdDisplayLock, tryAcquireAdDisplayLock } from './adDisplayLock'
import { CountdownTimer } from './CountdownTimer'

const createAdContainer = () => {
  const div = document.createElement('div')
  div.style.position = 'fixed'
  div.style.inset = '0'
  div.style.pointerEvents = 'none'
  div.style.zIndex = '999'
  document.body.appendChild(div)
  return div
}

export function TaskAdsReward() {
  const TASK_AD_OWNER = 'task-reward-ad'
  const isTaddyEnabled = config.isTaddyEnabled as boolean

  const { user, setUser } = useUserStore()

  const [amountReward, setAmountReward] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const adRef = useRef<AdsDataInterface | null>(null)
  const mountedRootRef = useRef<Root | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const isShowingRef = useRef(false)

  const cleanup = useCallback(() => {
    const root = mountedRootRef.current
    const container = containerRef.current
    mountedRootRef.current = null
    containerRef.current = null
    isShowingRef.current = false
    adRef.current = null
    setIsLoading(false)
    releaseAdDisplayLock(TASK_AD_OWNER)
    window.setTimeout(() => {
      root?.unmount()
      container?.remove()
    }, 0)
  }, [])

  const scheduleCleanup = useCallback(
    () => setTimeout(() => cleanup(), 0),
    [cleanup],
  )

  const reward = useCallback(
    async (isTaddy = false) => {
      try {
        if (!adRef.current) return
        const response = await authApiClient.confirmAds(
          adRef.current.verifyKey,
          undefined,
          isTaddy,
        )
        await setUser(response.user)
        if (response.success) toast.success('Награда получена!')
      } catch (err) {
        console.error('Failed to confirm ad', err)
      } finally {
        adRef.current = null
      }
    },
    [setUser],
  )

  const fetchAd = useCallback(async () => {
    try {
      if (isShowingRef.current) return
      if (!tryAcquireAdDisplayLock(TASK_AD_OWNER)) return

      isShowingRef.current = true
      setIsLoading(true)

      const response = await authApiClient.getAds(
        AdsPlaceEnum.REWARD_TASK,
        AdsTypeEnum.REWARD,
      )

      if (!response.isNoAds && response.ad) {
        const nextAd = response.ad
        adRef.current = nextAd

        if (!containerRef.current) containerRef.current = createAdContainer()
        if (mountedRootRef.current) return

        const root = createRoot(containerRef.current)
        mountedRootRef.current = root

        const handleClose = () => scheduleCleanup()

        const handleReward = async (isTaddy = false, isClose = false) => {
          await reward(isTaddy)
          if (isClose) handleClose()
        }

        const showFallbackAd = async () => {
          if (nextAd.network === AdsNetworkEnum.TADDY) {
            const { default: TaddyInterstitialForSDK } =
              await import('./TaddyInterstitialForSDK')
            root.render(
              <TaddyInterstitialForSDK
                onClosed={() => void handleReward(false, true)}
                onError={() => void handleClose()}
                onNoFill={() => void handleClose()}
              />,
            )
          } else if (nextAd.network === AdsNetworkEnum.ADSGRAM) {
            const { default: AdsgramAd } = await import('./AdsgramAd')
            root.render(
              <AdsgramAd
                blockId={String(nextAd.blockId)}
                onReward={() => void handleReward()}
                onClose={handleClose}
                isDebug={process.env.NODE_ENV !== 'production'}
              />,
            )
          } else if (nextAd.network === AdsNetworkEnum.ADSONAR) {
            const { default: AdsonarReward } = await import('./AdsonarReward')
            root.render(
              <AdsonarReward
                blockId={String(nextAd.blockId)}
                onReward={() => void handleReward()}
                onClose={handleClose}
              />,
            )
          } else if (nextAd.network === AdsNetworkEnum.RICHADS) {
            const { default: RichadsReward } = await import('./RichadsReward')
            root.render(
              <RichadsReward
                onReward={() => void handleReward()}
                onClose={handleClose}
              />,
            )
          } else {
            handleClose()
          }
        }

        if (isTaddyEnabled && nextAd.network !== AdsNetworkEnum.TADDY) {
          const { default: TaddyInterstitial } =
            await import('./TaddyInterstitial')
          root.render(
            <TaddyInterstitial
              canCloseImmediately={false}
              requiredViewSeconds={10}
              autoCloseOnViewed={false}
              onClosed={handleClose}
              demo={true}
              onViewed={(isShow) => {
                if (isShow) void handleReward(true, true)
              }}
              onError={() => void showFallbackAd()}
              onNoFill={() => void showFallbackAd()}
            />,
          )
        } else {
          void showFallbackAd()
        }

        return
      }

      if (response.isNoAds) toast.warn('Нет рекламы на текущий момент!')
      scheduleCleanup()
    } catch (err) {
      console.error('Failed to load ad', err)
      scheduleCleanup()
    }
  }, [isTaddyEnabled, reward, scheduleCleanup])

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

  useEffect(
    () => () => {
      scheduleCleanup()
    },
    [scheduleCleanup],
  )

  if (amountReward == null || !user) return null

  const isCoolingDown =
    user.nextAdsRewardAt && new Date(user.nextAdsRewardAt) > new Date()
  const isActionable = !isCoolingDown && !isLoading
  const Shell = isActionable ? motion.button : motion.div

  return (
    <Shell
      type={isActionable ? 'button' : undefined}
      onClick={isActionable ? fetchAd : undefined}
      disabled={isActionable ? false : undefined}
      className="relative flex items-center gap-2.5 w-full rounded-2xl overflow-hidden text-left"
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(var(--glass-blur))',
        WebkitBackdropFilter: 'blur(var(--glass-blur))',
        border: `1px solid ${isActionable ? 'rgba(255,140,66,0.13)' : 'rgba(255,255,255,0.07)'}`,
        boxShadow:
          '0 6px 24px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.06)',
        padding: '10px 12px',
        cursor: isActionable ? 'pointer' : 'default',
        transition: 'border-color 400ms ease',
      }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={isActionable ? { scale: 1.012 } : undefined}
      whileTap={isActionable ? { scale: 0.985 } : undefined}
      transition={{ duration: 0.35, ease: [0.2, 0, 0, 1] }}>
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
              'linear-gradient(105deg, transparent 40%, rgba(255,140,66,0.055) 50%, transparent 60%)',
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

      <motion.div
        animate={
          !isCoolingDown && !isLoading
            ? {
                boxShadow: [
                  '0 0 0 0 rgba(255,140,66,0)',
                  '0 0 0 6px rgba(255,140,66,0.18)',
                  '0 0 0 0 rgba(255,140,66,0)',
                ],
              }
            : { boxShadow: '0 0 0 0 rgba(255,140,66,0)' }
        }
        transition={{
          duration: 2.2,
          repeat: !isCoolingDown && !isLoading ? Infinity : 0,
          ease: 'easeOut',
        }}
        className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0 ml-1"
        style={{
          background: isCoolingDown
            ? 'rgba(255,171,64,0.08)'
            : 'rgba(255,140,66,0.14)',
          color: isCoolingDown ? 'var(--warning)' : 'var(--cta)',
          border: `1px solid ${isCoolingDown ? 'rgba(255,171,64,0.2)' : 'rgba(255,140,66,0.25)'}`,
          transition: 'all 400ms ease',
        }}>
        <Play size={13} style={{ marginLeft: 2 }} />
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
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-mono text-[12px] font-bold w-fit"
            style={{
              background: 'rgba(245,166,35,0.15)',
              color: 'var(--star)',
              border: '1px solid rgba(245,166,35,0.3)',
              letterSpacing: '0.02em',
            }}>
            <Currency w={12} type="star" />+{amountReward}
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
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true">
                  <path
                    d="M6 4L10 8L6 12"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.span>
            )}
          </AnimatePresence>
        )}
      </div>
    </Shell>
  )
}
