import {
    AcmEmptyState,
    AcmLoadingPage,
    AcmPageCard,
    AcmTable,
    AcmButton,
    compareStrings,
    IAcmTableColumn,
} from '@open-cluster-management/ui-components'
import { Page } from '@patternfly/react-core'
import React, { Fragment, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { NavigationPath } from '../../../NavigationPath'
import { ClosedConfirmModalProps, ConfirmModal, IConfirmModalProps } from '../../../components/ConfirmModal'
import { ErrorPage } from '../../../components/ErrorPage'
import { getProviderByKey, ProviderID } from '../../../lib/providers'
import { deleteResource, IRequestResult } from '../../../lib/resource-request'
import { useQuery } from '../../../lib/useQuery'
import { listProviderConnections, ProviderConnection } from '../../../resources/provider-connection'
import { usePageContext } from '../../ClusterManagement/ClusterManagement'

export default function ProviderConnectionsPage() {
    return (
        <Page>
            <ProviderConnectionsPageContent />
        </Page>
    )
}

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
    const { loading, error, data, startPolling, stopPolling, refresh } = useQuery(listProviderConnections)
    const { t } = useTranslation(['connection'])

    usePageContext(!loading && !!data, AddConnectionBtn)

    useEffect(() => {
        startPolling(5 * 1000)
        return stopPolling
    }, [startPolling, stopPolling])

    if (loading) {
        return <AcmLoadingPage />
    } else if (error) {
        return <ErrorPage error={error} />
    } else if (!data || data.length === 0) {
        return (
            <AcmPageCard>
                <AcmEmptyState
                    title={t('empty.title')}
                    message={t('empty.subtitle')}
                    action={<AddConnectionBtn />}
                />
            </AcmPageCard>
        )
    }

    // const { loading, error, data, startPolling, stopPolling, refresh } = DeleteProviderConnection()

    return (
        <AcmPageCard>
            <ProviderConnectionsTable providerConnections={data} refresh={refresh} deleteConnection={deleteResource} />
        </AcmPageCard>
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
    deleteConnection: (providerConnection: ProviderConnection) => IRequestResult
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
    ]
    function keyFn(providerConnection: ProviderConnection) {
        return providerConnection.metadata?.uid as string
    }

    // const [deleteProviderConnection] = useDeleteProviderConnectionMutation({ client })
    const [confirm, setConfirm] = useState<IConfirmModalProps>(ClosedConfirmModalProps)
    const history = useHistory()

    return (
        <Fragment>
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
                columns={columns}
                keyFn={keyFn}
                tableActions={[]}
                bulkActions={[
                    {
                        id: 'deleteConnection',
                        title: 'Delete connections',
                        click: (items: ProviderConnection[]) => {},
                    },
                ]}
                rowActions={[
                    { id: 'editConnection', title: 'Edit connection', click: (item: ProviderConnection) => {} },
                    {
                        id: 'deleteConnection',
                        title: t('delete'),
                        click: (providerConnection: ProviderConnection) => {
                            setConfirm({
                                title: t('modal.delete.title'),
                                message: `You are about to delete ${providerConnection.metadata?.name}. The provider connection will no longer be available for creating new clusters, but clusters that were previously created using the connection are not affected. This action is irreversible.`,
                                open: true,
                                confirm: () => {
                                    props
                                        .deleteConnection(providerConnection)
                                        .promise.then(() => {
                                            props.refresh()
                                        })
                                        .catch(() => {
                                            // TODO
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
