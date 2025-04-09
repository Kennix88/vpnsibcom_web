import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/core/i18n/i18n.ts')

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {},
  env: {
    API_PORT: process.env.API_PORT,
    API_URL: process.env.API_URL,
    APP_PORT: process.env.APP_PORT,
    APP_URL: process.env.APP_URL,
  },
  // Для локального HTTPS (необходимо для TMA)
  // devIndicators: {
  //   buildActivity: false,
  // },
  // allowedDevOrigins: ['local-origin.dev', '*.local-origin.dev'],
}

export default withNextIntl(nextConfig)
