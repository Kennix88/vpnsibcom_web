'use client'

import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { ReactNode, useEffect, useRef } from 'react'
import { IoClose } from 'react-icons/io5'
import { useTranslations } from 'use-intl'
import ScrollHint from './ScrollHint'

export type ModalVariant = 'default' | 'info' | 'warning' | 'error' | 'success'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string | ReactNode
  variant?: ModalVariant
  cancelText?: string
  actionText?: string
  onAction?: () => void
  showCancelButton?: boolean
  showCloseButton?: boolean
  actionButtonColor?: 'primary' | 'error' | 'warning' | 'success' | 'info'
  closeOnOutsideClick?: boolean
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

export default function Modal({
  isOpen,
  onClose,
  children,
  title,
  variant = 'default',
  cancelText,
  actionText,
  onAction,
  showCancelButton = true,
  showCloseButton = true,
  actionButtonColor,
  closeOnOutsideClick = true,
  maxWidth = 'md',
}: ModalProps) {
  const t = useTranslations('common.modal')
  const modalRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Определяем цвета в зависимости от варианта
  const variantStyles = {
    default: {
      background: 'var(--surface-container)',
      titleText: 'var(--on-surface)',
      titleBackground: 'var(--surface-container-high)',
      border: 'var(--outline)',
      text: 'var(--on-surface)',
      actionButton: actionButtonColor || 'error',
    },
    info: {
      background: 'var(--info-container)',
      titleText: 'var(--on-info)',
      titleBackground: 'var(--info)',
      border: 'var(--info)',
      text: 'var(--on-info-container)',
      actionButton: actionButtonColor || 'info',
    },
    warning: {
      background: 'var(--warning-container)',
      titleText: 'var(--on-warning)',
      titleBackground: 'var(--warning)',
      border: 'var(--warning)',
      text: 'var(--on-warning-container)',
      actionButton: actionButtonColor || 'warning',
    },
    error: {
      background: 'var(--error-container)',
      titleText: 'var(--on-error)',
      titleBackground: 'var(--error)',
      border: 'var(--error)',
      text: 'var(--on-error-container)',
      actionButton: actionButtonColor || 'error',
    },
    success: {
      background: 'var(--success-container)',
      titleText: 'var(--on-success)',
      titleBackground: 'var(--success)',
      border: 'var(--success)',
      text: 'var(--on-success-container)',
      actionButton: actionButtonColor || 'success',
    },
  }

  const buttonStyles = {
    primary: {
      background: 'var(--primary)',
      text: 'var(--on-primary)',
      hover: 'brightness-110',
    },
    error: {
      background: 'var(--error)',
      text: 'var(--on-error)',
      hover: 'brightness-110',
    },
    warning: {
      background: 'var(--warning)',
      text: 'var(--on-warning)',
      hover: 'brightness-110',
    },
    success: {
      background: 'var(--success)',
      text: 'var(--on-success)',
      hover: 'brightness-110',
    },
    info: {
      background: 'var(--info)',
      text: 'var(--on-info)',
      hover: 'brightness-110',
    },
  }

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full',
  }

  // Обработка клика вне модального окна
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        closeOnOutsideClick &&
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      // Блокируем прокрутку страницы при открытом модальном окне
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      // Восстанавливаем прокрутку при закрытии
      document.body.style.overflow = 'auto'
    }
  }, [isOpen, onClose, closeOnOutsideClick])

  // Обработка нажатия клавиши Escape
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey)
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4 font-mono z-99">
          {/* Затемнение фона */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black"
            onClick={closeOnOutsideClick ? onClose : undefined}
          />

          {/* Модальное окно */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{
              type: 'spring',
              damping: 25,
              stiffness: 300,
            }}
            className={clsx(
              'relative z-10 w-full rounded-lg shadow-xl overflow-hidden',
              maxWidthClasses[maxWidth],
            )}
            style={{
              backgroundColor: variantStyles[variant].background,
              color: variantStyles[variant].text,
              border: `1px solid ${variantStyles[variant].border}`,
            }}>
            {/* Заголовок */}
            {title && (
              <div
                className="px-4 py-2 font-semibold border-b"
                style={{
                  backgroundColor: variantStyles[variant].titleBackground,
                  color: variantStyles[variant].titleText,
                  borderColor: variantStyles[variant].border,
                }}>
                <div className="flex items-center justify-between">
                  <div>{title}</div>
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className="p-1 rounded-full cursor-pointer transition-all hover:bg-black/10 active:scale-95"
                      aria-label={t('close')}>
                      <IoClose size={20} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Содержимое */}
            <div
              className="relative p-4 overflow-y-auto max-h-[70vh]"
              ref={contentRef}>
              {children}
              <ScrollHint targetRef={contentRef} />
            </div>

            {/* Кнопки */}
            {(showCancelButton || onAction) && (
              <div
                className="px-4 pb-4 flex justify-end gap-3"
                style={{ borderColor: variantStyles[variant].border }}>
                {showCancelButton && (
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-md transition-all cursor-pointer hover:bg-black/10 active:scale-95 border"
                    style={{ borderColor: variantStyles[variant].border }}>
                    {cancelText || t('cancel')}
                  </button>
                )}
                {onAction && (
                  <button
                    onClick={onAction}
                    className={clsx(
                      'px-4 py-2 rounded-md cursor-pointer transition-all active:scale-95',
                      `hover:${buttonStyles[variantStyles[variant].actionButton].hover}`,
                    )}
                    style={{
                      backgroundColor:
                        buttonStyles[variantStyles[variant].actionButton]
                          .background,
                      color:
                        buttonStyles[variantStyles[variant].actionButton].text,
                    }}>
                    {actionText || t('accept')}
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
