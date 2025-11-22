'use client'
import { openLink } from '@tma.js/sdk-react'
import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <div className="p-4 text-center">
      <h1 className="text-2xl font-bold mb-4">🔐 Авторизация</h1>
      <p className="mb-6">Для доступа к приложению требуется авторизация</p>

      <button
        onClick={() => openLink('https://t.me/vpnsibcom_bot?start=login')}
        className="bg-blue-500 text-white px-6 py-3 rounded-lg">
        Войти через Telegram
      </button>

      <div className="mt-8 text-sm text-gray-500">
        <Link href="/app" className="underline">
          Веб-версия
        </Link>
      </div>
    </div>
  )
}
