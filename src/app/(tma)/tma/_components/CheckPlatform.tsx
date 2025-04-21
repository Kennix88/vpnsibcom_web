'use client'
import NavBar from '@app/app/_components/NavBar'
import { retrieveLaunchParams } from '@telegram-apps/sdk-react'
import { PropsWithChildren } from 'react'

export function CheckPlatform({ children }: PropsWithChildren) {
  const getInitData = retrieveLaunchParams()

  if (
    !getInitData.tgWebAppPlatform.includes('web') &&
    getInitData.tgWebAppPlatform !== 'tdesktop'
  ) {
    return (
      <div className="pt-[64px] min-h-screen">
        <div className="pt-4 px-4 pb-[100px] min-h-[calc(100vh-84px)] bg-[var(--background)] text-[var(--on-surface)]">
          {children}
          <NavBar />
        </div>
      </div>
    )
  } else {
    return (
      <div className="pt-4 px-4 pb-[100px] min-h-screen bg-[var(--background)] text-[var(--on-surface)]">
        {children}
        <NavBar />
      </div>
    )
  }
}
