'use client'

import { useCopyToClipboard } from '@app/utils/copy-to-clipboard.util'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import QRCodeStyling from 'qr-code-styling'
import { useEffect, useRef, useState } from 'react'
import { FaAppStoreIos, FaCopy, FaGooglePlay } from 'react-icons/fa6'
import { FiExternalLink } from 'react-icons/fi'
import { TbQrcode } from 'react-icons/tb'
import Modal from '../Modal'
import { ClientAppInterface } from './types/client-app.interface'
import { ClientAppsEnum } from './types/client-apps.enum'
import { IconTypeEnum } from './types/icon-type.enum'
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
  const [isOpenModalQRAdd, setIsOpenModalQRAdd] = useState<boolean>(false)
  const qrRef = useRef<HTMLDivElement>(null)
  const qrCodeRef = useRef<QRCodeStyling | null>(null)

  const platformData =
    appData.platforms.find((el) => el.platform == platform) ||
    appData.platforms[0]

  useEffect(() => {
    if (!isOpenModalQRAdd || !qrRef.current) return

    // Создаем новый QR-код
    qrCodeRef.current = new QRCodeStyling({
      width: 250,
      height: 250,
      type: 'svg',
      image: '/logo.png', // Путь к вашему логотипу
      dotsOptions: {
        color: 'var(--primary)',
        type: 'rounded', // 'rounded', 'dots', 'classy', 'classy-rounded', 'square', 'extra-rounded'
      },
      backgroundOptions: {
        color: 'var(--surface-container-lowest)',
      },
      cornersSquareOptions: {
        color: 'var(--secondary)',
        type: 'extra-rounded', // 'dot', 'square', 'extra-rounded', 'rounded'
      },
      cornersDotOptions: {
        color: 'var(--tertiary)',
        type: 'dot', // 'dot', 'square'
      },
      imageOptions: {
        crossOrigin: 'anonymous',
        margin: 10,
        hideBackgroundDots: true,
        imageSize: 0.3,
      },
      data: deepLink,
    })

    // Очищаем контейнер перед добавлением нового QR-кода
    qrRef.current.innerHTML = ''
    qrCodeRef.current.append(qrRef.current)
  }, [isOpenModalQRAdd, deepLink])

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
            <div className="py-4 text-sm flex flex-col gap-2">
              <div className="flex flex-row flex-wrap items-center gap-2 px-4 text-sm">
                <div>1. Скачать приложение:</div>
                {platformData.downloadLinks.map((el) => (
                  <Link
                    href={el.link}
                    target="_blank"
                    title="Скачать"
                    key={el.title}
                    className="grow rounded-md bg-[var(--surface-container)] h-8  cursor-pointer flex items-center gap-2 justify-center px-4">
                    {el.iconType == IconTypeEnum.APPLE_STORE ? (
                      <FaAppStoreIos size={18} />
                    ) : el.iconType == IconTypeEnum.PLAY_MARKET ? (
                      <FaGooglePlay size={18} />
                    ) : null}{' '}
                    {el.title}
                  </Link>
                ))}
              </div>
              <hr className="w-full rounded-full bg-[var(--outline)] border-[var(--outline)] opacity-70" />
              <div className="flex flex-row items-center justify-start gap-2 text-sm px-4">
                <div>2. Добавить подписку в приложение:</div>
                <Link
                  href={deepLink}
                  target="_blank"
                  title="Добавить подписку в приложение"
                  className="rounded-md bg-[var(--surface-container)] h-8  cursor-pointer flex items-center gap-2 justify-center px-4">
                  Добавить <FiExternalLink size={18} />
                </Link>
                <button
                  title="Копировать URL подписки"
                  onClick={() => copyToClipboard(subscriptionUrl)}
                  className="rounded-md bg-[var(--surface-container)] h-8 w-8 cursor-pointer flex items-center gap-2 justify-center">
                  <FaCopy size={16} />
                </button>
                <button
                  title="Открыть QR-код подписки"
                  className="rounded-md bg-[var(--surface-container)] h-8 w-8 cursor-pointer flex items-center gap-2 justify-center"
                  onClick={() => setIsOpenModalQRAdd(true)}>
                  <TbQrcode size={18} />
                </button>
                <Modal
                  isOpen={isOpenModalQRAdd}
                  onClose={() => setIsOpenModalQRAdd(false)}
                  title={'QR-код подписки'}
                  variant="default">
                  <div className="flex flex-col items-center gap-4 p-4">
                    <div ref={qrRef} className="qr-code-container"></div>
                    <div className="text-sm text-center">
                      Отсканируйте в приложении {appData.name}
                    </div>
                  </div>
                </Modal>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
