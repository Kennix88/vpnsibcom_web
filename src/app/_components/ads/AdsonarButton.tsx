'use client'

import { authApiClient } from '@app/core/authApiClient'
import { useUserStore } from '@app/store/user.store'
import { SonarReturnStatus } from '@app/types/sonar'
import { useTranslations } from 'next-intl'
import { useCallback } from 'react'
import { MdDoubleArrow } from 'react-icons/md'
import { toast } from 'react-toastify'

export default function AdsonarButton({
  blockId,
  verifyKey,
  fetchAd,
}: {
  blockId: string
  verifyKey: string
  fetchAd: () => Promise<void>
}) {
  const { setUser } = useUserStore()
  const t = useTranslations('earning')

  const reward = useCallback(async () => {
    try {
      const response = await authApiClient.confirmAds(verifyKey)
      await setUser(response.user)
      if (response.success) {
        toast.success(t('earned'))
      }
    } catch (error) {
      console.error('Failed to load ad', error)
      //
    } finally {
      fetchAd()
    }
  }, [verifyKey, setUser, t, fetchAd])

  const showRewardedAd = () => {
    /* eslint-disable @typescript-eslint/ban-ts-comment */
    // @ts-ignore
    window.Sonar.show({
      adUnit: blockId, // Замените {bannerAdUnitName} на актуальное

      loader: true, // опционально, можно включать или отключать показ лоадера перед показом рекламы. По-умолчанию: true

      onStart: () => {
        // Добавьте логику для момента начала загрузки рекламы
      },

      onShow: () => {
        // Добавьте логику для момента, когда реклама становится видимой пользователю
      },

      onError: () => {
        // Обработайте ошибки, которые могут возникнуть во время жизненного цикла рекламы
      },

      onClose: () => {
        // Добавьте логику для момента, когда объявление закрылось (например, возобновить контент, показать следующую страницу)
      },

      onReward: () => {
        reward()
      },
    }).then((result: { status: SonarReturnStatus; message?: string }) => {
      // Здесь вы также можете обработать результат попытки показа рекламы с помощью Promise
      if (result.status === 'error') {
        console.error('Не удалось показать рекламу:', result.message) // Лог ошибки, если что-то пошло не так
      } else {
        console.log('Статус рекламы:', result.status) // Лог текущего статуса рекламы
      }
    })
  }
  return (
    <button
      onClick={showRewardedAd}
      className="font-medium flex items-center justify-center bg-[var(--primary)] text-[var(--on-primary)] px-2 py-1 rounded-md uppercase cursor-pointer w-[52px]">
      <MdDoubleArrow size={18} />
    </button>
  )
}
