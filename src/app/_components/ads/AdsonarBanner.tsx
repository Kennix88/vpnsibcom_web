'use client'

import { authApiClient } from '@app/core/authApiClient'
import { AdsPlaceEnum } from '@app/enums/ads-place.enum'
import { AdsTaskTypeEnum } from '@app/enums/ads-task-type.enum'
import { useCallback, useEffect, useState } from 'react'

export default function AdsonarBanner({ place }: { place: AdsPlaceEnum }) {
  const [bannerId, setBannerId] = useState<string | null>(null)
  const showBannerAd = useCallback((banner: string) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    window.Sonar.show({
      adUnit: banner, // Замените {bannerAdUnitName} на актуальное

      onStart: () => {
        // Добавьте логику для момента начала загрузки рекламы
      },

      onShow: () => {
        // Добавьте логику для момента, когда реклама становится видимой пользователю
      },

      onError: () => {
        // Обработайте ошибки, которые могут возникнуть во время показа
      },

      onClose: () => {
        // Добавьте логику для момента, когда объявление закрылось (например, возобновить контент, показать следующую страницу)
      },

      onRefresh: () => {
        // Будет вызываться каждый раз, когда баннерная реклама автоматически обновляется
      },
    }).then((result: { status: 'showing' | 'error' }) => {
      // Здесь вы также можете обработать результат попытки показа рекламы с помощью Promise
      if (result.status === 'error') {
        console.error('Не удалось показать рекламу') // Лог ошибки, если что-то пошло не так
      } else {
        console.log('Реклама показывается') // Лог текущего статуса рекламы
      }
    })
  }, [])

  const fetchAd = useCallback(async (): Promise<void> => {
    try {
      const response = await authApiClient.getAds(place, AdsTaskTypeEnum.VIEW)
      setBannerId(response.blockId)
      showBannerAd(response.blockId)
    } catch (error) {
      console.error('Failed to load ad', error)
      // toast.error(t('errors.loadFailed'))
    }
  }, [showBannerAd, place])

  useEffect(() => {
    fetchAd()
  }, [fetchAd])

  if (!bannerId) {
    return null
  }

  return <div id={bannerId}></div>
}
