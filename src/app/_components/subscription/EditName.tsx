'use client'

import { authApiClient } from '@app/core/authApiClient'
import { useSubscriptionsStore } from '@app/store/subscriptions.store'
import { useUserStore } from '@app/store/user.store'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Pencil, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'react-toastify'

export default function EditName({
  name,
  subscriptionId,
  isEdit,
  isPublic,
}: {
  name: string
  subscriptionId: string
  isEdit: boolean
  isPublic: boolean
}) {
  const [inputName, setInputName] = useState(name)
  const [isEditName, setIsEditName] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const editInFlightRef = useRef(false)
  const { setSubscriptions } = useSubscriptionsStore()
  const { setUser } = useUserStore()

  const editNameSubscription = async (id: string, newName: string) => {
    if (editInFlightRef.current) return
    editInFlightRef.current = true
    setIsLoading(true)
    try {
      const data = await authApiClient.editSubscriptionName(id, newName)
      setUser(data.user)
      setSubscriptions(data.subscriptions)
      toast.success('Название обновлено')
    } catch {
      toast.error('Ошибка обновления названия')
    } finally {
      editInFlightRef.current = false
      setIsLoading(false)
    }
  }

  if (!isEdit || isPublic) {
    return (
      <span className="text-sm font-bold font-mono truncate">{inputName}</span>
    )
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {isEditName ? (
        <motion.div
          key="editing"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.15 }}
          className="flex items-center gap-1.5 grow min-w-0">
          <input
            autoFocus
            className="grow min-w-0 bg-transparent text-sm font-mono font-bold rounded-lg px-2 py-1 focus:outline-none"
            style={{
              border: '1px solid rgba(195,166,255,0.4)',
              color: 'var(--on-surface)',
              caretColor: 'var(--primary)',
            }}
            maxLength={20}
            minLength={1}
            type="text"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                editNameSubscription(subscriptionId, inputName)
                setIsEditName(false)
              }
              if (e.key === 'Escape') {
                setInputName(name)
                setIsEditName(false)
              }
            }}
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            disabled={isLoading}
            className="shrink-0 p-1.5 rounded-lg cursor-pointer"
            style={{
              background: 'rgba(255,107,102,0.18)',
              color: 'var(--error)',
              border: '1px solid rgba(255,107,102,0.25)',
            }}
            onClick={() => {
              setInputName(name)
              setIsEditName(false)
            }}>
            <X size={13} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            disabled={isLoading}
            className="shrink-0 p-1.5 rounded-lg cursor-pointer"
            style={{
              background: 'rgba(55,227,162,0.18)',
              color: 'var(--success)',
              border: '1px solid rgba(55,227,162,0.25)',
            }}
            onClick={() => {
              editNameSubscription(subscriptionId, inputName)
              setIsEditName(false)
            }}>
            {isLoading ? (
              <span className="text-[10px]">...</span>
            ) : (
              <Check size={13} />
            )}
          </motion.button>
        </motion.div>
      ) : (
        <motion.button
          key="viewing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          onClick={() => setIsEditName(true)}
          className="flex items-center gap-2 grow min-w-0 cursor-pointer">
          <span className="text-sm font-bold font-mono truncate flex-1 text-left">
            {inputName}
          </span>
          <span
            className="shrink-0 p-1.5 rounded-lg"
            style={{
              background: 'rgba(195,166,255,0.1)',
              color: 'var(--primary)',
              border: '1px solid rgba(195,166,255,0.18)',
            }}>
            <Pencil size={11} />
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  )
}
