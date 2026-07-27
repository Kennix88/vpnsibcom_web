'use client'

import Modal from '@app/app/_components/Modal'
import { DOC_TITLE, DocSlug } from './actionButtons.registry'
import DocContent from './DocContent'

interface DocViewerProps {
  slug: DocSlug | null
  onClose: () => void
}

export default function DocViewer({ slug, onClose }: DocViewerProps) {
  return (
    <Modal
      isOpen={!!slug}
      onClose={onClose}
      title={slug ? DOC_TITLE[slug] : ''}
      showCancelButton={false}
      maxWidth="lg">
      {slug && <DocContent slug={slug} />}
    </Modal>
  )
}
