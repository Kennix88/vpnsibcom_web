'use client'

import { ErrorBoundary } from '@app/app/(tma)/_components/ErrorBoundary'
import { ErrorBoundaryError } from '@app/app/(tma)/_components/ErrorBoundaryError'
import Loader from '@app/app/_components/Loader'
import { useDidMount } from '@app/hooks/useDidMount'
import dynamic from 'next/dynamic'
import { PropsWithChildren } from 'react'

const TMA = dynamic(
  () => import('@app/app/(tma)/_components/TMA').then((mod) => mod.TMA),
  { ssr: false },
)

export function TelegramProvider(props: PropsWithChildren) {
  const didMount = useDidMount()

  if (!didMount) {
    return <Loader />
  }

  return (
    <ErrorBoundary fallback={ErrorBoundaryError}>
      <TMA {...props} />
    </ErrorBoundary>
  )
}
