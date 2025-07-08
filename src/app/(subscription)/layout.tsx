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
      <body className="bg-[var(--background)]">{children}</body>
    </html>
  )
}
