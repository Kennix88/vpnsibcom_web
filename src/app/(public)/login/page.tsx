'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { Suspense } from 'react'

// Inner component that uses useSearchParams
function LoginContent() {
  const params = useSearchParams()
  const redirect = params.get('redirect') || '/app'

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.async = true
    script.dataset.telegramLogin = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME
    script.dataset.authUrl = `${window.location.origin}/api/auth/telegram`
    script.dataset.requestAccess = 'write'

    const container = document.getElementById('telegram-login')
    container?.appendChild(script)

    return () => {
      container?.removeChild(script)
    }
  }, [])

  return (
    <div>
      <h1>Login via Telegram</h1>
      <div id="telegram-login" />
      <a
        href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME}?start=web_${btoa(redirect)}`}>
        Or open in Telegram
      </a>
    </div>
  )
}

// Main page component with Suspense boundary
export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  )
}
