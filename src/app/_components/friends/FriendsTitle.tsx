'use client'

import { useTranslations } from 'use-intl'

export default function FriendsTitle() {
  const t = useTranslations('friends')
  return (
    <div className="flex flex-col gap-2 uppercase font-mono">
      <div className="text-2xl font-bold ">{t('title')}</div>
      <div className="text-lg font-bold font-mono">
        {t('get')} <span className="opacity-80 font-normal">{t('for')}</span>
      </div>
    </div>
  )
}
