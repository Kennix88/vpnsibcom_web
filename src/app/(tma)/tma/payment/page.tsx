'use client'
import { TmaPage } from '@app/app/(tma)/_components/TmaPage'
import AdsonarBanner from '@app/app/_components/ads/AdsonarBanner'
import Payments from '@app/app/_components/payments/Payments'
import SocialButtons from '@app/app/_components/SocialButtons'
import TopBar from '@app/app/_components/TopBar'
import Version from '@app/app/_components/Version'
import { authApiClient } from '@app/core/authApiClient'
import { AdsPlaceEnum } from '@app/enums/ads-place.enum'
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
      <TopBar />
      <div className="flex flex-row gap-4 my-4 flex-wrap justify-center">
        <div className="flex flex-col gap-2 uppercase font-mono w-full">
          <div className="text-2xl font-bold ">{t('title')}</div>
          {/*<div className="text-md font-bold font-mono">*/}
          {/*  {t('get')} <span className="opacity-80 font-normal">{t('for')}</span>*/}
          {/*</div>*/}
        </div>
        <Payments />
        <AdsonarBanner place={AdsPlaceEnum.BANNER_5} />
      </div>
      <div className="flex flex-col gap-4">
        <SocialButtons />
        <Version />
      </div>
    </TmaPage>
  )
}
