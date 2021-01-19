import {
    AcmActionGroup,
    AcmAlertContext,
    AcmAlertGroup,
    AcmAlertProvider,
    AcmDropdown,
    AcmDropdownItems,
    AcmEmptyState,
    AcmInlineProvider,
    AcmLabels,
    AcmLaunchLink,
    AcmPageCard,
    AcmTable,
    AcmTablePaginationContextProvider,
} from '@open-cluster-management/ui-components'
import React, { Fragment, useContext, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useHistory } from 'react-router-dom'
import { AppContext } from '../../../components/AppContext'
import { BulkActionModel, IBulkActionModelProps } from '../../../components/BulkActionModel'
import { DistributionField, StatusField, UpgradeModal } from '../../../components/ClusterCommon'
import { getErrorInfo } from '../../../components/ErrorPage'
import { deleteCluster, detachCluster } from '../../../lib/delete-cluster'
import { mapAddons } from '../../../lib/get-addons'
import { Cluster, ClusterStatus, getAllClusters } from '../../../lib/get-cluster'
import { useQuery } from '../../../lib/useQuery'
import { NavigationPath } from '../../../NavigationPath'
import {
    CheckTableActionsRbacAccess,
    ClustersTableActionsRbac,
    createSubjectAccessReviews,
    defaultTableRbacValues,
    rbacMapping,
} from '../../../resources/self-subject-access-review'
import { usePageContext } from '../../ClusterManagement/ClusterManagement'
import { BatchUpgradeModal } from './components/BatchUpgradeModal'
import { EditLabelsModal } from './components/EditLabelsModal'

export default function ClustersPage() {
    return (
        <AcmAlertProvider>
            <AcmAlertGroup isInline canClose alertMargin="24px 24px 0px 24px" />
            <ClustersPageContent />
        </AcmAlertProvider>
    )
}

const PageActions = () => {
    const [clusterCreationRbacRestriction, setclusterCreationRbacRestriction] = useState<boolean>(true)
    const { push } = useHistory()
    const { t } = useTranslation(['cluster', 'common'])
    const { clusterManagementAddons } = useContext(AppContext)
    const addons = mapAddons(clusterManagementAddons)

    useEffect(() => {
        const resourceList = rbacMapping('cluster.create')
        const promiseResult = createSubjectAccessReviews(resourceList)
        let allowed = true
        promiseResult.promise
            .then((results) => {
                if (results) {
                    results.forEach((result) => {
                        if (result.status === 'fulfilled') {
                            allowed = allowed && result.value.status?.allowed!
                        }
                    })
                }
                setclusterCreationRbacRestriction(!allowed)
            })
            .catch((err) => {
                // send err to console
                console.error(err)
            })
        return () => promiseResult.abort()
    }, [])
    const dropdownItems: AcmDropdownItems[] = [
        {
            id: 'create-cluster',
            text: t('managed.createCluster'),
            isDisabled: clusterCreationRbacRestriction,
            tooltip: clusterCreationRbacRestriction ? t('common:rbac.unauthorized') : '',
        },
        {
            id: 'import-cluster',
            text: t('managed.importCluster'),
            isDisabled: clusterCreationRbacRestriction,
            tooltip: clusterCreationRbacRestriction ? t('common:rbac.unauthorized') : '',
        },
    ]
    const onSelect = (id: string) => {
        switch (id) {
            case 'create-cluster':
                push(NavigationPath.createCluster)
                break
            case 'import-cluster':
                push(NavigationPath.importCluster)
                break
        }
    }

    return (
        <AcmActionGroup>
            <AcmLaunchLink
                links={addons
                    ?.filter((addon) => addon.launchLink)
                    ?.map((addon) => ({
                        id: addon.launchLink?.displayText ?? '',
                        text: addon.launchLink?.displayText ?? '',
                        href: addon.launchLink?.href ?? '',
                    }))}
            />
            <AcmDropdown
                dropdownItems={dropdownItems}
                text={t('managed.addCluster')}
                onSelect={onSelect}
                id="cluster-actions"
                isKebab={false}
                isPrimary={true}
            />
        </AcmActionGroup>
    )
}

let lastData: Cluster[] | undefined
let lastTime: number = 0

