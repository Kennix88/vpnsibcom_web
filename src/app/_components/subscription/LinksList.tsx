'use client'

import { useCopyToClipboard } from '@app/utils/copy-to-clipboard.util'
import Link from 'next/link'
import QRCodeStyling from 'qr-code-styling'
import { useEffect, useRef, useState } from 'react'
import { FaCopy, FaPlus } from 'react-icons/fa6'
import { TbQrcode } from 'react-icons/tb'
import Modal from '../Modal'

export default function LinksList({ links }: { links: string[] }) {
  const copyToClipboard = useCopyToClipboard()
  const [isOpenModalQRAdd, setIsOpenModalQRAdd] = useState<boolean>(false)
  const qrRef = useRef<HTMLDivElement>(null)
  const qrCodeRef = useRef<QRCodeStyling | null>(null)
  const [link, setLink] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpenModalQRAdd || !qrRef.current || !link) return

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
      data: link,
    })

    // Очищаем контейнер перед добавлением нового QR-кода
    qrRef.current.innerHTML = ''
    qrCodeRef.current.append(qrRef.current)
  }, [isOpenModalQRAdd, link])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {links?.map((el) => {
          const url = new URL(el)
          const parsedUrl = new URL(el.replace('vless://', 'http://'))
          const type = parsedUrl.searchParams.get('type')
          const security = parsedUrl.searchParams.get('security')

          return (
            <div
              key={JSON.stringify(el)}
              className="flex flex-row flex-wrap items-center justify-between gap-2 rounded-md bg-[var(--surface-container-lowest)] p-2 text-sm font-bold font-mono">
              <div className="order-1 rounded-md bg-[var(--warning-container)] px-2 h-8 text-xs text-[var(--on-warning-container)] flex items-center font-extrabold">
                {url.protocol.split(':')[0].toUpperCase() == 'SS'
                  ? 'SHADOWSOCKS'
                  : url.protocol.split(':')[0].toUpperCase()}
                {type && `-${type.toUpperCase()}`}
                {security && `-${security.toUpperCase()}`}
              </div>{' '}
              <div className=" order-3 w-full md:order-2 md:w-auto">
                {decodeURIComponent(url.hash.split('#')[1])}
              </div>
              <div className="order-2 flex flex-row items-center gap-2 md:order-3">
                <Link
                  title="Добавить"
                  href={el}
                  className="rounded-md bg-[var(--surface-container)] h-8 cursor-pointer flex items-center gap-2 justify-center px-2">
                  <FaPlus size={16} />
                </Link>
                <div
                  title="Копировать URL"
                  onClick={() => copyToClipboard(el)}
                  className="rounded-md bg-[var(--surface-container)] h-8 cursor-pointer flex items-center gap-2 justify-center px-2">
                  <FaCopy size={16} />
                </div>
                <button
                  title="Открыть QR-код"
                  className="rounded-md bg-[var(--surface-container)] h-8 cursor-pointer flex items-center gap-2 justify-center px-2"
                  onClick={() => {
                    setLink(el)
                    setIsOpenModalQRAdd(true)
                  }}>
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
                      Отсканируйте в телефоне
                    </div>
                  </div>
                </Modal>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
