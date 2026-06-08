'use client'

import { useRouter } from 'next/navigation'
import { PropsWithChildren, useEffect, useRef } from 'react'

export function TmaPage({
  children,
  back = true,
}: PropsWithChildren<{
  /**
   * True if it is allowed to go back from this page.
   * @default true
   */
  back?: boolean
}>) {
  const router = useRouter()
  // ✅ Fix #4: store cleanup fn synchronously in a ref so the cleanup callback
  // can call it without waiting for an async promise to resolve.
  const cleanupRef = useRef<(() => void) | undefined>(undefined)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const { backButton } = await import('@tma.js/sdk-react')

        if (cancelled) return // component already unmounted while importing

        if (back) {
          if (backButton.show.isAvailable()) backButton.show()
          // ✅ Fix #9: removed dead backButton.isVisible() call
          const off = backButton.onClick(() => router.back())
          cleanupRef.current = off
        } else {
          if (backButton.hide.isAvailable()) backButton.hide()
          cleanupRef.current = undefined
        }
      } catch (err) {
        console.error('Failed to init backButton', err)
      }
    })()

    return () => {
      cancelled = true
      // ✅ Synchronous cleanup — no race with next component's mount
      cleanupRef.current?.()
      cleanupRef.current = undefined
    }
  }, [back, router])

  return (
    <div className="w-full flex justify-center">
      <div className="max-w-md w-full flex flex-col items-stretch">
        {children}
      </div>
    </div>
  )
}
