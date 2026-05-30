'use client'
import { authApiClient } from '@app/core/authApiClient'
import { publicApiClient } from '@app/core/publicApiClient'
import { SubscriptionDataInterface } from '@app/types/subscription-data.interface'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import LanguageSwitcher from '../LanguageSwitcher'
import Loader from '../Loader'
import SocialButtons from '../SocialButtons'
import SubscriptionCard from './SubscriptionCard'

export default function Subscription({
  token,
  isToken,
}: {
  token: string
  isToken: boolean
}) {
  const t = useTranslations('subscriptions')

  const [subscription, setSubscription] =
    useState<SubscriptionDataInterface | null>(null)

  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const getSubscription = async () => {
      try {
        setLoading(true)
        setError(null)

        if (!isToken) {
          const get = await authApiClient.getSubscriptionDataById(token)
          setSubscription(get.subscription)
        } else {
          const get = await publicApiClient.getSubscriptionDataByToken(token)
          setSubscription(get.subscription)
        }
      } catch (err) {
        console.error(
          `[Subscription Error] Failed to load subscription data:`,
          err,
        )
        // Проверяем тип ошибки для более информативного сообщения
        if (err instanceof Error) {
          // Если ошибка содержит 404, значит подписка не найдена
          if (err.message.includes('404')) {
            setError(t('notFound'))
            toast.error(t('notFound'))
          } else {
            setError(t('errors.loadFailed'))
            toast.error(t('errors.loadFailed'))
          }
        } else {
          setError(t('errors.loadFailed'))
          toast.error(t('errors.loadFailed'))
        }
      } finally {
        setLoading(false)
      }
    }
    getSubscription()
  }, [isToken, token, t])

  if (loading) {
    return <Loader />
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full p-4 gap-4">
        <div className="text-[var(--error)] text-lg font-medium">{error}</div>
        <div className="text-sm text-[var(--on-surface-variant)]">
          {t('notFound')}
        </div>
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full p-4 gap-4">
        <div className="text-lg font-medium">{t('notFound')}</div>
      </div>
    )
  }

  return (
    <div className="w-full flex justify-center font-mono">
      <div className="max-w-lg flex w-full flex-col gap-4 py-4">
        <div className="flex flex-wrap justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className="block w-2 h-2 rounded-full"
              style={{ background: 'var(--primary)' }}
            />
            <span
              className="text-2xl tracking-widest uppercase"
              style={{ color: 'var(--on-background)', opacity: 0.42 }}>
              Подписка
            </span>
          </div>
          {isToken && <LanguageSwitcher isPublic={true} />}
        </div>
        <SubscriptionCard
          subscription={subscription}
          isList={false}
          isPublic={isToken}
          isDefaultOpen={true}
        />
        <SocialButtons />
      </div>
    </div>
  )
}
