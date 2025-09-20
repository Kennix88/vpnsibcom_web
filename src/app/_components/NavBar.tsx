'use client'
import { useUserStore } from '@app/store/user.store'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FaUserFriends } from 'react-icons/fa'
import { FaFire } from 'react-icons/fa6'
import { IoLogoGameControllerA } from 'react-icons/io'
import { useTranslations } from 'use-intl'
import Avatar from './Avatar'

export default function NavBar() {
  const t = useTranslations('navbar')
  const location = usePathname()
  const url = location === '/app' ? '/app' : '/tma'
  const { user } = useUserStore()

  const navItems = [
    {
      name: 'VPN',
      href: url,
      icon: (
        <Image
          src={'/logo.png'}
          alt="Logo"
          width={24}
          height={24}
          className={'rounded-md'}
        />
      ),
    },
    {
      name: t('earning'),
      href: url + '/earning',
      icon: <FaFire size={24} />,
    },
    {
      name: t('games'),
      href: url + '/games',
      icon: <IoLogoGameControllerA size={24} />,
    },
    {
      name: t('friends'),
      href: url + '/friends',
      icon: <FaUserFriends size={24} />,
    },
    {
      name: t('profile'),
      href: url + '/profile',
      icon: <Avatar url={user?.photoUrl} w={24} className={'cursor-pointer'} />,
    },
  ]

  const isMainUrls =
    location.includes('/earning') ||
    location.includes('/games') ||
    location.includes('/friends') ||
    location.includes('/billing') ||
    location.includes('/settings') ||
    location.includes('/profile') ||
    location.includes('/subscription') ||
    location.includes('/payment') ||
    location.includes('/add-subscription') ||
    url === location

  if (!isMainUrls) return null

  return (
    <div
      className={`bottom-0 left-0 right-0 fixed flex flex-row py-4 items-center justify-center z-[50] `}>
      <div
        className={`grid grid-cols-5 max-w-[320px] grid-rows-1 gap-2 p-2 rounded-xl bg-[var(--surface-container)] bg-opacity-90 justify-center`}>
        {navItems.map((item) => (
          <Link
            href={`${item.href}`}
            key={item.name}
            className={`flex flex-col items-center justify-center font-[600] text-[12px] gap-1 ${
              location !==
              `${item.href} transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer`
                ? 'text-[var(--on-surface-variant)]'
                : 'text-[var(--on-surface)]'
            }`}>
            <div
              className={`px-3 py-1 rounded-lg ${
                location !== `${item.href}`
                  ? 'text-[var(--on-surface-variant)]'
                  : 'text-[var(--on-surface)] bg-[var(--secondary-container)]'
              }`}>
              {item.icon}
            </div>
            <span
              className={`font-mono font-bold ${
                location !== `${item.href}`
                  ? 'text-[var(--on-surface-variant)]'
                  : 'text-[var(--on-surface)]'
              }`}>
              {item.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
