import { I18nProvider } from '@app/core/i18n/provider'
import { TelegramProvider } from '@app/providers/TelegramProvider'
import { Metadata } from 'next'
import Script from 'next/script'
import { getLocale } from 'next-intl/server'
// import 'normalize.css/normalize.css'
import { CheckPlatform } from '@app/app/(tma)/tma/_components/CheckPlatform'
import React from 'react'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import '../../_assets/globals.css'
import { InitData } from '../_components/InitData'

const telegramDesktopBridgePatch = `
;(function () {
  var w = window;
  var noop = function () {};

  w.TelegramGameProxy = w.TelegramGameProxy || {};
  if (typeof w.TelegramGameProxy.receiveEvent !== 'function') {
    w.TelegramGameProxy.receiveEvent = noop;
  }

  w.Telegram = w.Telegram || {};
  w.Telegram.WebView = w.Telegram.WebView || {};
  if (typeof w.Telegram.WebView.receiveEvent !== 'function') {
    w.Telegram.WebView.receiveEvent = noop;
  }

  if (typeof w.TelegramGameProxy_receiveEvent !== 'function') {
    w.TelegramGameProxy_receiveEvent = function () {
      return w.TelegramGameProxy.receiveEvent.apply(w.TelegramGameProxy, arguments);
    };
  }
})();`

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
          id="telegram-desktop-bridge-patch"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: telegramDesktopBridgePatch }}
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
