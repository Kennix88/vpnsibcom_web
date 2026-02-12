// components/GraspilInit.tsx
'use client'

import Script from 'next/script'
import { useEffect } from 'react'

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Safe Graspil init for Telegram Mini App.
 * Uses:
 *  - retrieveRawInitData() (string initData)
 *  - retrieveLaunchParams() (tgWebAppPlatform etc.)
 *  - globalThis.Telegram?.WebApp when available
 *
 * Insert this component somewhere in client layout (after your initTelegramSDK call)
 */
export default function AnalyticsInit() {
  useEffect(() => {
    // wait microtask so next/script has chance to run its inline script
    Promise.resolve().then(async () => {
      const { retrieveLaunchParams, retrieveRawInitData } =
        await import('@tma.js/sdk-react')
      const initDataRaw = retrieveRawInitData()
      const launchParams = retrieveLaunchParams()

      // 1) try global Telegram.WebApp (may be removed by @telegram-apps)
      const tgWebApp = (globalThis as any).Telegram?.WebApp

      // 2) collect values with fallbacks
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
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light')

      // ensure graspil exists and is pushable; support two shapes:
      // - array (usual analytics pattern)
      // - object with push function (in case something else created it)
      if (typeof window !== 'undefined') {
        const w = window as any

        if (!w.graspil) {
          // create array — remote script usually reads array on load
          w.graspil = []
        } else {
          // if graspil exists but is not usable, create wrapper that buffers
          const isArray = Array.isArray(w.graspil)
          const hasPushFn = typeof w.graspil.push === 'function'
          if (!isArray && !hasPushFn) {
            // preserve whatever value to buffer if needed
            const prev = w.graspil
            w.__graspil_prev = prev
            w.__graspil_buffer = []
            w.graspil = {
              push: (item: any) => {
                w.__graspil_buffer.push(item)
              },
            }
          }
        }

        // compose payload
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

        // Optionally add launch params for extra info
        if (launchParams?.tgWebAppStartParam)
          payload.tgWebAppStartParam = launchParams.tgWebAppStartParam

        // push safely
        try {
          // if it's array, push will work; if it's object with push method, it will work too
          ;(w.graspil as any).push(payload)
        } catch {
          // fallback: convert to array and push
          w.graspil = w.graspil && Array.isArray(w.graspil) ? w.graspil : []
          w.graspil.push(payload)
          // w.Telegram.push(payload)
          // w.Taddy.init('14cbeb980853dd416003462ca4db7c12')
        }
      }
    })
  }, [])

  // Insert Graspil loader script. It will create window.graspil = [] and load remote script.
  // Using dangerouslySetInnerHTML inline to match required snippet.
  return (
    <>
      {process.env.NEXT_PUBLIC_GRASPIL_ID && (
        <Script
          id="graspil"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){
      if (!Array.isArray(w[l])) { w[l] = []; }
      w[l].push({key:i});
      var f=d.getElementsByTagName(s)[0], j=d.createElement(s);
      j.async=true;j.src="https://w.graspil.com";
      f.parentNode.insertBefore(j,f);
    })(window,document,"script","graspil","${process.env.NEXT_PUBLIC_GRASPIL_ID}");`,
          }}
        />
      )}
    </>
  )
}
