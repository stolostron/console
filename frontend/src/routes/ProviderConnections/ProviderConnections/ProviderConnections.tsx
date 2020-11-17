import {
    AcmEmptyState,
    AcmPageCard,
    AcmTable,
    AcmTableLoading,
    compareStrings,
    IAcmTableColumn,
} from '@open-cluster-management/ui-components'
import { Button, Page, Spinner } from '@patternfly/react-core'
import React, { Fragment, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { ClosedConfirmModalProps, ConfirmModal, IConfirmModalProps } from '../../../components/ConfirmModal'
import { getProviderByKey, ProviderID } from '../../../lib/providers'
import { deleteResource, IRequestResult } from '../../../lib/resource-request'
import { useQuery } from '../../../lib/useQuery'
import { NavigationPath } from '../../../NavigationPath'
import { listProviderConnections, ProviderConnection } from '../../../resources/provider-connection'

export default function ProviderConnectionsPage() {
    return (
        <Page>
            <AcmPageCard>
                <ProviderConnectionsPageContent />
            </AcmPageCard>
        </Page>
    )
}

export function ProviderConnectionsPageContent() {
    const { loading, error, data, startPolling, refresh } = useQuery(listProviderConnections)
    const { t } = useTranslation(['connection'])
    const history = useHistory()

    useEffect(startPolling, [startPolling])

    if (error) {
        return <AcmEmptyState title={'Error'} message={error.message} showIcon={false} />
    } else if (loading) {
        return (
            <div
                style={{
                    minHeight: '588px',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Spinner size="xl" />
            </div>
        )
    } else if (!data || data.length === 0) {
        return (
            <AcmEmptyState
                title={t('empty.title')}
                message={t('empty.subtitle')}
                action={
                    <Button
                        onClick={() => {
                            history.push(NavigationPath.addConnection)
                        }}
                        component="a"
                    >
                        {t('add')}
                    </Button>
                }
            />
        )
    }
    return <ProviderConnectionsTable providerConnections={data} refresh={refresh} deleteConnection={deleteResource} />
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
                tableActions={[
                    {
                        id: 'addConnection',
                        title: t('add'),
                        click: () => {
                            history.push(NavigationPath.addConnection)
                        },
                    },
                ]}
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
