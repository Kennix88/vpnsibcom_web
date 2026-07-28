'use client'
import { AdsNetworkEnum } from '@app/enums/ads-network.enum'
import { AdsDataInterface } from '@app/enums/ads-res.interface'
import { Root } from 'react-dom/client'
export interface NetworkAdHandlers {
  /** Пользователь досмотрел / выполнил условие награды. */
  onWatched: (viaTaddyWrapper?: boolean) => void
  /** Техническая проблема (SDK не отдал рекламу, ошибка загрузки, no-fill) — можно ретраить. */
  onError: (viaTaddyWrapper?: boolean) => void
  /** Пользователь сам закрыл рекламу раньше времени (для reward — без награды). Терминально, ретраить не нужно. */
  onClosedEarly: (viaTaddyWrapper?: boolean) => void
}
export type NetworkAdVariant = 'view' | 'reward'
// const TADDY_WRAPPER_BLOCK_ID = 'taddyapi'

/**
 * - view: закрытие всегда засчитывается как просмотр, даже если закрыли раньше времени.
 * - reward: закрытие без onReward — это просто закрытие без награды, терминально, без ретрая.
 */
function handleNetworkClose(
  variant: NetworkAdVariant,
  handlers: NetworkAdHandlers,
) {
  if (variant === 'view') {
    handlers.onWatched()
  } else {
    handlers.onClosedEarly()
  }
}

async function renderTaddyWrapper(
  root: Root,
  handlers: NetworkAdHandlers,
  variant: NetworkAdVariant,
) {
  const { onWatched, onError, onClosedEarly } = handlers
  const isView = variant === 'view'
  try {
    const { default: TaddyInterstitial } = await import('./TaddyInterstitial')
    root.render(
      <TaddyInterstitial
        canCloseImmediately={isView}
        requiredViewSeconds={10}
        showSkeleton={!isView}
        onClosed={() => (isView ? onWatched(true) : onClosedEarly(true))}
        onViewed={() => onWatched(true)}
        onError={() => onError(true)}
        onNoFill={() => onError(true)}
      />,
    )
  } catch (error) {
    console.error(
      '[renderTaddyWrapper] failed to load TaddyInterstitial:',
      error,
    )
    onError(true)
  }
}

export async function renderNetworkAd(
  root: Root,
  ad: AdsDataInterface | null,
  handlers: NetworkAdHandlers,
  variant: NetworkAdVariant,
) {
  const { onWatched, onError } = handlers
  if (!ad) {
    // backend не отдал рекламу — это тоже кейс "нет заполнения", ведём как ошибку (ретрай решает вызывающий код).
    onError()
    return
  }
  switch (ad.network) {
    case AdsNetworkEnum.TADDY: {
      await renderTaddyWrapper(root, handlers, variant)
      break
    }
    case AdsNetworkEnum.ADSGRAM: {
      try {
        const { default: AdsgramAd } = await import('./AdsgramAd')
        root.render(
          <AdsgramAd
            blockId={String(ad.blockId)}
            onReward={() => onWatched()}
            onClose={() => handleNetworkClose(variant, handlers)}
            onError={() => onError()}
            isDebug={process.env.NODE_ENV !== 'production'}
          />,
        )
      } catch (error) {
        console.error('[renderNetworkAd] failed to load AdsgramAd:', error)
        onError()
      }
      break
    }
    case AdsNetworkEnum.ADSONAR: {
      try {
        const { default: AdsonarAd } = await import('./AdsonarAd')
        root.render(
          <AdsonarAd
            blockId={String(ad.blockId)}
            variant={variant}
            onReward={() => onWatched()}
            onClose={() => handleNetworkClose(variant, handlers)}
            onError={() => onError()}
          />,
        )
      } catch (error) {
        console.error('[renderNetworkAd] failed to load AdsonarAd:', error)
        onError()
      }
      break
    }
    case AdsNetworkEnum.RICHADS: {
      try {
        const { default: RichadsReward } = await import('./RichadsReward')
        root.render(
          <RichadsReward
            onReward={() => onWatched()}
            onClose={() => handleNetworkClose(variant, handlers)}
            onError={() => onError()}
          />,
        )
      } catch (error) {
        console.error('[renderNetworkAd] failed to load RichadsReward:', error)
        onError()
      }
      break
    }
    default:
      onError()
  }
}