export function ClustersPageContent() {
    const alertContext = useContext(AcmAlertContext)

    const { data, error, startPolling, refresh } = useQuery(
        getAllClusters,
        Date.now() - lastTime < 5 * 60 * 1000 ? lastData : undefined
    )
    useEffect(startPolling, [startPolling])
    usePageContext(!!data, PageActions)

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

    return (
        <AcmPageCard>
            <AcmTablePaginationContextProvider localStorageKey="table-clusters">
                <ClustersTable clusters={data} refresh={refresh} />
            </AcmTablePaginationContextProvider>
        </AcmPageCard>
    )
}

export function ClustersTable(props: {
    clusters?: Cluster[]
    deleteCluster?: (managedCluster: Cluster) => void
    refresh: () => void
}) {
    sessionStorage.removeItem('DiscoveredClusterName')
    sessionStorage.removeItem('DiscoveredClusterConsoleURL')
    const { t } = useTranslation(['cluster'])
    const [editClusterLabels, setEditClusterLabels] = useState<Cluster | undefined>()
    const [upgradeSingleCluster, setUpgradeSingleCluster] = useState<Cluster | undefined>()
    const [tableActionRbacValues, setTableActionRbacValues] = useState<ClustersTableActionsRbac>(defaultTableRbacValues)
    const [isOpen, setIsOpen] = useState<boolean>(false)
    const [abortRbacCheck, setRbacAborts] = useState<Function[]>()
    const [upgradeMultipleClusters, setUpgradeMultipleClusters] = useState<Array<Cluster> | undefined>()
    const [modalProps, setModalProps] = useState<IBulkActionModelProps<Cluster> | { open: false }>({
        open: false,
    })
    function mckeyFn(cluster: Cluster) {
        return cluster.name!
    }

    function abortRbacPromises() {
        abortRbacCheck?.forEach((abort) => abort())
    }

    const modalColumns = useMemo(
        () => [
            {
                header: t('table.name'),
                cell: (cluster: Cluster) => <span style={{ whiteSpace: 'nowrap' }}>{cluster.name}</span>,
                sort: 'name',
            },
            {
                header: t('table.status'),
                sort: 'status',
                cell: (cluster: Cluster) => (
                    <span style={{ whiteSpace: 'nowrap' }}>
                        <StatusField status={cluster.status} />
                    </span>
                ),
            },
            {
                header: t('table.provider'),
                sort: 'provider',
                cell: (cluster: Cluster) =>
                    cluster?.provider ? <AcmInlineProvider provider={cluster?.provider} /> : '-',
            },
        ],
        [t]
    )

    return (
        <Fragment>
            <BulkActionModel<Cluster> {...modalProps} />
            <EditLabelsModal
                cluster={editClusterLabels}
                close={() => {
                    setEditClusterLabels(undefined)
                    props.refresh()
                }}
            />
            <UpgradeModal
                data={upgradeSingleCluster?.distribution}
                open={!!upgradeSingleCluster}
                clusterName={upgradeSingleCluster?.name || ''}
                close={() => {
                    setUpgradeSingleCluster(undefined)
                }}
            />
            <BatchUpgradeModal
                clusters={upgradeMultipleClusters}
                open={!!upgradeMultipleClusters}
                close={() => {
                    setUpgradeMultipleClusters(undefined)
                }}
            />
            <AcmTable<Cluster>
                plural="clusters"
                items={props.clusters}
                columns={[
                    {
                        header: t('table.name'),
                        sort: 'name',
                        search: 'name',
                        cell: (cluster) => (
                            <span style={{ whiteSpace: 'nowrap' }}>
                                <Link to={NavigationPath.clusterDetails.replace(':id', cluster.name as string)}>
                                    {cluster.name}
                                </Link>
                            </span>
                        ),
                    },
                    {
                        header: t('table.status'),
                        sort: 'status',
                        search: 'status',
                        cell: (cluster) => (
                            <span style={{ whiteSpace: 'nowrap' }}>
                                <StatusField status={cluster.status} />
                            </span>
                        ),
                    },
                    {
                        header: t('table.provider'),
                        sort: 'provider',
                        search: 'provider',
                        cell: (cluster) =>
                            cluster?.provider ? <AcmInlineProvider provider={cluster?.provider} /> : '-',
                    },
                    {
                        header: t('table.distribution'),
                        sort: 'distribution.displayVersion',
                        search: 'distribution.displayVersion',
                        cell: (cluster) => (
                            <DistributionField
                                data={cluster.distribution}
                                clusterName={cluster?.name || ''}
                                clusterStatus={cluster?.status || ''}
                            />
                        ),
                    },
                    {
                        header: t('table.labels'),
                        // search: 'labels',
                        cell: (cluster) => (cluster.labels ? <AcmLabels labels={cluster.labels} /> : '-'),
                    },
                    {
                        header: t('table.nodes'),
                        // sort: 'info.status.nodeList.length',
                        cell: (cluster) => {
                            return cluster.nodes?.active && cluster.nodes.active > 0 ? cluster.nodes.active : '-'
                        },
                    },
                    {
                        header: '',
                        cell: (cluster: Cluster) => {
                            const onSelect = (id: string) => {
                                const action = actions.find((a) => a.id === id)
                                return action?.click(cluster)
                            }
                            let actions = [
                                {
                                    id: 'edit-labels',
                                    text: t('managed.editLabels'),
                                    click: (cluster: Cluster) => setEditClusterLabels(cluster),
                                    isDisabled: !tableActionRbacValues['cluster.edit.labels'],
                                    tooltip: !tableActionRbacValues['cluster.edit.labels']
                                        ? t('common:rbac.unauthorized')
                                        : '',
                                },
                                {
                                    id: 'launch-cluster',
                                    text: t('managed.launch'),
                                    click: (cluster: Cluster) => window.open(cluster?.consoleURL, '_blank'),
                                },
                                {
                                    id: 'upgrade-cluster',
                                    text: t('managed.upgrade'),
                                    click: (cluster: Cluster) => {
                                        setUpgradeSingleCluster(cluster)
                                    },
                                    isDisabled: !tableActionRbacValues['cluster.upgrade'],
                                    tooltip: !tableActionRbacValues['cluster.upgrade']
                                        ? t('common:rbac.unauthorized')
                                        : '',
                                },
                                {
                                    id: 'search-cluster',
                                    text: t('managed.search'),
                                    click: (cluster: Cluster) =>
                                        window.location.assign(
                                            `/search?filters={"textsearch":"cluster%3A${cluster?.name}"}`
                                        ),
                                },
                                {
                                    id: 'detach-cluster',
                                    text: t('managed.detached'),
                                    click: (cluster: Cluster) => {
                                        setModalProps({
                                            open: true,
                                            singular: t('cluster'),
                                            plural: t('clusters'),
                                            action: t('detach'),
                                            processing: t('detaching'),
                                            resources: [cluster],
                                            description: t('cluster.detach.description'),
                                            columns: modalColumns,
                                            keyFn: (cluster) => cluster.name as string,
                                            actionFn: (cluster) => detachCluster(cluster.name!),
                                            close: () => {
                                                setModalProps({ open: false })
                                                props.refresh()
                                            },
                                            isDanger: true,
                                            confirmText: t('detach').toUpperCase(),
                                        })
                                    },
                                    isDisabled: !tableActionRbacValues['cluster.detach'],
                                    tooltip: !tableActionRbacValues['cluster.detach']
                                        ? t('common:rbac.unauthorized')
                                        : '',
                                },
                                {
                                    id: 'destroy-cluster',
                                    text: t('managed.destroySelected'),
                                    click: (cluster: Cluster) => {
                                        setModalProps({
                                            open: true,
                                            singular: t('cluster'),
                                            plural: t('clusters'),
                                            action: t('destroy'),
                                            processing: t('destroying'),
                                            resources: [cluster],
                                            description: t('cluster.destroy.description'),
                                            columns: modalColumns,
                                            keyFn: (cluster) => cluster.name as string,
                                            actionFn: (cluster) => deleteCluster(cluster.name!),
                                            close: () => {
                                                setModalProps({ open: false })
                                                props.refresh()
                                            },
                                            isDanger: true,
                                            confirmText: t('destroy').toUpperCase(),
                                        })
                                    },
                                    isDisabled: !tableActionRbacValues['cluster.destroy'],
                                    tooltip: !tableActionRbacValues['cluster.destroy']
                                        ? t('common:rbac.unauthorized')
                                        : '',
                                },
                            ]

                            if (!cluster.consoleURL) {
                                actions = actions.filter((a) => a.id !== 'launch-cluster')
                            }

                            if (
                                cluster.status !== ClusterStatus.ready ||
                                !(
                                    cluster.distribution?.ocp?.availableUpdates &&
                                    cluster.distribution?.ocp?.availableUpdates.length > 0
                                ) ||
                                (cluster.distribution?.ocp?.version &&
                                    cluster.distribution?.ocp?.desiredVersion &&
                                    cluster.distribution?.ocp?.version !== cluster.distribution?.ocp?.desiredVersion)
                            ) {
                                actions = actions.filter((a) => a.id !== 'upgrade-cluster')
                            }

                            if (!cluster.isManaged) {
                                actions = actions.filter((a) => a.id !== 'search-cluster')
                            }

                            if (cluster.status === ClusterStatus.detached) {
                                actions = actions.filter((a) => a.id !== 'detach-cluster')
                            }

                            if (!cluster.isHive) {
                                actions = actions.filter((a) => a.id !== 'destroy-cluster')
                            }

                            return (
                                <AcmDropdown
                                    id={`${cluster.name}-actions`}
                                    onSelect={onSelect}
                                    text={t('actions')}
                                    dropdownItems={actions}
                                    isKebab={true}
                                    isPlain={true}
                                    onToggle={() => {
                                        if (!isOpen)
                                            CheckTableActionsRbacAccess(
                                                cluster,
                                                setTableActionRbacValues,
                                                setRbacAborts
                                            )
                                        else abortRbacPromises()
                                        setIsOpen(!isOpen)
                                    }}
                                />
                            )
                        },
                    },
                ]}
                keyFn={mckeyFn}
                key="managedClustersTable"
                tableActions={[]}
                bulkActions={[
                    {
                        id: 'destroyCluster',
                        title: t('managed.destroy'),
                        click: (clusters) => {
                            setModalProps({
                                open: true,
                                singular: t('cluster'),
                                plural: t('clusters'),
                                action: t('destroy'),
                                processing: t('destroying'),
                                resources: clusters,
                                description: t('cluster.destroy.description'),
                                columns: modalColumns,
                                keyFn: (cluster) => cluster.name as string,
                                actionFn: (cluster) => deleteCluster(cluster.name!, true),
                                close: () => {
                                    setModalProps({ open: false })
                                    props.refresh()
                                },
                                isDanger: true,
                                confirmText: t('destroy').toUpperCase(),
                            })
                        },
                    },
                    {
                        id: 'detachCluster',
                        title: t('managed.detachSelected'),
                        click: (clusters) => {
                            setModalProps({
                                open: true,
                                singular: t('cluster'),
                                plural: t('clusters'),
                                action: t('detach'),
                                processing: t('detaching'),
                                resources: clusters,
                                description: t('cluster.detach.description'),
                                columns: modalColumns,
                                keyFn: (cluster) => cluster.name as string,
                                actionFn: (cluster) => detachCluster(cluster.name!),
                                close: () => {
                                    setModalProps({ open: false })
                                    props.refresh()
                                },
                                isDanger: true,
                                confirmText: t('detach').toUpperCase(),
                            })
                        },
                    },
                    {
                        id: 'upgradeClusters',
                        title: t('managed.upgradeSelected'),
                        click: (managedClusters: Array<Cluster>) => {
                            if (!managedClusters) {
                                return
                            }

                            const clusters = managedClusters.filter(
                                (c) =>
                                    c.status === ClusterStatus.ready &&
                                    c.distribution?.ocp?.availableUpdates &&
                                    c.distribution?.ocp?.availableUpdates.length > 0 &&
                                    !(
                                        c.distribution?.ocp?.desiredVersion &&
                                        c.distribution?.ocp?.version &&
                                        c.distribution?.ocp?.version !== c.distribution?.ocp?.desiredVersion
                                    )
                            )
                            if (clusters.length === 1 && managedClusters.length === 1) {
                                setUpgradeSingleCluster(clusters[0])
                            } else if (managedClusters.length > 0) {
                                setUpgradeMultipleClusters(managedClusters)
                            }
                        },
                    },
                ]}
                rowActions={[]}
                emptyState={<AcmEmptyState title={t('managed.emptyStateHeader')} key="mcEmptyState" />}
            />
        </Fragment>
    )
}
