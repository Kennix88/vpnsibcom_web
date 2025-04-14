import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import type { PropsWithChildren } from 'react'
import { timeZone } from './config'
import { getServerLocale } from './locale.server'

export const I18nProvider = async ({ children }: PropsWithChildren) => {
  const locale = await getServerLocale()
  const messages = await getMessages()

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone={timeZone}>
      {children}
    </NextIntlClientProvider>
  )
}
