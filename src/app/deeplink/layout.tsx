import type { Metadata, Viewport } from 'next'
import '../_assets/globals.css'

export const metadata: Metadata = {
  title: 'Открыть в приложении',
  description: 'Добавление VPN‑конфигурации в приложение Happ',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#151417',
}

export default function DeeplinkLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body
        style={{
          margin: 0,
          padding: 0,
          background: '#151417',
          /* Запрещаем pull-to-refresh на iOS — страница не должна случайно обновиться */
          overscrollBehavior: 'none',
        }}>
        {children}
      </body>
    </html>
  )
}
