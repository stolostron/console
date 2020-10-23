import {
    AcmEmptyPage,
    AcmLoadingPage,
    AcmPageCard,
    AcmTable,
    compareStrings,
    IAcmTableColumn,
} from '@open-cluster-management/ui-components'
import { Page } from '@patternfly/react-core'
import React, { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { ClosedConfirmModalProps, ConfirmModal, IConfirmModalProps } from '../../../components/ConfirmModal'
import { ErrorPage } from '../../../components/ErrorPage'
import { ProviderConnections, ProviderConnection, providerConnections } from '../../../lib/ProviderConnection'
import { getProviderByKey, ProviderID } from '../../../lib/providers'
import { ClusterManagementPageHeader, NavigationPath } from '../ClusterManagement'

export function ProviderConnectionsPage() {
    return (
        <Page>
            <ClusterManagementPageHeader />
            <ProviderConnectionsPageContent />
        </Page>
    )
}

export function ProviderConnectionsPageContent() {
    const { loading, error, data, startPolling, stopPolling, refresh } = ProviderConnections()

    useEffect(refresh, [refresh])
    useEffect(() => {
        startPolling(5 * 1000)
        return stopPolling
    }, [startPolling, stopPolling, refresh])

    if (loading) {
        return <AcmLoadingPage />
    } else if (error) {
        return <ErrorPage error={error} />
    } else if (!data || data.length === 0) {
        return (
            <AcmEmptyPage
                title="No provider connections found."
                message="Your cluster does not contain any provider connections."
                action="Create connection"
            />
        )
    }

    // const { loading, error, data, startPolling, stopPolling, refresh } = DeleteProviderConnection()

    return (
        <ProviderConnectionsTable
            providerConnections={data}
            refresh={refresh}
            deleteConnection={providerConnections.delete}
        />
    )
}

function getProvider(labels: Record<string, string> | undefined) {
    const label = labels?.['cluster.open-cluster-management.io/provider']
    const provider = getProviderByKey(label as ProviderID)
    return provider.name
}

export function ProviderConnectionsTable(props: {
    providerConnections: ProviderConnection[]
    refresh: () => void
    deleteConnection: (name?: string, namespace?: string) => Promise<unknown>
}) {
    const columns: IAcmTableColumn<ProviderConnection>[] = [
        {
            header: 'Name',
            sort: 'metadata.name',
            search: 'metadata.name',
            cell: 'metadata.name',
        },
        {
            header: 'Provider',
            sort: (a: ProviderConnection, b: ProviderConnection) => {
                return compareStrings(getProvider(a.metadata?.labels), getProvider(b.metadata?.labels))
            },
            cell: (item: ProviderConnection) => {
                return getProvider(item.metadata?.labels)
            },
        },
        {
            header: 'Namespace',
            sort: 'metadata.namespace',
            search: 'metadata.namespace',
            cell: 'metadata.namespace',
        },
    ]
    function keyFn(providerConnection: ProviderConnection) {
        return providerConnection.metadata?.uid as string
    }

    // const [deleteProviderConnection] = useDeleteProviderConnectionMutation({ client })
    const [confirm, setConfirm] = useState<IConfirmModalProps>(ClosedConfirmModalProps)
    const history = useHistory()

    return (
        <AcmPageCard>
            <ConfirmModal
                open={confirm.open}
                confirm={confirm.confirm}
                cancel={confirm.cancel}
                title={confirm.title}
                message={confirm.message}
            ></ConfirmModal>
            <AcmTable<ProviderConnection>
                plural="connections"
                items={props.providerConnections}
                columns={columns}
                keyFn={keyFn}
                tableActions={[
                    {
                        id: 'addConnenction',
                        title: 'Add connection',
                        click: () => {
                            history.push(NavigationPath.addConnection)
                        },
                    },
                ]}
                bulkActions={[
                    {
                        id: 'deleteConnenction',
                        title: 'Delete connections',
                        click: (items: ProviderConnection[]) => {},
                    },
                ]}
                rowActions={[
                    { id: 'editConnenction', title: 'Edit connection', click: (item: ProviderConnection) => {} },
                    {
                        id: 'deleteConnenction',
                        title: 'Delete connection',
                        click: (providerConnection: ProviderConnection) => {
                            setConfirm({
                                title: 'Delete provider connection',
                                message: `You are about to delete ${providerConnection.metadata?.name}. The provider connection will no longer be available for creating new clusters, but clusters that were previously created using the connection are not affected. This action is irreversible.`,
                                open: true,
                                confirm: () => {
                                    props
                                        .deleteConnection(
                                            providerConnection.metadata?.name,
                                            providerConnection.metadata?.namespace
                                        )
                                        .then(() => {
                                            props.refresh()
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
        </AcmPageCard>
    )
}
