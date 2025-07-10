'use client'

import Image from 'next/image'
import Version from './Version'

const Loader = () => {
  return (
    <div className="flex flex-col gap-4 justify-around items-center min-h-screen bg-[var(--background)] text-[var(--on-surface)]">
      <div className={'flex flex-col gap-2 items-center'}>
        <Image
          src={'/logo.png'}
          alt={'logo'}
          width={100}
          height={100}
          priority
        />
        <div className={'font-bold text-xl'}>VPNsib</div>
      </div>
      <div className="loader"></div>
      <Version />
    </div>
  )
}

export default Loader
