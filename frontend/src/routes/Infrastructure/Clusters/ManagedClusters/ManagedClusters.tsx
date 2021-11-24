/* Copyright Contributors to the Open Cluster Management project */

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
} from '@open-cluster-management/ui-components'
import { ButtonVariant, PageSection, Stack, StackItem, Text, TextContent, TextVariants } from '@patternfly/react-core'
import { fitContent } from '@patternfly/react-table'
import { Fragment, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link, useHistory } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { clusterCuratorsState, clusterManagementAddonsState } from '../../../../atoms'
import { BulkActionModel, errorIsNot, IBulkActionModelProps } from '../../../../components/BulkActionModel'
import { deleteCluster, detachCluster } from '../../../../lib/delete-cluster'
import { canUser } from '../../../../lib/rbac-util'
import { NavigationPath } from '../../../../NavigationPath'
import {
    addonPathKey,
    addonTextKey,
    Cluster,
    ClusterDeployment,
    ClusterDeploymentDefinition,
    ClusterStatus,
    ManagedClusterDefinition,
    patchResource,
    ResourceErrorCode,
} from '../../../../resources'
import { usePageContext } from '../Clusters'
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
                {t('Get started with infrastructure environments')}
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
                        titleKey="Create Cluster on Premise with a cloud like experience"
                        textKey="<p>The best solution for creating cluster on an <bold>On Premise</bold> at scale. Easily create ready to go clusters for your applications.</p><p>Easily create and re-create clusters from hosts that are provided by an infrastructure environment.</p>"
                    />
                    <StackItem>
                        <ClustersTable
                            clusters={clusters}
                            tableButtonActions={[
                                {
                                    id: 'createCluster',
                                    title: t('Create cluster'),
                                    click: () => history.push(NavigationPath.createCluster),
                                    isDisabled: !canCreateCluster,
                                    tooltip: t(
                                        'You are not authorized to complete this action. See your cluster administrator for role-based access control information.'
                                    ),
                                    variant: ButtonVariant.primary,
                                },
                                {
                                    id: 'importCluster',
                                    title: t('Import cluster'),
                                    click: () => history.push(NavigationPath.importCluster),
                                    isDisabled: !canCreateCluster,
                                    tooltip: t(
                                        'You are not authorized to complete this action. See your cluster administrator for role-based access control information.'
                                    ),
                                    variant: ButtonVariant.secondary,
                                },
                            ]}
                            emptyState={
                                <AcmEmptyState
                                    key="mcEmptyState"
                                    title={t("You don't have any clusters.")}
                                    message={
                                        <Trans
                                            i18nKey={
                                                'Click the <bold>Create a cluster</bold> or <bold>Import an existing cluster</bold> button to add a managed cluster.'
                                            }
                                            components={{ bold: <strong /> }}
                                        />
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

    const modalColumns = useMemo(
        () => [
            {
                header: t('Name'),
                sort: 'displayName',
                cell: (cluster: Cluster) => (
                    <>
                        <span style={{ whiteSpace: 'nowrap' }}>{cluster.displayName}</span>
                        {cluster.hive.clusterClaimName && (
                            <TextContent>
                                <Text component={TextVariants.small}>{cluster.hive.clusterClaimName}</Text>
                            </TextContent>
                        )}
                    </>
                ),
            },
            {
                header: t('Status'),
                sort: 'status',
                cell: (cluster: Cluster) => (
                    <span style={{ whiteSpace: 'nowrap' }}>
                        <StatusField cluster={cluster} />
                    </span>
                ),
            },
            {
                header: t('Infrastructure provider'),
                sort: 'provider',
                cell: (cluster: Cluster) =>
                    cluster?.provider ? <AcmInlineProvider provider={cluster?.provider} /> : '-',
            },
        ],
        [t]
    )

    const columns = useMemo<IAcmTableColumn<Cluster>[]>(
        () => [
            {
                header: t('Name'),
                tooltip: t(
                    'The common Kubernetes resource name shared by multiple resources generated from cluster creation or import; including the Namespace, ManagedCluster, or ClusterDeployment. The cluster claim name will be displayed under the cluster name if it was claimed from a cluster pool.'
                ),
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
            },
            {
                header: t('Status'),
                sort: 'status',
                search: 'status',
                cell: (cluster) => (
                    <span style={{ whiteSpace: 'nowrap' }}>
                        <StatusField cluster={cluster} />
                    </span>
                ),
            },
            {
                header: t('Infrastructure provider'),
                sort: 'provider',
                search: 'provider',
                cell: (cluster) => (cluster?.provider ? <AcmInlineProvider provider={cluster?.provider} /> : '-'),
            },
            {
                header: t('Distribution version'),
                sort: 'distribution.displayVersion',
                search: 'distribution.displayVersion',
                cell: (cluster) => (
                    <DistributionField
                        cluster={cluster}
                        clusterCurator={clusterCurators.find((curator) => curator.metadata.name === cluster.name)}
                    />
                ),
            },
            {
                header: t('Labels'),
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
                                expandedText={t('Show less')}
                                // TODO - Handle interpolation
                                collapsedText={t('{{number}} more', { number: collapse.length })}
                                allCollapsedText={t('{{number}} labels', { number: collapse.length })}
                                collapse={collapse}
                            />
                        )
                    } else {
                        return '-'
                    }
                },
            },
            {
                header: t('Nodes'),
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
        ],
        []
    )

    const tableActions = useMemo<IAcmTableAction<Cluster>[]>(
        () => [
            {
                id: 'upgradeClusters',
                title: t('Upgrade clusters'),
                click: (managedClusters: Array<Cluster>) => {
                    if (!managedClusters) return
                    setUpgradeClusters(managedClusters)
                },
                variant: 'bulk-action',
            },
            {
                id: 'selectChannels',
                title: t('Select channels'),
                click: (managedClusters: Array<Cluster>) => {
                    if (!managedClusters) return
                    setSelectChannels(managedClusters)
                },
                variant: 'bulk-action',
            },
            { id: 'seperator-1', variant: 'action-seperator' },
            {
                id: 'hibernate-cluster',
                title: t('Hibernate clusters'),
                click: (clusters) => {
                    setModalProps({
                        open: true,
                        title: t('Hibernate clusters'),
                        action: t('Hibernate'),
                        processing: t('Hibernating'),
                        resources: clusters.filter((cluster) => cluster.hive.isHibernatable),
                        description: t(
                            'Moving to the Hibernating state blocks any operations for the clusters. While hibernating, the cluster does not consume any virtual machine or network resources. This can be undone at any time. Only clusters that support hibernation are shown.'
                        ),
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
                        plural: t('hibernatable clusters'),
                    })
                },
                variant: 'bulk-action',
            },
            {
                id: 'resume-cluster',
                title: t('Resume clusters'),
                click: (clusters) => {
                    setModalProps({
                        open: true,
                        title: t('Resume clusters'),
                        action: t('Resume'),
                        processing: t('Resuming'),
                        resources: clusters.filter((cluster) => cluster.status === ClusterStatus.hibernating),
                        description: t(
                            'Moving out of Hibernating state resumes all operations for the clusters. After powering back on, the cluster resumes consumption of any virtual machine and network resources. Only clusters that support hibernation are shown.'
                        ),
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
                        plural: t('hibernatable clusters'),
                    })
                },
                variant: 'bulk-action',
            },
            { id: 'seperator-2', variant: 'action-seperator' },
            {
                id: 'detachCluster',
                title: t('Detach clusters'),
                click: (clusters) => {
                    setModalProps({
                        open: true,
                        title: t('Detach clusters?'),
                        action: t('Detach'),
                        processing: t('Detaching'),
                        resources: clusters,
                        description: t(
                            'Detaching a cluster removes it from management, but does not destroy it. You can import the clusters again to manage them.'
                        ),
                        columns: modalColumns,
                        keyFn: (cluster) => cluster.name as string,
                        actionFn: (cluster) => detachCluster(cluster.name!),
                        close: () => setModalProps({ open: false }),
                        isDanger: true,
                        icon: 'warning',
                        confirmText: t('Confirm').toLowerCase(),
                        isValidError: errorIsNot([ResourceErrorCode.NotFound]),
                    })
                },
                variant: 'bulk-action',
            },
            {
                id: 'destroyCluster',
                title: t('Destroy clusters'),
                click: (clusters) => {
                    setModalProps({
                        open: true,
                        title: t('Permanently destroy clusters?'),
                        action: t('Destroy'),
                        processing: t('Destroying'),
                        resources: clusters,
                        description: t(
                            'This action detaches the cluster and if possible the cluster will be destroyed.'
                        ),
                        columns: modalColumns,
                        keyFn: (cluster) => cluster.name as string,
                        actionFn: (cluster) => deleteCluster(cluster, true),
                        close: () => setModalProps({ open: false }),
                        isDanger: true,
                        icon: 'warning',
                        confirmText: t('Confirm').toLowerCase(),
                        isValidError: errorIsNot([ResourceErrorCode.NotFound]),
                    })
                },
                variant: 'bulk-action',
            },
        ],
        [modalColumns]
    )

    const rowActions = useMemo(() => [], [])

    const filters = useMemo<ITableFilter<Cluster>[]>(() => {
        return [
            {
                id: 'provider',
                label: t('Infrastructure provider'),
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
                label: t('Status'),
                options: Object.keys(ClusterStatus)
                    // TODO - REVISIT I18N
                    .map((key) => ({
                        label: t(`status.${key}`),
                        value: t(`status.${key}`),
                    }))
                    .filter((value, index, array) => index === array.findIndex((v) => v.value === value.value))
                    .sort((lhs, rhs) => compareStrings(lhs.label, rhs.label)),
                tableFilterFn: (selectedValues, cluster) => selectedValues.includes(t(`status.${cluster.status}`)),
            },
        ]
    }, [])

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
