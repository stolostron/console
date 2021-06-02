/* Copyright Contributors to the Open Cluster Management project */

import {
    AcmAlertContext,
    AcmButton,
    AcmEmptyState,
    AcmExpandableCard,
    AcmLabels,
    AcmLaunchLink,
    AcmPageContent,
    AcmTable,
} from '@open-cluster-management/ui-components'
import { Flex, FlexItem, PageSection, Stack, Text, TextContent, TextVariants } from '@patternfly/react-core'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { fitContent } from '@patternfly/react-table'
import { Fragment, useContext, useEffect, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useRecoilValue, waitForAll } from 'recoil'
import {
    certificateSigningRequestsState,
    clusterDeploymentsState,
    clusterManagementAddonsState,
    clusterPoolsState,
    managedClusterAddonsState,
    managedClusterInfosState,
    managedClusterSetsState,
    managedClustersState,
    managedClusterSetBindingsState,
} from '../../../atoms'
import { BulkActionModel, errorIsNot, IBulkActionModelProps } from '../../../components/BulkActionModel'
import { DOC_LINKS } from '../../../lib/doc-util'
import { mapAddons } from '../../../lib/get-addons'
import { Cluster, mapClusters } from '../../../lib/get-cluster'
import { canUser } from '../../../lib/rbac-util'
import { deleteResource, ResourceErrorCode } from '../../../lib/resource-request'
import { NavigationPath } from '../../../NavigationPath'
import {
    ManagedClusterSet,
    ManagedClusterSetDefinition,
    managedClusterSetLabel,
} from '../../../resources/managed-cluster-set'
import { usePageContext } from '../ClusterManagement'
import { MultiClusterNetworkStatus } from './components/MultiClusterNetworkStatus'
import { ClusterSetActionDropdown } from './components/ClusterSetActionDropdown'
import { ClusterStatuses } from './components/ClusterStatuses'
import { CreateClusterSetModal } from './CreateClusterSet/CreateClusterSetModal'
import { TechPreviewAlert } from '../../../components/TechPreviewAlert'

