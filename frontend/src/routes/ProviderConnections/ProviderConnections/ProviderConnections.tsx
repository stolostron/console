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
} from '@open-cluster-management/ui-components'
import React, { Fragment, useContext, useEffect, useState } from 'react'
import { useTranslation, Trans } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { ClosedConfirmModalProps, ConfirmModal, IConfirmModalProps } from '../../../components/ConfirmModal'
import { ErrorState } from '../../../components/ErrorPage'
import { deleteResources } from '../../../lib/delete-resources'
import { getProviderByKey, ProviderID } from '../../../lib/providers'
import { deleteResource } from '../../../lib/resource-request'
import { useQuery } from '../../../lib/useQuery'
import { NavigationPath } from '../../../NavigationPath'
import { listProviderConnections, ProviderConnection } from '../../../resources/provider-connection'
import { createSubjectAccessReviews, ProviderConnectionsTableActionsRbac, rbacMapping } from '../../../resources/self-subject-access-review'
import { usePageContext } from '../../ClusterManagement/ClusterManagement'

export default function ProviderConnectionsPage() {
    return (
        <AcmAlertProvider>
            <AcmPageCard>
                <AcmTablePaginationContextProvider localStorageKey="table-provider-connections">
                    <ProviderConnectionsPageContent />
                </AcmTablePaginationContextProvider>
            </AcmPageCard>
        </AcmAlertProvider>
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

let lastData: ProviderConnection[] | undefined
let lastTime: number = 0

export function ProviderConnectionsPageContent() {
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
    const defaultTableRbacValues: ProviderConnectionsTableActionsRbac = {
        'secret.edit': false,
        'secret.delete': false,
    }
    const [confirm, setConfirm] = useState<IConfirmModalProps>(ClosedConfirmModalProps)
    const [tableActionRbacValues, setTableActionRbacValues] = useState<ProviderConnectionsTableActionsRbac>(defaultTableRbacValues)
    const [isOpen, setIsOpen] = useState<boolean>(false)
    const [abortRbacCheck, setRbacAborts] = useState<Function[]>()
    const [abortBatchRbacCheck, setBatchRbacAbort] = useState<abortDictionary>()
    const history = useHistory()
    const alertContext = useContext(AcmAlertContext)

    interface abortDictionary {
        [key: string]: Function[] | undefined
    }
    function abortRbacPromises() {
        abortRbacCheck?.forEach((abort) => abort())
    }
    function abortBatchRbacPromises(connection: ProviderConnection) {
        if (abortBatchRbacCheck) abortBatchRbacCheck[connection.metadata.name!]?.forEach((abort) => abort)
    }

    function checkRbacAccess(connection: ProviderConnection) {
        let currentRbacValues = { ...defaultTableRbacValues }
        let abortArray: Array<Function> = []
       
        Object.keys(currentRbacValues).forEach((action) => {
            const request = createSubjectAccessReviews(rbacMapping(action, connection.metadata.name, connection.metadata.namespace))
            request.promise
                .then((results) => {
                    if (results) {
                        let rbacQueryResults: boolean[] = []
                        results.forEach((result) => {
                            console.log('checking rbac response: ', result)
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

    function checkRbacAccessBatchAction(connections: ProviderConnection[]) {
        if (connections.length === 0) {
            setTableActionRbacValues(defaultTableRbacValues)
        } else {
            let rbacValues: ProviderConnectionsTableActionsRbac= {
                'secret.delete': false
            }

            let abortArray: Array<Function> = []
            let abortDictionary: abortDictionary = {}

            let promiseArray = Promise.allSettled(
                connections.map((connection) => {
                    let newRbacPromise = Promise.allSettled(
                        Object.keys(rbacValues).map((action: string) => {
                            const request = createSubjectAccessReviews(
                                rbacMapping(action, connection.metadata.name, connection.metadata.namespace)
                            )
                            abortArray.push(request.abort)
                            return request.promise
                                .then((results) => {
                                    if (results) {
                                        let rbacQueryResults: boolean[] = []
                                        results.forEach((result) => {
                                            console.log('checking rbac response: ', result)
                                            if (result.status === 'fulfilled') {
                                                rbacQueryResults.push(result.value.status?.allowed!)
                                            }
                                        })

                                        if (!rbacQueryResults.includes(false)) {
                                            // evaluates current rbacValue, if false value remains false
                                            let actionValue =
                                                rbacValues[
                                                    action as 'secret.edit' | 'secret.delete' 
                                                ] && true
                                            rbacValues[
                                                action as 'secret.edit' | 'secret.delete'
                                            ] = actionValue!
                                        } else {
                                            rbacValues[
                                                action as 'secret.edit' | 'secret.delete'
                                            ] = false
                                        }
                                    }
                                })
                                .catch((err) => console.error(err))
                        })
                    )
                    abortDictionary[connection.metadata.name!] = abortArray
                    return newRbacPromise
                })
            )
            promiseArray.then(() => {
                setTableActionRbacValues(rbacValues)
            })
            setBatchRbacAbort(abortDictionary)
        }
    }

    return (
        <Fragment>
            <AcmAlertGroup isInline canClose />
            <ConfirmModal {...confirm} />
            <AcmTable<ProviderConnection>
                onSelect={(connections) => checkRbacAccessBatchAction(connections)}
                emptyState={
                    <AcmEmptyState
                        title={t('empty.title')}
                        message={t('empty.subtitle')}
                        action={<AddConnectionBtn />}
                    />
                }
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
                                    tooltip: !tableActionRbacValues['secret.edit']
                                        ? t('common:rbac.unauthorized')
                                        : '',
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
                                        setConfirm({
                                            title: t('modal.delete.title.single'),
                                            message: (
                                                <Trans
                                                    i18nKey="connection:modal.delete.content.single"
                                                    values={{ name: providerConnection?.metadata.name }}
                                                    components={{ bold: <strong /> }}
                                                />
                                            ),
                                            open: true,
                                            confirm: () => {
                                                alertContext.clearAlerts()
                                                deleteResource(providerConnection)
                                                    .promise.then(props.refresh)
                                                    .catch(() => {
                                                        alertContext.addAlert({
                                                            type: 'danger',
                                                            title: 'Delete error',
                                                            message: `Failed to delete provider connection named ${providerConnection.metadata.name}`,
                                                        })
                                                    })
                                                setConfirm(ClosedConfirmModalProps)
                                            },
                                            confirmText: t('common:delete'),
                                            isDanger: true,
                                            cancel: () => {
                                                setConfirm(ClosedConfirmModalProps)
                                            },
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
                    }
                ]}
                keyFn={(providerConnection) => {
                    return providerConnection.metadata?.uid as string
                }}
                tableActions={[]}
                bulkActions={[
                    {
                        id: 'deleteConnection',
                        title: t('delete.batch'),
                        click: (providerConnections: ProviderConnection[]) => {
                            setConfirm({
                                title: (
                                    <Trans
                                        i18nKey="connection:modal.delete.title.batch"
                                        values={{ number: providerConnections.length }}
                                    />
                                ),
                                message: t('modal.delete.content.batch'),
                                open: true,
                                confirm: async () => {
                                    alertContext.clearAlerts()
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
                                    resultErrors.forEach((error) => {
                                        alertContext.addAlert({
                                            type: 'danger',
                                            title: 'Delete error',
                                            message: error,
                                        })
                                    })
                                    props.refresh()
                                    setConfirm(ClosedConfirmModalProps)
                                },
                                confirmText: t('common:delete'),
                                isDanger: true,
                                cancel: () => {
                                    setConfirm(ClosedConfirmModalProps)
                                },
                            })
                        },
                    },
                ]}
                rowActions={[]}
            />
        </Fragment>
    )
}
