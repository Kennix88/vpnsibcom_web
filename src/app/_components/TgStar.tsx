'use client'
import gold from '@app/app/_assets/icons/tg-star-gold.svg'
import ice from '@app/app/_assets/icons/tg-star-ice.svg'
import original from '@app/app/_assets/icons/tg-star-original.svg'
import purple from '@app/app/_assets/icons/tg-star-purple.svg'
import white from '@app/app/_assets/icons/tg-star-white.svg'
import Image from 'next/image'

export default function TgStar({
  w = 40,
  type = 'white',
}: {
  w?: number
  type?: 'gold' | 'white' | 'purple' | 'ice' | 'original'
}) {
  return (
    <Image
      src={
        type === 'gold'
          ? gold
          : type === 'purple'
            ? purple
            : type === 'ice'
              ? ice
              : type === 'original'
                ? original
                : white
      }
      alt={'Tg-stars'}
      width={w}
      height={w}
    />
  )
}
