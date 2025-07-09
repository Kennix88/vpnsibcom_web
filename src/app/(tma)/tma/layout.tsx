import { I18nProvider } from '@app/core/i18n/provider'
import { TelegramProvider } from '@app/providers/TelegramProvider'
import { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
// import 'normalize.css/normalize.css'
import { CheckPlatform } from '@app/app/(tma)/tma/_components/CheckPlatform'
import React from 'react'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import '../../_assets/globals.css'

export const metadata: Metadata = {
  title: 'TMA - VPNsib',
  description: 'VPNsibcom is an open source VPN service.',
}

export default async function TmaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  return (
    <html lang={locale} className={'dark'}>
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
            <CheckPlatform>{children}</CheckPlatform>
          </TelegramProvider>
        </I18nProvider>
      </body>
    </html>
  )
}
