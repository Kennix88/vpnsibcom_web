'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect } from 'react'

// Inner component that uses useSearchParams
function DeeplinkRedirect() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const rawLink = searchParams.get('link')

    if (!rawLink) {
      window.close()
      return
    }

    try {
      const url = decodeURIComponent(rawLink)

      // Пытаемся открыть в новой вкладке
      const opened = window.open(url, '_blank')

      if (opened) {
        // Успешно открылось — закроем текущую
        setTimeout(() => window.close(), 30000)
      } else {
        // Не удалось открыть — fallback
        window.location.href = url

        // Всё равно пробуем закрыть через секунду
        setTimeout(() => window.close(), 30000)
      }
    } catch (e) {
      console.error('Invalid link', e)
      window.close()
    }
  }, [searchParams])

  return (
    <div className="flex items-center justify-center h-screen bg-[var(--background)] text-[var(--on-background)] text-sm">
      Redirection to the app…
    </div>
  )
}

// Main page component with Suspense boundary
export default function DeeplinkRedirectPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen bg-[var(--background)] text-[var(--on-background)] text-sm">
          Loading...
        </div>
      }>
      <DeeplinkRedirect />
    </Suspense>
  )
}
