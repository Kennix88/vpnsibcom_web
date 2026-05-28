'use client'
import { motion } from 'framer-motion'

/* ─── Animated SVG network tree ──────────────────────────────────── */
function NetworkTree() {
  const pathVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (d: number) => ({
      pathLength: 1,
      opacity: 1,
      transition: { delay: d, duration: 0.5, ease: 'easeOut' } as const,
    }),
  }
  const nodeVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: (d: number) => ({
      scale: 1,
      opacity: 1,
      transition: {
        delay: d,
        type: 'spring',
        stiffness: 320,
        damping: 18,
      } as const,
    }),
  }

  // YOU → 2 L1  →  4 L2
  const lines = [
    { d: 'M 148 22 L 75 72', delay: 0.15, color: 'rgba(195,166,255,0.3)' },
    { d: 'M 152 22 L 225 72', delay: 0.2, color: 'rgba(195,166,255,0.3)' },
    { d: 'M 73 75 L 28 114', delay: 0.42, color: 'rgba(80,175,149,0.25)' },
    { d: 'M 77 75 L 110 114', delay: 0.46, color: 'rgba(80,175,149,0.25)' },
    { d: 'M 223 75 L 190 114', delay: 0.5, color: 'rgba(80,175,149,0.25)' },
    { d: 'M 227 75 L 272 114', delay: 0.54, color: 'rgba(80,175,149,0.25)' },
  ]

  return (
    <svg
      width="300"
      height="136"
      viewBox="0 0 300 136"
      fill="none"
      aria-hidden
      className="overflow-visible">
      {/* Lines */}
      {lines.map((l, i) => (
        <motion.path
          key={i}
          d={l.d}
          stroke={l.color}
          strokeWidth="1.5"
          strokeLinecap="round"
          custom={l.delay}
          variants={pathVariants}
          initial="hidden"
          animate="visible"
        />
      ))}

      {/* YOU */}
      <motion.g
        custom={0}
        variants={nodeVariants}
        initial="hidden"
        animate="visible"
        style={{ transformOrigin: '150px 18px' }}>
        <circle
          cx="150"
          cy="18"
          r="15"
          fill="rgba(195,166,255,0.15)"
          stroke="var(--primary)"
          strokeWidth="1.8"
        />
        <motion.circle
          cx="150"
          cy="18"
          r="15"
          stroke="var(--primary)"
          strokeWidth="1.5"
          fill="none"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        />
        <text
          x="150"
          y="22"
          textAnchor="middle"
          fontSize="8"
          fill="var(--primary)"
          fontFamily="monospace"
          fontWeight="bold">
          ВЫ
        </text>
      </motion.g>

      {/* L1 left */}
      <motion.g
        custom={0.28}
        variants={nodeVariants}
        initial="hidden"
        animate="visible"
        style={{ transformOrigin: '75px 75px' }}>
        <circle
          cx="75"
          cy="75"
          r="12"
          fill="rgba(80,175,149,0.15)"
          stroke="var(--usdt)"
          strokeWidth="1.5"
        />
        <text
          x="75"
          y="79"
          textAnchor="middle"
          fontSize="7.5"
          fill="var(--usdt)"
          fontFamily="monospace"
          fontWeight="bold">
          L1
        </text>
      </motion.g>

      {/* L1 right */}
      <motion.g
        custom={0.34}
        variants={nodeVariants}
        initial="hidden"
        animate="visible"
        style={{ transformOrigin: '225px 75px' }}>
        <circle
          cx="225"
          cy="75"
          r="12"
          fill="rgba(80,175,149,0.15)"
          stroke="var(--usdt)"
          strokeWidth="1.5"
        />
        <text
          x="225"
          y="79"
          textAnchor="middle"
          fontSize="7.5"
          fill="var(--usdt)"
          fontFamily="monospace"
          fontWeight="bold">
          L1
        </text>
      </motion.g>

      {/* L2 nodes */}
      {[28, 110, 190, 272].map((cx, i) => (
        <motion.g
          key={cx}
          custom={0.55 + i * 0.07}
          variants={nodeVariants}
          initial="hidden"
          animate="visible"
          style={{ transformOrigin: `${cx}px 116px` }}>
          <circle
            cx={cx}
            cy="116"
            r="9"
            fill="rgba(106,227,255,0.1)"
            stroke="var(--accent-network)"
            strokeWidth="1.2"
          />
          <text
            x={cx}
            y="120"
            textAnchor="middle"
            fontSize="6.5"
            fill="var(--accent-network)"
            fontFamily="monospace"
            fontWeight="bold">
            L2
          </text>
        </motion.g>
      ))}

      {/* USDT label next to L1 nodes */}
      <motion.text
        x="75"
        y="56"
        textAnchor="middle"
        fontSize="7"
        fill="var(--success)"
        fontFamily="monospace"
        fontWeight="bold"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ delay: 0.7 }}>
        USDT
      </motion.text>
      <motion.text
        x="225"
        y="56"
        textAnchor="middle"
        fontSize="7"
        fill="var(--success)"
        fontFamily="monospace"
        fontWeight="bold"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ delay: 0.75 }}>
        USDT
      </motion.text>
    </svg>
  )
}

/* ─── Hero component ─────────────────────────────────────────────── */
export default function FriendsHero() {
  return (
    <div className="w-full flex flex-col gap-4">
      {/* Network tree */}
      <div className="flex justify-center pt-2">
        <NetworkTree />
      </div>

      {/* Copy */}
      <div className="flex flex-col gap-1.5">
        <h1 className="flex items-center gap-2">
          <motion.span
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="block w-2 h-2 rounded-full"
            style={{ background: 'var(--usdt)' }}
          />
          <span
            className="text-2xl font-bold font-mono leading-tight"
            style={{ color: 'var(--usdt)', opacity: 0.85 }}>
            Реферальная программа
          </span>
        </h1>

        <p
          className="text-sm font-mono leading-relaxed"
          style={{ color: 'var(--on-background)', opacity: 0.52 }}>
          Получай{' '}
          <strong
            style={{ color: 'var(--usdt)', opacity: 1, fontStyle: 'normal' }}>
            USDT навсегда
          </strong>{' '}
          — за каждую оплату твоих друзей и их друзей
        </p>
      </div>
    </div>
  )
}
