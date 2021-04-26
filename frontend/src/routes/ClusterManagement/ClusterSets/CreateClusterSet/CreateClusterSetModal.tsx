/* Copyright Contributors to the Open Cluster Management project */

import { useState } from 'react'
import { useHistory } from 'react-router-dom'
import { useTranslation, Trans } from 'react-i18next'
import {
    AcmAlertContext,
    AcmAlertGroup,
    AcmButton,
    AcmForm,
    AcmSubmit,
    AcmTextInput,
    AcmLabelsInput,
    AcmModal,
} from '@open-cluster-management/ui-components'
import { ModalVariant, ActionGroup } from '@patternfly/react-core'
import {
    ManagedClusterSet,
    ManagedClusterSetApiVersion,
    ManagedClusterSetKind,
} from '../../../../resources/managed-cluster-set'
import { createResource } from '../../../../lib/resource-request'
import { NavigationPath } from '../../../../NavigationPath'

const emptyManagedClusterSet: ManagedClusterSet = {
    apiVersion: ManagedClusterSetApiVersion,
    kind: ManagedClusterSetKind,
    metadata: {
        name: '',
    },
    spec: {},
}

export function CreateClusterSetModal(props: { isOpen: boolean; onClose: () => void }) {
    const { t } = useTranslation(['cluster', 'common'])
    const history = useHistory()

    const [created, setCreated] = useState<boolean>()
    const [managedClusterSet, setManagedClusterSet] = useState<ManagedClusterSet>(emptyManagedClusterSet)

    function reset() {
        setManagedClusterSet(emptyManagedClusterSet)
        props.onClose?.()
    }

    return (
        <AcmModal
            variant={ModalVariant.medium}
            title={!created ? t('createClusterSet.title') : t('createClusterSet.success.title')}
            isOpen={props.isOpen}
            onClose={reset}
        >
            {!created ? (
                <AcmForm>
                    <AcmAlertContext.Consumer>
                        {(alertContext) => (
                            <>
                                <div>
                                    <Trans
                                        i18nKey="cluster:createClusterSet.description"
                                        components={{ bold: <strong /> }}
                                    />
                                </div>
                                <AcmTextInput
                                    id="clusterSetName"
                                    label={t('createClusterSet.form.name.label')}
                                    placeholder={t('createClusterSet.form.name.placeholder')}
                                    value={managedClusterSet.metadata.name}
                                    isRequired
                                    onChange={(name) => {
                                        const copy = { ...managedClusterSet }
                                        copy.metadata.name = name
                                        setManagedClusterSet(copy)
                                    }}
                                />
                                <AcmLabelsInput
                                    id="labels"
                                    label={t('common:labels')}
                                    placeholder={t('labels.edit.placeholder')}
                                    buttonLabel={t('common:label.add')}
                                    value={managedClusterSet.metadata.labels}
                                    onChange={(label) => {
                                        const copy = { ...managedClusterSet }
                                        copy.metadata.labels = label
                                        setManagedClusterSet(copy)
                                    }}
                                />

                                <AcmAlertGroup isInline canClose padTop />
                                <ActionGroup>
                                    <AcmSubmit
                                        id="submit"
                                        variant="primary"
                                        label={t('common:create')}
                                        processingLabel={t('common:creating')}
                                        onClick={() => {
                                            alertContext.clearAlerts()
                                            return createResource<ManagedClusterSet>(managedClusterSet)
                                                .promise.then(() => setCreated(true))
                                                .catch((err) => {
                                                    alertContext.addAlert({
                                                        type: 'danger',
                                                        title: err.name,
                                                        message: err.message,
                                                    })
                                                })
                                        }}
                                    />
                                    <AcmButton variant="link" onClick={reset}>
                                        {t('common:cancel')}
                                    </AcmButton>
                                </ActionGroup>
                            </>
                        )}
                    </AcmAlertContext.Consumer>
                </AcmForm>
            ) : (
                <>
                    <div style={{ marginBottom: '24px' }}>
                        <Trans
                            i18nKey="cluster:createClusterSet.success.description"
                            values={{ clusterSetName: managedClusterSet.metadata.name }}
                            components={{ bold: <strong /> }}
                        />
                    </div>
                    <ActionGroup>
                        <AcmButton
                            variant="primary"
                            onClick={() => {
                                history.push(
                                    NavigationPath.clusterSetManage.replace(':id', managedClusterSet.metadata.name!)
                                )
                            }}
                        >
                            {t('set.manage-resources')}
                        </AcmButton>
                        <AcmButton variant="link" onClick={reset}>
                            {t('common:close')}
                        </AcmButton>
                    </ActionGroup>
                </>
            )}
        </AcmModal>
    )
}
