/* Copyright Contributors to the Open Cluster Management project */

import {
    AcmAlertContext,
    AcmEmptyState,
    AcmInlineProvider,
    AcmInlineStatusGroup,
    AcmLabels,
    AcmLaunchLink,
    AcmPageContent,
    AcmTable,
} from '@open-cluster-management/ui-components'
import { PageSection } from '@patternfly/react-core'
import { fitContent, TableGridBreakpoint } from '@patternfly/react-table'
import { Fragment, useContext, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useHistory } from 'react-router-dom'
import { useRecoilValue, waitForAll } from 'recoil'
import {
    managedClusterSetsState,
    certificateSigningRequestsState,
    clusterDeploymentsState,
    managedClusterInfosState,
    managedClustersState,
    clusterManagementAddonsState,
    managedClusterAddonsState,
} from '../../../../atoms'
import { BulkActionModel, errorIsNot, IBulkActionModelProps } from '../../../../components/BulkActionModel'
import { deleteCluster, detachCluster } from '../../../../lib/delete-cluster'
import { mapAddons } from '../../../../lib/get-addons'
import { Cluster, mapClusters } from '../../../../lib/get-cluster'
import { canUser } from '../../../../lib/rbac-util'
import { ResourceErrorCode } from '../../../../lib/resource-request'
import { NavigationPath } from '../../../../NavigationPath'
import { ManagedClusterSetDefinition } from '../../../../resources/managed-cluster-set'
import { usePageContext } from '../../ClusterManagement'
import { AddCluster } from '../components/AddCluster'
import { BatchUpgradeModal } from '../components/BatchUpgradeModal'
import { ClusterActionDropdown } from '../components/ClusterActionDropdown'
import { DistributionField } from '../components/DistributionField'
import { StatusField } from '../components/StatusField'

export default function ManagedClusterSetsPage() {
    const alertContext = useContext(AcmAlertContext)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => alertContext.clearAlerts, [])

    const [
        managedClusterSets,
        managedClusters,
        clusterDeployments,
        managedClusterInfos,
        certificateSigningRequests,
        managedClusterAddons,
    ] = useRecoilValue(
        waitForAll([
            managedClusterSetsState,
            managedClustersState,
            clusterDeploymentsState,
            managedClusterInfosState,
            certificateSigningRequestsState,
            managedClusterAddonsState,
        ])
    )

    const clusters = mapClusters(clusterDeployments, managedClusterInfos, certificateSigningRequests, managedClusters, managedClusterAddons)

    usePageContext(clusters.length > 0, PageActions)
    return (
        <AcmPageContent id="clusters">
            <PageSection variant="light" isFilled={true}>
                <ManagedClusterSetsTable clusters={clusters} />
            </PageSection>
        </AcmPageContent>
    )
}

const PageActions = () => {
    const [clusterManagementAddons] = useRecoilValue(waitForAll([clusterManagementAddonsState]))
    const addons = mapAddons(clusterManagementAddons)

    return (
        <AcmLaunchLink
            links={addons
                ?.filter((addon) => addon.launchLink)
                ?.map((addon) => ({
                    id: addon.launchLink?.displayText ?? '',
                    text: addon.launchLink?.displayText ?? '',
                    href: addon.launchLink?.href ?? '',
                }))}
        />
    )
}

