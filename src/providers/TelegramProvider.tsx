'use client'

import { initTelegramSDK } from '@app/core/initTelegramSDK'
import { useTelegramMock } from '@app/hooks/useTelegramMock'
import React, { useEffect } from 'react'

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const init = async () => {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        await useTelegramMock()
        await initTelegramSDK({
          debug: true,
          eruda: true,
          mockForMacOS: false,
        })
      } else {
        await initTelegramSDK({
          debug: false,
          eruda: false,
          mockForMacOS: false,
        })
      }
    }

    init()
  }, [])

  return <>{children}</>
}
