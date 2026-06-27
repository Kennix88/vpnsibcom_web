import { I18nProvider } from '@app/core/i18n/provider'
import type { Metadata, Viewport } from 'next'
import { getLocale } from 'next-intl/server'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import '../../../_assets/globals.css'

export const metadata: Metadata = {
  title: 'Переход к рекламному партнеру - VPNsib',
  description: 'Переход к рекламному партнеру',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  return (
    <html lang={locale}>
      <body className="bg-[var(--background)] min-h-[100dvh]">
        <I18nProvider>
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
          {children}
        </I18nProvider>
      </body>
    </html>
  )
}
