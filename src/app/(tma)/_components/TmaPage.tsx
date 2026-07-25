'use client'
import { useSignal, viewport } from '@tma.js/sdk-react'
import { useRouter } from 'next/navigation'
import { PropsWithChildren, useEffect, useMemo } from 'react'
import { pushBackHandler } from './backButtonStack'

// Платформы, где имеет смысл просить полноэкранный режим.
// Десктопные клиенты Telegram (tdesktop/macos/web*) фуллскрин
// либо не поддерживают, либо он там не нужен — для них просто expand().
// const MOBILE_PLATFORMS = new Set(['ios', 'android'])

export function TmaPage({
  children,
  back = true,
}: PropsWithChildren<{
  /**
   * True if it is allowed to go back from this page.
   * @default true
   */
  back?: boolean
}>) {
  const router = useRouter()

  useEffect(() => {
    const pop = pushBackHandler(back ? () => router.back() : null)
    return pop
  }, [back, router])

  // const launchParams = useLaunchParams(true)
  // const platform = launchParams?.tgWebAppPlatform
  // const isMobilePlatform = platform ? MOBILE_PLATFORMS.has(platform) : false

  // const isViewportMounted = useSignal(viewport.isMounted)
  const isFullscreen = useSignal(viewport.isFullscreen)

  // safe area (системные вырезы/шторка) + content safe area
  // (перекрытие системным UI Telegram, например верхней плашкой в fullscreen)
  const safeAreaTop = useSignal(viewport.safeAreaInsetTop)
  const contentSafeAreaTop = useSignal(viewport.contentSafeAreaInsetTop)

  // useEffect(() => {
  //   let cancelled = false

  //   async function setup() {
  //     try {
  //       if (!viewport.isMounted()) {
  //         await viewport.mount()
  //       }
  //       if (cancelled) return

  //       viewport.bindCssVars()

  //       if (isMobilePlatform) {
  //         if (
  //           viewport.requestFullscreen.isAvailable() &&
  //           !viewport.isFullscreen()
  //         ) {
  //           await viewport.requestFullscreen()
  //         }
  //       } else {
  //         // На десктопе просто разворачиваем на полный размер окна TMA,
  //         // fullscreen-режим не запрашиваем
  //         if (viewport.expand.isAvailable()) {
  //           viewport.expand()
  //         }
  //       }
  //     } catch (e) {
  //       // Например, запуск вне Telegram (обычный браузер) — просто игнорируем
  //       console.warn('[TmaPage] viewport setup failed:', e)
  //     }
  //   }

  //   setup()
  //   return () => {
  //     cancelled = true
  //   }
  // }, [isMobilePlatform])

  // Отступ сверху нужен только в реальном fullscreen-режиме на мобиле,
  // чтобы контент не залезал под системную шторку / плашку Telegram
  const topInset = useMemo(() => {
    if (!isFullscreen) return 0
    return Math.max(safeAreaTop ?? 0, contentSafeAreaTop ?? 0)
  }, [isFullscreen, safeAreaTop, contentSafeAreaTop])

  return (
    <div
      className="w-full flex justify-center"
      style={topInset ? { paddingTop: topInset } : undefined}>
      <div className="max-w-md w-full flex flex-col items-stretch">
        {children}
      </div>
    </div>
  )
}
