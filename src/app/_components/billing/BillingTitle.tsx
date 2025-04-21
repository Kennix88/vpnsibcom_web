'use client'

import { useTranslations } from 'use-intl'

export default function BillingTitle() {
  const t = useTranslations('billing')
  return (
    <div className="flex flex-col gap-2 uppercase font-mono w-full">
      <div className="text-2xl font-bold ">{t('title')}</div>
      <div className="text-md font-bold font-mono">{t('description')}</div>
    </div>
  )
}
