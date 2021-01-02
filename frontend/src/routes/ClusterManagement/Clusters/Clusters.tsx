import {
    AcmAlertGroup,
    AcmAlertProvider,
    AcmDropdown,
    AcmEmptyState,
    AcmLabels,
    AcmPageCard,
    AcmTable,
    AcmActionGroup,
    AcmLaunchLink,
} from '@open-cluster-management/ui-components'
import React, { Fragment, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useHistory } from 'react-router-dom'
import { DistributionField, StatusField, UpgradeModal } from '../../../components/ClusterCommon'
import { Cluster, ClusterStatus, getAllClusters, mapClusters } from '../../../lib/get-cluster'
import { useQuery } from '../../../lib/useQuery'
import { NavigationPath } from '../../../NavigationPath'
import { CertificateSigningRequest } from '../../../resources/certificate-signing-requests'
import { ClusterDeployment } from '../../../resources/cluster-deployment'
import { ManagedClusterInfo } from '../../../resources/managed-cluster-info'
import { usePageContext } from '../../ClusterManagement/ClusterManagement'
import { EditLabelsModal } from './components/EditLabelsModal'
import { AppContext } from '../../../components/AppContext'
import { mapAddons } from '../../../lib/get-addons'
import { createSubjectAccessReviews, rbacMapping } from '../../../resources/self-subject-access-review'
import {
    ClosedDeleteModalProps,
    DeleteResourceModal,
    getIResourceClusters,
    IDeleteModalProps,
} from './components/DeleteResourceModal'

export default function ClustersPage() {
    return <ClustersPageContent />
}

const PageActions = () => {
    const [accessRestriction, setAccessRestriction] = useState<boolean>(true)
    const { push } = useHistory()
    const { t } = useTranslation(['cluster', 'common'])
    const { clusterManagementAddons } = useContext(AppContext)
    const addons = mapAddons(clusterManagementAddons)

    useEffect(() => {
        const resourceList = rbacMapping('cluster.create')
        const promiseResult = createSubjectAccessReviews(resourceList)
        let allowed = true
        promiseResult.promise
            .catch((err) => {
                // send err to console
                console.error(err)
            })
            .then((results) => {
                if (results) {
                    results.forEach((result) => {
                        if (result.status === 'fulfilled') {
                            allowed = allowed && result.value.status?.allowed!
                        }
                    })
                }
                setAccessRestriction(!allowed)
            })
    }, [])
    const dropdownItems = [
        { id: 'create-cluster', text: t('managed.createCluster') },
        { id: 'import-cluster', text: t('managed.importCluster') },
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
                isDisabled={accessRestriction}
                tooltip={t('common:rbac.unauthorized')}
                onSelect={onSelect}
                id="cluster-actions"
                isKebab={false}
                isPrimary={true}
            />
        </AcmActionGroup>
    )
}

export function ClustersPageContent() {
    const { data, startPolling, refresh } = useQuery(getAllClusters)
    useEffect(startPolling, [startPolling])
    usePageContext(!!data, PageActions)

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
            items[2] as CertificateSigningRequest[]
        )
    }

    return (
        <AcmPageCard>
            <AcmAlertProvider>
                <ClustersTable clusters={clusters} refresh={refresh} />
            </AcmAlertProvider>
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
    const [deleteModalProps, setDeleteModalProps] = useState<IDeleteModalProps>(ClosedDeleteModalProps)

    function mckeyFn(cluster: Cluster) {
        return cluster.name!
    }

    return (
        <Fragment>
            <AcmAlertGroup isInline canClose />
            <EditLabelsModal
                cluster={editClusterLabels}
                close={() => {
                    setEditClusterLabels(undefined)
                    props.refresh()
                }}
            />
            <DeleteResourceModal
                resources={deleteModalProps.resources!}
                action={deleteModalProps.action}
                title={deleteModalProps.title}
                plural={deleteModalProps.plural}
                description={deleteModalProps.description}
                close={() => {
                    setDeleteModalProps(ClosedDeleteModalProps)
                    props.refresh()
                }}
            />
            <UpgradeModal
                data={upgradeSingleCluster?.distribution}
                open={!!upgradeSingleCluster}
                clusterName={upgradeSingleCluster?.name || ''}
                close={() => {
                    setUpgradeSingleCluster()
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
                                },
                                {
                                    id: 'search-cluster',
                                    text: t('managed.search'),
                                    click: (cluster: Cluster) => {},
                                },
                                {
                                    id: 'detach-cluster',
                                    text: t('managed.detached'),
                                    click: (cluster: Cluster) => {
                                        const iResourceClusterlist = getIResourceClusters([cluster])
                                        setDeleteModalProps({
                                            resources: iResourceClusterlist,
                                            action: 'detach',
                                            plural: 'clusters',
                                            title: t('modal.detach.title'),
                                            description: t('modal.detach.content'),
                                            close: () => {
                                                setDeleteModalProps(ClosedDeleteModalProps)
                                                props.refresh()
                                            },
                                        })
                                    },
                                },
                                {
                                    id: 'destroy-cluster',
                                    text: t('managed.destroySelected'),
                                    click: (cluster: Cluster) => {
                                        const iResourceClusterlist = getIResourceClusters([cluster])
                                        setDeleteModalProps({
                                            resources: iResourceClusterlist,
                                            action: 'destroy',
                                            plural: 'clusters',
                                            title: t('modal.destroy.title'),
                                            description: t('modal.destroy.content'),
                                            close: () => {
                                                setDeleteModalProps(ClosedDeleteModalProps)
                                                props.refresh()
                                            },
                                        })
                                    },
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
                            const iResourceClusterlist = getIResourceClusters(clusters)
                            setDeleteModalProps({
                                resources: iResourceClusterlist,
                                action: 'destroy',
                                plural: 'clusters',
                                title: t('modal.destroy.title'),
                                description: t('modal.destroy.batch', { num: clusters.length }),
                                close: () => {
                                    setDeleteModalProps(ClosedDeleteModalProps)
                                    props.refresh()
                                },
                            })
                        },
                    },
                    {
                        id: 'detachCluster',
                        title: t('managed.detachSelected'),
                        click: (clusters) => {
                            const iResourceClusterlist = getIResourceClusters(clusters)
                            setDeleteModalProps({
                                resources: iResourceClusterlist,
                                action: 'detach',
                                plural: 'clusters',
                                title: t('modal.detach.title'),
                                description: t('modal.detach.batch', { num: clusters.length }),
                                close: () => {
                                    setDeleteModalProps(ClosedDeleteModalProps)
                                    props.refresh()
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