'use client'

import getRandomEmoji from '@app/utils/get-random-emoji.util'
import Image from 'next/image'

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  w?: number
  url?: string
}

export default function Avatar({ w = 40, url, ...props }: AvatarProps) {
  return (
    <div
      {...props}
      className={`flex relative justify-center items-center p-1 rounded-full bg-[var(--surface-container)]`}
      style={{
        width: w,
        height: w,
      }}>
      {getRandomEmoji()}
      {url && url && (
        <Image
          src={url}
          alt="Avatar"
          width={w}
          height={w}
          className={'absolute rounded-full'}
        />
      )}
    </div>
  )
}
