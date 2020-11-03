import {
    AcmEmptyState,
    AcmLoadingPage,
    AcmPageCard,
    AcmTable,
    IAcmTableColumn,
} from '@open-cluster-management/ui-components'
import { Page } from '@patternfly/react-core'
import React, { useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ErrorPage } from '../../../components/ErrorPage'
<<<<<<< HEAD
import { client } from '../../../lib/apollo-client'
import { ManagedClusters, ManagedCluster } from '../../../lib/ManagedCluster'
=======
import { ManagedCluster, ManagedClusters, managedClusters } from '../../../lib/ManagedCluster'
>>>>>>> e2e6d52989360e29977403ee0194bc59f6d55ec0
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
<<<<<<< HEAD
        return <AcmPageCard><AcmEmptyState title="No clusters found." message="No managed clusters found." action="Create cluster" /></AcmPageCard>
=======
        return (
            <AcmPageCard>
                <AcmEmptyState
                    title="No clusters found."
                    message="No managed clusters found."
                    // action="Create cluster"
                />
            </AcmPageCard>
        )
>>>>>>> e2e6d52989360e29977403ee0194bc59f6d55ec0
    }
    return (
        <AcmPageCard>
            <ClustersTable managedClusters={managedClustersQuery.data.items} />
        </AcmPageCard>
    )
}

export function ClustersTable(props: { managedClusters: ManagedCluster[] }) {
    const { t } = useTranslation(['cluster'])
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
            // cell: (managedCluster) => <AcmLabels labels={managedCluster.metadata.labels} />,
            cell: (managedCluster) => <div>-</div>,
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
            emptyState={{ title: '', message: '' }}
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
<<<<<<< HEAD
                { id: 'destroyCluster', title: 'Destroy', click: (items) => {} },
                { id: 'detachCluster', title: 'Detach', click: (items) => {} },
                { id: 'upgradeClusters', title: 'Upgrade', click: (items) => {} },
=======
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
>>>>>>> e2e6d52989360e29977403ee0194bc59f6d55ec0
            ]}
            rowActions={[
                { id: 'editLabels', title: 'Edit labels', click: (managedCluster) => {} },
                { id: 'launchToCluster', title: 'Launch to cluster', click: (managedCluster) => {} },
                { id: 'upgradeCluster', title: 'Upgrade cluster', click: (managedCluster) => {} },
                { id: 'searchCluster', title: 'Search cluster', click: (managedCluster) => {} },
                { id: 'detachCluster', title: 'Detach cluster', click: (managedCluster) => {} },
            ]}
<<<<<<< HEAD
=======
            emptyState={<AcmEmptyState title="No managed clusters found" />}
>>>>>>> e2e6d52989360e29977403ee0194bc59f6d55ec0
        />
    )
}
