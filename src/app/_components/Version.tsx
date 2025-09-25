'use client'

import { config } from '@app/config/client'
import Link from 'next/link'

export default function Version() {
  return (
    <div className="font-mono flex-wrap flex gap-x-6 gap-y-2 items-center justify-center">
      <div>v{config.APP_VERSION}</div>
      {/* <div className="text-[12px]">x</div>
      <Link
        href={config.GITHUBREPO_URL || ''}
        target="_blank"
        className="flex gap-2 items-center text-[var(--primary)] transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer">
        <Github size={18} />
        GitHub
      </Link> */}
      <div className="flex gap-2 items-center justify-center ">
        <div className="text-nowrap">Developed by</div>
        <Link
          href={config.TELEGRAM_KENNIXDEV_URL || ''}
          target="_blank"
          className="text-[var(--primary)] transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer w-full text-center">
          @KennixDev
        </Link>
      </div>
      <div className="flex gap-2 items-center justify-center ">
        <div className="text-nowrap">Sponsored by</div>
        <Link
          href={'https://t.me/solycmty'}
          target="_blank"
          className="text-[var(--primary)] transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer w-full text-center">
          @solycmty
        </Link>
      </div>
    </div>
  )
}
