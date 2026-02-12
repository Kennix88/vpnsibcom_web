'use client'
import { motion, useAnimation } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { IoChevronDown } from 'react-icons/io5'

function ScrollHint({
  targetRef,
}: {
  targetRef: React.RefObject<HTMLDivElement | null>
}) {
  const controls = useAnimation()
  const [isScrollable, setIsScrollable] = useState(false)
  const [visible, setVisible] = useState(false)
  const t = useTranslations('common')

  useEffect(() => {
    const el = targetRef.current
    if (!el) return

    const checkScrollable = () => {
      setIsScrollable(el.scrollHeight > el.clientHeight)
    }

    checkScrollable()
    window.addEventListener('resize', checkScrollable)
    return () => {
      window.removeEventListener('resize', checkScrollable)
    }
  }, [targetRef])

  // Первый показ с задержкой
  useEffect(() => {
    if (!isScrollable) return
    setVisible(true)
  }, [isScrollable])

  // Скрытие при скролле и повторный показ после остановки
  useEffect(() => {
    const el = targetRef.current
    if (!el || !isScrollable) return

    let timeout: NodeJS.Timeout

    const handleScroll = () => {
      // Скрываем при начале скролла
      if (visible) setVisible(false)
      // Показываем через 1 сек после окончания скролла
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        // Если всё ещё можно скроллить
        if (el.scrollTop + el.clientHeight < el.scrollHeight) {
          setVisible(true)
        }
      }, 1000)
    }

    el.addEventListener('scroll', handleScroll)
    return () => {
      el.removeEventListener('scroll', handleScroll)
      clearTimeout(timeout)
    }
  }, [targetRef, visible, isScrollable])

  // Анимация "микропокачивания"
  useEffect(() => {
    if (!isScrollable || !visible) return
    const interval = setInterval(() => {
      controls.start({ y: [0, -6, 0], transition: { duration: 0.6 } })
    }, 8000)
    return () => clearInterval(interval)
  }, [controls, isScrollable, visible])

  useEffect(() => {
    const el = targetRef.current
    if (!el) return

    const observer = new ResizeObserver(() => {
      setIsScrollable(el.scrollHeight > el.clientHeight)
      // если контент уменьшился, скрываем подсказку
      if (el.scrollHeight <= el.clientHeight) setVisible(false)
    })

    observer.observe(el)

    return () => observer.disconnect()
  }, [targetRef])

  if (!isScrollable) return null

  return (
    <motion.div
      className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center font-extrabold"
      animate={{ opacity: visible ? 1 : 0 }} // прозрачность управляется visible
      transition={{ duration: 0.4, ease: 'easeInOut' }}>
      <motion.span
        animate={{
          y: [0, -4, 0], // лёгкое качание вверх-вниз
        }}
        transition={{ repeat: Infinity, duration: 1.5, repeatType: 'loop' }}
        className="text-xs">
        {t('scrolling')}
      </motion.span>
      <motion.div
        animate={{
          y: [0, -4, 0], // качание стрелки синхронно с текстом
        }}
        transition={{ repeat: Infinity, duration: 1.5, repeatType: 'loop' }}>
        <IoChevronDown size={20} />
      </motion.div>
    </motion.div>
  )
}

export default ScrollHint
