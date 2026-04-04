'use client'

import { config } from '@app/config/client'
import { useSubscriptionsStore } from '@app/store/subscriptions.store'
import { roundUp } from '@app/utils/calculate-subscription-cost.util'
import { ReactNode, useEffect, useRef, useState } from 'react'
import { FaPlay } from 'react-icons/fa6'
import { MdDoubleArrow } from 'react-icons/md'
import { FeedItem } from 'taddy-sdk-web'
import Currency from '../Currency'

type Props = {
  pubId?: string
  limit?: number
  imageFormat?: 'png' | 'jpg' | 'webp'
  autoImpressions?: boolean
  showCompleted?: boolean
  waitForMs?: number
  manualCheck?: boolean
  renderPrice?: (item: FeedItem) => ReactNode
  onItems?: (items: FeedItem[]) => void
  onComplete?: (item: FeedItem) => void
  onNotCompleted?: (item: FeedItem) => void
}

export default function TaddyExchange({
  pubId = config.taddyPubId,
  limit = 4,
  imageFormat = 'webp',
  autoImpressions = true,
  showCompleted = true,
  waitForMs = 3000,
  manualCheck = false,
  renderPrice,
  onItems,
  onComplete,
  onNotCompleted,
}: Props) {
  const startedRef = useRef(false)
  const [items, setItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { subscriptions } = useSubscriptionsStore()

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    let cancelled = false

    const waitForTaddy = async (): Promise<typeof window.Taddy | undefined> => {
      const startedAt = Date.now()
      return await new Promise((resolve) => {
        const tick = () => {
          if (window.Taddy) {
            resolve(window.Taddy)
            return
          }
          if (Date.now() - startedAt >= waitForMs) {
            resolve(undefined)
            return
          }
          window.setTimeout(tick, 50)
        }
        tick()
      })
    }

    const run = async () => {
      try {
        const taddy = await waitForTaddy()

        if (!taddy) {
          setError('Taddy SDK not available on window')
          setLoading(false)
          return
        }

        if (!pubId) {
          setError('Taddy pubId is not configured')
          setLoading(false)
          return
        }

        if (!taddy.isInit) {
          await taddy.init(pubId, {
            // debug: process.env.NODE_ENV === 'development',
          })
        }

        if (!taddy.isReady) {
          await taddy.ready()
        }

        const exchange = taddy.exchange()
        const result = await exchange.feed({
          limit,
          imageFormat,
          autoImpressions,
          showCompleted,
        })

        if (cancelled) return

        setItems(result)
        onItems?.(result)

        if (!autoImpressions && result.length > 0) {
          exchange.impressions(result)
        }
      } catch {
        if (!cancelled) {
          setError('Failed to load exchange feed')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [
    autoImpressions,
    imageFormat,
    limit,
    onItems,
    pubId,
    showCompleted,
    waitForMs,
  ])

  const handleOpen = async (item: FeedItem) => {
    try {
      const taddy = window.Taddy
      if (!taddy) return

      const exchange = taddy.exchange()
      if (manualCheck) {
        await exchange.open(item, false)
        const success = await exchange.check(item)
        if (success) {
          onComplete?.(item)
        } else {
          onNotCompleted?.(item)
        }
      } else {
        await exchange.open(item)
        onComplete?.(item)
      }
    } catch {
      onNotCompleted?.(item)
    }
  }

  if (loading) {
    return null
  }

  if (error) {
    return null
  }

  if (!items.length) {
    return null
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {items.map((item) => {
        const priceStars =
          typeof item.price === 'number' && subscriptions?.tgStarsToUSD
            ? roundUp(item.price * subscriptions.tgStarsToUSD)
            : null
        const displayPrice = renderPrice?.(item) ?? priceStars

        return (
          <div
            key={String(item.id)}
            className="px-2 py-1 bg-[var(--surface-container-lowest)] rounded-md font-bold flex items-center justify-between gap-2 w-full">
            <div className="w-[40px] h-[40px] rounded-md bg-[var(--tertiary)] text-[var(--on-tertiary)] flex items-center justify-center overflow-hidden">
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image}
                  alt={item.title ?? 'Exchange item'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <FaPlay className="text-xl" />
              )}
            </div>
            <div className="flex flex-col gap-0.5 grow min-w-0">
              <div className="text-[14px] font-bold font-mono truncate">
                {item.title ?? 'Exchange'}
              </div>
              <div className="text-[12px] flex gap-2 flex-wrap font-mono">
                {displayPrice != null && (
                  <div className="inline-flex gap-1 items-center px-1 py-1 rounded-md bg-[var(--star-container-rgba)] w-fit">
                    <Currency w={18} type={'star'} />+{displayPrice}
                  </div>
                )}
                {item.description && (
                  <div className="truncate opacity-70">{item.description}</div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => void handleOpen(item)}
              className="font-medium flex items-center justify-center bg-[var(--primary)] text-[var(--on-primary)] px-2 py-1 rounded-md uppercase cursor-pointer w-[52px]">
              <MdDoubleArrow size={18} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
