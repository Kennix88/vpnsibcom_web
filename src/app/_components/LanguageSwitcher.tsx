'use client'

import { config } from '@app/config/client'
import { localesMap } from '@app/core/i18n/config'
import { getCookie, setCookie } from 'cookies-next'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { FaCaretDown } from 'react-icons/fa6'

export default function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState(localesMap[0])
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)

  // Закрытие при клике вне
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Установка сохранённого языка
  useEffect(() => {
    const savedLocale = getCookie(config.COOKIE_NAME) as string | undefined
    const found = localesMap.find((l) => l.key === savedLocale)
    if (found) setSelected(found)
  }, [])

  const changeLanguage = (lang: (typeof localesMap)[number]) => {
    setSelected(lang)
    setCookie(config.COOKIE_NAME, lang.key)
    setIsOpen(false)
    router.refresh()
  }

  return (
    <div ref={containerRef} className="relative inline-block text-sm text-left">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-md border font-medium font-mono transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer"
        style={{
          backgroundColor: 'var(--surface-container)',
          color: 'var(--on-surface)',
          borderColor: 'var(--outline)',
        }}>
        <Image
          src={selected.icon}
          alt={selected.title}
          width={20}
          height={20}
        />
        <span
          className={'flex flex-row gap-1 items-center font-mono font-bold'}>
          [{selected.key.toUpperCase()}] {selected.title} <FaCaretDown />
        </span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.ul
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 mt-2 bg-[var(--surface-container-high)] border border-[var(--outline)] text-[var(--on-surface)var(] rounded-md shadow-xl z-50 overflow-auto max-h-50 w-full min-w-[200px] divide-y divide-[var(--outline)]">
            {localesMap.map((lang) => (
              <li key={lang.key}>
                <button
                  onClick={() => changeLanguage(lang)}
                  className="flex w-full items-center px-4 py-2 text-sm gap-2 text-left transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer "
                  style={{
                    backgroundColor:
                      selected.key === lang.key
                        ? 'var(--primary-container)'
                        : 'var(--surface-container)',
                    color: 'var(--on-surface)',
                  }}>
                  <Image
                    src={lang.icon}
                    alt={lang.title}
                    width={20}
                    height={20}
                  />
                  <span
                    className={
                      'flex flex-row gap-1 items-center font-mono font-bold'
                    }>
                    {lang.title} [{lang.key.toUpperCase()}]
                  </span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
