'use client'

import { ErrorBoundary } from '@app/app/(tma)/_components/ErrorBoundary'
import { ErrorBoundaryError } from '@app/app/(tma)/_components/ErrorBoundaryError'
import { TMA } from '@app/app/(tma)/_components/TMA'
import { useDidMount } from '@app/hooks/useDidMount'
import { PropsWithChildren } from 'react'

export function TelegramProvider(props: PropsWithChildren) {
  const didMount = useDidMount()

  return didMount ? (
    <ErrorBoundary fallback={ErrorBoundaryError}>
      <TMA {...props} />
    </ErrorBoundary>
  ) : (
    <div className="root__loading bg-background text-on-surface w-screen bg-opacity-90 min-h-screen... ">
      Loading...
    </div>
  )
}
