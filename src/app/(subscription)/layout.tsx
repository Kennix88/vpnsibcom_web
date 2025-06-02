export const metadata = {
  title: 'Your subscription - VPNsib.com',
  description: 'Your subscription',
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
