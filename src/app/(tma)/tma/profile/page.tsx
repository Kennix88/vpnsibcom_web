'use client'
import { TmaPage } from '@app/app/(tma)/_components/TmaPage'
import { useFullscreenAd } from '@app/app/_components/ads/useFullscreenAd'
import Avatar from '@app/app/_components/Avatar'
import Balance from '@app/app/_components/Balance'
import LanguageSwitcher from '@app/app/_components/LanguageSwitcher'
import SocialButtons from '@app/app/_components/SocialButtons'
import { TonWalletConnect } from '@app/app/_components/ton/TonWalletConnect'
import { TonWalletManager } from '@app/app/_components/ton/TonWalletManager'
import { authApiClient } from '@app/core/authApiClient'
import { UserRolesEnum } from '@app/enums/user-roles.enum'
import { useSlicedAddress } from '@app/hooks/useSlicedAddress'
import { useUserStore } from '@app/store/user.store'
import { useCopyToClipboard } from '@app/utils/copy-to-clipboard.util'
import limitLengthString from '@app/utils/limit-length-string.util'
import { Address } from '@ton/ton'
import { useTonWallet } from '@tonconnect/ui-react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCheck, Copy, Hash, Percent, User, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslations } from 'use-intl'

/* ─── Animation variants ─────────────────────────────────────────── */
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}

const fadeSlideUp = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: [0.2, 0, 0, 1] as const },
  },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.38, ease: [0.2, 0, 0, 1] as const },
  },
}

/* ─── Shared copy-feedback button ───────────────────────────────── */
interface CopyButtonProps {
  value: string
  label: string
}

function CopyButton({ value, label }: CopyButtonProps) {
  const copy = useCopyToClipboard()
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    copy(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.button
      onClick={handleCopy}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.95 }}
      className="flex items-center gap-1.5 text-xs font-mono font-bold rounded-lg px-2.5 py-1.5 cursor-pointer select-none"
      style={{
        color: copied ? 'var(--success)' : 'var(--on-primary-container)',
        background: copied
          ? 'var(--success-container)'
          : 'rgba(195,166,255,0.08)',
        border: `1px solid ${copied ? 'var(--success)' : 'rgba(195,166,255,0.18)'}`,
        transition:
          'background 180ms ease, color 180ms ease, border-color 180ms ease',
        minWidth: 0,
        maxWidth: '180px',
      }}>
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span
            key="done"
            className="flex items-center gap-1 whitespace-nowrap"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.18 }}>
            <CheckCheck size={12} />
            Copied!
          </motion.span>
        ) : (
          <motion.span
            key="val"
            className="flex items-center gap-1.5 overflow-hidden"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.18 }}>
            <span className="truncate">{label}</span>
            <Copy size={11} className="shrink-0" />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

/* ─── Info row inside the glass card ────────────────────────────── */
interface InfoRowProps {
  icon: React.ElementType
  label: string
  slot: React.ReactNode
  divider?: boolean
}

function InfoRow({ icon: Icon, label, slot, divider = true }: InfoRowProps) {
  return (
    <motion.div
      variants={fadeSlideUp}
      className="flex items-center justify-between gap-3 py-3"
      style={{
        borderBottom: divider ? '1px solid rgba(255,255,255,0.05)' : 'none',
      }}>
      <div
        className="flex items-center gap-2 text-xs font-mono shrink-0"
        style={{ color: 'var(--on-background)', opacity: 0.5 }}>
        <Icon size={14} aria-hidden />
        {label}
      </div>
      <div className="min-w-0">{slot}</div>
    </motion.div>
  )
}

