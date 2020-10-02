import { Page } from '@patternfly/react-core'
import { ICell, sortable } from '@patternfly/react-table'
import React, { useState } from 'react'
import { useHistory } from 'react-router-dom'
import { AcmPageCard } from '../../../components/AcmPage'
import { ClosedConfirmModalProps, ConfirmModal, IConfirmModalProps } from '../../../components/ConfirmModal'
import { EmptyPage } from '../../../components/EmptyPage'
import { ErrorPage } from '../../../components/ErrorPage'
import { compareStrings, AcmTable } from '../../../components/AcmTable'
import { LoadingPage } from '../../../components/LoadingPage'
import { client } from '../../../lib/apollo-client'
import {
    ProviderConnection,
    Secret,
    useDeleteProviderConnectionMutation,
    useProviderConnectionsQuery,
} from '../../../sdk'
import { ClusterManagementPageHeader, NavigationPath } from '../ClusterManagement'
import { getProviderByKey, ProviderID } from '../../../lib/providers'

export function ProviderConnectionsPage() {
    return (
        <Page>
            <ClusterManagementPageHeader />
            <ProviderConnectionsPageContent />
        </Page>
    )
}

export function ProviderConnectionsPageContent() {
    const { loading, error, data, refetch } = useProviderConnectionsQuery({
        client,
        pollInterval: 10 * 1000,
    })
    if (loading) {
        return <LoadingPage />
    } else if (error) {
        return <ErrorPage error={error} />
    } else if (!data?.providerConnections || data.providerConnections.length === 0) {
        return (
            <EmptyPage
                title="No provider connections found."
                message="Your cluster does not contain any provider connections."
                action="Create connection"
            />
        )
    }
    return (
        <ProviderConnectionsTable
            providerConnections={data.providerConnections as ProviderConnection[]}
            refetch={refetch}
        ></ProviderConnectionsTable>
    )
}

function getProvider(labels: string[]) {
    const label = labels.find((label) => label.startsWith('cluster.open-cluster-management.io/provider='))
    let providerID = label ? label.substr('cluster.open-cluster-management.io/provider='.length) : ''
    const provider = getProviderByKey(providerID as ProviderID)
    return provider.name
}

export function ProviderConnectionsTable(props: { providerConnections: ProviderConnection[]; refetch: () => {} }) {
    const columns: ICell[] = [
        { title: 'Name', transforms: [sortable] },
        { title: 'Provider', transforms: [sortable] },
        { title: 'Namespace', transforms: [sortable] },
    ]
    function sortFn(providerConnections: ProviderConnection[], column: number) {
        switch (column) {
            case 1:
                return providerConnections.sort((a, b) =>
                    a.metadata.name < b.metadata.name ? -1 : a.metadata.name > b.metadata.name ? 1 : 0
                )
            case 2:
                return providerConnections.sort((a, b) =>
                    compareStrings(getProvider(a.metadata.labels), getProvider(b.metadata.labels))
                )
            case 3:
                return providerConnections.sort((a, b) => compareStrings(a.metadata.namespace, b.metadata.namespace))
        }
        return providerConnections.sort((a, b) =>
            a.metadata.name < b.metadata.name ? -1 : a.metadata.name > b.metadata.name ? 1 : 0
        )
    }
    function keyFn(secret: Secret) {
        return secret.metadata.uid
    }
    function cellsFn(secret: Secret) {
        return [
            <div>{secret.metadata.name}</div>,
            <div>{getProvider(secret.metadata.labels)}</div>,
            <div>{secret.metadata.namespace}</div>,
        ]
    }

    const [deleteProviderConnection] = useDeleteProviderConnectionMutation({ client })

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
                searchKeys={['metadata.name']}
                columns={columns}
                sortFn={sortFn}
                keyFn={keyFn}
                cellsFn={cellsFn}
                tableActions={[
                    {
                        id: 'addConnenction',
                        title: 'Add connection',
                        click: () => {
                            history.push(NavigationPath.addConnection)
                        },
                    },
                ]}
                bulkActions={[{ id: 'deleteConnenction', title: 'Delete connections', click: (items: Secret[]) => {} }]}
                rowActions={[
                    { id: 'editConnenction', title: 'Edit connection', click: (item: Secret) => {} },
                    {
                        id: 'deleteConnenction',
                        title: 'Delete connection',
                        click: (secret: Secret) => {
                            setConfirm({
                                title: 'Delete provider connection',
                                message: `You are about to delete ${secret.metadata.name}. The provider connection will no longer be available for creating new clusters, but clusters that were previously created using the connection are not affected. This action is irreversible.`,
                                open: true,
                                confirm: () => {
                                    deleteProviderConnection({
                                        variables: {
                                            name: secret.metadata.name,
                                            namespace: secret.metadata.namespace as string,
                                        },
                                    }).then(() => {
                                        props.refetch()
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
