/* Copyright Contributors to the Open Cluster Management project */

import { ButtonVariant, PageSection, Stack, StackItem, Text, TextContent, TextVariants } from '@patternfly/react-core'
import { fitContent } from '@patternfly/react-table'
import {
    AcmAlertContext,
    AcmButton,
    AcmEmptyState,
    AcmInlineProvider,
    AcmInlineStatusGroup,
    AcmLabels,
    AcmLaunchLink,
    AcmPageContent,
    AcmTable,
    compareStrings,
    IAcmTableAction,
    IAcmTableButtonAction,
    IAcmTableColumn,
    ITableFilter,
    Provider,
    ProviderLongTextMap,
} from '../../../../ui-components'
import { Fragment, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Link, useHistory } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { clusterCuratorsState, clusterManagementAddonsState } from '../../../../atoms'
import { BulkActionModel, errorIsNot, IBulkActionModelProps } from '../../../../components/BulkActionModel'
import { Trans, useTranslation } from '../../../../lib/acm-i18next'
import { deleteCluster, detachCluster } from '../../../../lib/delete-cluster'
import { canUser } from '../../../../lib/rbac-util'
import { NavigationPath } from '../../../../NavigationPath'
import {
    addonPathKey,
    addonTextKey,
    Cluster,
    ClusterCurator,
    ClusterDeployment,
    ClusterDeploymentDefinition,
    ClusterStatus,
    ManagedClusterDefinition,
    patchResource,
    ResourceErrorCode,
} from '../../../../resources'
import { getDateTimeCell } from '../../helpers/table-row-helpers'
import { usePageContext } from '../ClustersPage'
import { AddCluster } from './components/AddCluster'
import { BatchChannelSelectModal } from './components/BatchChannelSelectModal'
import { BatchUpgradeModal } from './components/BatchUpgradeModal'
import { OnPremiseBanner } from './components/cim/OnPremiseBanner'
import { ClusterActionDropdown } from './components/ClusterActionDropdown'
import { DistributionField } from './components/DistributionField'
import { StatusField } from './components/StatusField'
import { useAllClusters } from './components/useAllClusters'

function InfraEnvLinkButton() {
    const { t } = useTranslation()

    return (
        <Link to={NavigationPath.infraEnvironments} style={{ marginRight: '16px' }}>
            <AcmButton key="enableDiscovery" variant={ButtonVariant.primary}>
                {t('cim.onpremise.banner.infraenv.link')}
            </AcmButton>
        </Link>
    )
}
export default function ManagedClusters() {
    const { t } = useTranslation()
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
                <Stack hasGutter={true}>
                    <OnPremiseBanner
                        id="banner.managedclusters"
                        extraButton={<InfraEnvLinkButton />}
                        titleKey="cim.onpremise.banner.header"
                        textKey="cim.onpremise.banner.body"
                    />
                    <StackItem>
                        <ClustersTable
                            clusters={clusters}
                            tableButtonActions={[
                                {
                                    id: 'createCluster',
                                    title: t('managed.createCluster'),
                                    click: () => history.push(NavigationPath.createInfrastructure),
                                    isDisabled: !canCreateCluster,
                                    tooltip: t('rbac.unauthorized'),
                                    variant: ButtonVariant.primary,
                                },
                                {
                                    id: 'importCluster',
                                    title: t('managed.importCluster'),
                                    click: () => history.push(NavigationPath.importCluster),
                                    isDisabled: !canCreateCluster,
                                    tooltip: t('rbac.unauthorized'),
                                    variant: ButtonVariant.secondary,
                                },
                            ]}
                            emptyState={
                                <AcmEmptyState
                                    key="mcEmptyState"
                                    title={t('managed.emptyStateHeader')}
                                    message={
                                        <Trans i18nKey={'managed.emptyStateMsg'} components={{ bold: <strong /> }} />
                                    }
                                    action={<AddCluster type="button" />}
                                />
                            }
                        />
                    </StackItem>
                </Stack>
            </PageSection>
        </AcmPageContent>
    )
}

const PageActions = () => {
    const [clusterManagementAddons] = useRecoilState(clusterManagementAddonsState)
    const addons = clusterManagementAddons.filter(
        (cma) => cma.metadata.annotations?.[addonTextKey] && cma.metadata.annotations?.[addonPathKey]
    )

    return (
        <AcmLaunchLink
            links={addons?.map((cma) => ({
                id: cma.metadata.annotations?.[addonTextKey]!,
                text: cma.metadata.annotations?.[addonTextKey]!,
                href: cma.metadata.annotations?.[addonPathKey]!,
            }))}
        />
    )
}

