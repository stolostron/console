/* Copyright Contributors to the Open Cluster Management project */
import { WizTextInput } from '@patternfly-labs/react-form-wizard'
import { Modal, ModalVariant, Button, Wizard } from '@patternfly/react-core'
import { Fragment, useState } from 'react'
import { useTranslation } from '../../../../../../lib/acm-i18next'

export const ModalWithWizard: React.FunctionComponent = () => {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const { t } = useTranslation()

    const handleModalToggle = () => {
        setIsModalOpen(!isModalOpen)
    }

    const steps = [
        {
            name: 'Step 1',
            component: (
                <WizTextInput
                    id="clusterName"
                    path="metadata.name"
                    label={t('import.form.clusterName.label')}
                    placeholder={t('import.form.clusterName.placeholder')}
                    required
                />
            ),
        },
        { name: 'Step 2', component: <p>Step 2</p> },
        { name: 'Step 3', component: <p>Step 3</p> },
        { name: 'Step 4', component: <p>Step 4</p> },
        { name: 'Review', component: <p>Review Step</p>, nextButtonText: 'Finish' },
    ]

    return (
        <Fragment>
            <Button variant="secondary" onClick={handleModalToggle}>
                {t('Add credential')}
            </Button>
            <Modal
                variant={ModalVariant.large}
                showClose={false}
                isOpen={isModalOpen}
                aria-labelledby="modal-wizard-label"
                aria-describedby="modal-wizard-description"
                onClose={handleModalToggle}
                hasNoBodyWrapper
            >
                <Wizard
                    titleId="modal-wizard-label"
                    descriptionId="modal-wizard-description"
                    title={t('Add credential')}
                    description={t(
                        'A credential stores the access credentials and configuration information for creating clusters.'
                    )}
                    steps={steps}
                    onClose={handleModalToggle}
                    height={400}
                />
            </Modal>
        </Fragment>
    )
}
