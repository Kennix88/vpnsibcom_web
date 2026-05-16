'use client'

import { config } from '@app/config/client'
import Link from 'next/link'
import { FaAd } from 'react-icons/fa'
import { IoIosArrowDroprightCircle } from 'react-icons/io'
import { RiTelegram2Fill } from 'react-icons/ri'

export default function SocialButtons() {
  return (
    <div className="flex-col font-mono flex-wrap flex gap-2 items-center justify-center text-md w-full">
      <Link
        href={config.TELEGRAM_CHANNEL_URL || ''}
        target="_blank"
        className="flex gap-2 items-center bg-[var(--info-container)] text-[var(--on-info-container)] transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer rounded-md px-2 py-2 w-full justify-between">
        <div className="flex gap-2 items-center">
          <RiTelegram2Fill size={18} />
          Канал
        </div>
        <IoIosArrowDroprightCircle size={18} />
      </Link>
      <Link
        href={config.TELEGRAM_CHAT_URL || ''}
        target="_blank"
        className="flex gap-2 items-center bg-[var(--info-container)] text-[var(--on-info-container)] transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer rounded-md px-2 py-2 w-full justify-between">
        <div className="flex gap-2 items-center">
          <RiTelegram2Fill size={18} />
          Чат и Поддержка
        </div>
        <IoIosArrowDroprightCircle size={18} />
      </Link>
      <Link
        href={'https://t.me/vpnsibcom?direct'}
        target="_blank"
        className="flex gap-2 items-center bg-[var(--wager)] text-[var(--on-wager)] transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer rounded-md px-2 py-2 w-full justify-between">
        <div className="flex gap-2 items-center">
          <RiTelegram2Fill size={18} />
          Сотрудничество и Реклама
        </div>
        <IoIosArrowDroprightCircle size={18} />
      </Link>
      <Link
        href={'https://taddy.pro/vpnsibcom_bot'}
        target="_blank"
        className="flex gap-2 items-center bg-[var(--ad)] text-[var(--on-ad)] transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer rounded-md px-2 py-2 w-full justify-between">
        <div className="flex gap-2 items-center">
          <FaAd size={18} />
          Заказать рекламу через Taddy
        </div>
        <IoIosArrowDroprightCircle size={18} />
      </Link>
    </div>
  )
}