export function ClustersTable(props: {
    clusters?: Cluster[]
    tableButtonActions?: IAcmTableButtonAction[]
    emptyState?: React.ReactNode
}) {
    useEffect(() => {
        sessionStorage.removeItem('DiscoveredClusterDisplayName')
        sessionStorage.removeItem('DiscoveredClusterConsoleURL')
        sessionStorage.removeItem('DiscoveredClusterApiURL')
    }, [])

    const [clusterCurators] = useRecoilState(clusterCuratorsState)

    const { t } = useTranslation()
    const [upgradeClusters, setUpgradeClusters] = useState<Array<Cluster> | undefined>()
    const [selectChannels, setSelectChannels] = useState<Array<Cluster> | undefined>()
    const [modalProps, setModalProps] = useState<IBulkActionModelProps<Cluster> | { open: false }>({
        open: false,
    })

    const mckeyFn = useCallback(function mckeyFn(cluster: Cluster) {
        return cluster.name!
    }, [])

    const clusterNameColumn = useClusterNameColumn()
    const clusterStatusColumn = useClusterStatusColumn()
    const clusterProviderColumn = useClusterProviderColumn()
    const clusterDistributionColumn = useClusterDistributionColumn(clusterCurators)
    const clusterLabelsColumn = useClusterLabelsColumn()
    const clusterNodesColumn = useClusterNodesColumn()
    const clusterCreatedDataColumn = useClusterCreatedDateColumn()

    const modalColumns = useMemo(
        () => [clusterNameColumn, clusterStatusColumn, clusterProviderColumn],
        [clusterNameColumn, clusterStatusColumn, clusterProviderColumn]
    )

    const columns = useMemo<IAcmTableColumn<Cluster>[]>(
        () => [
            clusterNameColumn,
            clusterStatusColumn,
            clusterProviderColumn,
            clusterDistributionColumn,
            clusterLabelsColumn,
            clusterNodesColumn,
            clusterCreatedDataColumn,
            {
                header: '',
                cell: (cluster: Cluster) => {
                    return <ClusterActionDropdown cluster={cluster} isKebab={true} />
                },
                cellTransforms: [fitContent],
            },
        ],
        [
            clusterNameColumn,
            clusterStatusColumn,
            clusterProviderColumn,
            clusterDistributionColumn,
            clusterLabelsColumn,
            clusterNodesColumn,
            clusterCreatedDataColumn,
        ]
    )

    const tableActions = useMemo<IAcmTableAction<Cluster>[]>(
        () => [
            {
                id: 'upgradeClusters',
                title: t('managed.upgrade.plural'),
                click: (managedClusters: Array<Cluster>) => {
                    if (!managedClusters) return
                    const managedClustersNoHypershift = managedClusters.filter((mc) => !mc.isHostedCluster)
                    setUpgradeClusters(managedClustersNoHypershift)
                },
                variant: 'bulk-action',
            },
            {
                id: 'selectChannels',
                title: t('managed.selectChannel.plural'),
                click: (managedClusters: Array<Cluster>) => {
                    if (!managedClusters) return
                    setSelectChannels(managedClusters)
                },
                variant: 'bulk-action',
            },
            { id: 'seperator-1', variant: 'action-seperator' },
            {
                id: 'hibernate-cluster',
                title: t('managed.hibernate.plural'),
                click: (clusters) => {
                    setModalProps({
                        open: true,
                        title: t('bulk.title.hibernate'),
                        action: t('hibernate'),
                        processing: t('hibernating'),
                        resources: clusters.filter((cluster) => cluster.hive.isHibernatable),
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
                        plural: t('hibernatable.clusters'),
                    })
                },
                variant: 'bulk-action',
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
                        resources: clusters.filter((cluster) => cluster.status === ClusterStatus.hibernating),
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
                        plural: t('resumable.clusters'),
                    })
                },
                variant: 'bulk-action',
            },
            { id: 'seperator-2', variant: 'action-seperator' },
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
                        icon: 'warning',
                        confirmText: t('confirm').toLowerCase(),
                        isValidError: errorIsNot([ResourceErrorCode.NotFound]),
                    })
                },
                variant: 'bulk-action',
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
                        icon: 'warning',
                        confirmText: t('confirm').toLowerCase(),
                        isValidError: errorIsNot([ResourceErrorCode.NotFound]),
                    })
                },
                variant: 'bulk-action',
            },
        ],
        [modalColumns, t]
    )

    const rowActions = useMemo(() => [], [])

    const filters = useMemo<ITableFilter<Cluster>[]>(() => {
        return [
            {
                id: 'provider',
                label: t('table.provider'),
                options: Object.values(Provider)
                    .map((key) => ({
                        label: ProviderLongTextMap[key],
                        value: key,
                    }))
                    .filter((value, index, array) => index === array.findIndex((v) => v.value === value.value))
                    .sort((lhs, rhs) => compareStrings(lhs.label, rhs.label)),
                tableFilterFn: (selectedValues, cluster) => selectedValues.includes(cluster.provider ?? ''),
            },
            {
                id: 'status',
                label: t('table.status'),
                options: Object.keys(ClusterStatus)
                    .map((key) => ({
                        label: t(`status.${key}`),
                        value: t(`status.${key}`),
                    }))
                    .filter((value, index, array) => index === array.findIndex((v) => v.value === value.value))
                    .sort((lhs, rhs) => compareStrings(lhs.label, rhs.label)),
                tableFilterFn: (selectedValues, cluster) => selectedValues.includes(t(`status.${cluster.status}`)),
            },
        ]
    }, [t])

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
            <BatchChannelSelectModal
                clusters={selectChannels}
                open={!!selectChannels}
                close={() => {
                    setSelectChannels(undefined)
                }}
            />
            <AcmTable<Cluster>
                plural="clusters"
                items={props.clusters}
                columns={columns}
                keyFn={mckeyFn}
                key="managedClustersTable"
                tableActionButtons={props.tableButtonActions}
                tableActions={tableActions}
                rowActions={rowActions}
                emptyState={props.emptyState}
                filters={filters}
            />
        </Fragment>
    )
}

