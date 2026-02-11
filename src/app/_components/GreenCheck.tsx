'use client'

import { publicApiClient } from '@app/core/publicApiClient'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import {
  TbShieldCheckFilled,
  TbShieldExclamation,
  TbShieldX,
} from 'react-icons/tb'
import { toast } from 'react-toastify'
import { useTranslations } from 'use-intl'

export default function GreenCheck() {
  const [isGreen, setIsGreen] = useState<boolean | null>(null)
  const [ip, setIp] = useState<string | null>(null)
  const t = useTranslations('greenCheck')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const green = await publicApiClient.greenCheck()
        setIsGreen(green.isGreen)
        setIp(green.ip)
      } catch {
        toast.error('Error during the update')
        setIsGreen(false)
      }
    }

    fetchData()
  }, [])

  if (isGreen === null || !ip) {
    return (
      <div className="flex gap-2 p-2 font-mono rounded-md bg-[var(--warning-container)] text-[var(--on-warning-container)] animate-pulse w-full max-w-[400px]">
        <div className="text-5xl">
          <TbShieldExclamation />
        </div>
        <div className="text-xs text-center">{t('loading')}</div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={clsx(
        'flex gap-2 p-2 font-mono rounded-md text-center w-full max-w-[400px] ',
        isGreen
          ? 'text-[var(--on-success-container)] bg-[var(--success-container)]'
          : 'text-[var(--on-error-container)] bg-[var(--error-container)]',
      )}>
      <div className="text-5xl">
        {isGreen ? <TbShieldCheckFilled /> : <TbShieldX />}
      </div>
      <div className="flex flex-col gap-2 grow">
        <div className="break-words border py-0.5 px-1 rounded-md border-dashed text-xs">
          {ip}
        </div>
        <div className="text-xs break-words whitespace-pre-wrap">
          {isGreen ? t('success') : t('danger')}
        </div>
      </div>
    </motion.div>
  )
}
