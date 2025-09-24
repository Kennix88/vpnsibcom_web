'use client'

import { config } from '@app/config/client'
import Link from 'next/link'
import { RiTelegram2Fill } from 'react-icons/ri'

export default function SocialButtons() {
  return (
    <div className="font-mono flex-wrap flex gap-2 items-center justify-center text-sm">
      <Link
        href={config.TELEGRAM_CHANNEL_URL || ''}
        target="_blank"
        className="flex gap-2 items-center bg-[var(--info-container)] text-[var(--on-info-container)] transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer rounded-md px-2 py-1">
        <RiTelegram2Fill size={18} />
        Channel
      </Link>
      <Link
        href={config.TELEGRAM_CHAT_URL || ''}
        target="_blank"
        className="flex gap-2 items-center bg-[var(--info-container)] text-[var(--on-info-container)] transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer rounded-md px-2 py-1">
        <RiTelegram2Fill size={18} />
        Chat&Support
      </Link>
    </div>
  )
}
