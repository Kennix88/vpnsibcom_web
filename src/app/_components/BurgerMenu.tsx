'use client'

import Modal from '@app/app/_components/Modal'
import { UserRolesEnum } from '@app/enums/user-roles.enum'
import { useUserStore } from '@app/store/user.store'
import { motion, Variants } from 'framer-motion'
import { useState } from 'react'
import { HiArrowLeft, HiOutlineShieldExclamation } from 'react-icons/hi2'
import { IoMenu } from 'react-icons/io5'
import ActionButton, { AccentKey, IconComponent } from './ActionButton'
import {
  ACTION_BUTTONS_REGISTRY,
  DOC_TITLE,
  DocSlug,
} from './actionButtons.registry'
import DocContent from './DocContent'

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8, filter: 'blur(3px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring', stiffness: 360, damping: 30 },
  },
}

const MENU_KEYS = [
  'channel',
  'chat',
  'personal',
  'support',
  'ad',
  'terms',
  'privacy',
] as const

// 'menu' — список пунктов; DocSlug — показываем документ ВНУТРИ той же модалки
type View = 'menu' | DocSlug

export default function BurgerMenu() {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<View>('menu')
  const { user } = useUserStore()
  const isSuperAdmin = user?.role === UserRolesEnum.SUPER_ADMIN

  const openMenu = () => {
    setView('menu')
    setOpen(true)
  }

  // Модалка одна и та же на весь жизненный цикл открытия — переключается
  // только `view`. Это и убирает баг: второй Modal никогда не монтируется
  // поверх первого, значит некому "поймать" чужой history.back().
  return (
    <>
      <motion.button
        onClick={openMenu}
        aria-label="Меню"
        className="relative flex items-center justify-center w-8 h-8 rounded-xl cursor-pointer"
        style={{
          background:
            'linear-gradient(135deg, color-mix(in srgb, var(--on-surface) 8%, var(--surface-container)) 0%, var(--surface-container-low) 100%)',
          border: '1px solid var(--surface-border)',
          color: 'var(--on-surface-variant)',
        }}
        whileHover={{
          borderColor:
            'color-mix(in srgb, var(--primary) 35%, var(--surface-border))',
          color: 'var(--primary)',
          boxShadow: '0 0 12px var(--primary-glow)',
        }}
        whileTap={{ scale: 0.88, rotate: -8 }}
        transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}>
        <IoMenu size={16} />
      </motion.button>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={
          view === 'menu' ? (
            'Меню'
          ) : (
            <div className="flex items-center gap-2">
              <motion.button
                onClick={() => setView('menu')}
                whileTap={{ scale: 0.9 }}
                className="p-1 -ml-1 rounded-lg cursor-pointer"
                aria-label="Назад к меню">
                <HiArrowLeft size={16} />
              </motion.button>
              <span>{DOC_TITLE[view]}</span>
            </div>
          )
        }
        showCancelButton={false}
        maxWidth={view === 'menu' ? 'md' : 'lg'}>
        {view === 'menu' ? (
          <motion.div
            className="flex flex-col gap-2"
            variants={containerVariants}
            initial="hidden"
            animate="visible">
            {MENU_KEYS.map((key) => {
              const cfg = ACTION_BUTTONS_REGISTRY[key]
              return (
                <motion.div key={cfg.key} variants={itemVariants}>
                  <ActionButton
                    variant="row"
                    icon={cfg.icon}
                    label={cfg.label}
                    description={cfg.description}
                    accent={cfg.accent}
                    badge={cfg.badge}
                    onClick={() => {
                      if (cfg.action.kind === 'link') {
                        window.open(
                          cfg.action.href,
                          '_blank',
                          'noopener,noreferrer',
                        )
                        setOpen(false)
                      } else {
                        // Не закрываем модалку — переключаем вид внутри неё.
                        setView(cfg.action.slug)
                      }
                    }}
                  />
                </motion.div>
              )
            })}

            {isSuperAdmin && (
              <motion.div variants={itemVariants}>
                <ActionButton
                  variant="row"
                  icon={HiOutlineShieldExclamation as IconComponent}
                  label="Admin panel"
                  description="Доступно только super admin"
                  accent={'error' as AccentKey}
                  badge={undefined}
                  onClick={() => {
                    window.location.href = '/admin'
                    setOpen(false)
                  }}
                />
              </motion.div>
            )}
          </motion.div>
        ) : (
          <DocContent slug={view} />
        )}
      </Modal>
    </>
  )
}
