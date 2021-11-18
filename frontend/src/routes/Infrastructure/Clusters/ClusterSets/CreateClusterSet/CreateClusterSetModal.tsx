/* Copyright Contributors to the Open Cluster Management project */

import {
    createResource,
    ManagedClusterSet,
    ManagedClusterSetApiVersion,
    ManagedClusterSetKind,
} from '../../../../../resources'
import {
    AcmAlertContext,
    AcmAlertGroup,
    AcmButton,
    AcmForm,
    AcmModal,
    AcmSubmit,
    AcmTextInput,
} from '@open-cluster-management/ui-components'
import { ActionGroup, ModalVariant } from '@patternfly/react-core'
import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { NavigationPath } from '../../../../../NavigationPath'

function getEmptySet() {
    return {
        apiVersion: ManagedClusterSetApiVersion,
        kind: ManagedClusterSetKind,
        metadata: {
            name: '',
        },
        spec: {},
    } as ManagedClusterSet
}

export function CreateClusterSetModal(props: { isOpen: boolean; onClose: () => void }) {
    const { t } = useTranslation()
    const history = useHistory()

    const [created, setCreated] = useState<boolean>()
    const [managedClusterSet, setManagedClusterSet] = useState<ManagedClusterSet>(getEmptySet())

    function reset() {
        setManagedClusterSet(getEmptySet())
        setCreated(false)
        props.onClose?.()
    }

    return (
        <AcmModal
            variant={ModalVariant.medium}
            title={!created ? t('Create cluster set') : t('Cluster set successfully created')}
            titleIconVariant={!created ? undefined : 'success'}
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
                                        i18nKey="Creating a <bold>ManagedClusterSet</bold> will allow you to group resources and manage access control to all of the resources in the group together. You will be able to manage the resource assignments for access control after creating the cluster set."
                                        components={{ bold: <strong /> }}
                                    />
                                </div>
                                <AcmTextInput
                                    id="clusterSetName"
                                    label={t('Cluster set name')}
                                    placeholder={t('Enter cluster set name')}
                                    value={managedClusterSet.metadata.name}
                                    isRequired
                                    onChange={(name) => {
                                        const copy = { ...managedClusterSet }
                                        copy.metadata.name = name
                                        setManagedClusterSet(copy)
                                    }}
                                />

                                <AcmAlertGroup isInline canClose />
                                <ActionGroup>
                                    <AcmSubmit
                                        id="submit"
                                        variant="primary"
                                        label={t('Create')}
                                        processingLabel={t('Creating')}
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
                                        {t('Cancel')}
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
                            i18nKey="<bold>{{clusterSetName}}</bold> was successfully created. Click the <bold>Manage resource assignments</bold> button to assign resources to this cluster set."
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
                            {t('Manage resource assignments')}
                        </AcmButton>
                        <AcmButton variant="link" onClick={reset}>
                            {t('Close')}
                        </AcmButton>
                    </ActionGroup>
                </>
            )}
        </AcmModal>
    )
}
