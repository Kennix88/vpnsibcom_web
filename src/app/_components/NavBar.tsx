'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FaUserFriends } from 'react-icons/fa'
import { FaFire, FaMoneyBill1Wave } from 'react-icons/fa6'
import { TbGiftFilled, TbSmartHome } from 'react-icons/tb'
import { useTranslations } from 'use-intl'

export default function NavBar() {
  const t = useTranslations('navbar')
  const location = usePathname()
  const url = location === '/app' ? '/app' : '/tma'

  const navItems = [
    {
      name: t('home'),
      href: url,
      icon: <TbSmartHome className="text-2xl" />,
    },
    {
      name: t('earning'),
      href: url + '/earning',
      icon: <FaFire className="text-2xl" />,
    },
    {
      name: t('gifts'),
      href: url + '/gifts',
      icon: <TbGiftFilled className="text-2xl" />,
    },
    {
      name: t('friends'),
      href: url + '/friends',
      icon: <FaUserFriends className="text-2xl" />,
    },
    {
      name: t('billing'),
      href: url + '/billing',
      icon: <FaMoneyBill1Wave className="text-2xl" />,
    },
  ]

  const isMainUrls =
    url === location ||
    url + '/earning' === location ||
    url + '/gifts' === location ||
    url + '/friends' === location ||
    url + '/billing' === location

  if (!isMainUrls) return null

  return (
    <div
      className={`bottom-0 left-0 right-0 fixed flex flex-row py-4 items-center justify-center z-[99] `}>
      <div
        className={`grid grid-cols-5 min-w-[320px] grid-rows-1 gap-2 p-2 rounded-xl bg-[var(--surface-container)] bg-opacity-90 `}>
        {navItems.map((item) => (
          <Link
            href={`${item.href}`}
            key={item.name}
            className={`flex flex-col items-center justify-center font-[600] text-[12px] gap-1 ${
              location !== `${item.href}`
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
