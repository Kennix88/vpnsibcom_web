export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
  tonManifestUrl:
    process.env.NEXT_PUBLIC_TON_CONNECT_MANIFEST_URL ||
    process.env.TON_CONNECT_MANIFEST_URL,
  COOKIE_NAME: 'LOCALE_KEY',
  SPLIT_TG_REF_URL:
    process.env.NEXT_PUBLIC_SPLIT_TG_REF_URL ||
    'https://split.tg/?ref=UQAjDnbTYmkesnuG0DZv-PeMo3lY-B-K6mfArUBEEdAb4xaJ',
}

if (typeof window !== 'undefined' && !config.apiUrl) {
  console.error('Missing env variables:', config)
}
