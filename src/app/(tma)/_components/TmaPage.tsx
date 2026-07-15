'use client'
import { useRouter } from 'next/navigation'
import { PropsWithChildren, useEffect } from 'react'
import { pushBackHandler } from './backButtonStack'

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
    // Регистрируем эту страницу как текущий уровень стека back-кнопки.
    // Если поверх откроется модалка — она сама запушит свой уровень и при
    // закрытии стек вернётся сюда автоматически, без ручной синхронизации.
    const pop = pushBackHandler(back ? () => router.back() : null)
    return pop
  }, [back, router])

  return (
    <div className="w-full flex justify-center">
      <div className="max-w-md w-full flex flex-col items-stretch">
        {children}
      </div>
    </div>
  )
}
