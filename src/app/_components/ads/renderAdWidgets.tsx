'use client'

import { AdsNetworkEnum } from '@app/enums/ads-network.enum'
import { AdsDataInterface } from '@app/enums/ads-res.interface'
import { Root } from 'react-dom/client'

export interface NetworkAdHandlers {
  /** Пользователь досмотрел / выполнил условие награды. */
  onWatched: () => void
  /** Реклама закрыта без права на награду (ошибка, no-fill, ранний выход). */
  onDismissed: () => void
}

/** variant отличает view-версии компонентов от reward-версий там, где сети требуют разные виджеты (напр. Adsonar). */
export async function renderNetworkAd(
  root: Root,
  ad: AdsDataInterface | null,
  handlers: NetworkAdHandlers,
  variant: 'view' | 'reward',
) {
  const { onWatched, onDismissed } = handlers

  if (!ad) {
    onDismissed()
    return
  }

  switch (ad.network) {
    case AdsNetworkEnum.TADDY: {
      const { default: TaddyInterstitialForSDK } =
        await import('./TaddyInterstitialForSDK')
      root.render(
        <TaddyInterstitialForSDK
          onClosed={onWatched}
          onViewThrough={onWatched}
          onError={onDismissed}
          onNoFill={onDismissed}
        />,
      )
      break
    }
    case AdsNetworkEnum.ADSGRAM: {
      const { default: AdsgramAd } = await import('./AdsgramAd')
      root.render(
        <AdsgramAd
          blockId={String(ad.blockId)}
          onReward={onWatched}
          onClose={onDismissed}
          isDebug={process.env.NODE_ENV !== 'production'}
        />,
      )
      break
    }
    case AdsNetworkEnum.ADSONAR: {
      if (variant === 'reward') {
        const { default: AdsonarReward } = await import('./AdsonarReward')
        root.render(
          <AdsonarReward
            blockId={String(ad.blockId)}
            onReward={onWatched}
            onClose={onDismissed}
          />,
        )
      } else {
        const { default: AdsonarFullscreen } =
          await import('./AdsonarFullscreen')
        root.render(
          <AdsonarFullscreen
            blockId={String(ad.blockId)}
            onClose={onWatched}
          />,
        )
      }
      break
    }
    case AdsNetworkEnum.RICHADS: {
      const { default: RichadsReward } = await import('./RichadsReward')
      root.render(<RichadsReward onReward={onWatched} onClose={onDismissed} />)
      break
    }
    default:
      onDismissed()
  }
}

interface TaddyWrapperConfig {
  canCloseImmediately: boolean
  requiredViewSeconds: number
  onClosed: () => void
  onViewed: () => void
  onError: () => void
  onNoFill: () => void
}

/** "Верхняя" полноэкранная Taddy-обёртка, показывается перед fallback-сетью, если Taddy включён. */
export async function renderTaddyWrapper(root: Root, cfg: TaddyWrapperConfig) {
  const { default: TaddyInterstitial } = await import('./TaddyInterstitial')
  root.render(
    <TaddyInterstitial
      canCloseImmediately={cfg.canCloseImmediately}
      requiredViewSeconds={cfg.requiredViewSeconds}
      onClosed={cfg.onClosed}
      onViewed={cfg.onViewed}
      onError={cfg.onError}
      onNoFill={cfg.onNoFill}
      showSkeleton={false}
    />,
  )
}
