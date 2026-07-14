'use client'
import gram from '@app/app/_assets/icons/gram.svg'
import star from '@app/app/_assets/icons/star.svg'
import tgStar from '@app/app/_assets/icons/tg-star-original.svg'
import ton from '@app/app/_assets/icons/ton-coin.svg'
import usdt from '@app/app/_assets/icons/usdt.svg'
import Image from 'next/image'

export type CurrencyType = 'star' | 'tg-star' | 'ton' | 'usdt' | 'gram'

export default function Currency({
  w = 40,
  type = 'star',
}: {
  w?: number
  type?: CurrencyType
}) {
  return (
    <Image
      src={
        type === 'star'
          ? star
          : type === 'tg-star'
            ? tgStar
            : type === 'ton'
              ? ton
              : type === 'usdt'
                ? usdt
                : type === 'gram'
                  ? gram
                  : star
      }
      alt={'currency'}
      width={w}
      height={w}
    />
  )
}