export function useClusterNameColumn(): IAcmTableColumn<Cluster> {
    const { t } = useTranslation()
    return {
        header: t('table.name'),
        tooltip: t('table.name.helperText.noBold'),
        sort: 'displayName',
        search: (cluster) => [cluster.displayName as string, cluster.hive.clusterClaimName as string],
        cell: (cluster) => (
            <>
                <span style={{ whiteSpace: 'nowrap' }}>
                    <Link to={NavigationPath.clusterDetails.replace(':id', cluster.name as string)}>
                        {cluster.displayName}
                    </Link>
                </span>
                {cluster.hive.clusterClaimName && (
                    <TextContent>
                        <Text component={TextVariants.small}>{cluster.hive.clusterClaimName}</Text>
                    </TextContent>
                )}
            </>
        ),
    }
}

export function useClusterStatusColumn(): IAcmTableColumn<Cluster> {
    const { t } = useTranslation()
    return {
        header: t('table.status'),
        sort: 'status',
        search: 'status',
        cell: (cluster) => (
            <span style={{ whiteSpace: 'nowrap' }}>
                <StatusField cluster={cluster} />
            </span>
        ),
    }
}

export function useClusterProviderColumn(): IAcmTableColumn<Cluster> {
    const { t } = useTranslation()
    return {
        header: t('table.provider'),
        sort: 'provider',
        search: 'provider',
        cell: (cluster) => (cluster?.provider ? <AcmInlineProvider provider={cluster?.provider} /> : '-'),
    }
}

export function useClusterDistributionColumn(clusterCurators: ClusterCurator[]): IAcmTableColumn<Cluster> {
    const { t } = useTranslation()
    return {
        header: t('table.distribution'),
        sort: 'distribution.displayVersion',
        search: 'distribution.displayVersion',
        cell: (cluster) => (
            <DistributionField
                cluster={cluster}
                clusterCurator={clusterCurators.find((curator) => curator.metadata.name === cluster.name)}
            />
        ),
    }
}

export function useClusterLabelsColumn(): IAcmTableColumn<Cluster> {
    const { t } = useTranslation()
    return {
        header: t('table.labels'),
        search: (cluster) =>
            cluster.labels ? Object.keys(cluster.labels).map((key) => `${key}=${cluster.labels![key]}`) : '',
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
                        'managed-by',
                        'local-cluster',
                        'openshiftVersion',
                    ].filter((label) => {
                        return labelKeys.includes(label)
                    }) ?? []
                labelKeys.forEach((label) => {
                    if (label.includes('open-cluster-management.io')) {
                        collapse.push(label)
                    }
                })
                return (
                    <AcmLabels
                        labels={cluster.labels}
                        expandedText={t('show.less')}
                        collapsedText={t('show.more', { number: collapse.length })}
                        allCollapsedText={t('count.labels', { number: collapse.length })}
                        collapse={collapse}
                    />
                )
            } else {
                return '-'
            }
        },
    }
}

export function useClusterNodesColumn(): IAcmTableColumn<Cluster> {
    const { t } = useTranslation()
    return {
        header: t('table.nodes'),
        sort: 'nodes',
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
    }
}

export function useClusterCreatedDateColumn(): IAcmTableColumn<Cluster> {
    const { t } = useTranslation()
    return {
        header: t('table.creationDate'),
        sort: (a: Cluster, b: Cluster) => {
            const dateTimeCellA = getDateTimeCell(a.creationTimestamp ? new Date(a.creationTimestamp).toString() : '-')
            const dateTimeCellB = getDateTimeCell(b.creationTimestamp ? new Date(b.creationTimestamp).toString() : '-')
            return compareStrings(
                dateTimeCellA.sortableValue == 0 ? '' : dateTimeCellA.sortableValue.toString(),
                dateTimeCellB.sortableValue == 0 ? '' : dateTimeCellB.sortableValue.toString()
            )
        },
        search: 'creationDate',
        cell: (cluster) => {
            const dateTimeCell = getDateTimeCell(
                cluster.creationTimestamp ? new Date(cluster.creationTimestamp).toString() : '-'
            )
            return dateTimeCell.title === 'Invalid Date' ? '-' : dateTimeCell.title
        },
    }
}
