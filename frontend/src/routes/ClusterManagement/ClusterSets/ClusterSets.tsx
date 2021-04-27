/* Copyright Contributors to the Open Cluster Management project */

import {
    AcmAlertContext,
    AcmButton,
    AcmEmptyState,
    AcmInlineStatusGroup,
    AcmLabels,
    AcmLaunchLink,
    AcmPageContent,
    AcmTable,
} from '@open-cluster-management/ui-components'
import { Card, CardBody, PageSection } from '@patternfly/react-core'
import { fitContent, TableGridBreakpoint } from '@patternfly/react-table'
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
} from '../../../atoms'
import { BulkActionModel, errorIsNot, IBulkActionModelProps } from '../../../components/BulkActionModel'
import { mapAddons } from '../../../lib/get-addons'
import { Cluster, mapClusters } from '../../../lib/get-cluster'
import { canUser } from '../../../lib/rbac-util'
import { deleteResource, ResourceErrorCode } from '../../../lib/resource-request'
// import { ResourceErrorCode } from '../../../lib/resource-request'
import { NavigationPath } from '../../../NavigationPath'
import {
    ManagedClusterSet,
    ManagedClusterSetDefinition,
    managedClusterSetLabel,
} from '../../../resources/managed-cluster-set'
import { usePageContext } from '../ClusterManagement'
import { ClusterSetActionDropdown } from './components/ClusterSetActionDropdown'
import { ClusterStatuses } from './components/ClusterStatuses'
import { CreateClusterSetModal } from './CreateClusterSet/CreateClusterSetModal'

export default function ClusterSetsPage() {
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
                <Card isLarge>
                    <CardBody>
                        <ClusterSetsTable clusters={clusters} managedClusterSets={managedClusterSets} />{' '}
                    </CardBody>
                </Card>
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

    const [clusterPools] = useRecoilValue(waitForAll([clusterPoolsState]))

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
                header: t('table.clusters'),
                sort: 'status',
                cell: (managedClusterSet: ManagedClusterSet) => (
                    <ClusterStatuses managedClusterSet={managedClusterSet} />
                ),
            },
            {
                header: t('table.clusterPools'),
                cell: (managedClusterSet: ManagedClusterSet) => {
                    return clusterPools.filter(
                        (cp) => cp.metadata.labels?.[managedClusterSetLabel] === managedClusterSet.metadata.name
                    ).length
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
                gridBreakPoint={TableGridBreakpoint.none}
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
                        header: t('table.clusters'),
                        cell: (managedClusterSet: ManagedClusterSet) => {
                            return <ClusterStatuses managedClusterSet={managedClusterSet} />
                        },
                    },
                    {
                        header: t('table.clusterPools'),
                        cell: (managedClusterSet: ManagedClusterSet) => {
                            return clusterPools.filter(
                                (cp) => cp.metadata.labels?.[managedClusterSetLabel] === managedClusterSet.metadata.name
                            ).length
                        },
                    },
                    {
                        header: t('table.labels'),
                        search: (managedClusterSet) =>
                            managedClusterSet.metadata.labels
                                ? Object.keys(managedClusterSet.metadata.labels).map(
                                      (key) => `${key}=${managedClusterSet.metadata.labels![key]}`
                                  )
                                : '',
                        cell: (managedClusterSet) =>
                            managedClusterSet.metadata.labels ? (
                                <AcmLabels labels={managedClusterSet.metadata.labels} style={{ maxWidth: '600px' }} />
                            ) : (
                                '-'
                            ),
                    },
                    {
                        header: t('table.nodes'),
                        cell: (managedClusterSet: ManagedClusterSet) => {
                            const clusters =
                                props.clusters?.filter(
                                    (cluster) => cluster?.clusterSet === managedClusterSet.metadata.name
                                ) ?? []

                            let healthy = 0
                            let danger = 0
                            let unknown = 0

                            clusters.forEach((cluster) => {
                                healthy += cluster.nodes!.ready
                                danger += cluster.nodes!.unhealthy
                                unknown += cluster.nodes!.unknown
                            })

                            return healthy + danger + unknown > 0 ? (
                                <AcmInlineStatusGroup healthy={healthy} danger={danger} unknown={unknown} />
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
