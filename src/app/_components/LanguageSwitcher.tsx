'use client'

import { config } from '@app/config/client'
import { authApiClient } from '@app/core/authApiClient'
import { localesMap } from '@app/core/i18n/config'
import { useUserStore } from '@app/store/user.store'
import { getCookie, setCookie } from 'cookies-next'
import { AnimatePresence, motion } from 'framer-motion'
import { Languages } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify'

export default function LanguageSwitcher({
  isPublic = false,
}: {
  isPublic?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState(localesMap[0])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const { setUser } = useUserStore()

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
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const savedLocale = getCookie(config.COOKIE_NAME) as string | undefined
    const found = localesMap.find((l) => l.key === savedLocale)
    if (found) setSelected(found)
  }, [])

  const changeLanguage = async (lang: (typeof localesMap)[number]) => {
    if (lang.key === selected.key) {
      setIsOpen(false)
      return
    }
    setLoading(true)
    try {
      setSelected(lang)
      setCookie(config.COOKIE_NAME, lang.key)
      if (!isPublic) {
        const updated = await authApiClient.updateLanguageUser(lang.key)
        setUser(updated)
      }
      setIsOpen(false)
      router.refresh()
    } catch {
      toast.error('Error during the update')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      {/* Trigger button */}
      <motion.button
        onClick={() => setIsOpen((prev) => !prev)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        disabled={loading}
        className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-mono text-sm font-bold cursor-pointer select-none"
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(var(--glass-blur))',
          WebkitBackdropFilter: 'blur(var(--glass-blur))',
          border: '1px solid rgba(255,255,255,0.08)',
          color: 'var(--on-surface)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          transition: 'opacity 150ms',
          opacity: loading ? 0.6 : 1,
        }}>
        <Languages
          size={15}
          aria-hidden
          style={{ color: 'var(--primary)', opacity: 0.9 }}
        />

        <Image
          src={selected.icon}
          alt={selected.title}
          width={18}
          height={18}
          className="rounded-sm"
        />

        <span style={{ color: 'var(--on-background)' }}>{selected.title}</span>

        <span
          className="text-[10px] tracking-widest px-1.5 py-0.5 rounded-md"
          style={{
            background: 'rgba(195,166,255,0.12)',
            color: 'var(--primary)',
            border: '1px solid rgba(195,166,255,0.2)',
          }}>
          {selected.key.toUpperCase()}
        </span>

        {/* Chevron */}
        <motion.svg
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden
          style={{ color: 'var(--on-background)', opacity: 0.45 }}>
          <path
            d="M2 4L6 8L10 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
            className="absolute left-0 mt-2 z-50 rounded-xl overflow-hidden min-w-[200px]"
            style={{
              background: 'var(--surface-container-high)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 16px 40px rgba(0,0,0,0.45)',
            }}>
            {/* Header label */}
            <div
              className="flex items-center gap-1.5 px-3 py-2"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span
                className="block w-1 h-1 rounded-full"
                style={{ background: 'var(--primary)' }}
              />
              <span
                className="text-[10px] font-mono tracking-widest uppercase"
                style={{ color: 'var(--on-background)', opacity: 0.35 }}>
                Select Language
              </span>
            </div>

            {/* Options */}
            <ul className="py-1 max-h-52 overflow-y-auto">
              {localesMap.map((lang, i) => {
                const isActive = selected.key === lang.key
                return (
                  <motion.li
                    key={lang.key}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.18 }}>
                    <button
                      onClick={() => changeLanguage(lang)}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-mono font-bold cursor-pointer transition-all duration-150"
                      style={{
                        background: isActive
                          ? 'rgba(195,166,255,0.12)'
                          : 'transparent',
                        color: isActive
                          ? 'var(--primary)'
                          : 'var(--on-surface)',
                        borderLeft: isActive
                          ? '2px solid var(--primary)'
                          : '2px solid transparent',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive)
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.background = 'rgba(255,255,255,0.04)'
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive)
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.background = 'transparent'
                      }}>
                      <Image
                        src={lang.icon}
                        alt={lang.title}
                        width={18}
                        height={18}
                        className="rounded-sm shrink-0"
                      />
                      <span className="flex-1 text-left">{lang.title}</span>
                      <span
                        className="text-[10px] tracking-widest px-1.5 py-0.5 rounded-md shrink-0"
                        style={{
                          background: isActive
                            ? 'rgba(195,166,255,0.18)'
                            : 'rgba(255,255,255,0.06)',
                          color: isActive
                            ? 'var(--primary)'
                            : 'var(--on-background)',
                          opacity: isActive ? 1 : 0.45,
                        }}>
                        {lang.key.toUpperCase()}
                      </span>

                      {/* Active checkmark */}
                      {isActive && (
                        <motion.svg
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 500 }}
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                          aria-hidden>
                          <path
                            d="M2.5 7L5.5 10L11.5 4"
                            stroke="var(--primary)"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </motion.svg>
                      )}
                    </button>
                  </motion.li>
                )
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
