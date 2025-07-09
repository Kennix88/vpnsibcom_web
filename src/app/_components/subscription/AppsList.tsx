'use client'

import { detectPlatform } from '@app/utils/platform-detect.util'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { FaCaretDown } from 'react-icons/fa6'
import AppElement from './AppElement'
import { CLIENT_APPS } from './data/client-apps.data'
import { ClientAppsEnum } from './types/client-apps.enum'
import { PlatformEnum } from './types/platform.enum'

export default function AppsList({
  subscriptionUrl,
}: {
  subscriptionUrl: string
}) {
  const platforms: { key: PlatformEnum; name: string }[] = [
    {
      key: PlatformEnum.ANDROID,
      name: 'Android',
    },
    {
      key: PlatformEnum.IOS,
      name: 'iOS',
    },
    {
      key: PlatformEnum.WINDOWS,
      name: 'Windows',
    },
    {
      key: PlatformEnum.MACOS,
      name: 'MacOS',
    },
    {
      key: PlatformEnum.IPADOS,
      name: 'iPad OS',
    },
    {
      key: PlatformEnum.ANDROID_TV,
      name: 'Android TV',
    },
    {
      key: PlatformEnum.APPLE_TV,
      name: 'Apple TV',
    },
    {
      key: PlatformEnum.LINUX,
      name: 'Linux',
    },
  ]
  const [platform, setPlatform] = useState<{ key: PlatformEnum; name: string }>(
    platforms[0],
  )
  const [isOpenSelectPlatform, setIsOpenSelectPlatform] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [openApp, setOpenApp] = useState<ClientAppsEnum | null>(
    CLIENT_APPS[0].key || null,
  )

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpenSelectPlatform(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    const result = detectPlatform()
    setPlatform(platforms.find((el) => el.key == result) || platforms[0])
  }, [])

  const changePlatform = (plat: { key: PlatformEnum; name: string }) => {
    setPlatform(plat)
    setIsOpenSelectPlatform(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4 justify-end">
        <div>Платформа:</div>
        <div
          ref={containerRef}
          className="relative inline-block text-sm text-left ">
          <button
            onClick={() => setIsOpenSelectPlatform((prev) => !prev)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md border font-medium font-mono transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer min-w-[200px]"
            style={{
              backgroundColor: 'var(--surface-container)',
              color: 'var(--on-surface)',
              borderColor: 'var(--outline)',
            }}>
            <span
              className={
                'flex flex-row gap-1 items-center font-mono font-bold justify-between w-full'
              }>
              {platform.name} <FaCaretDown />
            </span>
          </button>
          <AnimatePresence>
            {isOpenSelectPlatform && (
              <motion.ul
                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 mt-2 bg-[var(--surface-container-high)] border border-[var(--outline)] text-[var(--on-surface)var(] rounded-md shadow-xl z-50 overflow-auto max-h-50 min-w-[200px] divide-y divide-[var(--outline)]">
                {platforms.map((plat) => (
                  <li key={plat.key}>
                    <button
                      onClick={() => changePlatform(plat)}
                      className="flex w-full items-center px-4 py-2 text-sm gap-2 text-left transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer "
                      style={{
                        backgroundColor:
                          platform === plat
                            ? 'var(--primary-container)'
                            : 'var(--surface-container)',
                        color: 'var(--on-surface)',
                      }}>
                      <span
                        className={
                          'flex flex-row gap-1 items-center font-mono font-bold'
                        }>
                        {plat.name}
                      </span>
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {CLIENT_APPS.filter(
          (el) =>
            el.platforms.find((el) => el.platform == platform.key) != undefined,
        ).map((el) => (
          <AppElement
            key={el.key}
            isOpen={openApp == el.key}
            toggleOpen={() => {
              if (openApp == el.key) setOpenApp(null)
              else setOpenApp(el.key)
            }}
            subscriptionUrl={subscriptionUrl}
            appData={el}
            platform={platform.key}
          />
        ))}
      </div>
    </div>
  )
}
