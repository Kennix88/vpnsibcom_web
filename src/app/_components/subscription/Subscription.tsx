'use client'
import { authApiClient } from '@app/core/authApiClient'
import { publicApiClient } from '@app/core/publicApiClient'
import { SubscriptionDataInterface } from '@app/types/subscription-data.interface'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import LanguageSwitcher from '../LanguageSwitcher'
import AppsList from './AppsList'
import LinksList from './LinksList'
import SubscriptionElement from './SubscriptionElement'

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
  const [tab, setTab] = useState<'apps' | 'links'>('apps')

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
    return (
      <div className="flex flex-col items-center justify-center w-full h-full p-4 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]"></div>
        <div className="text-lg font-medium">{t('loading')}</div>
      </div>
    )
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
          <h1 className="text-2xl font-bold uppercase">Подписка</h1>
          {isToken && <LanguageSwitcher isPublic={true} />}
        </div>
        <SubscriptionElement
          subscription={subscription}
          isList={false}
          isPublic={isToken}
          isDefaultOpen={true}
        />

        <div className="flex items-center divide-x-2 divide-[var(--surface-container-highest)]">
          <button
            onClick={() => setTab('apps')}
            className="grow cursor-pointer rounded-l-md h-8 transition-all duration-200 hover:brightness-110 active:scale-[0.97]"
            style={{
              backgroundColor:
                tab == 'apps'
                  ? 'var(--primary)'
                  : 'var(--surface-container-lowest)',
              color:
                tab == 'apps'
                  ? 'var(--on-primary)'
                  : 'var(--on-surface-container)',
            }}>
            Подключение
          </button>
          <button
            onClick={() => setTab('links')}
            className="grow cursor-pointer rounded-r-md h-8 transition-all duration-200 hover:brightness-110 active:scale-[0.97]"
            style={{
              backgroundColor:
                tab !== 'apps'
                  ? 'var(--primary)'
                  : 'var(--surface-container-lowest)',
              color:
                tab !== 'apps'
                  ? 'var(--on-primary)'
                  : 'var(--on-surface-container)',
            }}>
            Конфигурации (Pro)
          </button>
        </div>
        {tab == 'apps' ? (
          <AppsList subscriptionUrl={subscription.subscriptionUrl} />
        ) : (
          <LinksList links={subscription.links} />
        )}
      </div>
    </div>
  )
}
