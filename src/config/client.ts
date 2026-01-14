export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
  appUrl: process.env.NEXT_PUBLIC_APP_URL,
  tonManifestUrl: process.env.NEXT_PUBLIC_TON_CONNECT_MANIFEST_URL,
  COOKIE_NAME: 'LOCALE_KEY',
  SPLIT_TG_REF_URL:
    process.env.NEXT_PUBLIC_SPLIT_TG_REF_URL ||
    'https://split.tg/?ref=UQAjDnbTYmkesnuG0DZv-PeMo3lY-B-K6mfArUBEEdAb4xaJ',
  APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
  GITHUBREPO_URL: process.env.NEXT_PUBLIC_GITHUBREPO_URL,
  TELEGRAM_CHANNEL_URL: process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_URL,
  TELEGRAM_CHAT_URL: process.env.NEXT_PUBLIC_TELEGRAM_CHAT_URL,
  BOT_URL: process.env.NEXT_PUBLIC_BOT_URL,
  TMA_TOKEN: process.env.NEXT_PUBLIC_TMA_TOKEN as string,
  TMA_IDENTIFIER: process.env.NEXT_PUBLIC_TMA_IDENTIFIER as string,
}

if (typeof window !== 'undefined' && !config.apiUrl) {
  console.error('Missing env variables:', config)
}
