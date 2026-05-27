'use client'
import { config } from '@app/config/client'
import { authApiClient } from '@app/core/authApiClient'
import { AdsNetworkEnum } from '@app/enums/ads-network.enum'
import { AdsPlaceEnum } from '@app/enums/ads-place.enum'
import { AdsDataInterface } from '@app/enums/ads-res.interface'
import { AdsTypeEnum } from '@app/enums/ads-type.enum'
import { useUserStore } from '@app/store/user.store'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { FaPlay } from 'react-icons/fa6'
import { MdDoubleArrow } from 'react-icons/md'
import { toast } from 'react-toastify'
import Currency from '../Currency'
import { releaseAdDisplayLock, tryAcquireAdDisplayLock } from './adDisplayLock'
import { CountdownTimer } from './CountdownTimer'

const createAdContainer = () => {
  const div = document.createElement('div')
  div.style.position = 'fixed'
  div.style.inset = '0'
  div.style.pointerEvents = 'none'
  document.body.appendChild(div)
  return div
}

export function TaskAdsReward() {
  const TASK_AD_OWNER = 'task-reward-ad'
  const OVERLAY_TIMEOUT_MS = 25000
  const isTaddyEnabled = config.isTaddyEnabled as boolean

  const { user, setUser } = useUserStore()
  const t = useTranslations('earning')

  const [amountReward, setAmountReward] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const adRef = useRef<AdsDataInterface | null>(null)
  const mountedRootRef = useRef<Root | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const isShowingRef = useRef(false)
  const overlayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const setTaddyOverlayVisible = useCallback((visible: boolean) => {
    if (!containerRef.current) return
    containerRef.current.style.width = visible ? '100vw' : '0'
    containerRef.current.style.height = visible ? '100vh' : '0'
    containerRef.current.style.zIndex = visible ? '99' : '-1'
    containerRef.current.style.background = visible
      ? 'rgba(0, 0, 0, 1)'
      : 'transparent'
  }, [])

  const resetOverlayTimeout = useCallback(() => {
    if (overlayTimeoutRef.current) {
      clearTimeout(overlayTimeoutRef.current)
      overlayTimeoutRef.current = null
    }
  }, [])

  const cleanup = useCallback(() => {
    resetOverlayTimeout()
    if (mountedRootRef.current) {
      mountedRootRef.current.unmount()
      mountedRootRef.current = null
    }
    if (containerRef.current) {
      containerRef.current.remove()
      containerRef.current = null
    }
    isShowingRef.current = false
    adRef.current = null
    setIsLoading(false)
    releaseAdDisplayLock(TASK_AD_OWNER)
  }, [resetOverlayTimeout])

  const scheduleCleanup = useCallback(() => {
    setTimeout(() => cleanup(), 0)
  }, [cleanup])

  const reward = useCallback(
    async (isTaddy = false) => {
      try {
        if (adRef.current == null) return
        const response = await authApiClient.confirmAds(
          adRef.current.verifyKey,
          undefined,
          isTaddy,
        )
        await setUser(response.user)
        if (response.success) toast.success(t('earned'))
      } catch (error) {
        console.error('Failed to load ad', error)
      } finally {
        adRef.current = null
      }
    },
    [setUser, t],
  )

  const fetchAd = useCallback(async (): Promise<void> => {
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
        setTaddyOverlayVisible(isTaddyEnabled)
        resetOverlayTimeout()
        overlayTimeoutRef.current = setTimeout(
          () => scheduleCleanup(),
          OVERLAY_TIMEOUT_MS,
        )

        const handleClose = () => scheduleCleanup()
        const handleReward = async (isTaddy = false) => {
          await reward(isTaddy)
          handleClose()
        }

        const showFallbackAd = async () => {
          setTaddyOverlayVisible(false)
          if (nextAd.network === AdsNetworkEnum.ADSGRAM) {
            const { default: AdsgramReward } = await import('./AdsgramReward')
            root.render(
              <AdsgramReward
                blockId={nextAd.blockId as `${number}` | `int-${number}`}
                onReward={handleReward}
                onClose={handleClose}
              />,
            )
          } else if (nextAd.network === AdsNetworkEnum.ADSONAR) {
            const { default: AdsonarReward } = await import('./AdsonarReward')
            root.render(
              <AdsonarReward
                blockId={String(nextAd.blockId)}
                onReward={handleReward}
                onClose={handleClose}
              />,
            )
          } else if (nextAd.network === AdsNetworkEnum.RICHADS) {
            const { default: RichadsReward } = await import('./RichadsReward')
            root.render(
              <RichadsReward onReward={handleReward} onClose={handleClose} />,
            )
          } else {
            handleClose()
          }
        }

        if (isTaddyEnabled) {
          const { default: TaddyInterstitial } =
            await import('./TaddyInterstitial')
          root.render(
            <TaddyInterstitial
              canCloseImmediately={false}
              requiredViewSeconds={5}
              onClosed={handleClose}
              autoCloseOnViewed={false}
              onShow={(isShow) => {
                if (isShow) void handleReward(true)
              }}
              onStartFailed={() => void showFallbackAd()}
              onError={() => void showFallbackAd()}
              onNoFill={() => void showFallbackAd()}
            />,
          )
        } else {
          void showFallbackAd()
        }
        return
      } else if (response.isNoAds) {
        toast.warn('Нет рекламы на текущий момент!')
      }

      scheduleCleanup()
    } catch (error) {
      console.error('Failed to load ad', error)
      scheduleCleanup()
    }
  }, [
    isTaddyEnabled,
    resetOverlayTimeout,
    reward,
    scheduleCleanup,
    setTaddyOverlayVisible,
  ])

  const fetchReward = useCallback(async (): Promise<void> => {
    try {
      const response = await authApiClient.getAdTaskReward()
      if (response) setAmountReward(response.amount)
      else setAmountReward(null)
    } catch (error) {
      console.error('Failed to load reward', error)
    }
  }, [])

  useEffect(() => {
    fetchReward()
  }, [fetchReward])

  useEffect(() => {
    return () => cleanup()
  }, [cleanup])

  if (amountReward == null || !user) return null

  const isCoolingDown =
    user.nextAdsRewardAt && new Date(user.nextAdsRewardAt) > new Date()

  return (
    <motion.div
      className="relative flex items-center gap-3 w-full rounded-xl overflow-hidden max-w-md"
      style={{
        background:
          'linear-gradient(135deg, var(--surface-container-high) 0%, var(--surface-container) 100%)',
        border: '1px solid var(--surface-strong-border)',
        boxShadow:
          '0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
        padding: '10px 12px',
      }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.2, 0, 0, 1] }}>
      {/* Left accent line */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl"
        style={{
          background:
            'linear-gradient(to bottom, var(--tertiary), var(--primary))',
        }}
      />

      {/* Play icon */}
      <div
        className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0 ml-1"
        style={{
          background:
            'linear-gradient(135deg, var(--tertiary-container) 0%, color-mix(in srgb, var(--tertiary-container) 60%, transparent) 100%)',
          color: 'var(--tertiary)',
          boxShadow: '0 0 0 1px rgba(239,184,200,0.15)',
        }}>
        <FaPlay size={14} />
      </div>

      {/* Title + reward badge */}
      <div className="flex flex-col gap-1 grow min-w-0">
        <span
          className="text-[13px] font-bold font-mono leading-tight truncate"
          style={{ color: 'var(--on-surface)' }}>
          {t('rewardTask.title')}
        </span>

        <div className="flex items-center gap-1.5">
          {/* Star reward badge */}
          <div
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[11px] font-bold"
            style={{
              background: 'var(--star-container-rgba)',
              color: 'var(--on-secondary-container)',
              border: '1px solid rgba(254,189,4,0.2)',
            }}>
            <Currency w={13} type="star" />
            <span>+{amountReward}</span>
          </div>
        </div>
      </div>

      {/* Right action */}
      <div className="shrink-0">
        {isCoolingDown ? (
          <div
            className="flex items-center justify-center px-2 py-1.5 rounded-lg font-mono text-[11px]"
            style={{
              background: 'var(--surface-container-highest)',
              color: 'var(--on-surface-variant)',
              border: '1px solid var(--outline-variant)',
            }}>
            <CountdownTimer expiryDate={user.nextAdsRewardAt!} />
          </div>
        ) : (
          <motion.button
            onClick={fetchAd}
            disabled={isLoading}
            className="relative flex items-center justify-center gap-1 px-3 py-2 rounded-lg font-mono text-[12px] font-bold uppercase cursor-pointer overflow-hidden"
            style={{
              background: isLoading
                ? 'var(--surface-container-highest)'
                : 'linear-gradient(135deg, var(--primary) 0%, var(--primary-active) 100%)',
              color: isLoading
                ? 'var(--disabled-content)'
                : 'var(--on-primary)',
              boxShadow: isLoading ? 'none' : '0 0 14px rgba(195,166,255,0.3)',
            }}
            whileTap={{ scale: 0.93 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
            {isLoading ? (
              /* Spinning ring while loading */
              <motion.div
                className="w-4 h-4 rounded-full border-2 border-transparent"
                style={{ borderTopColor: 'var(--primary)' }}
                animate={{ rotate: 360 }}
                transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
              />
            ) : (
              <MdDoubleArrow size={18} />
            )}
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}
