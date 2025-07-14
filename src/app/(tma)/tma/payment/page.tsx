'use client'
import { TmaPage } from '@app/app/(tma)/_components/TmaPage'
import Payments from '@app/app/_components/payments/Payments'
import { authApiClient } from '@app/core/authApiClient'
import { usePaymentMethodsStore } from '@app/store/payment-methods.store'
import { useUserStore } from '@app/store/user.store'
import { useEffect } from 'react'
import { toast } from 'react-toastify'
import { useTranslations } from 'use-intl'

export default function Page() {
  const t = useTranslations('billing.payment')
  const { setUser } = useUserStore()
  const { setMethods } = usePaymentMethodsStore()

  useEffect(() => {
    const getMethods = async () => {
      try {
        const updated = await authApiClient.getPaymentMethods(true)
        setMethods(updated.methods)
        setUser(updated.user)
      } catch {
        toast.error('Error updating data')
      }
    }
    getMethods()
    return () => {}
  }, [setMethods, setUser])

  return (
    <TmaPage back={true}>
      <div className="flex flex-row gap-4 flex-wrap justify-center">
        <div className="flex flex-col gap-2 uppercase font-mono w-full">
          <div className="text-2xl font-bold ">{t('title')}</div>
          {/*<div className="text-md font-bold font-mono">*/}
          {/*  {t('get')} <span className="opacity-80 font-normal">{t('for')}</span>*/}
          {/*</div>*/}
        </div>
        <Payments isTma={true} />
      </div>
    </TmaPage>
  )
}
