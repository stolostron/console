import {
    AcmEmptyState,
    AcmLabels,
    AcmLoadingPage,
    AcmPageCard,
    AcmTable,
    IAcmTableColumn,
} from '@open-cluster-management/ui-components'
import { Page } from '@patternfly/react-core'
import React, { useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { ErrorPage } from '../../../components/ErrorPage'
import { ManagedCluster, ManagedClusters, managedClusters } from '../../../lib/ManagedCluster'
import { ClusterManagementPageHeader, NavigationPath } from '../ClusterManagement'

export function ClustersPage() {
    return (
        <Page>
            <ClusterManagementPageHeader />
            <ClustersPageContent />
        </Page>
    )
}

export function ClustersPageContent() {
    const managedClustersQuery = ManagedClusters()

    useEffect(() => {
        managedClustersQuery.startPolling(10 * 1000)
        return managedClustersQuery.stopPolling
    }, [managedClustersQuery])

    if (managedClustersQuery.loading) {
        return <AcmLoadingPage />
    } else if (managedClustersQuery.error) {
        return <ErrorPage error={managedClustersQuery.error} />
    } else if (!managedClustersQuery.data?.items || managedClustersQuery.data.items.length === 0) {
        return (
            <AcmPageCard>
                <AcmEmptyState
                    title="No clusters found."
                    message="No managed clusters found."
                    // action="Create cluster"
                />
            </AcmPageCard>
        )
    }
    return (
        <AcmPageCard>
            <ClustersTable
                managedClusters={managedClustersQuery.data.items}
                deleteCluster={managedClusters.delete}
                refresh={managedClustersQuery.refresh}
            />
        </AcmPageCard>
    )
}

export function ClustersTable(props: {
    managedClusters: ManagedCluster[]
    deleteCluster: (name: string, namespace: string) => void
    refresh: () => void
}) {
    const columns: IAcmTableColumn<ManagedCluster>[] = [
        {
            header: 'Name',
            sort: 'metadata.name',
            search: 'metadata.name',
            cell: 'metadata.name',
        },
        {
            header: 'Status',
            sort: 'displayStatus',
            search: 'displayStatus',
            cell: (managedCluster) => (
                <span style={{ whiteSpace: 'nowrap' }} key="2">
                    -
                    {/* {managedCluster.displayStatus === 'Ready' ? (
                        <CheckIcon color="green" key="ready-icon" />
                    ) : (
                        <Fragment key="ready-icon"></Fragment>
                    )}
                    {managedCluster.displayStatus === 'Pending import' ? (
                        <MinusCircleIcon color="grey" key="pending-icon" />
                    ) : (
                        <Fragment key="pending-icon"></Fragment>
                    )}
                    {managedCluster.displayStatus === 'Offline' ? (
                        <ExclamationIcon color="red" key="offline-icon" />
                    ) : (
                        <Fragment key="offline-icon"></Fragment>
                    )}
                    <span key="status">&nbsp; {managedCluster.displayStatus}</span> */}
                </span>
            ),
        },
        {
            header: 'Distribution',
            sort: 'status.version.kubernetes',
            search: 'status.version.kubernetes',
            cell: 'status.version.kubernetes',
        },
        {
            header: 'Labels',
            search: 'metadata.labels',
            cell: (managedCluster) => <AcmLabels labels={managedCluster.metadata.labels} />,
        },
        {
            header: 'Nodes',
            // sort: 'info.status.nodeList.length',
            cell: (managedCluster) => <div>-</div>,
        },
    ]
    function keyFn(managedCluster: ManagedCluster) {
        return managedCluster.metadata.uid!
    }
    const history = useHistory()
    return (
        <AcmTable<ManagedCluster>
            emptyState={<AcmEmptyState title="No managed clusters found" />}
            plural="clusters"
            items={props.managedClusters}
            columns={columns}
            keyFn={keyFn}
            tableActions={[
                {
                    id: 'createCluster',
                    title: 'Create cluster',
                    click: () => history.push(NavigationPath.createCluster),
                },
                {
                    id: 'importCluster',
                    title: 'Import cluster',
                    click: () => history.push(NavigationPath.importCluster),
                },
            ]}
            bulkActions={[
                {
                    id: 'destroyCluster',
                    title: 'Destroy',
                    click: (managedClusters) => {
                        // TODO props.deleteCluster
                        props.refresh()
                    },
                },
                { id: 'detachCluster', title: 'Detach', click: (managedClusters) => {} },
                { id: 'upgradeClusters', title: 'Upgrade', click: (managedClusters) => {} },
            ]}
            rowActions={[
                { id: 'editLabels', title: 'Edit labels', click: (managedCluster) => {} },
                { id: 'launchToCluster', title: 'Launch to cluster', click: (managedCluster) => {} },
                { id: 'upgradeCluster', title: 'Upgrade cluster', click: (managedCluster) => {} },
                { id: 'searchCluster', title: 'Search cluster', click: (managedCluster) => {} },
                { id: 'detachCluster', title: 'Detach cluster', click: (managedCluster) => {} },
            ]}
        />
    )
}
