'use client'
import ad from '@app/app/_assets/icons/ad-icon.svg'
import star from '@app/app/_assets/icons/star.svg'
import tgStar from '@app/app/_assets/icons/tg-star-original.svg'
import ticket from '@app/app/_assets/icons/ticket.svg'
import ton from '@app/app/_assets/icons/ton-coin.svg'
import traffic from '@app/app/_assets/icons/traffic.svg'
import Image from 'next/image'

export default function Currency({
  w = 40,
  type = 'star',
}: {
  w?: number
  type?: 'star' | 'tg-star' | 'ticket' | 'traffic' | 'ton' | 'ad'
}) {
  return (
    <Image
      src={
        type === 'star'
          ? star
          : type === 'tg-star'
            ? tgStar
            : type === 'ticket'
              ? ticket
              : type === 'traffic'
                ? traffic
                : type === 'ton'
                  ? ton
                  : type === 'ad'
                    ? ad
                    : star
      }
      alt={'currency'}
      width={w}
      height={w}
    />
  )
}
