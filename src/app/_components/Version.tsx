'use client'

import { config } from '@app/config/client'

export default function Version() {
  return (
    <div className="font-mono flex-wrap flex gap-x-6 gap-y-2 items-center justify-center">
      <div>v{config.APP_VERSION}</div>
    </div>
  )
}
