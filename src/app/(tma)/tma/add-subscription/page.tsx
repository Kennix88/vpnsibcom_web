'use client'
import { TmaPage } from '@app/app/(tma)/_components/TmaPage'
import AddSubscription from '@app/app/_components/add-subscription/AddSubscription'
import SocialButtons from '@app/app/_components/SocialButtons'
import TopBar from '@app/app/_components/TopBar'
import Version from '@app/app/_components/Version'

export default function Page() {
  return (
    <TmaPage back={true}>
      <div className="flex flex-col gap-4 items-center font-mono">
        <TopBar />
        <div className="flex flex-col gap-2 uppercase font-mono w-full">
          <div className="text-2xl font-bold ">Добавление подписки</div>
          {/* <div className="text-md font-bold font-mono">{t('description')}</div> */}
        </div>

        <AddSubscription />
        <br />
        <SocialButtons />
        <Version />
      </div>
    </TmaPage>
  )
}
