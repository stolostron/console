import {
    AcmActionGroup,
    AcmAlertContext,
    AcmAlertGroup,
    AcmAlertProvider,
    AcmDropdown,
    AcmDropdownItems,
    AcmEmptyState,
    AcmLabels,
    AcmLaunchLink,
    AcmPageCard,
    AcmTable,
    AcmTablePaginationContextProvider,
    AcmInlineProvider,
} from '@open-cluster-management/ui-components'
import React, { Fragment, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useHistory } from 'react-router-dom'
import { AppContext } from '../../../components/AppContext'
import { DistributionField, StatusField, UpgradeModal } from '../../../components/ClusterCommon'
import { ClosedConfirmModalProps, ConfirmModal, IConfirmModalProps } from '../../../components/ConfirmModal'
import { deleteCluster, deleteClusters } from '../../../lib/delete-cluster'
import { mapAddons } from '../../../lib/get-addons'
import { Cluster, ClusterStatus, getAllClusters, mapClusters } from '../../../lib/get-cluster'
import { useQuery } from '../../../lib/useQuery'
import { NavigationPath } from '../../../NavigationPath'
import { CertificateSigningRequest } from '../../../resources/certificate-signing-requests'
import { ClusterDeployment } from '../../../resources/cluster-deployment'
import { ManagedCluster } from '../../../resources/managed-cluster'
import { ManagedClusterInfo } from '../../../resources/managed-cluster-info'
import { usePageContext } from '../../ClusterManagement/ClusterManagement'
import { EditLabelsModal } from './components/EditLabelsModal'
import {
    createSubjectAccessReviews,
    rbacMapping,
    ClustersTableActionsRbac,
} from '../../../resources/self-subject-access-review'

export default function ClustersPage() {
    return <ClustersPageContent />
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
                isDisabled={clusterCreationRbacRestriction}
                tooltip={t('common:rbac.unauthorized')}
                onSelect={onSelect}
                id="cluster-actions"
                isKebab={false}
                isPrimary={true}
            />
        </AcmActionGroup>
    )
}

let lastData:
    | PromiseSettledResult<
          ClusterDeployment[] | ManagedClusterInfo[] | CertificateSigningRequest[] | ManagedCluster[]
      >[]
    | undefined
let lastTime: number = 0

