import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/core/i18n/i18n.ts')

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {},
  // Для локального HTTPS (необходимо для TMA)
  // devIndicators: {
  //   buildActivity: false,
  // },
  // allowedDevOrigins: ['local-origin.dev', '*.local-origin.dev'],
}

export default withNextIntl(nextConfig)
