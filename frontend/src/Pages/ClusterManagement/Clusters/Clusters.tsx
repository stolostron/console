import {
    AcmEmptyPage,
    AcmLabels,
    AcmLoadingPage,
    AcmPageCard,
    AcmTable,
    IAcmTableColumn,
} from '@open-cluster-management/ui-components'
import { Page } from '@patternfly/react-core'
import CheckIcon from '@patternfly/react-icons/dist/js/icons/check-circle-icon'
import { default as ExclamationIcon } from '@patternfly/react-icons/dist/js/icons/exclamation-circle-icon'
import MinusCircleIcon from '@patternfly/react-icons/dist/js/icons/minus-circle-icon'
import React, { Fragment } from 'react'
import { useHistory } from 'react-router-dom'
import { ErrorPage } from '../../../components/ErrorPage'
import { client } from '../../../lib/apollo-client'
import { ManagedCluster, useManagedClustersQuery } from '../../../sdk'
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
    const { loading, error, data } = useManagedClustersQuery({ client, pollInterval: 30 * 1000 })
    if (loading) {
        return <AcmLoadingPage />
    } else if (error) {
        return <ErrorPage error={error} />
    } else if (!data?.managedClusters || data.managedClusters.length === 0) {
        return <AcmEmptyPage title="No clusters found." message="No managed clusters found." action="Create cluster" />
    }
    return (
        <AcmPageCard>
            <ClustersTable managedClusters={data.managedClusters as ManagedCluster[]} />
        </AcmPageCard>
    )
}

export function ClustersTable(props: { managedClusters: ManagedCluster[] }) {
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
                    {managedCluster.displayStatus === 'Ready' ? (
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
                    <span key="status">&nbsp; {managedCluster.displayStatus}</span>
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
            sort: 'info.status.nodeList.length',
            cell: 'info.status.nodeList.length',
        },
    ]
    function keyFn(secret: ManagedCluster) {
        return secret.metadata.uid
    }
    const history = useHistory()
    return (
        <AcmTable<ManagedCluster>
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
                { id: 'destroyCluster', title: 'Destroy', click: (items) => {} },
                { id: 'detachCluster', title: 'Detach', click: (items) => {} },
                { id: 'upgradeClusters', title: 'Upgrade', click: (items) => {} },
            ]}
            rowActions={[
                { id: 'editLabels', title: 'Edit labels', click: (item) => {} },
                { id: 'launchToCluster', title: 'Launch to cluster', click: (item) => {} },
                { id: 'upgradeCluster', title: 'Upgrade cluster', click: (item) => {} },
                { id: 'searchCluster', title: 'Search cluster', click: (item) => {} },
                { id: 'detachCluster', title: 'Detach cluster', click: (item) => {} },
            ]}
        />
    )
}