export function ClustersPageContent() {
    const { data, startPolling, refresh } = useQuery(
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

    const items = data?.map((d) => {
        if (d.status === 'fulfilled') {
            return d.value
        } else {
            console.error(d.reason)
            return []
        }
    })

    let clusters: Cluster[] | undefined
    if (items) {
        clusters = mapClusters(
            items[0] as ClusterDeployment[],
            items[1] as ManagedClusterInfo[],
            items[2] as CertificateSigningRequest[],
            items[3] as ManagedCluster[]
        )
    }

    return (
        <AcmAlertProvider>
            <AcmPageCard>
                <AcmTablePaginationContextProvider localStorageKey="table-clusters">
                    <ClustersTable clusters={clusters} refresh={refresh} />
                </AcmTablePaginationContextProvider>
            </AcmPageCard>
        </AcmAlertProvider>
    )
}

export function ClustersTable(props: {
    clusters?: Cluster[]
    deleteCluster?: (managedCluster: Cluster) => void
    refresh: () => void
}) {
    const alertContext = useContext(AcmAlertContext)
    sessionStorage.removeItem('DiscoveredClusterName')
    sessionStorage.removeItem('DiscoveredClusterConsoleURL')
    const { t } = useTranslation(['cluster'])
    const defaultTableRbacValues: ClustersTableActionsRbac = {
        'cluster.edit.labels': false,
        'cluster.detach': false,
        'cluster.destroy': false,
        'cluster.upgrade': false,
    }
    const [confirm, setConfirm] = useState<IConfirmModalProps>(ClosedConfirmModalProps)
    const [editClusterLabels, setEditClusterLabels] = useState<Cluster | undefined>()
    const [upgradeSingleCluster, setUpgradeSingleCluster] = useState<Cluster | undefined>()
    const [tableActionRbacValues, setTableActionRbacValues] = useState<ClustersTableActionsRbac>(defaultTableRbacValues)
    const [isOpen, setIsOpen] = useState<boolean>(false)
    const [abortRbacCheck, setRbacAborts] = useState<Function[]>()

    function mckeyFn(cluster: Cluster) {
        return cluster.name!
    }

    function abortRbacPromises() {
        abortRbacCheck?.forEach((abort) => abort())
    }

    function checkRbacAccess(cluster: Cluster) {
        let currentRbacValues = { ...defaultTableRbacValues }
        let abortArray: Array<Function> = []
        if (!cluster.isHive) {
            delete currentRbacValues['cluster.destroy']
        }
        if (cluster?.status === ClusterStatus.detached) {
            delete currentRbacValues['cluster.detach']
        }
        Object.keys(currentRbacValues).forEach((action) => {
            const request = createSubjectAccessReviews(rbacMapping(action, cluster.name, cluster.namespace))
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
            <AcmAlertGroup isInline canClose />
            <ConfirmModal
                open={confirm.open}
                confirm={confirm.confirm}
                cancel={confirm.cancel}
                title={confirm.title}
                message={confirm.message}
            ></ConfirmModal>
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
                            <DistributionField data={cluster.distribution} clusterName={cluster?.name || ''} />
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
                                        setConfirm({
                                            title: t('modal.detach.title'),
                                            message: `You are about to detach ${cluster?.name}. This action is irreversible.`,
                                            open: true,
                                            confirm: () => {
                                                alertContext.clearAlerts()
                                                deleteCluster(cluster?.name!, false)
                                                    .promise.then((results) => {
                                                        results.forEach((result) => {
                                                            if (result.status === 'rejected') {
                                                                alertContext.addAlert({
                                                                    type: 'danger',
                                                                    title: 'Detach error',
                                                                    message: `Failed to detach managed cluster ${cluster?.name}. ${result.reason}`,
                                                                })
                                                            }
                                                        })
                                                    })
                                                    .catch((err) => {
                                                        setConfirm(ClosedConfirmModalProps)
                                                        alertContext.addAlert({
                                                            type: 'danger',
                                                            title: 'Detach error',
                                                            message: err,
                                                        })
                                                    })
                                                    .finally(() => {
                                                        props.refresh()
                                                    })
                                                setConfirm(ClosedConfirmModalProps)
                                            },
                                            cancel: () => {
                                                setConfirm(ClosedConfirmModalProps)
                                            },
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
                                        setConfirm({
                                            title: t('modal.destroy.title'),
                                            message: `You are about to destroy ${cluster.name}. This action is irreversible.`,
                                            open: true,
                                            confirm: () => {
                                                alertContext.clearAlerts()
                                                deleteCluster(cluster.name!, true)
                                                    .promise.then((results) => {
                                                        results.forEach((result) => {
                                                            if (result.status === 'rejected') {
                                                                alertContext.addAlert({
                                                                    type: 'danger',
                                                                    title: 'Destroy error',
                                                                    message: `Failed to destroy managed cluster ${cluster?.name}. ${result.reason}`,
                                                                })
                                                            }
                                                        })
                                                    })
                                                    .catch((err) => {
                                                        setConfirm(ClosedConfirmModalProps)
                                                        alertContext.addAlert({
                                                            type: 'danger',
                                                            title: 'Destroy error',
                                                            message: err,
                                                        })
                                                    })
                                                    .finally(() => {
                                                        props.refresh()
                                                    })
                                                setConfirm(ClosedConfirmModalProps)
                                            },
                                            cancel: () => {
                                                setConfirm(ClosedConfirmModalProps)
                                            },
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
                                        if (!isOpen) checkRbacAccess(cluster)
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
                            setConfirm({
                                title: t('modal.destroy.title'),
                                message: `You are about to destroy ${clusters.length} managed clusters. This action is irreversible.`,
                                open: true,
                                confirm: async () => {
                                    alertContext.clearAlerts()
                                    const clusterNames = clusters.map((cluster) => cluster.name) as Array<string>

                                    const promiseResults = await deleteClusters(clusterNames, true)
                                    const resultErrors: string[] = []
                                    let i = 0
                                    promiseResults.promise
                                        .then((results) => {
                                            if (results) {
                                                results.forEach((result) => {
                                                    if (result.status === 'rejected') {
                                                        resultErrors.push(
                                                            `Failed to destroy managed cluster. ${result.reason}`
                                                        )
                                                    } else {
                                                        result.value.forEach((result) => {
                                                            if (result.status === 'rejected') {
                                                                alertContext.addAlert({
                                                                    type: 'danger',
                                                                    title: 'Destroy error',
                                                                    message: `Failed to destroy managed cluster ${clusterNames[i]}. ${result.reason}`,
                                                                })
                                                            }
                                                        })
                                                        i++
                                                    }
                                                })
                                            }
                                        })
                                        .catch((err) => {
                                            alertContext.addAlert({
                                                type: 'danger',
                                                title: 'Destroy error',
                                                message: 'Encountered error: ' + err,
                                            })
                                        })
                                        .finally(() => {
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
                    {
                        id: 'detachCluster',
                        title: t('managed.detachSelected'),
                        click: (managedClusters) => {
                            setConfirm({
                                title: t('modal.detach.title'),
                                message: `You are about to detach ${managedClusters.length} managed clusters. This action is irreversible.`,
                                open: true,
                                confirm: () => {
                                    alertContext.clearAlerts()
                                    const managedClusterNames = managedClusters.map(
                                        (managedCluster) => managedCluster.name
                                    ) as Array<string>
                                    const promiseResults = deleteClusters(managedClusterNames, false)
                                    promiseResults.promise
                                        .then((results) => {
                                            const resultErrors: string[] = []
                                            let i = 0
                                            if (results) {
                                                results.forEach((result) => {
                                                    if (result.status === 'rejected') {
                                                        resultErrors.push(
                                                            `Failed to detach managed cluster. ${result.reason}`
                                                        )
                                                    } else {
                                                        result.value.forEach((result) => {
                                                            if (result.status === 'rejected') {
                                                                alertContext.addAlert({
                                                                    type: 'danger',
                                                                    title: 'detach error',
                                                                    message: `Failed to detach managed cluster ${managedClusterNames[i]}. ${result.reason}`,
                                                                })
                                                            }
                                                        })
                                                        i++
                                                    }
                                                })
                                            }
                                        })
                                        .catch((err) => {
                                            alertContext.addAlert({
                                                type: 'danger',
                                                title: 'Detach error',
                                                message: 'Encountered error: ' + err,
                                            })
                                        })
                                        .finally(() => {
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
                    {
                        id: 'upgradeClusters',
                        title: t('managed.upgradeSelected'),
                        click: (managedClusters: Array<Cluster>) => {
                            if (!managedClusters) {
                                return
                            }
                            const clusters = managedClusters.filter(
                                (c) =>
                                    c.distribution?.ocp?.availableUpdates &&
                                    c.distribution?.ocp?.availableUpdates.length > 0
                            )
                            if (clusters.length === 1) {
                                const cluster = clusters[0]
                                if (
                                    cluster.distribution?.ocp?.availableUpdates &&
                                    cluster.distribution?.ocp?.availableUpdates.length > 0 &&
                                    !(
                                        cluster.distribution?.ocp?.desiredVersion &&
                                        cluster.distribution?.ocp?.version &&
                                        cluster.distribution?.ocp?.version !== cluster.distribution?.ocp?.desiredVersion
                                    )
                                ) {
                                    setUpgradeSingleCluster(clusters[0])
                                }
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
