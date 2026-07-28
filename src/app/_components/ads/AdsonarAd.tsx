'use client'
import { SonarReturnStatus } from '@app/types/sonar'
import { useEffect, useRef } from 'react'
import { NetworkAdVariant } from './renderAdWidgets'

interface AdsonarAdProps {
  blockId: string
  variant: NetworkAdVariant
  onReward: () => void
  onError: (message?: string) => void
  onClose: () => void
}

/**
 * Единый компонент для Adsonar.
 * - 'view':   fullscreen без явной награды, loader выключен, любое завершение показа = onWatched.
 * - 'reward': rewarded-формат, loader включен, награда только через onReward.
 *             - SDK недоступен / onError из SDK / status === 'error' / exception -> onError
 *             - onClose из SDK (пользователь закрыл рекламу)                     -> onClose
 */
export default function AdsonarAd({
  blockId,
  variant,
  onReward,
  onError,
  onClose,
}: AdsonarAdProps) {
  const calledRef = useRef(false)
  const handlersRef = useRef({ onReward, onError, onClose })
  handlersRef.current = { onReward, onError, onClose }

  useEffect(() => {
    if (calledRef.current) return
    calledRef.current = true
    let cancelled = false
    const isReward = variant === 'reward'

    const showSonarAd = async () => {
      /* eslint-disable @typescript-eslint/ban-ts-comment */
      // @ts-ignore
      const sonar = window.Sonar
      if (!sonar?.show) {
        console.warn('Sonar SDK not available')
        if (!cancelled) handlersRef.current.onError('Sonar SDK not available')
        return
      }
      try {
        const result: { status: SonarReturnStatus; message?: string } =
          await sonar.show({
            adUnit: blockId,
            loader: isReward,
            ...(isReward && {
              onError: (message?: string) => {
                if (!cancelled) handlersRef.current.onError(message)
              },
              onClose: () => {
                if (!cancelled) handlersRef.current.onClose()
              },
              onReward: () => {
                if (!cancelled) handlersRef.current.onReward()
              },
            }),
          })

        if (isReward) {
          if (result?.status === 'error') {
            console.error('Не удалось показать рекламу:', result.message)
            if (!cancelled) handlersRef.current.onError(result.message)
          }
          // остальные статусы обрабатываются через onReward/onClose из конфига выше
        } else if (!cancelled) {
          // VIEW: любое завершение показа = подтверждение
          handlersRef.current.onReward()
        }
      } catch (err) {
        console.error('showSonarAd error', err)
        if (!cancelled) {
          if (isReward) {
            handlersRef.current.onError(
              err instanceof Error ? err.message : String(err),
            )
          } else {
            handlersRef.current.onReward()
          }
        }
      }
    }

    // defer, чтобы избежать гонки с гидратацией
    const id = setTimeout(showSonarAd, 0)
    return () => {
      cancelled = true
      clearTimeout(id)
    }
  }, [blockId, variant])

  return null
}
