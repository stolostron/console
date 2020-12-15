import { AcmButton, AcmModal } from '@open-cluster-management/ui-components'
import { ModalVariant } from '@patternfly/react-core'
import React from 'react'

export interface IWarningModalProps {
    open: boolean
    confirm: () => void
    title: string
    message: string
}

export const ClosedWarningModalProps: IWarningModalProps = {
    open: false,
    confirm: () => {},
    title: 'CLOSED', // Must have a title
    message: '',
}

export function WarningModal(props: IWarningModalProps) {
    return (
        <AcmModal
            variant={ModalVariant.medium}
            title={props.title}
            isOpen={props.open}
            onClose={() => props.confirm()}
            actions={[
                <AcmButton key="confirm" variant="primary" onClick={() => props.confirm()}>
                    Close
                </AcmButton>,
            ]}
        >
            {props.message}
        </AcmModal>
    )
}
