'use client'
import { config } from '@app/config/client'
import { useUserStore } from '@app/store/user.store'
import { useCopyToClipboard } from '@app/utils/copy-to-clipboard.util'
import { FaCopy, FaShareNodes } from 'react-icons/fa6'
import { RiTelegram2Fill } from 'react-icons/ri'
import { useTranslations } from 'use-intl'

export default function FriendsInviteButtons() {
  const copyToClipboard = useCopyToClipboard()
  const { user } = useUserStore()
  const t = useTranslations('friends')

  const handleShareMessage = async () => {
    try {
      const { shareMessage } = await import('@tma.js/sdk-react')
      shareMessage(user?.inviteMessageId || '')
    } catch (err) {
      console.error('Failed to share message', err)
    }
  }

  const handleShareStory = async () => {
    try {
      const { shareStory } = await import('@tma.js/sdk-react')
      shareStory.ifAvailable(`${config.appUrl}/story.png`, {
        text: 'Use a VPN and play games in one place! The bonus is already waiting for you! @vpnsibcom_bot',
        widgetLink: {
          url: user?.inviteUrl || '',
          name: 'VPN&GAMES',
        },
      })
    } catch (err) {
      console.error('Failed to share story', err)
    }
  }

  if (!user) return null

  return (
    <div className="flex flex-col gap-1 items-center font-extralight font-mono max-w-[400px] w-full">
      <div className="px-4 opacity-50 flex flex-row gap-2 items-center w-full ">
        {t('invite.title')}
      </div>
      <div
        className={
          'text-sm bg-[var(--surface-container-lowest)] rounded-md flex flex-col gap-2 py-2 px-4 max-w-[400px] w-full'
        }>
        <div className={'flex flex-row justify-between py-2'}>
          <div className={'flex flex-wrap gap-2 items-center '}>
            <button
              onClick={handleShareMessage}
              className={
                'w-full flex gap-2 items-center justify-center bg-[var(--primary)] text-[var(--on-primary)] font-bold text-md px-4 py-2 rounded-md transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer uppercase tracking-wide'
              }>
              {t('invite.message')} <FaShareNodes />
            </button>
            <button
              onClick={() => copyToClipboard(user.inviteUrl)}
              className={
                'w-full flex gap-2 items-center justify-center bg-[var(--primary)] text-[var(--on-primary)] font-bold text-md px-4 py-2 rounded-md transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer uppercase tracking-wide'
              }>
              {t('invite.copy')}
              <FaCopy />
            </button>
            <button
              onClick={handleShareStory}
              className={
                'w-full flex gap-2 items-center justify-center bg-[var(--primary)] text-[var(--on-primary)] font-bold text-md px-4 py-2 rounded-md transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer uppercase tracking-wide'
              }>
              {t('invite.story')}
              <RiTelegram2Fill />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
