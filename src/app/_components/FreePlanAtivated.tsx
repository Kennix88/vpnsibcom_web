'use client'

import { authApiClient } from '@app/core/authApiClient'
import { useSubscriptionsStore } from '@app/store/subscriptions.store'
import { useUserStore } from '@app/store/user.store'
import clsx from 'clsx'
import { useState } from 'react'
import { toast } from 'react-toastify'
import { useTranslations } from 'use-intl'

export function FreePlanActivated() {
  const { user, setUser } = useUserStore()
  const [isLoading, setIsLoading] = useState(false)
  const { setSubscriptions } = useSubscriptionsStore()
  const t = useTranslations('freePlan')

  if (!user || !user.isFreePlanAvailable) return null

  const handleClick = async () => {
    setIsLoading(true)
    try {
      const getData = await authApiClient.freePlanActivated()
      if (!getData) return
      setUser(getData.user)
      setSubscriptions(getData.subscriptions)
    } catch {
      toast.error(t('activationFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 bg-[var(--surface-container-lowest)] rounded-md w-full max-w-[400px] font-mono">
      <div className="text-sm ">
        🎁 {t('trialAvailable', { days: user.freePlanDays ?? 0 })}
      </div>
      <button
        onClick={() => handleClick()}
        disabled={isLoading}
        className={clsx(
          'flex flex-row gap-2 items-center justify-center bg-[var(--primary)] text-[var(--on-primary)] font-medium text-sm px-4 py-2 rounded-md w-full transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer max-w-[400px]',
          isLoading && 'opacity-50 pointer-events-none',
        )}>
        {isLoading && (
          <div
            className={'loader'}
            style={{ width: '15px', height: '15px', borderWidth: '2px' }}></div>
        )}
        {t('activate')}
      </button>
    </div>
  )
}
