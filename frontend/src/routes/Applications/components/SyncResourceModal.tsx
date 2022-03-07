/* Copyright Contributors to the Open Cluster Management project */

import { AcmModal } from '@stolostron/ui-components'
import { Button, ModalVariant } from '@patternfly/react-core'
import { TFunction } from 'i18next'
export interface ISyncResourceModalProps {
    close: () => void
    open: boolean
    t: TFunction
}

export function SyncResourceModal(props: ISyncResourceModalProps | { open: false }) {
    if (props.open === false) {
        return <></>
    }
    const { t } = props

    const handleSubmit = () => {
        props.close()
    }

    const modalTitle = t('Sync application')
    return (
        <AcmModal
            id="remove-resource-modal"
            isOpen={props.open}
            title={modalTitle}
            aria-label={modalTitle}
            showClose={true}
            onClose={props.close}
            variant={ModalVariant.large}
            position="top"
            positionOffset="225px"
            actions={[
                <Button key="confirm" variant="primary" onClick={() => handleSubmit()}>
                    {t('Synchronize')}
                </Button>,
                <Button key="cancel" variant="link" onClick={props.close}>
                    {t('Cancel')}
                </Button>,
            ]}
        >
            {t('Synchronize application resources with the source repository.')}
        </AcmModal>
    )
}
