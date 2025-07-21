'use client'

import { motion } from 'framer-motion'

// Компонент: Список привилегий
export const PrivilegesList = ({
  privileges,
}: {
  privileges: Array<{ key: string; icon: React.ReactNode; text: string }>
}) => (
  <div className="flex flex-col gap-2 items-center font-extralight font-mono w-full">
    <motion.div
      layout
      className="text-sm bg-[var(--surface-container-lowest)] divide-y divide-[var(--primary)] rounded-xl flex flex-col p-4 py-2 w-full shadow-md">
      {privileges.map((el) => (
        <motion.div
          key={el.key}
          className="flex flex-row gap-3 items-center px-4 py-2 text-sm font-mono">
          {el.icon} {el.text}
        </motion.div>
      ))}
    </motion.div>
  </div>
)
