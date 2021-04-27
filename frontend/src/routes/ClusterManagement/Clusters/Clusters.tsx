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
    IAcmTableAction,
} from '@open-cluster-management/ui-components'
import { Card, CardBody, PageSection } from '@patternfly/react-core'
import { fitContent, TableGridBreakpoint } from '@patternfly/react-table'
import { Fragment, useContext, useEffect, useMemo, useState } from 'react'
import { useTranslation, Trans } from 'react-i18next'
import { Link, useHistory } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { clusterManagementAddonsState } from '../../../atoms'
import { BulkActionModel, errorIsNot, IBulkActionModelProps } from '../../../components/BulkActionModel'
import { deleteCluster, detachCluster } from '../../../lib/delete-cluster'
import { mapAddons } from '../../../lib/get-addons'
import { Cluster } from '../../../lib/get-cluster'
import { canUser } from '../../../lib/rbac-util'
import { patchResource, ResourceErrorCode } from '../../../lib/resource-request'
import { NavigationPath } from '../../../NavigationPath'
import { ManagedClusterDefinition } from '../../../resources/managed-cluster'
import { ClusterDeploymentDefinition, ClusterDeployment } from '../../../resources/cluster-deployment'
import { usePageContext } from '../ClusterManagement'
import { AddCluster } from './components/AddCluster'
import { BatchUpgradeModal } from './components/BatchUpgradeModal'
import { ClusterActionDropdown } from './components/ClusterActionDropdown'
import { DistributionField } from './components/DistributionField'
import { StatusField } from './components/StatusField'
import { useAllClusters } from './components/useAllClusters'

