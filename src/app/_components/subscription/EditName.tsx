'use client'

import { authApiClient } from '@app/core/authApiClient'
import { useSubscriptionsStore } from '@app/store/subscriptions.store'
import { useUserStore } from '@app/store/user.store'
import { useState } from 'react'
import { AiOutlineStop } from 'react-icons/ai'
import { FaCheck, FaPen } from 'react-icons/fa6'
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
  const { setSubscriptions } = useSubscriptionsStore()
  const { setUser } = useUserStore()

  const editNameSubscription = async (subscriptionId: string, name: string) => {
    try {
      setIsLoading(true)
      const data = await authApiClient.editSubscriptionName(
        subscriptionId,
        name,
      )

      setUser(data.user)
      setSubscriptions(data.subscriptions)
      toast.success('Subscription name updated')
    } catch {
      toast.error('Failed to update subscription name')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isEdit || isPublic) return <div>{inputName}</div>
  if (isEditName)
    return (
      <div className="flex items-center gap-2 grow justify-between">
        <input
          className="border w-full border-[var(--on-surface)]/50 rounded-md px-2 py-1 bg-transparent focus:border-[var(--primary)] focus:outline-none"
          maxLength={20}
          minLength={1}
          type="text"
          value={inputName}
          onChange={(e) => setInputName(e.target.value)}
        />
        <button
          disabled={isLoading}
          className="transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer p-1 rounded-md bg-[var(--error)] text-[var(--on-error)] font-extrabold"
          onClick={() => {
            setInputName(name)
            setIsEditName(false)
          }}>
          <AiOutlineStop size={14} />
        </button>
        <button
          disabled={isLoading}
          className="transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer p-1 rounded-md bg-[var(--success)] text-[var(--on-success)] font-extrabold"
          onClick={() => {
            editNameSubscription(subscriptionId, inputName)
            setIsEditName(false)
          }}>
          <FaCheck size={14} />
        </button>
      </div>
    )
  else
    return (
      <button
        onClick={() => setIsEditName(true)}
        className="flex items-center gap-2 transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer justify-between grow">
        {inputName}{' '}
        <div className="p-1.5 rounded-md bg-[var(--secondary-container)] text-[var(--on-secondary-container)] font-extrabold">
          <FaPen size={14} />
        </div>
      </button>
    )
}
