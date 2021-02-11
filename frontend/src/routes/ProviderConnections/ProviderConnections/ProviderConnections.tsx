import {
    AcmAlertContext,
    AcmAlertGroup,
    AcmAlertProvider,
    AcmButton,
    AcmDropdown,
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
import { useHistory } from 'react-router-dom'
import { BulkActionModel, IBulkActionModelProps } from '../../../components/BulkActionModel'
import { getErrorInfo } from '../../../components/ErrorPage'
import { getProviderByKey, ProviderID } from '../../../lib/providers'
import { deleteResource } from '../../../lib/resource-request'
import { useQuery } from '../../../lib/useQuery'
import { NavigationPath } from '../../../NavigationPath'
import { listProviderConnections, ProviderConnection } from '../../../resources/provider-connection'
import {
    createSubjectAccessReviews,
    ProviderConnectionsTableActionsRbac,
    rbacMapping,
} from '../../../resources/self-subject-access-review'
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
        <AcmButton component="a" to={NavigationPath.addConnection}>
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
    const defaultTableRbacValues: ProviderConnectionsTableActionsRbac = {
        'secret.edit': false,
        'secret.delete': false,
    }
    const [tableActionRbacValues, setTableActionRbacValues] = useState<ProviderConnectionsTableActionsRbac>(
        defaultTableRbacValues
    )
    const [isOpen, setIsOpen] = useState<boolean>(false)
    const [abortRbacCheck, setRbacAborts] = useState<Function[]>()
    const history = useHistory()

    const [modalProps, setModalProps] = useState<IBulkActionModelProps<ProviderConnection> | { open: false }>({
        open: false,
    })

    function abortRbacPromises() {
        abortRbacCheck?.forEach((abort) => abort())
    }

    function checkRbacAccess(connection: ProviderConnection) {
        let currentRbacValues = { ...defaultTableRbacValues }
        let abortArray: Array<Function> = []

        Object.keys(currentRbacValues).forEach((action) => {
            const request = createSubjectAccessReviews(
                rbacMapping(action, connection.metadata.name, connection.metadata.namespace)
            )
            request.promise
                .then((results) => {
                    if (results) {
                        let rbacQueryResults: boolean[] = []
                        results.forEach((result) => {
                            if (result.status === 'fulfilled') {
                                rbacQueryResults.push(result.value.status?.allowed!)
                            }
                        })
                        if (!rbacQueryResults.includes(false)) {
                            setTableActionRbacValues((current) => {
                                return { ...current, ...{ [action]: true } }
                            })
                        }
                    }
                })
                .catch((err) => console.error(err))
            abortArray.push(request.abort)
        })
        setRbacAborts(abortArray)
    }

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
                            const onSelect = (id: string) => {
                                const action = actions.find((a) => a.id === id)
                                return action?.click(providerConnection)
                            }
                            let actions = [
                                {
                                    id: 'editConnection',
                                    text: t('edit'),
                                    isDisabled: !tableActionRbacValues['secret.edit'],
                                    tooltip: !tableActionRbacValues['secret.edit'] ? t('common:rbac.unauthorized') : '',
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
                                    text: t('delete'),
                                    isDisabled: !tableActionRbacValues['secret.delete'],
                                    tooltip: !tableActionRbacValues['secret.delete']
                                        ? t('common:rbac.unauthorized')
                                        : '',
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
                                },
                            ]
                            return (
                                <AcmDropdown
                                    id={`${providerConnection.metadata.name}-actions`}
                                    onSelect={onSelect}
                                    text={t('actions')}
                                    dropdownItems={actions}
                                    isKebab={true}
                                    isPlain={true}
                                    onToggle={() => {
                                        if (!isOpen) checkRbacAccess(providerConnection)
                                        else {
                                            abortRbacPromises()
                                            setTableActionRbacValues(defaultTableRbacValues)
                                            setIsOpen(!isOpen)
                                        }
                                    }}
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