export default function ClustersPage() {
    const { t } = useTranslation(['cluster'])
    const alertContext = useContext(AcmAlertContext)
    let clusters = useAllClusters()
    clusters = clusters.filter((cluster) => {
        // don't show clusters in cluster pools in table
        if (cluster.hive.clusterPool) {
            return cluster.hive.clusterClaimName !== undefined
        } else {
            return true
        }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => alertContext.clearAlerts, [])

    usePageContext(clusters.length > 0, PageActions)

    const history = useHistory()
    const [canCreateCluster, setCanCreateCluster] = useState<boolean>(false)
    useEffect(() => {
        const canCreateManagedCluster = canUser('create', ManagedClusterDefinition)
        canCreateManagedCluster.promise
            .then((result) => setCanCreateCluster(result.status?.allowed!))
            .catch((err) => console.error(err))
        return () => canCreateManagedCluster.abort()
    }, [])

    return (
        <AcmPageContent id="clusters">
            <PageSection>
                <Card isLarge>
                    <CardBody>
                        <ClustersTable
                            clusters={clusters}
                            tableActions={[
                                {
                                    id: 'createCluster',
                                    title: t('managed.createCluster'),
                                    click: () => history.push(NavigationPath.createCluster),
                                    isDisabled: !canCreateCluster,
                                    tooltip: t('common:rbac.unauthorized'),
                                },
                                {
                                    id: 'importCluster',
                                    title: t('managed.importCluster'),
                                    click: () => history.push(NavigationPath.importCluster),
                                    isDisabled: !canCreateCluster,
                                    tooltip: t('common:rbac.unauthorized'),
                                },
                            ]}
                            emptyState={
                                <AcmEmptyState
                                    key="mcEmptyState"
                                    title={t('managed.emptyStateHeader')}
                                    message={
                                        <Trans
                                            i18nKey={'cluster:managed.emptyStateMsg'}
                                            components={{ bold: <strong /> }}
                                        />
                                    }
                                    action={<AddCluster type="button" />}
                                />
                            }
                        />
                    </CardBody>
                </Card>
            </PageSection>
        </AcmPageContent>
    )
}

const PageActions = () => {
    const [clusterManagementAddons] = useRecoilState(clusterManagementAddonsState)
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

export function ClustersTable(props: {
    clusters?: Cluster[]
    tableActions?: IAcmTableAction[]
    emptyState?: React.ReactNode
}) {
    sessionStorage.removeItem('DiscoveredClusterName')
    sessionStorage.removeItem('DiscoveredClusterConsoleURL')
    const { t } = useTranslation(['cluster'])
    const [upgradeClusters, setUpgradeClusters] = useState<Array<Cluster> | undefined>()
    const [modalProps, setModalProps] = useState<IBulkActionModelProps<Cluster> | { open: false }>({
        open: false,
    })

    function mckeyFn(cluster: Cluster) {
        return cluster.name!
    }

    const modalColumns = useMemo(
        () => [
            {
                header: t('table.name'),
                cell: (cluster: Cluster) => <span style={{ whiteSpace: 'nowrap' }}>{cluster.displayName}</span>,
                sort: 'displayName',
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
                        sort: 'displayName',
                        search: 'displayName',
                        cell: (cluster) => (
                            <span style={{ whiteSpace: 'nowrap' }}>
                                <Link to={NavigationPath.clusterDetails.replace(':id', cluster.name as string)}>
                                    {cluster.displayName}
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
                key="managedClustersTable"
                tableActions={props.tableActions}
                bulkActions={[
                    {
                        id: 'upgradeClusters',
                        title: t('managed.upgrade.plural'),
                        click: (managedClusters: Array<Cluster>) => {
                            if (!managedClusters) return
                            setUpgradeClusters(managedClusters)
                        },
                    },
                    {
                        id: 'hibernate-cluster',
                        title: t('managed.hibernate.plural'),
                        click: (clusters) => {
                            setModalProps({
                                open: true,
                                title: t('bulk.title.hibernate'),
                                action: t('hibernate'),
                                processing: t('hibernating'),
                                resources: clusters,
                                description: t('bulk.message.hibernate'),
                                columns: modalColumns,
                                keyFn: (cluster) => cluster.name as string,
                                actionFn: (cluster) => {
                                    return patchResource(
                                        {
                                            apiVersion: ClusterDeploymentDefinition.apiVersion,
                                            kind: ClusterDeploymentDefinition.kind,
                                            metadata: {
                                                name: cluster.name!,
                                                namespace: cluster.namespace!,
                                            },
                                        } as ClusterDeployment,
                                        [{ op: 'replace', path: '/spec/powerState', value: 'Hibernating' }]
                                    )
                                },
                                close: () => {
                                    setModalProps({ open: false })
                                },
                                isValidError: errorIsNot([ResourceErrorCode.NotFound]),
                            })
                        },
                    },
                    {
                        id: 'resume-cluster',
                        title: t('managed.resume.plural'),
                        click: (clusters) => {
                            setModalProps({
                                open: true,
                                title: t('bulk.title.resume'),
                                action: t('resume'),
                                processing: t('resuming'),
                                resources: clusters,
                                description: t('bulk.message.resume'),
                                columns: modalColumns,
                                keyFn: (cluster) => cluster.name as string,
                                actionFn: (cluster) => {
                                    return patchResource(
                                        {
                                            apiVersion: ClusterDeploymentDefinition.apiVersion,
                                            kind: ClusterDeploymentDefinition.kind,
                                            metadata: {
                                                name: cluster.name!,
                                                namespace: cluster.namespace!,
                                            },
                                        } as ClusterDeployment,
                                        [{ op: 'replace', path: '/spec/powerState', value: 'Running' }]
                                    )
                                },
                                close: () => {
                                    setModalProps({ open: false })
                                },
                                isValidError: errorIsNot([ResourceErrorCode.NotFound]),
                            })
                        },
                    },
                    {
                        id: 'detachCluster',
                        title: t('managed.detach.plural'),
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
                        id: 'destroyCluster',
                        title: t('managed.destroy.plural'),
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
                                actionFn: (cluster) => deleteCluster(cluster, true),
                                close: () => setModalProps({ open: false }),
                                isDanger: true,
                                confirmText: t('confirm').toLowerCase(),
                                isValidError: errorIsNot([ResourceErrorCode.NotFound]),
                            })
                        },
                    },
                ]}
                rowActions={[]}
                emptyState={props.emptyState}
            />
        </Fragment>
    )
}
