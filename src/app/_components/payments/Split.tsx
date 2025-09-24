'use client'

import { config } from '@app/config/client'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { FaCircleInfo } from 'react-icons/fa6'
import Currency from '../Currency'

export default function Split() {
  const t = useTranslations('billing.payment')
  return (
    <div
      className={
        'bg-[var(--surface-container)] text-[var(--on-surface)] rounded-md flex flex-col gap-2 py-2 px-4 w-full max-w-[400px]'
      }>
      <div className={'flex flex-row gap-2 items-center text-xs'}>
        <FaCircleInfo className={'text-3xl'} />
        {t('split')}
      </div>
      <Link
        href={config.SPLIT_TG_REF_URL}
        className={
          'flex flex-row gap-2 items-center justify-center px-4 py-2 bg-[var(--surface-container-high)] rounded-md transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer text-sm'
        }
        target={'_blank'}>
        {t('splitBay')} <Currency type={'tg-star'} w={18} />
      </Link>
    </div>
  )
}
