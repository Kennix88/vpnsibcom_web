'use client'

import Modal from '../Modal'
import ConnectGuide from './ConnectGuide'

export function AddDeviceModal({
  isOpen,
  onClose,
  subscriptionUrl,
  isActive,
}: {
  isOpen: boolean
  onClose: () => void
  subscriptionUrl: string
  isActive: boolean
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Подключить устройство"
      showCancelButton={false}
      maxWidth="md">
      <ConnectGuide subscriptionUrl={subscriptionUrl} isActive={isActive} />
    </Modal>
  )
}
