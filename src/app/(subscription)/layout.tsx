import { I18nProvider } from '@app/core/i18n/provider'
import { getLocale } from 'next-intl/server'
import '../_assets/globals.css'

export const metadata = {
  title: 'Your subscription - VPNsib.com',
  description: 'Your subscription',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  return (
    <html lang={locale}>
      <body className="bg-[var(--background)]">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  )
}
