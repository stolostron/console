/* Copyright Contributors to the Open Cluster Management project */

import { Button, Modal, ModalVariant } from '@patternfly/react-core'
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
      <Modal
        bodyAriaLabel="policy difference modal"
        tabIndex={0}
        variant={ModalVariant.large}
        title={`${t('Difference for the')} ${kind} ${namespace ? namespace + '/' : ''}${name}`}
        isOpen={isModalOpen}
        onClose={handleModalToggle}
        actions={[
          <Button key="Cancel" variant="primary" onClick={handleModalToggle}>
            {t('Close')}
          </Button>,
        ]}
      >
        <CodeBlock>{diff}</CodeBlock>
      </Modal>
    </>
  )
}
