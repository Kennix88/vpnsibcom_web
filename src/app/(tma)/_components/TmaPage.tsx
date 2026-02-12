'use client'

import { useRouter } from 'next/navigation'
import { PropsWithChildren, useEffect } from 'react'

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

  useEffect(() => {
    const initBackButton = async () => {
      try {
        const { backButton } = await import('@tma.js/sdk-react')

        if (back) {
          if (backButton.show.isAvailable()) {
            backButton.show()
            backButton.isVisible() // true
          }
          return backButton.onClick(() => {
            router.back()
          })
        }
        if (backButton.hide.isAvailable()) {
          backButton.hide()
          backButton.isVisible() // false
        }
      } catch (err) {
        console.error('Failed to init backButton', err)
      }
    }

    const cleanupPromise = initBackButton()

    return () => {
      cleanupPromise.then((cleanup) => {
        if (typeof cleanup === 'function') cleanup()
      })
    }
  }, [back, router])

  return <>{children}</>
}
