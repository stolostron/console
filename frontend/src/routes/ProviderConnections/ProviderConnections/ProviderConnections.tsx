import {
    AcmAlertContext,
    AcmAlertGroup,
    AcmAlertProvider,
    AcmButton,
    AcmEmptyState,
    AcmInlineProvider,
    AcmPageCard,
    AcmTable,
    AcmTablePaginationContextProvider,
    compareStrings,
    Provider,
    AcmErrorBoundary,
} from '@open-cluster-management/ui-components'
import React, { Fragment, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory, Link } from 'react-router-dom'
import { BulkActionModel, IBulkActionModelProps } from '../../../components/BulkActionModel'
import { getErrorInfo } from '../../../components/ErrorPage'
import { RbacDropdown } from '../../../components/RbacDropdown'
import { getProviderByKey, ProviderID } from '../../../lib/providers'
import { deleteResource } from '../../../lib/resource-request'
import { useQuery } from '../../../lib/useQuery'
import { NavigationPath } from '../../../NavigationPath'
import { listProviderConnections, ProviderConnection } from '../../../resources/provider-connection'
import { usePageContext } from '../../ClusterManagement/ClusterManagement'

export default function ProviderConnectionsPage() {
    return (
        <AcmErrorBoundary>
            <AcmAlertProvider>
                <AcmAlertGroup isInline canClose alertMargin="24px 24px 0px 24px" />
                <AcmPageCard>
                    <AcmTablePaginationContextProvider localStorageKey="table-provider-connections">
                        <ProviderConnectionsPageContent />
                    </AcmTablePaginationContextProvider>
                </AcmPageCard>
            </AcmAlertProvider>
        </AcmErrorBoundary>
    )
}

// Ingoring coverage since this will move one the console header navigation is done
/* istanbul ignore next */
const AddConnectionBtn = () => {
    const { t } = useTranslation(['connection'])
    return (
        <AcmButton component={Link} to={NavigationPath.addConnection}>
            {t('add')}
        </AcmButton>
    )
}

let lastData: ProviderConnection[] | undefined
let lastTime: number = 0

export function ProviderConnectionsPageContent() {
    const alertContext = useContext(AcmAlertContext)
    const { error, data, startPolling, refresh } = useQuery(
        listProviderConnections,
        Date.now() - lastTime < 5 * 60 * 1000 ? lastData : undefined
    )
    useEffect(() => {
        if (process.env.NODE_ENV !== 'test') {
            lastData = data
            lastTime = Date.now()
        }
    }, [data])
    useEffect(startPolling, [startPolling])
    usePageContext(data !== undefined && data.length > 0, AddConnectionBtn)
    useEffect(() => {
        alertContext.clearAlerts()
        if (error) {
            alertContext.addAlert(getErrorInfo(error))
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [error])

    return <ProviderConnectionsTable providerConnections={data} refresh={refresh} />
}

function getProvider(labels: Record<string, string> | undefined) {
    const label = labels?.['cluster.open-cluster-management.io/provider']
    const provider = getProviderByKey(label as ProviderID)
    return provider.name
}

export function ProviderConnectionsTable(props: { providerConnections?: ProviderConnection[]; refresh: () => void }) {
    const { t } = useTranslation(['connection', 'common'])
    const history = useHistory()
    const [modalProps, setModalProps] = useState<IBulkActionModelProps<ProviderConnection> | { open: false }>({
        open: false,
    })

    return (
        <Fragment>
            <BulkActionModel<ProviderConnection> {...modalProps} />
            <AcmTable<ProviderConnection>
                emptyState={
                    <AcmEmptyState
                        title={t('empty.title')}
                        message={t('empty.subtitle')}
                        action={<AddConnectionBtn />}
                    />
                }
                plural={t('connections')}
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
                            switch (label) {
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
                    {
                        header: '',
                        cell: (providerConnection: ProviderConnection) => {
                            const actions = [
                                {
                                    id: 'editConnection',
                                    text: t('edit'),
                                    isDisabled: true,
                                    click: (providerConnection: ProviderConnection) => {
                                        history.push(
                                            NavigationPath.editConnection
                                                .replace(':namespace', providerConnection.metadata.namespace!)
                                                .replace(':name', providerConnection.metadata.name!)
                                        )
                                    },
                                    rbac: [
                                        {
                                            name: providerConnection.metadata.name,
                                            namespace: providerConnection.metadata.namespace,
                                            resource: 'secrets',
                                            verb: 'patch',
                                        },
                                    ],
                                },
                                {
                                    id: 'deleteConnection',
                                    text: t('delete'),
                                    isDisabled: true,
                                    click: (providerConnection: ProviderConnection) => {
                                        setModalProps({
                                            open: true,
                                            singular: t('connection'),
                                            plural: t('connections'),
                                            action: t('common:delete'),
                                            processing: t('common:deleting'),
                                            resources: [providerConnection],
                                            description: t('modal.delete.content.batch'),
                                            columns: [
                                                {
                                                    header: t('table.header.name'),
                                                    cell: 'metadata.name',
                                                    sort: 'metadata.name',
                                                },
                                                {
                                                    header: t('table.header.namespace'),
                                                    cell: 'metadata.namespace',
                                                    sort: 'metadata.namespace',
                                                },
                                            ],
                                            keyFn: (providerConnection: ProviderConnection) =>
                                                providerConnection.metadata.uid as string,
                                            actionFn: (providerConnection: ProviderConnection) =>
                                                deleteResource(providerConnection),
                                            close: () => {
                                                setModalProps({ open: false })
                                                props.refresh()
                                            },
                                            isDanger: true,
                                        })
                                    },
                                    rbac: [
                                        {
                                            name: providerConnection.metadata.name,
                                            namespace: providerConnection.metadata.namespace,
                                            resource: 'secrets',
                                            verb: 'delete',
                                        },
                                    ],
                                },
                            ]

                            return (
                                <RbacDropdown<ProviderConnection>
                                    id={`${providerConnection.metadata.name}-actions`}
                                    item={providerConnection}
                                    isKebab={true}
                                    text={`${providerConnection.metadata.name}-actions`}
                                    actions={actions}
                                />
                            )
                        },
                    },
                ]}
                keyFn={(providerConnection) => providerConnection.metadata?.uid as string}
                tableActions={[]}
                bulkActions={[
                    {
                        id: 'deleteConnection',
                        title: t('delete.batch'),
                        click: (providerConnections: ProviderConnection[]) => {
                            setModalProps({
                                open: true,
                                singular: t('connection'),
                                plural: t('connections'),
                                action: t('common:delete'),
                                processing: t('common:deleting'),
                                resources: [...providerConnections],
                                description: t('modal.delete.content.batch'),
                                columns: [
                                    {
                                        header: t('table.header.name'),
                                        cell: 'metadata.name',
                                        sort: 'metadata.name',
                                    },
                                    {
                                        header: t('table.header.namespace'),
                                        cell: 'metadata.namespace',
                                        sort: 'metadata.namespace',
                                    },
                                ],
                                keyFn: (providerConnection: ProviderConnection) =>
                                    providerConnection.metadata.uid as string,
                                actionFn: (providerConnection: ProviderConnection) =>
                                    deleteResource(providerConnection),
                                close: () => {
                                    setModalProps({ open: false })
                                    props.refresh()
                                },
                                isDanger: true,
                            })
                        },
                    },
                ]}
                rowActions={[]}
            />
        </Fragment>
    )
}
