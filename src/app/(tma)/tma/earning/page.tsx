'use client'
import { TmaPage } from '@app/app/(tma)/_components/TmaPage'
import SocialButtons from '@app/app/_components/SocialButtons'
import TopBar from '@app/app/_components/TopBar'
import Version from '@app/app/_components/Version'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
const TaskAdsReward = dynamic(
  () =>
    import('@app/app/_components/ads/TaskAdsReward').then(
      (mod) => mod.TaskAdsReward,
    ),
  {
    ssr: false,
  },
)

const AdsgramRewardTask = dynamic(
  () =>
    import('@app/app/_components/ads/AdsgramRewardTask').then(
      (mod) => mod.AdsgramRewardTask,
    ),
  {
    ssr: false,
  },
)

export default function Page() {
  const t = useTranslations('earning')
  return (
    <TmaPage back={false}>
      <TopBar />
      <div className="pt-4 px-4  flex flex-col gap-4">
        <h1 className="text-2xl font-bold uppercase">{t('title')}</h1>
        {/* <div className="text-lg font-bold font-mono">Soon...</div> */}
      </div>
      <div className="flex flex-col gap-4 mt-4 pb-[80px]">
        <TaskAdsReward />
        <AdsgramRewardTask />
      </div>
      <div className="flex flex-col gap-4">
        <SocialButtons />
        <Version />
      </div>
    </TmaPage>
  )
}
