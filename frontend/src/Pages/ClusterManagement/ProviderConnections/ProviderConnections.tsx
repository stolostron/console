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
import { useTranslation, Trans } from 'react-i18next'
import { ClosedConfirmModalProps, ConfirmModal, IConfirmModalProps } from '../../../components/ConfirmModal'
import { ErrorPage } from '../../../components/ErrorPage'
import { client } from '../../../lib/apollo-client'
import { getProviderByKey, ProviderID } from '../../../lib/providers'
import {
    ProviderConnection,
    Secret,
    useDeleteProviderConnectionMutation,
    useProviderConnectionsQuery,
} from '../../../sdk'
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
    const { t } = useTranslation(['connection'])
    const { loading, error, data, refetch, stopPolling, startPolling } = useProviderConnectionsQuery({
        client,
    })
    useEffect(() => {
        refetch()
        startPolling(10 * 1000)
        return () => {
            stopPolling()
        }
    }, [refetch, startPolling, stopPolling])
    if (loading) {
        return <AcmLoadingPage />
    } else if (error) {
        return <ErrorPage error={error} />
    } else if (!data?.providerConnections || data.providerConnections.length === 0) {
        return (
            <AcmEmptyPage
                title={t('empty.title')}
                message={t('empty.subtitle')}
                action={t('add')}
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
                return compareStrings(getProvider(a.metadata.labels), getProvider(b.metadata.labels))
            },
            cell: (item: ProviderConnection) => {
                return getProvider(item.metadata.labels)
            },
        },
        {
            header: t('table.header.namespace'),
            sort: 'metadata.namespace',
            search: 'metadata.namespace',
            cell: 'metadata.namespace',
        },
    ]
    function keyFn(secret: Secret) {
        return secret.metadata.uid
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
                bulkActions={[{ id: 'deleteConnection', title: t('common:delete'), click: (items: Secret[]) => {} }]}
                rowActions={[
                    { id: 'editConnection', title: t('edit'), click: (item: Secret) => {} },
                    {
                        id: 'deleteConnection',
                        title: t('delete'),
                        click: (secret: Secret) => {
                            setConfirm({
                                title: t('modal.delete.title'),
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
