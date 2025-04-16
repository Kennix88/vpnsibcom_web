'use client'

import { useUserStore } from '@app/store/user.store'
import getRandomEmoji from '@app/utils/get-random-emoji.util'
import Image from 'next/image'

export default function Avatar({ w = 40 }: { w?: number }) {
  const { user } = useUserStore()
  return (
    <div
      className={`flex relative justify-center items-center p-1 rounded-full bg-[var(--surface-container)] ${`w-[${w}px]`} ${`h-[${w}px]`} cursor-pointer`}>
      {getRandomEmoji()}
      {user && user.photoUrl && (
        <Image
          src={user.photoUrl}
          alt="Avatar"
          width={w}
          height={w}
          className={'absolute rounded-full'}
        />
      )}
    </div>
  )
}
