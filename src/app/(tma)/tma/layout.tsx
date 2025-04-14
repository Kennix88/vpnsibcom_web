import NavBar from '@app/app/_components/NavBar'
import { ThemeToggle } from '@app/app/_components/ThemeToggle'
import { I18nProvider } from '@app/core/i18n/provider'
import { TelegramProvider } from '@app/providers/TelegramProvider'
import { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import 'normalize.css/normalize.css'
import React from 'react'
import '../../_assets/globals.css'

export const metadata: Metadata = {
  title: 'TMA - VPNsib.com',
  description: 'VPNsibcom is an open source VPN service.',
}

export default async function TmaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  return (
    <html lang={locale}>
      <body className="bg-background">
        <I18nProvider>
          <TelegramProvider>
            <div className="pt-4 px-4 pb-[100px] flex flex-col gap-4 text-[#fafafa]">
              <ThemeToggle />
              {children}
              <NavBar />
            </div>
          </TelegramProvider>
        </I18nProvider>
      </body>
    </html>
  )
}
