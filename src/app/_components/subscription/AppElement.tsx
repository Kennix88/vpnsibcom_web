'use client'

import { useCopyToClipboard } from '@app/utils/copy-to-clipboard.util'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { ClientAppInterface } from './types/client-app.interface'
import { ClientAppsEnum } from './types/client-apps.enum'
import { PlatformEnum } from './types/platform.enum'

export default function AppElement({
  subscriptionUrl,
  appData,
  platform,
  isOpen,
  toggleOpen,
}: {
  subscriptionUrl: string
  appData: ClientAppInterface
  platform: PlatformEnum
  isOpen: boolean
  toggleOpen: () => void
}) {
  const encodeLink =
    appData.key == ClientAppsEnum.SHADOWROCKET ||
    appData.key == ClientAppsEnum.FOXRAY
      ? Buffer.from(encodeURI(subscriptionUrl)).toString('base64')
      : encodeURI(subscriptionUrl)
  const deepLink = appData.deepLink.replace('{URL}', encodeLink)
  const copyToClipboard = useCopyToClipboard()

  const [isOpenModalDownload, setIsOpenModalDownload] = useState<boolean>(false)
  const [isOpenModalQRAdd, setIsOpenModalQRAdd] = useState<boolean>(false)

  const platformData =
    appData.platforms.find((el) => el.platform == platform) ||
    appData.platforms[0]

  return (
    <div className="rounded-lg overflow-hidden bg-[var(--surface-container-lowest)]">
      <button
        onClick={toggleOpen}
        className="w-full flex items-center justify-between px-4 py-3 text-left font-medium transition cursor-pointer"
        style={{
          background: `${appData.color}`,
        }}>
        <div className="flex items-center gap-4">
          <Image src={appData.icon} alt="icon" width={25} height={25} />
          <span className="font-bold font-mono">{appData.name}</span>
          {appData.isRequired && (
            <div className="px-2 py-1 bg-[var(--primary)] text-[var(--on-primary)] rounded-md text-xs">
              Рекомендуется!
            </div>
          )}
        </div>
        <ChevronDown
          className={clsx(
            'transition-transform duration-300',
            isOpen && 'rotate-180',
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden">
            <div className="px-4 py-3 text-sm ">content</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