export function ManagedClusterSetsTable(props: {
    clusters?: Cluster[]
    deleteCluster?: (managedCluster: Cluster) => void
}) {
    sessionStorage.removeItem('DiscoveredClusterName')
    sessionStorage.removeItem('DiscoveredClusterConsoleURL')
    const { t } = useTranslation(['cluster'])
    const [upgradeClusters, setUpgradeClusters] = useState<Array<Cluster> | undefined>()
    const [modalProps, setModalProps] = useState<IBulkActionModelProps<Cluster> | { open: false }>({
        open: false,
    })

    const history = useHistory()
    const [canCreateClusterSet, setCanCreateClusterSet] = useState<boolean>(false)
    useEffect(() => {
        const canCreateManagedClusterSet = canUser('create', ManagedClusterSetDefinition)
        canCreateManagedClusterSet.promise
            .then((result) => setCanCreateClusterSet(result.status?.allowed!))
            .catch((err) => console.error(err))
        return () => canCreateManagedClusterSet.abort()
    }, [])

    function mckeyFn(cluster: Cluster) {
        return cluster.name!
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
                        <StatusField cluster={cluster} />
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
            <BatchUpgradeModal
                clusters={upgradeClusters}
                open={!!upgradeClusters}
                close={() => {
                    setUpgradeClusters(undefined)
                }}
            />
            <AcmTable<Cluster>
                gridBreakPoint={TableGridBreakpoint.none}
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
                                <StatusField cluster={cluster} />
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
                        cell: (cluster) => <DistributionField cluster={cluster} />,
                    },
                    {
                        header: t('table.labels'),
                        search: (cluster) =>
                            cluster.labels
                                ? Object.keys(cluster.labels).map((key) => `${key}=${cluster.labels![key]}`)
                                : '',
                        cell: (cluster) => {
                            if (cluster.labels) {
                                const labelKeys = Object.keys(cluster.labels)
                                const collapse =
                                    [
                                        'cloud',
                                        'clusterID',
                                        'installer.name',
                                        'installer.namespace',
                                        'name',
                                        'vendor',
                                    ].filter((label) => labelKeys.includes(label)) ?? []
                                return (
                                    <AcmLabels
                                        labels={cluster.labels}
                                        style={{ maxWidth: '600px' }}
                                        expandedText={t('common:show.less')}
                                        collapsedText={t('common:show.more', { number: collapse.length })}
                                        collapse={collapse}
                                    />
                                )
                            } else {
                                return '-'
                            }
                        },
                    },
                    {
                        header: t('table.nodes'),
                        cell: (cluster) => {
                            return cluster.nodes!.nodeList!.length > 0 ? (
                                <AcmInlineStatusGroup
                                    healthy={cluster.nodes!.ready}
                                    danger={cluster.nodes!.unhealthy}
                                    unknown={cluster.nodes!.unknown}
                                />
                            ) : (
                                '-'
                            )
                        },
                    },
                    {
                        header: '',
                        cell: (cluster: Cluster) => {
                            return <ClusterActionDropdown cluster={cluster} isKebab={true} />
                        },
                        cellTransforms: [fitContent],
                    },
                ]}
                keyFn={mckeyFn}
                key="managedClusterSetsTable"
                tableActions={[
                    {
                        id: 'createCluster',
                        title: t('managed.createCluster'),
                        click: () => history.push(NavigationPath.createCluster),
                        isDisabled: !canCreateClusterSet,
                        tooltip: t('common:rbac.unauthorized'),
                    },
                ]}
                bulkActions={[
                    {
                        id: 'destroyCluster',
                        title: t('managed.destroy'),
                        click: (clusters) => {
                            setModalProps({
                                open: true,
                                title: t('bulk.title.destroy'),
                                action: t('destroy'),
                                processing: t('destroying'),
                                resources: clusters,
                                description: t('bulk.message.destroy'),
                                columns: modalColumns,
                                keyFn: (cluster) => cluster.name as string,
                                actionFn: (cluster) => deleteCluster(cluster.name!, true),
                                close: () => setModalProps({ open: false }),
                                isDanger: true,
                                confirmText: t('confirm').toLowerCase(),
                                isValidError: errorIsNot([ResourceErrorCode.NotFound]),
                            })
                        },
                    },
                    {
                        id: 'detachCluster',
                        title: t('managed.detachSelected'),
                        click: (clusters) => {
                            setModalProps({
                                open: true,
                                title: t('bulk.title.detach'),
                                action: t('detach'),
                                processing: t('detaching'),
                                resources: clusters,
                                description: t('bulk.message.detach'),
                                columns: modalColumns,
                                keyFn: (cluster) => cluster.name as string,
                                actionFn: (cluster) => detachCluster(cluster.name!),
                                close: () => setModalProps({ open: false }),
                                isDanger: true,
                                confirmText: t('confirm').toLowerCase(),
                                isValidError: errorIsNot([ResourceErrorCode.NotFound]),
                            })
                        },
                    },
                    {
                        id: 'upgradeClusters',
                        title: t('managed.upgradeSelected'),
                        click: (managedClusters: Array<Cluster>) => {
                            if (!managedClusters) return
                            setUpgradeClusters(managedClusters)
                        },
                    },
                ]}
                rowActions={[]}
                emptyState={
                    <AcmEmptyState
                        key="mcEmptyState"
                        title={t('managed.emptyStateHeader')}
                        message={t('managed.emptyStateMsg')}
                        action={<AddCluster type="button" buttonSpacing />}
                    />
                }
            />
        </Fragment>
    )
}
