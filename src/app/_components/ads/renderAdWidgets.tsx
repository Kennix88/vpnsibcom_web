'use client'
import { AdsNetworkEnum } from '@app/enums/ads-network.enum'
import { AdsDataInterface } from '@app/enums/ads-res.interface'
import { Root } from 'react-dom/client'

export interface NetworkAdHandlers {
  /** Пользователь досмотрел / выполнил условие награды.
   *  viaTaddyWrapper=true — если досмотр произошёл через верхнюю Taddy-обёртку. */
  onWatched: (viaTaddyWrapper?: boolean) => void
  /** Эта конкретная реклама не отрисовалась/закрыта без награды (no-fill, error, ранний выход). */
  onDismissed: (viaTaddyWrapper?: boolean) => void
}

export type NetworkAdVariant = 'view' | 'reward'

const TADDY_WRAPPER_BLOCK_ID = 'taddyapi'

/** "Голый" SDK-виджет Taddy — используется сам по себе, и как fallback для верхней обёртки (та же сеть, другой формат). */
async function renderTaddySDK(root: Root, handlers: NetworkAdHandlers) {
  const { onWatched, onDismissed } = handlers
  const { default: TaddyInterstitialForSDK } =
    await import('./TaddyInterstitialForSDK')
  root.render(
    <TaddyInterstitialForSDK
      onClosed={() => onWatched()}
      onViewThrough={() => onWatched()}
      onError={() => onDismissed()}
      onNoFill={() => onDismissed()}
    />,
  )
}

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
        onError={() => void renderTaddySDK(root, handlers)}
        onNoFill={() => void renderTaddySDK(root, handlers)}
      />,
    )
  } catch (error) {
    console.error('[renderTaddyWrapper] failed to load:', error)

    // Текущая реклама не может быть показана.
    onDismissed(true)
  }
}
/**
 * Рендерит ОДНУ рекламу под конкретную сеть/blockId, которую отдал backend.
 * Никакого клиентского fallback на другую сеть — если ad === null, значит юзеру
 * сейчас реклама не положена, и мы это уважаем. Если ad есть, но не отрисовался —
 * решение "попросить у backend другую рекламу" принимается выше, в хуке
 * (см. useFullscreenAd/useRewardAd), потому что многим сетям для показа
 * обязателен свой blockId, который клиент подделать не может.
 */
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
        await renderTaddySDK(root, handlers)
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
