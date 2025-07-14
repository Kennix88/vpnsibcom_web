'use client'

import { backButton } from '@telegram-apps/sdk-react'
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
  }, [back, router])

  return <>{children}</>
}
