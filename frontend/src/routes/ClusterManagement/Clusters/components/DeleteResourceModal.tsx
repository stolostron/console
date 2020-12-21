import {
    AcmAlertGroup,
    AcmAlertProvider,
    AcmForm,
    AcmModal,
    AcmSubmit,
    AcmAlertContext,
    IAlertContext,
    AcmTable,
} from '@open-cluster-management/ui-components'
import { ActionGroup, Button, ModalVariant } from '@patternfly/react-core'
import React, { useContext } from 'react'
import { useTranslation } from 'react-i18next'

import { IResource } from '../../../../resources/resource'
import { ManagedClusterKind } from '../../../../resources/managed-cluster'
import { ManagedClusterInfoApiVersion } from '../../../../resources/managed-cluster-info'
import { deleteClusters } from '../../../../lib/delete-cluster'
import { Cluster } from '../../../../lib/get-cluster'

export interface IDeleteModalProps {
    resources: Array<IResource> | undefined
    action: string
    close: () => void
    title: string
    plural: string
    description: string
}

export const ClosedDeleteModalProps: IDeleteModalProps = {
    resources: undefined,
    action: '',
    close: () => {},
    title: 'CLOSED',
    plural: '',
    description: '',
}

export function DeleteResourceModal(props: {
    resources: Array<IResource>
    action: string
    close: () => void
    title: string
    plural: string
    description: string
}) {
    const { t } = useTranslation(['cluster', 'common'])
    const alertContext = useContext(AcmAlertContext)

    return (
        <AcmModal
            variant={ModalVariant.medium}
            title={props.title}
            isOpen={props.resources !== undefined}
            onClose={props.close}
        >
            <AcmAlertProvider>
                <AcmForm style={{ gap: 0 }}>
                    <div>{props.description ? props.description : undefined}</div>
                    <AcmTable<IResource>
                        plural={props.plural}
                        items={props.resources}
                        columns={[
                            {
                                header: t(props.plural),
                                cell: 'metadata.name',
                                sort: 'metadata.name',
                            },
                        ]}
                        keyFn={(resource: IResource) => resource.metadata.name!}
                        tableActions={[]}
                        rowActions={[]}
                        bulkActions={[]}
                    />
                    <AcmAlertGroup isInline canClose />
                    <ActionGroup>
                        <AcmSubmit
                            id="delete-resource"
                            variant="primary"
                            onClick={async () => {
                                alertContext.clearAlerts()

                                switch (props.plural) {
                                    case 'clusters':
                                        if (props.action === 'detach') {
                                            await detachManagedClusterResource(props.resources, alertContext)
                                        } else {
                                            await destroyManagedClusterResource(props.resources, alertContext)
                                        }
                                }
                                props.close()
                            }}
                            label={t(`modal.${props.action}.action`)}
                            processingLabel={t(`modal.${props.action}.processing`)}
                        />
                        <Button variant="link" onClick={props.close}>
                            {t('common:cancel')}
                        </Button>
                    </ActionGroup>
                </AcmForm>
            </AcmAlertProvider>
        </AcmModal>
    )
}

export function getIResourceClusters(clusters: Array<Cluster>) {
    return clusters.map((cluster) => {
        return {
            apiVersion: ManagedClusterInfoApiVersion,
            kind: ManagedClusterKind,
            metadata: {
                name: cluster.name,
                namespace: cluster.namespace,
            },
        } as IResource
    })
}

export async function detachManagedClusterResource(clusters: Array<IResource>, alertContext: IAlertContext) {
    const clusterNames = clusters.map((cluster) => cluster.metadata.name) as Array<string>
    return deleteClusters(clusterNames, false)
        .promise.catch((err) => {
            alertContext.addAlert({
                type: 'danger',
                title: 'Detach error',
                message: 'Encountered error: ' + err,
            })
        })
        .then((results) => {
            const resultErrors: string[] = []
            let i = 0
            if (results) {
                results.forEach((result) => {
                    if (result.status === 'rejected') {
                        resultErrors.push(`Failed to detach managed cluster. ${result.reason}`)
                    } else {
                        result.value.forEach((result) => {
                            if (result.status === 'rejected') {
                                alertContext.addAlert({
                                    type: 'danger',
                                    title: 'detach error',
                                    message: `Failed to detach managed cluster ${clusterNames[i]}. ${result.reason}`,
                                })
                            }
                        })
                        i++
                    }
                })
            }
        })
}

export async function destroyManagedClusterResource(clusters: Array<IResource>, alertContext: IAlertContext) {
    const clusterNames = clusters.map((cluster) => cluster.metadata.name) as Array<string>
    return deleteClusters(clusterNames, true)
        .promise.catch((err) => {
            alertContext.addAlert({
                type: 'danger',
                title: 'Destroy error',
                message: 'Encountered error: ' + err,
            })
        })
        .then((results) => {
            if (results) {
                const resultErrors: string[] = []
                let i = 0
                results.forEach((result) => {
                    if (result.status === 'rejected') {
                        resultErrors.push(`Failed to destroy managed cluster. ${result.reason}`)
                    } else {
                        result.value.forEach((result) => {
                            if (result.status === 'rejected') {
                                alertContext.addAlert({
                                    type: 'danger',
                                    title: 'Destroy error',
                                    message: `Failed to destroy managed cluster ${clusterNames[i]}. ${result.reason}`,
                                })
                            }
                        })
                        i++
                    }
                })
            }
        })
}

// TODO: add support for BMA, provider connections?
