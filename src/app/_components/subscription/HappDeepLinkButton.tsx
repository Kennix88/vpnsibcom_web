'use client'

import Image from 'next/image'
import Link from 'next/link'
import { CLIENT_APPS } from './data/client-apps.data'
import { ClientAppsEnum } from './types/client-apps.enum'

export default function HappDeepLinkButton({
  subscriptionUrl,
}: {
  subscriptionUrl: string
}) {
  const client = CLIENT_APPS.find((el) => el.key == ClientAppsEnum.HAPP)

  if (!client) return null

  const encodeLink = encodeURI(subscriptionUrl)
  const deepLink = client.deepLink.replace('{URL}', encodeLink)

  return (
    <Link
      className="flex items-center justify-center p-1 rounded-md"
      href={`/deeplink/?link=${encodeURI(deepLink)}`}
      style={{
        background: `${client.color}`,
      }}
      target="_blank">
      <Image src={client.icon} alt="icon" width={24} height={24} />
    </Link>
  )
}
