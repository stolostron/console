import {
    AcmAlert,
    AcmAlertGroup,
    AcmButton,
    AcmEmptyState,
    AcmPageCard,
    AcmTable,
    AcmInlineProvider,
    Provider,
    compareStrings,
} from '@open-cluster-management/ui-components'
import { AlertActionCloseButton, AlertVariant, Page } from '@patternfly/react-core'
import React, { Fragment, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { ClosedConfirmModalProps, ConfirmModal, IConfirmModalProps } from '../../../components/ConfirmModal'
import { ErrorState } from '../../../components/ErrorPage'
import { deleteResources } from '../../../lib/delete-resources'
import { getProviderByKey, ProviderID } from '../../../lib/providers'
import { deleteResource } from '../../../lib/resource-request'
import { useQuery } from '../../../lib/useQuery'
import { NavigationPath } from '../../../NavigationPath'
import { listProviderConnections, ProviderConnection } from '../../../resources/provider-connection'
import { usePageContext } from '../../ClusterManagement/ClusterManagement'

export default function ProviderConnectionsPage() {
    return (
        <Page>
            <AcmPageCard>
                <ProviderConnectionsPageContent />
            </AcmPageCard>
        </Page>
    )
}

// Ingoring coverage since this will move one the console header navigation is done
/* istanbul ignore next */
const AddConnectionBtn = () => {
    const { t } = useTranslation(['connection'])
    const { push } = useHistory()
    return (
        <AcmButton component="a" href="#" onClick={() => push(NavigationPath.addConnection)}>
            {t('add')}
        </AcmButton>
    )
}

export function ProviderConnectionsPageContent() {
    const { error, data, startPolling, refresh } = useQuery(listProviderConnections)
    useEffect(startPolling, [startPolling])
    usePageContext(data !== undefined && !!data, AddConnectionBtn)
    if (error) return <ErrorState error={error} />
    return <ProviderConnectionsTable providerConnections={data} refresh={refresh} />
}

function getProvider(labels: Record<string, string> | undefined) {
    const label = labels?.['cluster.open-cluster-management.io/provider']
    const provider = getProviderByKey(label as ProviderID)
    return provider.name
}

export function ProviderConnectionsTable(props: { providerConnections?: ProviderConnection[]; refresh: () => void }) {
    const { t } = useTranslation(['connection', 'common'])
    const [confirm, setConfirm] = useState<IConfirmModalProps>(ClosedConfirmModalProps)
    const [errors, setErrors] = useState<string[]>([])
    const history = useHistory()
    return (
        <Fragment>
            {errors && (
                <AcmAlertGroup>
                    {errors.map((error, index) => (
                        <AcmAlert
                            isInline
                            isLiveRegion
                            variant={AlertVariant.danger}
                            title={error}
                            key={index.toString()}
                            actionClose={
                                <AlertActionCloseButton
                                    title={error}
                                    variantLabel={`${AlertVariant.danger} alert`}
                                    onClose={
                                        /* istanbul ignore next */ () =>
                                            setErrors([...errors.filter((e) => e !== error)])
                                    }
                                />
                            }
                        />
                    ))}
                </AcmAlertGroup>
            )}
            <ConfirmModal
                open={confirm.open}
                confirm={confirm.confirm}
                cancel={confirm.cancel}
                title={confirm.title}
                message={confirm.message}
            ></ConfirmModal>
            <AcmTable<ProviderConnection>
                emptyState={<AcmEmptyState title={t('empty.title')} />}
                plural="connections"
                items={props.providerConnections}
                columns={[
                    {
                        header: t('table.header.name'),
                        sort: 'metadata.name',
                        search: 'metadata.name',
                        cell: 'metadata.name',
                    },
                    {
                        header: t('table.header.provider'),
                        sort: /* istanbul ignore next */ (a: ProviderConnection, b: ProviderConnection) => {
                            return compareStrings(getProvider(a.metadata?.labels), getProvider(b.metadata?.labels))
                        },
                        cell: (item: ProviderConnection) => {
                            const label = item.metadata.labels?.['cluster.open-cluster-management.io/provider']
                            let provider
                            switch(label) {
                            case ProviderID.GCP:
                                provider = Provider.gcp
                                break
                            case ProviderID.AWS:
                                provider = Provider.aws
                                break
                            case ProviderID.AZR:
                                provider = Provider.azure
                                break
                            case ProviderID.VMW:
                                provider = Provider.vmware
                                break
                            case ProviderID.BMC:
                                provider = Provider.baremetal
                                break
                            case ProviderID.CRH:
                                provider = Provider.redhatcloud
                                break
                            case ProviderID.UKN:
                            default:
                                provider = Provider.other
                            }
                            return <AcmInlineProvider provider={provider} />
                        },
                        search: (item: ProviderConnection) => {
                            return getProvider(item.metadata?.labels)
                        },
                    },
                    {
                        header: t('table.header.namespace'),
                        sort: 'metadata.namespace',
                        search: 'metadata.namespace',
                        cell: 'metadata.namespace',
                    },
                ]}
                keyFn={(providerConnection) => {
                    return providerConnection.metadata?.uid as string
                }}
                tableActions={[]}
                bulkActions={[
                    {
                        id: 'deleteConnection',
                        title: 'Delete connections',
                        click: (providerConnections: ProviderConnection[]) => {
                            setConfirm({
                                title: t('modal.delete.title'),
                                message: `You are about to delete ${providerConnections.length} provider connections. The provider connections will no longer be available for creating new clusters, but clusters that were previously created using the connections are not affected. This action is irreversible.`,
                                open: true,
                                confirm: async () => {
                                    const promiseResults = await deleteResources(providerConnections).promise
                                    const resultErrors: string[] = []
                                    for (let index = 0; index < promiseResults.length; index++) {
                                        const promiseResult = promiseResults[index]
                                        if (promiseResult.status === 'rejected') {
                                            resultErrors.push(
                                                `Failed to delete provider connection named ${providerConnections[index].metadata.name}`
                                            )
                                        }
                                    }
                                    setErrors([...errors, ...resultErrors])
                                    props.refresh()
                                    setConfirm(ClosedConfirmModalProps)
                                },
                                cancel: () => {
                                    setConfirm(ClosedConfirmModalProps)
                                },
                            })
                        },
                    },
                ]}
                rowActions={[
                    {
                        id: 'editConnection',
                        title: t('edit'),
                        click: (providerConnection: ProviderConnection) => {
                            history.push(
                                NavigationPath.editConnection
                                    .replace(':namespace', providerConnection.metadata.namespace!)
                                    .replace(':name', providerConnection.metadata.name!)
                            )
                        },
                    },
                    {
                        id: 'deleteConnection',
                        title: t('delete'),
                        click: (providerConnection: ProviderConnection) => {
                            setConfirm({
                                title: t('modal.delete.title'),
                                message: `You are about to delete ${providerConnection.metadata?.name}. The provider connection will no longer be available for creating new clusters, but clusters that were previously created using the connection are not affected. This action is irreversible.`,
                                open: true,
                                confirm: () => {
                                    deleteResource(providerConnection)
                                        .promise.then(props.refresh)
                                        .catch(() => {
                                            setErrors([
                                                ...errors,
                                                `Failed to delete provider connection named ${providerConnection.metadata.name}`,
                                            ])
                                        })
                                    setConfirm(ClosedConfirmModalProps)
                                },
                                cancel: () => {
                                    setConfirm(ClosedConfirmModalProps)
                                },
                            })
                        },
                    },
                ]}
            />
        </Fragment>
    )
}
