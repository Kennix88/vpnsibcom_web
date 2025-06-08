'use client'
import { TmaPage } from '@app/app/(tma)/_components/TmaPage'
import AddSubscription from '@app/app/_components/AddSubscription'

export default function Page() {
  return (
    <TmaPage back={true}>
      <div className="flex flex-col gap-4 items-center font-mono">
        <div className="flex flex-col gap-2 uppercase font-mono w-full">
          <div className="text-2xl font-bold ">Добавление подписки</div>
          {/* <div className="text-md font-bold font-mono">{t('description')}</div> */}
        </div>

        <AddSubscription />
      </div>
    </TmaPage>
  )
}
