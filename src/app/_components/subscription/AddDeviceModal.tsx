'use client'

import Modal from '../Modal'
import ConnectGuide from './ConnectGuide'

export function AddDeviceModal({
  isOpen,
  onClose,
  subscriptionUrl,
}: {
  isOpen: boolean
  onClose: () => void
  subscriptionUrl: string
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      // title="Подключить устройство"
      showCancelButton={false}
      maxWidth="md">
      <ConnectGuide subscriptionUrl={subscriptionUrl} />
    </Modal>
  )
}
