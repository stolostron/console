import React from 'react'
import { Modal, Button, ModalVariant } from '@patternfly/react-core'

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
    title: '',
    message: '',
}

export function ConfirmModal(props: IConfirmModalProps) {
    return (
        <Modal
            variant={ModalVariant.medium}
            title={props.title}
            isOpen={props.open}
            onClose={() => props.cancel()}
            actions={[
                <Button key="confirm" variant="primary" onClick={() => props.confirm()}>
                    Confirm
                </Button>,
                <Button key="cancel" variant="link" onClick={() => props.cancel()}>
                    Cancel
                </Button>,
            ]}
        >
            {props.message}
        </Modal>
    )
}