/* ─── Main page ──────────────────────────────────────────────────── */
export default function Page() {
  const { user, setUser } = useUserStore()
  const wallet = useTonWallet()
  const t = useTranslations('user')
  const address = useSlicedAddress(wallet?.account.address)
  const fullAddress = wallet?.account.address
    ? Address.parseRaw(wallet.account.address).toString({
        testOnly: false,
        bounceable: false,
      })
    : null

  useFullscreenAd()

  useEffect(() => {
    const updateUser = async () => {
      try {
        const updated = await authApiClient.getMe()
        setUser(updated)
      } catch {
        /* noop */
      }
    }
    updateUser()
  }, [setUser])

  return (
    <TmaPage back={true}>
      {/* subtle background gradient blobs */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 overflow-hidden"
        style={{ zIndex: 0 }}>
        <div
          className="absolute rounded-full"
          style={{
            width: 320,
            height: 320,
            top: -80,
            left: '50%',
            transform: 'translateX(-50%)',
            background:
              'radial-gradient(circle, rgba(195,166,255,0.07) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 240,
            height: 240,
            bottom: 80,
            right: -60,
            background:
              'radial-gradient(circle, rgba(106,227,255,0.05) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
      </div>

      <motion.div
        className="relative flex flex-col gap-5 pb-10 items-center"
        style={{ zIndex: 1 }}
        variants={stagger}
        initial="hidden"
        animate="visible">
        {/* ── Hero ── */}
        <motion.div
          variants={scaleIn}
          className="flex flex-col items-center gap-3 pt-6">
          {/* Avatar: ring colour + shield badge driven by connection status */}
          <Avatar w={72} url={user?.photoUrl} withStatus />

          {/* Name */}
          <div className="text-center leading-snug">
            <motion.p
              variants={fadeSlideUp}
              className="font-bold text-xl font-mono tracking-tight"
              style={{ color: 'var(--on-background)' }}>
              {user ? limitLengthString(user.fullName) : '—'}
            </motion.p>
            <motion.p
              variants={fadeSlideUp}
              className="text-sm font-mono mt-0.5"
              style={{ color: 'var(--on-background)', opacity: 0.48 }}>
              @{user?.username ?? 'Anonymous'}
            </motion.p>
          </div>

          {/* Role badge */}
          {user && user.role !== UserRolesEnum.USER && (
            <motion.span
              variants={scaleIn}
              className="px-3 py-1 rounded-full text-xs font-mono font-bold tracking-widest uppercase"
              style={{
                background: 'rgba(195,166,255,0.12)',
                color: 'var(--primary)',
                border: '1px solid rgba(195,166,255,0.3)',
              }}>
              ✦ {user.roleName}
            </motion.span>
          )}
        </motion.div>

        {/* ── Balances ── */}
        <motion.div
          variants={fadeSlideUp}
          className="flex flex-wrap gap-3 justify-center">
          <Balance type="payment" />
          <Balance type="usdt" />
        </motion.div>

        {/* ── Info glass card ── */}
        <motion.div
          variants={fadeSlideUp}
          className="rounded-2xl overflow-hidden max-w-md w-full"
          style={{
            background: 'var(--glass-bg)',
            backdropFilter: `blur(var(--glass-blur))`,
            WebkitBackdropFilter: `blur(var(--glass-blur))`,
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
          }}>
          {/* Card label strip */}
          <div
            className="flex items-center gap-2 px-4 py-2.5"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="block w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--primary)' }}
            />
            <span
              className="text-[10px] font-mono tracking-widest uppercase"
              style={{ color: 'var(--on-background)', opacity: 0.38 }}>
              Ваш профиль
            </span>
          </div>

          {/* Rows */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="px-4 py-1">
            {user && (
              <>
                <InfoRow
                  icon={Hash}
                  label="Telegram ID"
                  slot={
                    <CopyButton
                      value={String(user.telegramId)}
                      label={String(user.telegramId)}
                    />
                  }
                />
                <InfoRow
                  icon={User}
                  label="User ID"
                  slot={
                    <CopyButton
                      value={user.id}
                      label={limitLengthString(user.id)}
                    />
                  }
                />
              </>
            )}

            {user &&
              user.roleDiscount !== null &&
              user.roleDiscount !== undefined &&
              100 - 100 * user.roleDiscount > 0 && (
                <InfoRow
                  icon={Percent}
                  label={t('discount')}
                  slot={
                    <span
                      className="text-xs font-mono font-bold px-2.5 py-1.5 rounded-lg"
                      style={{
                        background: 'var(--success-container)',
                        color: 'var(--success)',
                        border: '1px solid rgba(55,227,162,0.25)',
                      }}>
                      -{100 - 100 * user.roleDiscount}%
                    </span>
                  }
                />
              )}

            <InfoRow
              icon={Wallet}
              label="TON Кошелек"
              divider={false}
              slot={
                address && fullAddress ? (
                  <CopyButton value={fullAddress} label={address} />
                ) : (
                  <TonWalletConnect />
                )
              }
            />
          </motion.div>

          {/* Wallet manager below rows */}
          <motion.div variants={fadeSlideUp} className="px-4 pb-3">
            <TonWalletManager />
          </motion.div>
        </motion.div>

        {/* ── Bottom actions ── */}
        <motion.div
          variants={fadeSlideUp}
          className="flex flex-col items-center gap-4 w-full ">
          <LanguageSwitcher />
          <SocialButtons />
        </motion.div>
      </motion.div>
    </TmaPage>
  )
}
