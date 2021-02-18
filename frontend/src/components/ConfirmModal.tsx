import { AcmButton, AcmModal } from '@open-cluster-management/ui-components'
import { useTranslation } from 'react-i18next'
import { ModalVariant, ButtonVariant } from '@patternfly/react-core'
import React from 'react'

export interface IConfirmModalProps {
    open: boolean
    confirm: () => void
    confirmText?: string
    cancel: () => void
    title: string | React.ReactNode
    message: string | React.ReactNode
    isDanger?: boolean
}

export const ClosedConfirmModalProps: IConfirmModalProps = {
    open: false,
    confirm: () => {},
    confirmText: undefined,
    isDanger: false,
    cancel: () => {},
    title: 'CLOSED', // Must have a title
    message: '',
}

export function ConfirmModal(props: IConfirmModalProps) {
    const { t } = useTranslation()
    return (
        <AcmModal
            variant={ModalVariant.medium}
            title={props.title}
            isOpen={props.open}
            onClose={() => props.cancel()}
            actions={[
                <AcmButton
                    key="confirm"
                    variant={props.isDanger ? ButtonVariant.danger : ButtonVariant.primary}
                    onClick={() => props.confirm()}
                >
                    {props.confirmText ?? t('confirm')}
                </AcmButton>,
                <AcmButton key="cancel" variant="link" onClick={() => props.cancel()}>
                    {t('cancel')}
                </AcmButton>,
            ]}
        >
            {props.message}
        </AcmModal>
    )
}
