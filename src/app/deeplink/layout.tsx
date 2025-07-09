import '../_assets/globals.css'

export const metadata = {
  title: 'Redirect to deeplink',
  description: 'Redirect to deeplink',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
