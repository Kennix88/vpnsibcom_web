import { I18nProvider } from '@app/core/i18n/provider'
import { TelegramProvider } from '@app/providers/TelegramProvider'
import { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
// import 'normalize.css/normalize.css'
import { CheckPlatform } from '@app/app/(tma)/tma/_components/CheckPlatform'
import { config } from '@app/config/client'
import Script from 'next/script'
import React from 'react'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import '../../_assets/globals.css'
import { InitData } from '../_components/InitData'

export const metadata: Metadata = {
  title: 'TMA - VPNsib',
  description: 'VPNsib - VPN service.',
}

export default async function TmaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  return (
    <html lang={locale} className={'dark'}>
      <head>
        <Script
          id="adsonar"
          strategy="beforeInteractive"
          src={
            'https://static.sonartech.io/lib/1.0.0/sonar.js?appId=app_133d2148' +
            (process.env.NODE_ENV === 'development' ? '&isDebug=true' : '')
          }
        />

        <Script
          id="taddy"
          strategy="beforeInteractive"
          src={'https://sdk.taddy.pro/web/taddy.min.js?1317'}
        />

        <Script
          id="richads-sdk"
          strategy="beforeInteractive"
          src="https://richinfo.co/richpartners/telegram/js/tg-ob.js"
        />
        <Script
          id="richads-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.richadsController = window.richadsController || null;
              if (!window.richadsController && window.TelegramAdsController) {
                window.richadsController = new window.TelegramAdsController();
                window.richadsController.initialize({
                  pubId: "${config.richadsPubId}",
                  appId: "${config.richadsAppId}",
                  debug: ${process.env.NODE_ENV === 'development'},
                });
              }
            `,
          }}
        />
      </head>
      <body className="bg-[var(--background)]">
        <I18nProvider>
          <TelegramProvider>
            <ToastContainer
              position="bottom-center"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="dark"
            />
            <CheckPlatform>
              <InitData>{children}</InitData>
            </CheckPlatform>
          </TelegramProvider>
        </I18nProvider>
      </body>
    </html>
  )
}
