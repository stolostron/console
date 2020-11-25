import { AcmButton, AcmModal } from '@open-cluster-management/ui-components'
import { ModalVariant } from '@patternfly/react-core'
import React from 'react'

export interface IProcessingModalProps {
    open: boolean
    setOpen: (open: boolean) => void
    confirm: () => void
    cancel: () => void
    title: string
    message: string
}

export const DefaultProcessingModalProps: IProcessingModalProps = {
    open: false,
    setOpen: () => {},
    confirm: () => {},
    cancel: () => {},
    title: 'CLOSED', // Must have a title
    message: '',
}

export function ProcessingModal(props: IProcessingModalProps) {
    return (
        <AcmModal
            variant={ModalVariant.medium}
            title={props.title}
            isOpen={props.open}
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
