'use client'
import { SonarReturnStatus } from '@app/types/sonar'
import { useEffect, useRef } from 'react'
import { NetworkAdHandlers, NetworkAdVariant } from './renderAdWidgets'

interface AdsonarAdProps extends NetworkAdHandlers {
  blockId: string
  variant: NetworkAdVariant
}

/**
 * Единый компонент для Adsonar.
 * - 'view':   fullscreen без явной награды, loader выключен, любое завершение показа = onWatched.
 * - 'reward': rewarded-формат, loader включен, награда только через onReward; onError/onClose = onDismissed.
 */
export default function AdsonarAd({
  blockId,
  variant,
  onWatched,
  onDismissed,
}: AdsonarAdProps) {
  const calledRef = useRef(false)
  const handlersRef = useRef({ onWatched, onDismissed })
  handlersRef.current = { onWatched, onDismissed }

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
        if (!cancelled) handlersRef.current.onDismissed()
        return
      }
      try {
        const result: { status: SonarReturnStatus; message?: string } =
          await sonar.show({
            adUnit: blockId,
            loader: isReward,
            ...(isReward && {
              onError: () => {
                if (!cancelled) handlersRef.current.onDismissed()
              },
              onClose: () => {
                if (!cancelled) handlersRef.current.onDismissed()
              },
              onReward: () => {
                if (!cancelled) handlersRef.current.onWatched()
              },
            }),
          })

        if (isReward) {
          if (result?.status === 'error') {
            console.error('Не удалось показать рекламу:', result.message)
            if (!cancelled) handlersRef.current.onDismissed()
          }
          // остальные статусы обрабатываются через onReward/onClose из конфига выше
        } else if (!cancelled) {
          // VIEW: любое завершение показа = подтверждение
          handlersRef.current.onWatched()
        }
      } catch (err) {
        console.error('showSonarAd error', err)
        if (!cancelled) {
          if (isReward) handlersRef.current.onDismissed()
          else handlersRef.current.onWatched()
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
