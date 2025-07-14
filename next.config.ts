import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import { buildTranslations } from './src/core/i18n/build-translations'

const withNextIntl = createNextIntlPlugin('./src/core/i18n/i18n.ts')

// Build translations during build process
if (process.env.NODE_ENV === 'production') {
  console.log('Building translations for production...');
  buildTranslations(false).catch(console.error);
} else {
  console.log('Building translations for development...');
  buildTranslations(true).catch(console.error);
}

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {},
  // Для локального HTTPS (необходимо для TMA)
  // devIndicators: {
  //   buildActivity: false,
  // },
  // allowedDevOrigins: ['local-origin.dev', '*.local-origin.dev'],
  
  // Для Docker-контейнера в продакшене
  output: 'standalone',
}

export default withNextIntl(nextConfig)
