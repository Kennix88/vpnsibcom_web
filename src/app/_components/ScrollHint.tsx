'use client'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import { IoChevronDown } from 'react-icons/io5'
function ScrollHint({
  targetRef,
  suppress = false,
}: {
  targetRef: React.RefObject<HTMLDivElement | null>
  /** Принудительно скрыть подсказку (например, пока лист тащат за drag-хэндл) */
  suppress?: boolean
}) {
  const [isScrollable, setIsScrollable] = useState(false)
  const [visible, setVisible] = useState(false)
  const t = useTranslations('common')
  const hideTimeout = useRef<NodeJS.Timeout | undefined>(undefined)
  // Единая проверка скролла: ResizeObserver (размер el) + MutationObserver (контент внутри)
  useEffect(() => {
    const el = targetRef.current
    if (!el) return
    const check = () => {
      const scrollable = el.scrollHeight > el.clientHeight
      setIsScrollable(scrollable)
      if (!scrollable) setVisible(false)
    }
    check()
    const resizeObserver = new ResizeObserver(check)
    resizeObserver.observe(el)
    const mutationObserver = new MutationObserver(check)
    mutationObserver.observe(el, {
      childList: true,
      subtree: true,
      characterData: true,
    })
    return () => {
      resizeObserver.disconnect()
      mutationObserver.disconnect()
    }
  }, [targetRef])
  // Первый показ
  useEffect(() => {
    if (isScrollable) setVisible(true)
  }, [isScrollable])
  // Скрытие при скролле, повторный показ после остановки
  useEffect(() => {
    const el = targetRef.current
    if (!el || !isScrollable) return
    const handleScroll = () => {
      setVisible(false)
      clearTimeout(hideTimeout.current)
      hideTimeout.current = setTimeout(() => {
        if (el.scrollTop + el.clientHeight < el.scrollHeight) {
          setVisible(true)
        }
      }, 1000)
    }
    el.addEventListener('scroll', handleScroll)
    return () => {
      el.removeEventListener('scroll', handleScroll)
      clearTimeout(hideTimeout.current)
    }
  }, [targetRef, isScrollable])
  if (!isScrollable) return null
  return (
    <motion.div
      aria-hidden="true"
      className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center font-extrabold"
      animate={{ opacity: visible && !suppress ? 1 : 0 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}>
      <motion.span
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 1.5, repeatType: 'loop' }}
        className="text-xs">
        {t('scrolling')}
      </motion.span>
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 1.5, repeatType: 'loop' }}>
        <IoChevronDown size={20} />
      </motion.div>
    </motion.div>
  )
}
export default ScrollHint
