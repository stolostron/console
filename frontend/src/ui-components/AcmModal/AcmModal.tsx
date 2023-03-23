/* Copyright Contributors to the Open Cluster Management project */

import { useEffect, useContext } from 'react'
import { Modal, ModalProps } from '@patternfly/react-core'
import { AcmAlertProvider, AcmAlertContext } from '../AcmAlert/AcmAlert'

const ACM_MODAL_TOP_OFFSET = '10em' as const

export function AcmModal(props: ModalProps) {
  return (
    <AcmAlertProvider>
      <AcmModalContent {...props} />
    </AcmAlertProvider>
  )
}

function AcmModalContent(props: ModalProps) {
  const alertContext = useContext(AcmAlertContext)

  useEffect(() => {
    if (!props.isOpen) {
      alertContext.clearAlerts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.isOpen])

  return (
    <Modal {...{ positionOffset: props.position === 'top' ? ACM_MODAL_TOP_OFFSET : undefined }} {...props} ref={null} />
  )
}
