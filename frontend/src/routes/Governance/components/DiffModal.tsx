/* Copyright Contributors to the Open Cluster Management project */

import { Button, Modal, ModalBody, ModalFooter, ModalHeader, ModalVariant } from '@patternfly/react-core'
import { useState } from 'react'
import { useTranslation } from '../../../lib/acm-i18next'
import { CodeBlock } from './CodeBlock'

export function DiffModal({
  diff,
  kind,
  name,
  namespace,
}: Readonly<{ name: string; diff: string; namespace: string; kind: string }>) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const handleModalToggle = () => {
    setIsModalOpen((prevIsModalOpen) => !prevIsModalOpen)
  }
  const { t } = useTranslation()
  return (
    <>
      {diff && (
        <>
          {' - '}
          <Button variant="link" isInline onClick={handleModalToggle}>
            {t('View diff')}
          </Button>
        </>
      )}
      <Modal variant={ModalVariant.large} isOpen={isModalOpen} onClose={handleModalToggle}>
        <ModalHeader
          title={t('Difference for the {{kind}} {{resource}}', {
            kind,
            resource: `${namespace ? namespace + '/' : ''}${name}`,
          })}
        />
        <ModalBody tabIndex={0} aria-label={t('scrollable policy differences')}>
          <CodeBlock>{diff}</CodeBlock>
        </ModalBody>
        <ModalFooter>
          <Button key="Cancel" variant="primary" onClick={handleModalToggle}>
            {t('Close')}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  )
}
