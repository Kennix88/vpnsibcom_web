'use client'
import Avatar from '@app/app/_components/Avatar'
import Balance from '@app/app/_components/Balance'
import { IoMenu } from 'react-icons/io5'

export default function TopBar() {
  return (
    <div className="flex flex-row gap-2 justify-between items-center">
      <Avatar />
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
