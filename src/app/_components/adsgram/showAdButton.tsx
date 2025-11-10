import { useAdsgram } from '@adsgram/react'
import { ReactElement, useCallback } from 'react'

export function ShowAdButton(): ReactElement {
  const onReward = useCallback(() => {
    // alert('Reward')
  }, [])
  const onError = useCallback(() => {
    // alert('Error')
  }, [])

  /**
   * Вставьте ваш blockId
   */
  const { show } = useAdsgram({
    blockId: '17143',
    onReward,
    onError,
    debug: false,
  })

  return <button onClick={show}>Смотреть рекламу</button>
}
