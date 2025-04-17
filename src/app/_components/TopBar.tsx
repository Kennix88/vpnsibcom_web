'use client'
import Avatar from '@app/app/_components/Avatar'
import Balance from '@app/app/_components/Balance'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { IoMenu } from 'react-icons/io5'

export default function TopBar() {
  const location = usePathname()
  const url = location === '/app' ? '/app' : '/tma'
  return (
    <div className="flex flex-row gap-2 justify-between items-center">
      <Link href={url + '/settings'}>
        <Avatar />
      </Link>
      <Balance type={'payment'} isAdd={true} />
      <div
        className={
          'flex justify-center bg-[var(--secondary-container)] rounded-md items-center p-1 cursor-pointer'
        }>
        <IoMenu className={'text-2xl'} />
      </div>
    </div>
  )
}
