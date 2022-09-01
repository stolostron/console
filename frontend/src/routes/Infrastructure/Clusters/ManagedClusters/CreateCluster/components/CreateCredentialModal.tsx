/* Copyright Contributors to the Open Cluster Management project */
import { Button } from '@patternfly/react-core'
import { Fragment } from 'react'

import { useTranslation } from '../../../../../../lib/acm-i18next'
export interface IModalWithWizardProps {
    handleModalToggle: () => void
}

export function ModalWithWizard(props: IModalWithWizardProps) {
    const { t } = useTranslation()

    return (
        <Fragment>
            <Button variant="secondary" onClick={props.handleModalToggle}>
                {t('Add credential')}
            </Button>
        </Fragment>
    )
}
