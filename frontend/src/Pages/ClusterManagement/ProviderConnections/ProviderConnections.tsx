import {
    AcmEmptyState,
    AcmLoadingPage,
    AcmPageCard,
    AcmTable,
    compareStrings,
    IAcmTableColumn,
} from '@open-cluster-management/ui-components'
import { Page } from '@patternfly/react-core'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { ClosedConfirmModalProps, ConfirmModal, IConfirmModalProps } from '../../../components/ConfirmModal'
import { ErrorPage } from '../../../components/ErrorPage'
import { ProviderConnection, ProviderConnections, providerConnections } from '../../../lib/ProviderConnection'
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
    const { t } = useTranslation(['connection'])

    useEffect(() => {
        startPolling(5 * 1000)
        return stopPolling
    }, [startPolling, stopPolling, refresh])

    if (loading) {
        return <AcmLoadingPage />
    } else if (error) {
        return <ErrorPage error={error} />
    } else if (!data?.items || data.items.length === 0) {
        return (
            <AcmPageCard>
                <AcmEmptyState title={t('empty.title')} message={t('empty.subtitle')} action={t('add')} />
            </AcmPageCard>
        )
    }

    // const { loading, error, data, startPolling, stopPolling, refresh } = DeleteProviderConnection()

    return (
        <ProviderConnectionsTable
            providerConnections={data.items}
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
    const { t } = useTranslation(['connection', 'common'])
    const columns: IAcmTableColumn<ProviderConnection>[] = [
        {
            header: t('table.header.name'),
            sort: 'metadata.name',
            search: 'metadata.name',
            cell: 'metadata.name',
        },
        {
            header: t('table.header.provider'),
            sort: (a: ProviderConnection, b: ProviderConnection) => {
                return compareStrings(getProvider(a.metadata?.labels), getProvider(b.metadata?.labels))
            },
            cell: (item: ProviderConnection) => {
                return getProvider(item.metadata?.labels)
            },
        },
        {
            header: t('table.header.namespace'),
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
                        title: t('add'),
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
                        title: t('delete'),
                        click: (providerConnection: ProviderConnection) => {
                            setConfirm({
                                title: t('modal.delete.title'),
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
                emptyState={{
                    title: 'TODO',
                    message: 'TODO',
                }}
            />
        </AcmPageCard>
    )
}
