'use client'

import { TmaPage } from '@app/app/(tma)/_components/TmaPage'
import { TaskAdsgramTask } from '@app/app/_components/ads/TaskAdsgram'
import { Extensions } from '@app/app/_components/Extensions'
import TopBar from '@app/app/_components/TopBar'
import { Gift, ListChecks, Megaphone, ShieldAlert } from 'lucide-react'
import dynamic from 'next/dynamic'
import { SectionHeading } from './_components/SectionHeading'

const TaskAdsReward = dynamic(
  () =>
    import('@app/app/_components/ads/TaskAdsReward').then(
      (mod) => mod.TaskAdsReward,
    ),
  {
    ssr: false,
  },
)

export default function Page() {
  return (
    <TmaPage back={false}>
      <TopBar />

      <div className="pt-4 flex flex-col gap-4">
        {/* ─── Hero — та же тёплая "золотая" тема, что и у таба в NavBar ─── */}
        <div
          className="relative rounded-2xl p-4 overflow-hidden"
          style={{
            background:
              'linear-gradient(135deg, rgba(245,166,35,0.16), rgba(255,140,66,0.05))',
            border: '1px solid rgba(245,166,35,0.22)',
          }}>
          <div
            aria-hidden
            className="pointer-events-none absolute -top-16 -right-10 w-40 h-40 rounded-full blur-3xl"
            style={{ background: 'rgba(245,166,35,0.18)' }}
          />
          <div className="relative flex items-start gap-3">
            <span
              className="flex items-center justify-center w-11 h-11 rounded-xl shrink-0"
              style={{
                background: 'rgba(245,166,35,0.16)',
                color: 'var(--star)',
                border: '1px solid rgba(245,166,35,0.3)',
              }}>
              <ListChecks size={20} strokeWidth={2.3} />
            </span>
            <div className="flex flex-col gap-0.5 min-w-0">
              <h1
                className="text-[17px] font-bold font-mono uppercase leading-tight"
                style={{ color: 'var(--on-surface)' }}>
                Задачи
              </h1>
              <span
                className="text-[11.5px] font-mono leading-snug"
                style={{ color: 'var(--on-surface-variant)', opacity: 0.85 }}>
                Смотри рекламу, будь активен в соцсетях — получай Stars, дни,
                устройства и трафик бесплатно
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5 mt-5 pb-[80px]">
        <div className="flex flex-col gap-2.5">
          <SectionHeading
            icon={<Megaphone size={14} />}
            title="Награда за партнерские задания"
            hint="Смотри ролики, выполняй задачи, делай клики и подписки — получай Stars каждый день"
          />
          <div className="flex flex-col gap-3">
            <TaskAdsReward />
            <TaskAdsgramTask debug={process.env.NODE_ENV !== 'production'} />
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <SectionHeading
            icon={<Gift size={14} />}
            title="Расширения подписки"
            hint="Разовые условия — выполнил один раз, награда навсегда"
          />
          <Extensions />
        </div>

        {/* ─── Предупреждение об отмене заданий ──────────────────────── */}
        <div
          className="relative rounded-2xl p-3.5 flex items-start gap-2.5 overflow-hidden"
          style={{
            background: 'rgba(255,171,64,0.08)',
            border: '1px solid rgba(255,171,64,0.22)',
          }}>
          <span
            className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0"
            style={{
              background: 'rgba(255,171,64,0.16)',
              color: 'var(--warning)',
            }}>
            <ShieldAlert size={14} />
          </span>
          <span
            className="text-[10.5px] font-mono leading-snug"
            style={{ color: 'var(--on-surface-variant)', opacity: 0.9 }}>
            Если после выполнения задания ты отменишь действие — отпишешься от
            канала или чата, отзовёшь реферала, вернёшь рекламный просмотр и
            т.п. — начисленная награда спишется обратно, а сверху будет удержан
            штраф. Баланс при этом может уйти в минус.
          </span>
        </div>
      </div>
    </TmaPage>
  )
}
