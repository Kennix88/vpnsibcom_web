'use server'
import { publicApiClient } from '@app/core/publicApiClient'
import { getTranslations } from 'next-intl/server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ token: string }> },
) {
  // Получаем переводы для сообщений об ошибках
  const t = await getTranslations('subscriptions')
  // Get token from params asynchronously
  const { token } = await context.params

  const headersList = await headers()
  const agent = headersList.get('User-Agent')

  headersList.forEach((value, key) => console.log(`${key}: ${value}`))

  const regexAllClients = new RegExp(
    /^([Cc]lash-verge|[Cc]lash[-.]?[Mm]eta|[Ff][Ll][Cc]lash|[Cc]lash|[Ss]tash|[Mm]ihomo|[Ss]tash|SFA|SFI|SFM|SFT|[Hh]app|[Ss]treisand|v2box|v2ray[Nn][Gg]|v2ray[Nn]|[Kk]aring|[Hh]iddify|v2ray|[Hh]iddify[Nn]ext|[Hh]iddify|sing-box|SS|SSR|SSD|SSS|Outline|Shadowsocks|SSconf|TelegramBot|TwitterBot|NekoBox|[Xx]ray-[Cc]hecker)/,
  )

  if (agent && regexAllClients.test(agent!)) {
    const resData = await publicApiClient.getSubscriptionDataByToken(
      token,
      agent,
    )

    if (!resData || !resData.marzbanSubRes) {
      console.error(
        `[Subscription Error] Subscription data not found for token: ${token}`,
      )
      return new Response(t('notFound'), {
        status: 404,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      })
    }

    let links = ''

    resData.subscription.links.map((el: string) => (links = links + el + `\n`))

    const truncateAnnounce = (text: string, max = 200) => {
      const chars = [...text]

      if (chars.length <= max) return text

      return chars.slice(0, max - 3).join('') + '...'
    }

    const rawAnnounce = resData.subscription.announce

    const announce =
      rawAnnounce &&
      `base64:${Buffer.from(truncateAnnounce(rawAnnounce)).toString('base64')}`

    return new Response(Buffer.from(links).toString('base64'), {
      status: 200,
      headers: {
        // ...resData.marzbanSubRes.headers,
        'content-type': 'text/plain; charset=utf-8',
        'content-disposition': 'attachment; filename="213"',
        'subscription-userinfo': `upload=0; download=${resData.subscription.usedTraffic || 0}; total=${resData.subscription.dataLimit || 0}${resData.subscription.expiredAt ? `; expire=${Math.floor(new Date(resData.subscription.expiredAt).getTime() / 1000)}` : ''}`,
        'support-url': process.env.NEXT_PUBLIC_BOT_URL || '',
        'profile-web-page-url': resData.subscription.subscriptionUrl,
        'profile-update-interval': '1',
        'profile-title': `base64:${Buffer.from(`${resData.subscription.name} - VPNsib`).toString('base64')}`,
        ...(announce && { announce }),
      },
    })
  } else {
    redirect(`/sub/${token}/info`)
  }
}