export default function ClusterSetsPage() {
    const { t } = useTranslation(['cluster', 'common'])
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
            clusterPoolsState,
        ])
    )

    let clusters = mapClusters(
        clusterDeployments,
        managedClusterInfos,
        certificateSigningRequests,
        managedClusters,
        managedClusterAddons
    )
    clusters = clusters.filter((cluster) => cluster?.clusterSet)

    usePageContext(clusters.length > 0, PageActions)
    return (
        <AcmPageContent id="clusters">
            <PageSection>
                <TechPreviewAlert i18nKey="cluster:preview.clusterSets" docHref={DOC_LINKS.CLUSTER_SETS} />
                <Stack hasGutter style={{ height: 'unset' }}>
                    <AcmExpandableCard title={t('common:learn.terminology')} id="cluster-sets-learn">
                        <Flex spaceItems={{ default: 'spaceItemsLg' }}>
                            <FlexItem flex={{ default: 'flex_1' }}>
                                <TextContent>
                                    <Text component={TextVariants.h4}>{t('clusterSets')}</Text>
                                    <Text component={TextVariants.p}>{t('learn.clusterSets')}</Text>
                                </TextContent>
                            </FlexItem>
                            <FlexItem flex={{ default: 'flex_1' }}>
                                <TextContent>
                                    <Text component={TextVariants.h4}>{t('submariner')}</Text>
                                    <Text component={TextVariants.p}>{t('learn.submariner')}</Text>
                                </TextContent>
                            </FlexItem>
                        </Flex>
                        <Flex justifyContent={{ default: 'justifyContentFlexEnd' }}>
                            <FlexItem>
                                <AcmButton
                                    onClick={() => window.open(DOC_LINKS.CLUSTER_SETS, '_blank')}
                                    variant="link"
                                    role="link"
                                    icon={<ExternalLinkAltIcon />}
                                    iconPosition="right"
                                >
                                    {t('common:view.documentation')}
                                </AcmButton>
                            </FlexItem>
                        </Flex>
                    </AcmExpandableCard>
                    <Stack>
                        <ClusterSetsTable clusters={clusters} managedClusterSets={managedClusterSets} />
                    </Stack>
                </Stack>
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

export function ClusterSetsTable(props: { clusters?: Cluster[]; managedClusterSets?: ManagedClusterSet[] }) {
    const { t } = useTranslation(['cluster'])
    const [modalProps, setModalProps] = useState<IBulkActionModelProps<ManagedClusterSet> | { open: false }>({
        open: false,
    })
    const [createClusterSetModalOpen, setCreateClusterSetModalOpen] = useState<boolean>(false)
    const [canCreateClusterSet, setCanCreateClusterSet] = useState<boolean>(false)
    useEffect(() => {
        const canCreateManagedClusterSet = canUser('create', ManagedClusterSetDefinition)
        canCreateManagedClusterSet.promise
            .then((result) => setCanCreateClusterSet(result.status?.allowed!))
            .catch((err) => console.error(err))
        return () => canCreateManagedClusterSet.abort()
    }, [])

    const [clusterPools, managedClusterSetBindings] = useRecoilValue(
        waitForAll([clusterPoolsState, managedClusterSetBindingsState])
    )

    const modalColumns = useMemo(
        () => [
            {
                header: t('table.name'),
                cell: (managedClusterSet: ManagedClusterSet) => (
                    <span style={{ whiteSpace: 'nowrap' }}>{managedClusterSet.metadata.name}</span>
                ),
                sort: 'name',
            },
            {
                header: t('table.networkStatus'),
                cell: (managedClusterSet: ManagedClusterSet) => {
                    return <MultiClusterNetworkStatus clusterSet={managedClusterSet} />
                },
            },
            {
                header: t('table.clusters'),
                sort: 'status',
                cell: (managedClusterSet: ManagedClusterSet) => (
                    <ClusterStatuses managedClusterSet={managedClusterSet} />
                ),
            },
            {
                header: t('table.clusterPools'),
                cell: (managedClusterSet: ManagedClusterSet) => {
                    const pools = clusterPools.filter(
                        (cp) => cp.metadata.labels?.[managedClusterSetLabel] === managedClusterSet.metadata.name
                    )
                    if (pools.length === 0) {
                        return '-'
                    } else {
                        return pools.length
                    }
                },
            },
        ],
        [t, clusterPools]
    )

    function mckeyFn(managedClusterSet: ManagedClusterSet) {
        return managedClusterSet.metadata.name!
    }

    return (
        <Fragment>
            <CreateClusterSetModal
                isOpen={createClusterSetModalOpen}
                onClose={() => setCreateClusterSetModalOpen(false)}
            />
            <BulkActionModel<ManagedClusterSet> {...modalProps} />
            <AcmTable<ManagedClusterSet>
                plural="clusterSets"
                items={props.managedClusterSets}
                columns={[
                    {
                        header: t('table.name'),
                        sort: 'metadata.name',
                        search: 'metadata.name',
                        cell: (managedClusterSet: ManagedClusterSet) => (
                            <span style={{ whiteSpace: 'nowrap' }}>
                                <Link
                                    to={NavigationPath.clusterSetOverview.replace(
                                        ':id',
                                        managedClusterSet.metadata.name as string
                                    )}
                                >
                                    {managedClusterSet.metadata.name}
                                </Link>
                            </span>
                        ),
                    },
                    {
                        header: t('table.networkStatus'),
                        cell: (managedClusterSet: ManagedClusterSet) => {
                            return <MultiClusterNetworkStatus clusterSet={managedClusterSet} />
                        },
                    },
                    {
                        header: t('table.clusters'),
                        cell: (managedClusterSet: ManagedClusterSet) => {
                            return <ClusterStatuses managedClusterSet={managedClusterSet} />
                        },
                    },
                    {
                        header: t('table.clusterPools'),
                        cell: (managedClusterSet: ManagedClusterSet) => {
                            const pools = clusterPools.filter(
                                (cp) => cp.metadata.labels?.[managedClusterSetLabel] === managedClusterSet.metadata.name
                            )
                            if (pools.length === 0) {
                                return '-'
                            } else {
                                return pools.length === 1
                                    ? t('clusterPools.one')
                                    : t('clusterPools.multiple', { number: pools.length })
                            }
                        },
                    },
                    {
                        header: t('table.clusterSetBinding'),
                        tooltip: t('clusterSetBinding.edit.message.noBold'),
                        cell: (managedClusterSet) => {
                            const bindings = managedClusterSetBindings.filter(
                                (mcsb) => mcsb.spec.clusterSet === managedClusterSet.metadata.name!
                            )
                            const namespaces = bindings.map((mcsb) => mcsb.metadata.namespace!)
                            return namespaces.length ? (
                                <AcmLabels
                                    labels={namespaces}
                                    collapse={namespaces.filter((ns, i) => i > 1)}
                                    style={{ maxWidth: '600px' }}
                                />
                            ) : (
                                '-'
                            )
                        },
                    },
                    {
                        header: '',
                        cell: (managedClusterSet) => {
                            return <ClusterSetActionDropdown managedClusterSet={managedClusterSet} isKebab={true} />
                        },
                        cellTransforms: [fitContent],
                    },
                ]}
                keyFn={mckeyFn}
                key="clusterSetsTable"
                bulkActions={[
                    {
                        id: 'deleteClusterSets',
                        title: t('bulk.delete.sets'),
                        click: (managedClusterSets) => {
                            setModalProps({
                                open: true,
                                title: t('bulk.title.deleteSet'),
                                action: t('delete'),
                                processing: t('deleting'),
                                resources: managedClusterSets,
                                description: t('bulk.message.deleteSet'),
                                columns: modalColumns,
                                keyFn: (managedClusterSet) => managedClusterSet.metadata.name as string,
                                actionFn: deleteResource,
                                close: () => setModalProps({ open: false }),
                                isDanger: true,
                                confirmText: t('confirm').toLowerCase(),
                                isValidError: errorIsNot([ResourceErrorCode.NotFound]),
                            })
                        },
                    },
                ]}
                tableActions={[
                    {
                        id: 'createClusterSet',
                        title: t('managed.createClusterSet'),
                        click: () => setCreateClusterSetModalOpen(true),
                        isDisabled: !canCreateClusterSet,
                        tooltip: t('common:rbac.unauthorized'),
                    },
                ]}
                rowActions={[]}
                emptyState={
                    <AcmEmptyState
                        key="mcEmptyState"
                        title={t('managed.clusterSets.emptyStateHeader')}
                        message={
                            <Trans
                                i18nKey={'cluster:managed.clusterSets.emptyStateMsg'}
                                components={{ bold: <strong />, p: <p /> }}
                            />
                        }
                        action={
                            <AcmButton
                                role="link"
                                onClick={() => setCreateClusterSetModalOpen(true)}
                                isDisabled={!canCreateClusterSet}
                                tooltip={t('common:rbac.unauthorized')}
                            >
                                {t('managed.createClusterSet')}
                            </AcmButton>
                        }
                    />
                }
            />
        </Fragment>
    )
}
