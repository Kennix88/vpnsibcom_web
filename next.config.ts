// next.config.ts
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/core/i18n/i18n.ts')

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // poweredByHeader: false,
  compress: true,
  output: 'standalone',
  outputFileTracingRoot: __dirname,
  productionBrowserSourceMaps: false,

  experimental: {
    // Явно запрещаем потенциально уязвимые экспериментальные фичи
    ppr: false,
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    // Замените на доверенные домены вашего проекта
    // remotePatterns: [
    //   { protocol: 'https', hostname: 'cdn.my-domain.com', pathname: '/**' },
    //   { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
    // ],
    dangerouslyAllowSVG: false,
  },

  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['src'],
  },

  typescript: {
    ignoreBuildErrors: false,
  },

  // async headers() {
  //   return [
  //     {
  //       source: '/(.*)',
  //       headers: [
  //         { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  //         { key: 'X-Content-Type-Options', value: 'nosniff' },
  //         { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  //         { key: 'Permissions-Policy', value: 'geolocation=(), microphone=()' },
  //         { key: 'X-XSS-Protection', value: '1; mode=block' },
  //         {
  //           key: 'Strict-Transport-Security',
  //           value: 'max-age=63072000; includeSubDomains; preload',
  //         },
  //         {
  //           key: 'Content-Security-Policy',
  //           value:
  //             "default-src 'self'; img-src 'self' https: data:; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; frame-ancestors 'none';",
  //         },
  //       ],
  //     },
  //   ]
  // },

  webpack: (config, { isServer }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const webpack = require('webpack')
    config.plugins?.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/locale$/,
        contextRegExp: /moment$/,
      }),
    )
    return config
  },
}

export default withNextIntl(nextConfig)
