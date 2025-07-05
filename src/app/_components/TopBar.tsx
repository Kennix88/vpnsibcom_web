'use client'
import Avatar from '@app/app/_components/Avatar'
import Balance from '@app/app/_components/Balance'
import { useUserStore } from '@app/store/user.store'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function TopBar() {
  const { user } = useUserStore()
  const location = usePathname()
  const url = location === '/app' ? '/app' : '/tma'
  return (
    <div className="flex flex-row gap-2 justify-between items-center w-full">
      <Link href={url + '/settings'}>
        <Avatar url={user?.photoUrl} className={'cursor-pointer'} />
      </Link>
      <Balance type={'payment'} isAdd={true} />
      {/* <div
        className={
          'flex justify-center bg-[var(--secondary-container)] rounded-md items-center p-1 cursor-pointer'
        }>
        <IoMenu className={'text-2xl'} />
      </div> */}
    </div>
  )
}
