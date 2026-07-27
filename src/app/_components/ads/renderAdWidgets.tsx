'use client'

import { AdsNetworkEnum } from '@app/enums/ads-network.enum'
import { AdsDataInterface } from '@app/enums/ads-res.interface'
import { Root } from 'react-dom/client'

export interface NetworkAdHandlers {
  /** Пользователь досмотрел / выполнил условие награды. */
  onWatched: (viaTaddyWrapper?: boolean) => void

  /** Текущая реклама не отрисовалась или была закрыта без награды. */
  onDismissed: (viaTaddyWrapper?: boolean) => void
}

export type NetworkAdVariant = 'view' | 'reward'

const TADDY_WRAPPER_BLOCK_ID = 'taddyapi'

async function renderTaddyWrapper(
  root: Root,
  handlers: NetworkAdHandlers,
  variant: NetworkAdVariant,
) {
  const { onWatched, onDismissed } = handlers
  const isView = variant === 'view'

  try {
    const { default: TaddyInterstitial } = await import('./TaddyInterstitial')

    root.render(
      <TaddyInterstitial
        canCloseImmediately={isView}
        requiredViewSeconds={10}
        showSkeleton={!isView}
        onClosed={() => (isView ? onWatched(true) : onDismissed(true))}
        onViewed={() => onWatched(true)}

        // API Taddy завершился ошибкой
        onError={() => onDismissed(true)}

        // API Taddy вернул result === null
        onNoFill={() => onDismissed(true)}
      />,
    )
  } catch (error) {
    console.error(
      '[renderTaddyWrapper] failed to load TaddyInterstitial:',
      error,
    )

    onDismissed(true)
  }
}

export async function renderNetworkAd(
  root: Root,
  ad: AdsDataInterface | null,
  handlers: NetworkAdHandlers,
  variant: NetworkAdVariant,
) {
  const { onWatched, onDismissed } = handlers

  if (!ad) {
    onDismissed()
    return
  }

  switch (ad.network) {
    case AdsNetworkEnum.TADDY: {
      if (ad.blockId === TADDY_WRAPPER_BLOCK_ID) {
        await renderTaddyWrapper(root, handlers, variant)
      } else {
        // Важно:
        // здесь по-прежнему запускается SDK Taddy.
        // Если SDK Taddy вообще больше не нужен, этот блок тоже нужно убрать.
        onDismissed()
      }

      break
    }

    case AdsNetworkEnum.ADSGRAM: {
      const { default: AdsgramAd } = await import('./AdsgramAd')

      root.render(
        <AdsgramAd
          blockId={String(ad.blockId)}
          onReward={() => onWatched()}
          onClose={() => onDismissed()}
          isDebug={process.env.NODE_ENV !== 'production'}
        />,
      )

      break
    }

    case AdsNetworkEnum.ADSONAR: {
      const { default: AdsonarAd } = await import('./AdsonarAd')

      root.render(
        <AdsonarAd
          blockId={String(ad.blockId)}
          variant={variant}
          onWatched={() => onWatched()}
          onDismissed={() => onDismissed()}
        />,
      )

      break
    }

    case AdsNetworkEnum.RICHADS: {
      const { default: RichadsReward } = await import('./RichadsReward')

      root.render(
        <RichadsReward
          onReward={() => onWatched()}
          onClose={() => onDismissed()}
        />,
      )

      break
    }

    default:
      onDismissed()
  }
}
