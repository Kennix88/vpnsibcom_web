'use client'
import Avatar from '@app/app/_components/Avatar'
import Balance from '@app/app/_components/Balance'
import { useUserStore } from '@app/store/user.store'
import { useSignal, viewport } from '@tma.js/sdk-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLayoutEffect, useRef } from 'react'
import BurgerMenu from './BurgerMenu'

function useTopBarHeightVar(ref: React.RefObject<HTMLDivElement | null>) {
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const setVar = () => {
      document.documentElement.style.setProperty(
        '--topbar-height',
        `${el.offsetHeight}px`,
      )
    }
    setVar()
    const ro = new ResizeObserver(setVar)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
}

export default function TopBar() {
  const { user } = useUserStore()
  const location = usePathname()
  const url = location === '/app' ? '/app' : '/tma'
  const rootRef = useRef<HTMLDivElement>(null)
  useTopBarHeightVar(rootRef)

  const isFullscreen = useSignal(viewport.isFullscreen)
  const safeAreaTop = useSignal(viewport.safeAreaInsetTop)
  const contentSafeAreaTop = useSignal(viewport.contentSafeAreaInsetTop)
  const topInset = isFullscreen
    ? Math.max(safeAreaTop ?? 0, contentSafeAreaTop ?? 0)
    : 0

  return (
    <motion.div
      ref={rootRef}
      className="w-full"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.2, 0, 0, 1] }}>
      {isFullscreen && (
        <div
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-2"
          style={{
            paddingTop: topInset + 12,
            background:
              'linear-gradient(to bottom, var(--background) 60%, transparent 100%)',
          }}>
          <span
            className="absolute left-1/2 -translate-x-1/2 font-mono text-[13px] font-bold tracking-[0.08em] select-none pointer-events-none"
            style={{ color: 'var(--on-background)', opacity: 0.85 }}>
            VPNsib
          </span>
        </div>
      )}

      <div
        className="flex gap-2 justify-between items-center w-full max-w-md"
        style={{ paddingTop: isFullscreen ? 18 : 0 }}>
        <Link href={url + '/profile'}>
          <Avatar url={user?.photoUrl} className="cursor-pointer" withStatus />
        </Link>

        <div className="flex justify-end items-center gap-2">
          <Balance type={'payment'} fixedNumber={3} />
          <BurgerMenu />
        </div>
      </div>
    </motion.div>
  )
}
