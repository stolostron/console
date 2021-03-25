/* Copyright Contributors to the Open Cluster Management project */

import { Fragment, useContext, useEffect, useState } from 'react'
import {
    AcmAlertContext,
    AcmEmptyState,
    AcmInlineStatusGroup,
    AcmLaunchLink,
    AcmPageContent,
    AcmTable,
    AcmButton,
} from '@open-cluster-management/ui-components'
import { PageSection } from '@patternfly/react-core'
import { TableGridBreakpoint } from '@patternfly/react-table'
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
} from '../../../atoms'
import { mapAddons } from '../../../lib/get-addons'
import { Cluster, mapClusters, ClusterStatus } from '../../../lib/get-cluster'
// import { ResourceErrorCode } from '../../../lib/resource-request'
import { NavigationPath } from '../../../NavigationPath'
import {
    ManagedClusterSet,
    ManagedClusterSetDefinition,
    managedClusterSetLabel,
} from '../../../resources/managed-cluster-set'
import { usePageContext } from '../ClusterManagement'
import { canUser } from '../../../lib/rbac-util'

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
    clusters = clusters.filter((cluster) => cluster.labels?.[managedClusterSetLabel])

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
    const history = useHistory()
    const [canCreateClusterSet, setCanCreateClusterSet] = useState<boolean>(false)
    useEffect(() => {
        const canCreateManagedClusterSet = canUser('create', ManagedClusterSetDefinition)
        canCreateManagedClusterSet.promise
            .then((result) => setCanCreateClusterSet(result.status?.allowed!))
            .catch((err) => console.error(err))
        return () => canCreateManagedClusterSet.abort()
    }, [])

    function mckeyFn(managedClusterSet: ManagedClusterSet) {
        return managedClusterSet.metadata.name!
    }

    return (
        <Fragment>
            <AcmTable<ManagedClusterSet>
                gridBreakPoint={TableGridBreakpoint.none}
                plural="clusterSets"
                items={props.managedClusterSets}
                columns={[
                    {
                        header: t('table.name'),
                        sort: 'name',
                        search: 'name',
                        cell: (managedClusterSet: ManagedClusterSet) => {
                            const clusters =
                                props.clusters?.filter(
                                    (cluster) =>
                                        cluster.labels?.[managedClusterSetLabel] === managedClusterSet.metadata.name
                                ) ?? []
                            return (
                                <span style={{ whiteSpace: 'nowrap' }}>
                                    {clusters.length > 0 ? (
                                        <Link
                                            to={NavigationPath.clusterSetDetails.replace(
                                                ':id',
                                                managedClusterSet.metadata.name as string
                                            )}
                                        >
                                            {managedClusterSet.metadata.name}
                                        </Link>
                                    ) : (
                                        managedClusterSet.metadata.name
                                    )}
                                </span>
                            )
                        },
                    },
                    {
                        header: t('table.clusters'),
                        cell: (managedClusterSet: ManagedClusterSet) => {
                            const clusters =
                                props.clusters?.filter(
                                    (cluster) =>
                                        cluster.labels?.[managedClusterSetLabel] === managedClusterSet.metadata.name
                                ) ?? []
                            let healthy = 0
                            let warning = 0
                            let progress = 0
                            let danger = 0
                            let pending = 0
                            let sleep = 0

                            clusters.forEach((cluster) => {
                                switch (cluster.status) {
                                    case ClusterStatus.ready:
                                        healthy++
                                        break
                                    case ClusterStatus.needsapproval:
                                        warning++
                                        break
                                    case ClusterStatus.creating:
                                    case ClusterStatus.destroying:
                                    case ClusterStatus.detaching:
                                    case ClusterStatus.stopping:
                                    case ClusterStatus.resuming:
                                        progress++
                                        break
                                    case ClusterStatus.failed:
                                    case ClusterStatus.provisionfailed:
                                    case ClusterStatus.deprovisionfailed:
                                    case ClusterStatus.notaccepted:
                                    case ClusterStatus.offline:
                                    case ClusterStatus.degraded:
                                        danger++
                                        break
                                    // temporary
                                    case ClusterStatus.hibernating:
                                        sleep++
                                        break
                                    case ClusterStatus.pending:
                                    case ClusterStatus.pendingimport:
                                        pending++
                                        break
                                    // detached clusters don't have a ManagedCluster
                                    case ClusterStatus.detached:
                                        break
                                }
                            })

                            return clusters.length === 0 ? (
                                '0'
                            ) : (
                                <AcmInlineStatusGroup
                                    healthy={healthy}
                                    warning={warning}
                                    progress={progress}
                                    danger={danger}
                                    pending={pending}
                                    sleep={sleep}
                                />
                            )
                        },
                    },
                    {
                        header: t('table.nodes'),
                        cell: (managedClusterSet: ManagedClusterSet) => {
                            const clusters =
                                props.clusters?.filter(
                                    (cluster) =>
                                        cluster.labels?.[managedClusterSetLabel] === managedClusterSet.metadata.name
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
                    // {
                    //     header: '',
                    //     cell: (managedClusterSet) => {
                    //         return <ClusterActionDropdown cluster={cluster} isKebab={true} />
                    //     },
                    //     cellTransforms: [fitContent],
                    // },
                ]}
                keyFn={mckeyFn}
                key="clusterSetsTable"
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
                        message={t('managed.clusterSetsemptyStateMsg')}
                        action={
                            <AcmButton
                                role="link"
                                onClick={() => history.push(NavigationPath.createClusterSet)}
                                disabled={!canCreateClusterSet}
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
