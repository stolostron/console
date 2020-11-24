import { AcmButton, AcmModal } from '@open-cluster-management/ui-components'
import { ModalVariant } from '@patternfly/react-core'
import React from 'react'

export interface IConfirmModalProps {
    open: boolean
    confirm: () => void
    cancel: () => void
    title: string
    message: string
}

export const ClosedConfirmModalProps: IConfirmModalProps = {
    open: false,
    confirm: () => {},
    cancel: () => {},
    title: 'CLOSED', // Must have a title
    message: '',
}

export function ConfirmModal(props: IConfirmModalProps) {
    return (
        <AcmModal
            variant={ModalVariant.medium}
            title={props.title}
            isOpen={props.open}
            onClose={() => props.cancel()}
            actions={[
                <AcmButton key="confirm" variant="primary" onClick={() => props.confirm()}>
                    Confirm
                </AcmButton>,
                <AcmButton key="cancel" variant="link" onClick={() => props.cancel()}>
                    Cancel
                </AcmButton>,
            ]}
        >
            {props.message}
        </AcmModal>
    )
}
