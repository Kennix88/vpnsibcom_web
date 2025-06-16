'use server'
import { publicApiClient } from '@app/core/publicApiClient'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export async function GET(
  request: Request,
  { params }: { params: { token: string } },
) {
  // Get token from params asynchronously
  const { token } = await params

  const headersList = await headers()
  const agent = headersList.get('User-Agent')

  console.log({
    agent,
  })

  const regexAllClients = new RegExp(
    /^([Cc]lash-verge|[Cc]lash[-.]?[Mm]eta|[Ff][Ll][Cc]lash|[Cc]lash|[Ss]tash|[Mm]ihomo|[Ss]tash|SFA|SFI|SFM|SFT|[Hh]app|[Ss]treisand|v2box|v2ray[Nn][Gg]|v2ray[Nn]|[Kk]aring|[Hh]iddify|v2ray|[Hh]iddify[Nn]ext|[Hh]iddify|sing-box|SS|SSR|SSD|SSS|Outline|Shadowsocks|SSconf|TelegramBot|TwitterBot|NekoBox)/,
  )

  if (agent && regexAllClients.test(agent!)) {
    const resData = await publicApiClient.getSubscriptionData(token, agent)

    if (!resData || !resData.marzbanSubRes) {
      return new Response('Not Found', {
        status: 404,
      })
    }

    let links = ''

    resData.subscription.links.map((el) => (links = links + el + `\n`))

    return new Response(resData.marzbanSubRes.body, {
      status: 200,
      headers: {
        ...resData.marzbanSubRes.headers,
        'subscription-userinfo': `upload=0; download=${resData.subscription.usedTraffic || 0}; total=${resData.subscription.dataLimit || 0}; expire=${resData.subscription.expiredAt ? Math.floor(new Date(resData.subscription.expiredAt).getTime() / 1000) : 0}`,
        'support-url': process.env.NEXT_PUBLIC_BOT_URL || '',
        'profile-web-page-url': resData.subscription.subscriptionUrl,
        'profile-update-interval': '1',
        'profile-title': `base64:${Buffer.from(`VPNsib.com - ${resData.subscription.id}`).toString('base64')}`,
      },
    })
  } else redirect(`/sub/${token}/info`)
}
