/* Copyright Contributors to the Open Cluster Management project */

import { Fragment, useContext, useEffect, useState, useMemo } from 'react'
import {
    AcmAlertContext,
    AcmEmptyState,
    AcmInlineStatusGroup,
    AcmLaunchLink,
    AcmPageContent,
    AcmTable,
    AcmButton,
    AcmLabels,
} from '@open-cluster-management/ui-components'
import { PageSection } from '@patternfly/react-core'
import { fitContent, TableGridBreakpoint } from '@patternfly/react-table'
import { useTranslation, Trans } from 'react-i18next'
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
} from '../../../atoms'
import { BulkActionModel, errorIsNot, IBulkActionModelProps } from '../../../components/BulkActionModel'
import { mapAddons } from '../../../lib/get-addons'
import { Cluster, mapClusters } from '../../../lib/get-cluster'
import { canUser } from '../../../lib/rbac-util'
// import { ResourceErrorCode } from '../../../lib/resource-request'
import { NavigationPath } from '../../../NavigationPath'
import { ManagedClusterSet, ManagedClusterSetDefinition } from '../../../resources/managed-cluster-set'
import { usePageContext } from '../ClusterManagement'
import { ClusterStatuses } from './components/ClusterStatuses'
import { ClusterSetActionDropdown } from './components/ClusterSetActionDropdown'
import { deleteResource, ResourceErrorCode } from '../../../lib/resource-request'

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
            <PageSection variant="light" isFilled={true}>
                <ClusterSetsTable clusters={clusters} managedClusterSets={managedClusterSets} />
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
    const history = useHistory()
    const [canCreateClusterSet, setCanCreateClusterSet] = useState<boolean>(false)
    useEffect(() => {
        const canCreateManagedClusterSet = canUser('create', ManagedClusterSetDefinition)
        canCreateManagedClusterSet.promise
            .then((result) => setCanCreateClusterSet(result.status?.allowed!))
            .catch((err) => console.error(err))
        return () => canCreateManagedClusterSet.abort()
    }, [])

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
        ],
        [t]
    )

    function mckeyFn(managedClusterSet: ManagedClusterSet) {
        return managedClusterSet.metadata.name!
    }

    return (
        <Fragment>
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
                        click: () => history.push(NavigationPath.createClusterSet),
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
                                onClick={() => history.push(NavigationPath.createClusterSet)}
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
