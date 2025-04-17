export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
  tonManifestUrl:
    process.env.NEXT_PUBLIC_TON_CONNECT_MANIFEST_URL ||
    process.env.TON_CONNECT_MANIFEST_URL,
  COOKIE_NAME: 'LOCALE_KEY',
  // Другие переменные
}

if (typeof window !== 'undefined' && !config.apiUrl) {
  console.error('Missing env variables:', config)
}
