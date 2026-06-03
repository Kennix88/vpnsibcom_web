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

// ─── Обходим отсутствие типов для <adsgram-task> без .d.ts файла ──────────────
const AdsgramTask = 'adsgram-task' as unknown as React.ElementType

// ─────────────────────────────────────────────────────────────────────────────

interface TaskAdsgramTaskProps {
  /** blockId в формате 'task-xxx'. Если не передан — берётся из ответа API */
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

  const taskRef = useRef<HTMLElement | null>(null)
  const rewardCalledRef = useRef(false)

  // ── Проверить, доступна ли реклама ──────────────────────────────────────────
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

      // web-component должен быть зарегистрирован скриптом sad.min.js
      if (typeof window !== 'undefined' && customElements.get('adsgram-task')) {
        setIsReady(true)
        return
      }

      // Скрипт может грузиться асинхронно — ждём регистрации
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

  // ── Получить размер вознаграждения ───────────────────────────────────────────
  const fetchReward = useCallback(async () => {
    try {
      const response = await authApiClient.getAdTaskReward('adsgram')
      setAmountReward(response ? response.amount : null)
    } catch (err) {
      console.error('Failed to load reward', err)
    }
  }, [])

  // ── Подтвердить выполнение задания ───────────────────────────────────────────
  const handleReward = useCallback(async () => {
    if (rewardCalledRef.current) return
    rewardCalledRef.current = true
    try {
      const response = await authApiClient.confirmAds(resolvedBlockId ?? '')
      await setUser(response.user)
      if (response.success) toast.success('Награда получена!')
    } catch (err) {
      console.error('Failed to confirm task ad', err)
    }
  }, [resolvedBlockId, setUser])

  // ── Навесить слушатели на <adsgram-task> ─────────────────────────────────────
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

  // ── Ранний выход ─────────────────────────────────────────────────────────────
  if (!isVisible || !user || amountReward == null) return null

  const isCoolingDown =
    user.nextAdsgramTaskAt && new Date(user.nextAdsgramTaskAt) > new Date()

  // ── Вид "кулдаун" ────────────────────────────────────────────────────────────
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
        {/* Левая полоска */}
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl"
          style={{
            background:
              'linear-gradient(to bottom, rgba(255,171,64,0.4), rgba(255,171,64,0.15))',
          }}
        />

        {/* Иконка часов */}
        <div
          className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0 ml-1"
          style={{
            background: 'rgba(255,171,64,0.08)',
            color: 'var(--warning)',
            border: '1px solid rgba(255,171,64,0.2)',
          }}>
          <Clock size={15} />
        </div>

        {/* Центр */}
        <div className="flex flex-col gap-1 grow min-w-0">
          <span
            className="text-[13px] font-bold font-mono leading-tight truncate"
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

        {/* Таймер */}
        <div className="shrink-0 flex items-center justify-center">
          <CountdownTimer expiryDate={user.nextAdsgramTaskAt!} />
        </div>
      </motion.div>
    )
  }

  // ── Вид "задание" ─────────────────────────────────────────────────────────────
  if (!isReady || !resolvedBlockId) return null

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
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow:
          '0 6px 24px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}>
      {/* Левая цветная полоска */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl z-10"
        style={{
          background:
            'linear-gradient(to bottom, var(--cta), rgba(255,140,66,0.4))',
        }}
      />

      {/*
        AdsgramTask = 'adsgram-task' as unknown as React.ElementType
        Обход отсутствия типов без .d.ts файла.
        Стили web-component задаются через CSS-переменные и слоты.
      */}
      <AdsgramTask
        ref={taskRef}
        data-block-id={resolvedBlockId}
        data-debug={debug ? 'true' : 'false'}
        data-debug-console="false"
        className="adsgram-task-override">
        {/* слот: награда */}
        <span slot="reward" className="adsgram-slot-reward">
          <Currency w={12} type="star" />+{amountReward}
        </span>

        {/* слот: кнопка "выполнить" */}
        <div slot="button" className="adsgram-slot-button">
          Смотреть
        </div>

        {/* слот: "получить награду" (после просмотра) */}
        <div slot="claim" className="adsgram-slot-button adsgram-slot-claim">
          Забрать
        </div>

        {/* слот: "готово" */}
        <div slot="done" className="adsgram-slot-button adsgram-slot-done">
          Готово ✓
        </div>
      </AdsgramTask>

      {/* Стили для web-component — Tailwind сюда не дотянется */}
      <style>{`
        .adsgram-task-override {
          --adsgram-task-font-size: 13px;
          --adsgram-task-icon-size: 36px;
          --adsgram-task-icon-border-radius: 10px;
          --adsgram-task-icon-title-gap: 10px;
          --adsgram-task-button-width: 72px;

          display: block;
          width: 100%;
          padding: 10px 12px 10px 15px;
          color: var(--on-surface);
          font-family: ui-monospace, SFMono-Regular, monospace;
        }

        .adsgram-slot-reward {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 2px 8px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 700;
          font-family: ui-monospace, SFMono-Regular, monospace;
          background: rgba(245,166,35,0.12);
          color: var(--star);
          border: 1px solid rgba(245,166,35,0.25);
          margin-top: 4px;
        }

        .adsgram-slot-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 5px 10px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 700;
          font-family: ui-monospace, SFMono-Regular, monospace;
          background: var(--cta-container);
          color: var(--cta);
          border: 1px solid rgba(255,140,66,0.3);
          cursor: pointer;
          transition: all 150ms ease;
          white-space: nowrap;
        }

        .adsgram-slot-button:active {
          transform: scale(0.96);
        }

        .adsgram-slot-claim {
          background: rgba(255,140,66,0.22);
          color: var(--cta);
          border-color: rgba(255,140,66,0.4);
        }

        .adsgram-slot-done {
          background: rgba(55,227,162,0.12);
          color: var(--success);
          border-color: rgba(55,227,162,0.3);
          cursor: default;
        }
      `}</style>
    </motion.div>
  )
}
