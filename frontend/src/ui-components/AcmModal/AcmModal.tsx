/* Copyright Contributors to the Open Cluster Management project */

import { useEffect, useContext } from 'react'
import { Modal, ModalProps } from '@patternfly/react-core'
import { AcmAlertProvider, AcmAlertContext } from '../AcmAlert/AcmAlert'

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
    }, [props.isOpen])

    return <Modal {...props} ref={null} />
}
