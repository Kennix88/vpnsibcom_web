'use client'

import { SonarReturnStatus } from '@app/types/sonar'

export default function AdsonarReward({
  blockId,
  onReward,
}: {
  blockId: string
  onReward: () => void
}) {
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

      onError: () => {},

      onClose: () => {
        // Добавьте логику для момента, когда объявление закрылось (например, возобновить контент, показать следующую страницу)
      },

      onReward: () => {
        onReward()
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

  showRewardedAd()
  return null
}
