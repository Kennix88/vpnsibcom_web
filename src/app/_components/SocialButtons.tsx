'use client'

import { motion, Variants } from 'framer-motion'
import { useState } from 'react'
import ActionButton from './ActionButton'
import {
  ACTION_BUTTONS_REGISTRY,
  ButtonKey,
  DocSlug,
} from './actionButtons.registry'
import DocViewer from './DocViewer'

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring', stiffness: 340, damping: 30 },
  },
}

export interface SocialButtonsProps {
  /** Какие кнопки показать и в каком порядке. По умолчанию — канал + чат. */
  keys?: ButtonKey[]
}

export default function SocialButtons({
  keys = ['channel', 'chat'],
}: SocialButtonsProps) {
  const [openDoc, setOpenDoc] = useState<DocSlug | null>(null)

  return (
    <>
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full font-mono max-w-2xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible">
        {keys.map((key) => {
          const cfg = ACTION_BUTTONS_REGISTRY[key]
          return (
            <motion.div key={cfg.key} variants={itemVariants}>
              <ActionButton
                variant="card"
                icon={cfg.icon}
                label={cfg.label}
                description={cfg.description}
                accent={cfg.accent}
                badge={cfg.badge}
                onClick={() => {
                  if (cfg.action.kind === 'link') {
                    window.open(
                      cfg.action.href,
                      '_blank',
                      'noopener,noreferrer',
                    )
                  } else {
                    setOpenDoc(cfg.action.slug)
                  }
                }}
              />
            </motion.div>
          )
        })}
      </motion.div>

      <DocViewer slug={openDoc} onClose={() => setOpenDoc(null)} />
    </>
  )
}
