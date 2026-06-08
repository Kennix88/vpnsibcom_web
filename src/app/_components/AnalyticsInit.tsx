'use client'

import Script from 'next/script'
import { useEffect } from 'react'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Graspil analytics init for Telegram Mini App.
 *
 * ✅ Fix #5: Options (trackClicks, trackTgEvents) are now included in the
 * push call inside the IIFE — the 6th argument to an IIFE with 5 params
 * was silently ignored before.
 */
export default function AnalyticsInit() {
  useEffect(() => {
    Promise.resolve().then(async () => {
      try {
        const { retrieveLaunchParams, retrieveRawInitData } =
          await import('@tma.js/sdk-react')

        const initDataRaw = retrieveRawInitData()
        const launchParams = retrieveLaunchParams()
        const tgWebApp = (globalThis as any).Telegram?.WebApp

        const platform =
          tgWebApp?.platform ?? launchParams?.tgWebAppPlatform ?? undefined
        const version = tgWebApp?.version ?? undefined
        const viewportHeight =
          typeof tgWebApp?.viewportHeight === 'number'
            ? tgWebApp.viewportHeight
            : typeof window !== 'undefined'
              ? window.innerHeight
              : undefined
        const viewportStableHeight =
          typeof tgWebApp?.viewportStableHeight === 'number'
            ? tgWebApp.viewportStableHeight
            : undefined
        const colorScheme =
          tgWebApp?.colorScheme ??
          (typeof window !== 'undefined' &&
          window.matchMedia?.('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light')

        if (typeof window === 'undefined') return

        const w = window as any
        if (!Array.isArray(w.graspil)) {
          w.graspil = []
        }

        const payload: Record<string, any> = {
          custom_init_data_row: initDataRaw ?? undefined,
        }
        if (platform) payload.platform = platform
        if (version) payload.version = version
        if (viewportHeight !== undefined)
          payload.viewportHeight = viewportHeight
        if (viewportStableHeight !== undefined)
          payload.viewportStableHeight = viewportStableHeight
        if (colorScheme) payload.colorScheme = colorScheme
        if (launchParams?.tgWebAppStartParam)
          payload.tgWebAppStartParam = launchParams.tgWebAppStartParam

        w.graspil.push(payload)
      } catch (err) {
        console.error('AnalyticsInit error', err)
      }
    })
  }, [])

  if (!process.env.NEXT_PUBLIC_GRASPIL_ID) return null

  const id = process.env.NEXT_PUBLIC_GRASPIL_ID

  return (
    <Script
      id="graspil"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        // ✅ Fix #5: options merged into the initial push object, not a 6th IIFE arg
        __html: `(function(w,d,s,l,i){
  if (!Array.isArray(w[l])) { w[l] = []; }
  w[l].push({ key: i, trackClicks: 'tagged', trackTgEvents: false });
  var f=d.getElementsByTagName(s)[0], j=d.createElement(s);
  j.async=true; j.src="https://w.graspil.com";
  f.parentNode.insertBefore(j,f);
})(window,document,"script","graspil","${id}");`,
      }}
    />
  )
}
