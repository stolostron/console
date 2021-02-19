import {
    AcmAlertContext,
    AcmAlertGroup,
    AcmAlertProvider,
    AcmButton,
    AcmEmptyState,
    AcmPageCard,
    AcmPageHeader,
    AcmScrollable,
    AcmTable,
    AcmTablePaginationContextProvider,
    AcmErrorBoundary,
} from '@open-cluster-management/ui-components'
import { Page } from '@patternfly/react-core'
import React, { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { BulkActionModel, IBulkActionModelProps } from '../../components/BulkActionModel'
import { getErrorInfo } from '../../components/ErrorPage'
import { deleteResources } from '../../lib/delete-resources'
import { DOC_LINKS } from '../../lib/doc-util'
import { deleteResource, IRequestResult } from '../../lib/resource-request'
import { useQuery } from '../../lib/useQuery'
import { NavigationPath } from '../../NavigationPath'
import { BareMetalAsset, BareMetalAssetDefinition, listBareMetalAssets } from '../../resources/bare-metal-asset'
import { RbacDropdown } from '../../components/Rbac'
import { getUserAccess, getResourceAttributes } from '../../lib/rbac-util'
import { ManagedClusterDefinition } from '../../resources/managed-cluster'

export default function BareMetalAssetsPage() {
    const { t } = useTranslation(['bma', 'common'])
    return (
        <Page>
            <AcmPageHeader
                title={t('bmas')}
                titleTooltip={
                    <>
                        {t('bmas.tooltip')}
                        <a
                            href={DOC_LINKS.BARE_METAL_ASSETS}
                            target="_blank"
                            rel="noreferrer"
                            style={{ display: 'block', marginTop: '4px' }}
                        >
                            {t('common:learn.more')}
                        </a>
                    </>
                }
            />
            <AcmErrorBoundary>
                <AcmScrollable>
                    <AcmAlertProvider>
                        <AcmAlertGroup isInline canClose alertMargin="24px 24px 0px 24px" />
                        <BareMetalAssets />
                    </AcmAlertProvider>
                </AcmScrollable>
            </AcmErrorBoundary>
        </Page>
    )
}

let lastData: BareMetalAsset[] | undefined
let lastTime: number = 0

export function BareMetalAssets() {
    const alertContext = useContext(AcmAlertContext)
    const { data, error, startPolling, refresh } = useQuery(
        listBareMetalAssets,
        Date.now() - lastTime < 5 * 60 * 1000 ? lastData : undefined
    )
    useEffect(startPolling, [startPolling])
    useEffect(() => {
        if (process.env.NODE_ENV !== 'test') {
            lastData = data
            lastTime = Date.now()
        }
    }, [data])
    useEffect(() => {
        alertContext.clearAlerts()
        if (error) {
            alertContext.addAlert(getErrorInfo(error))
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [error])

    return <BareMetalAssetsTable bareMetalAssets={data} deleteBareMetalAsset={deleteResource} refresh={refresh} />
}

export function deleteBareMetalAssets(bareMetalAssets: BareMetalAsset[]) {
    return deleteResources(bareMetalAssets).promise
}

export function BareMetalAssetsTable(props: {
    bareMetalAssets?: BareMetalAsset[]
    deleteBareMetalAsset: (bareMetalAsset: BareMetalAsset) => IRequestResult
    refresh: () => void
}) {
    const [canCreateCluster, setCanCreateCluster] = useState<boolean>(true)
    const [modalProps, setModalProps] = useState<IBulkActionModelProps<BareMetalAsset> | { open: false }>({
        open: false,
    })
    const history = useHistory()
    const { t } = useTranslation(['bma', 'common'])

    useEffect(() => {
        const canCreateCluster = getUserAccess('create', ManagedClusterDefinition)

        canCreateCluster.promise
            .then((result) => setCanCreateCluster(result.status?.allowed!))
            .catch((err) => console.error(err))
        return () => canCreateCluster.abort()
    }, [])

    function keyFn(bareMetalAsset: BareMetalAsset) {
        return bareMetalAsset.metadata.uid as string
    }

    return (
        <AcmPageCard>
            <BulkActionModel<BareMetalAsset> {...modalProps} />
            <AcmTablePaginationContextProvider localStorageKey="table-bare-metal-assets">
                <AcmTable<BareMetalAsset>
                    emptyState={
                        <AcmEmptyState
                            title={t('bareMetalAsset.emptyState.title')}
                            action={
                                <AcmButton
                                    variant="primary"
                                    onClick={() => {
                                        history.push(NavigationPath.createBareMetalAsset)
                                    }}
                                >
                                    {t('createBareMetalAsset.title')}
                                </AcmButton>
                            }
                        />
                    }
                    plural="bare metal assets"
                    items={props.bareMetalAssets}
                    columns={[
                        {
                            header: t('bareMetalAsset.tableHeader.name'),
                            cell: 'metadata.name',
                            sort: 'metadata.name',
                            search: 'metadata.name',
                        },
                        {
                            header: t('bareMetalAsset.tableHeader.namespace'),
                            cell: 'metadata.namespace',
                            search: 'metadata.namespace',
                        },
                        {
                            header: t('bareMetalAsset.tableHeader.cluster'),
                            cell: (bareMetalAsset: BareMetalAsset) =>
                                bareMetalAsset.metadata.labels?.['metal3.io/cluster-deployment-name'] || '-',
                            search: 'metal3.io/cluster-deployment-name',
                        },
                        {
                            header: t('bareMetalAsset.tableHeader.role'),
                            cell: (bareMetalAsset: BareMetalAsset) =>
                                bareMetalAsset.metadata.labels?.['metal3.io/role'] || '-',
                            search: 'metal3.io/role',
                        },
                        {
                            header: t('bareMetalAsset.tableHeader.status'),
                            cell: (bareMetalAsset) => {
                                if (bareMetalAsset.status) {
                                    let mostCurrentStatusTime = bareMetalAsset.status!.conditions[0].lastTransitionTime
                                    let mostCurrentStatus = bareMetalAsset.status!.conditions[0].type
                                    for (let conditions of bareMetalAsset.status!.conditions) {
                                        if (conditions.lastTransitionTime > mostCurrentStatusTime!) {
                                            mostCurrentStatusTime = conditions.lastTransitionTime
                                            mostCurrentStatus = conditions.type
                                        }
                                        // if status time is equivalent, take the status at that was added last
                                        else if (conditions.lastTransitionTime === mostCurrentStatusTime) {
                                            mostCurrentStatusTime = conditions.lastTransitionTime
                                            mostCurrentStatus = conditions.type
                                        }
                                    }
                                    switch (mostCurrentStatus) {
                                        // returns translation strings
                                        case 'CredentialsFound':
                                            return t('bareMetalAsset.statusMessage.credentialsFound')
                                        case 'AssetSyncStarted':
                                            return t('bareMetalAsset.statusMessage.assetSyncStarted')
                                        case 'ClusterDeploymentFound':
                                            return t('bareMetalAsset.statusMessage.clusterDeploymentFound')
                                        case 'AssetSyncCompleted':
                                            return t('bareMetalAsset.statusMessage.assetSyncCompleted')
                                        case 'Ready':
                                            return t('bareMetalAsset.statusMessage.ready')
                                        default:
                                            return ''
                                    }
                                }
                                return ''
                            },
                        },
                        {
                            header: '',
                            cell: (bareMetalAsset) => {
                                const actions = [
                                    {
                                        id: 'editAsset',
                                        text: t('bareMetalAsset.rowAction.editAsset.title'),
                                        isDisabled: true,
                                        click: (bareMetalAsset: BareMetalAsset) => {
                                            history.push(
                                                NavigationPath.editBareMetalAsset.replace(
                                                    ':namespace/:name',
                                                    `${bareMetalAsset.metadata?.namespace}/${bareMetalAsset.metadata?.name}` as string
                                                )
                                            )
                                        },
                                        rbac: [
                                            getResourceAttributes(
                                                'patch',
                                                BareMetalAssetDefinition,
                                                bareMetalAsset.metadata?.namespace,
                                                bareMetalAsset.metadata?.name
                                            ),
                                        ],
                                    },
                                    {
                                        id: 'deleteAsset',
                                        text: t('bareMetalAsset.rowAction.deleteAsset.title'),
                                        isDisabled: true,
                                        click: (bareMetalAsset: BareMetalAsset) => {
                                            setModalProps({
                                                open: true,
                                                singular: t('bare metal asset'),
                                                plural: t('bare metal assets'),
                                                action: t('common:delete'),
                                                processing: t('common:deleting'),
                                                resources: [bareMetalAsset],
                                                description: t('modal.delete.content.batch'),
                                                columns: [
                                                    {
                                                        header: t('bareMetalAsset.tableHeader.name'),
                                                        cell: 'metadata.name',
                                                        sort: 'metadata.name',
                                                    },
                                                    {
                                                        header: t('bareMetalAsset.tableHeader.namespace'),
                                                        cell: 'metadata.namespace',
                                                        sort: 'metadata.namespace',
                                                    },
                                                ],
                                                keyFn: (bareMetalAsset: BareMetalAsset) =>
                                                    bareMetalAsset.metadata.uid as string,
                                                actionFn: (bareMetalAsset: BareMetalAsset) =>
                                                    deleteResource(bareMetalAsset),
                                                close: () => {
                                                    setModalProps({ open: false })
                                                    props.refresh()
                                                },
                                                isDanger: true,
                                            })
                                        },
                                        rbac: [
                                            getResourceAttributes(
                                                'delete',
                                                BareMetalAssetDefinition,
                                                bareMetalAsset.metadata?.namespace,
                                                bareMetalAsset.metadata?.name
                                            ),
                                        ],
                                    },
                                ]

                                return (
                                    <RbacDropdown<BareMetalAsset>
                                        id={`${bareMetalAsset.metadata.name}-actions`}
                                        item={bareMetalAsset}
                                        isKebab={true}
                                        text={`${bareMetalAsset.metadata.name}-actions`}
                                        actions={actions}
                                    />
                                )
                            },
                        },
                    ]}
                    keyFn={keyFn}
                    tableActions={[
                        {
                            id: 'createAsset',
                            title: t('bareMetalAsset.bulkAction.createAsset'),
                            click: () => {
                                history.push(NavigationPath.createBareMetalAsset)
                            },
                        },
                    ]}
                    bulkActions={[
                        {
                            id: 'deleteBareMetalAsset',
                            title: t('bareMetalAsset.bulkAction.deleteAsset'),
                            click: (bareMetalAssets: BareMetalAsset[]) => {
                                setModalProps({
                                    open: true,
                                    singular: t('bare metal asset'),
                                    plural: t('bare metal assets'),
                                    action: t('common:delete'),
                                    processing: t('common:deleting'),
                                    resources: [...bareMetalAssets],
                                    description: t('modal.delete.content.batch'),
                                    columns: [
                                        {
                                            header: t('bareMetalAsset.tableHeader.name'),
                                            cell: 'metadata.name',
                                            sort: 'metadata.name',
                                        },
                                        {
                                            header: t('bareMetalAsset.tableHeader.namespace'),
                                            cell: 'metadata.namespace',
                                            sort: 'metadata.namespace',
                                        },
                                    ],
                                    keyFn: (bareMetalAsset: BareMetalAsset) => bareMetalAsset.metadata.uid as string,
                                    actionFn: (bareMetalAsset: BareMetalAsset) => deleteResource(bareMetalAsset),
                                    close: () => {
                                        setModalProps({ open: false })
                                        props.refresh()
                                    },
                                    isDanger: true,
                                })
                            },
                        },
                        {
                            id: 'createBareMetalAssetCluster',
                            title: t('bareMetalAsset.bulkAction.createCluster'),
                            click: (items) => {
                                const params = new URLSearchParams()
                                const bmaIDs = items.map((bma) => bma.metadata.uid)
                                params.set('bmas', bmaIDs.join(','))
                                history.push(`${NavigationPath.createCluster}?${params}`)
                            },
                            isDisabled: !canCreateCluster,
                            tooltip: !canCreateCluster ? t('common:rbac.unauthorized') : '',
                        },
                    ]}
                    rowActions={[]}
                />
            </AcmTablePaginationContextProvider>
        </AcmPageCard>
    )
}
