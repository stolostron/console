import {
    AcmEmptyState,
    AcmPageCard,
    AcmTable,
    IAcmTableColumn,
} from '@open-cluster-management/ui-components'
import { useHistory } from 'react-router-dom'
import { ManagedCluster, ManagedClusters, managedClusters } from '../../../lib/ManagedCluster'
import { DiscoveredCluster, DiscoveredClusters } from '../../../lib/DiscoveredCluster'
import { Page, ToggleGroup, ToggleGroupItem } from '@patternfly/react-core'
import CheckIcon from '@patternfly/react-icons/dist/js/icons/check-circle-icon'
import AWSIcon from '@patternfly/react-icons/dist/js/icons/aws-icon'
import { default as ExclamationIcon } from '@patternfly/react-icons/dist/js/icons/exclamation-circle-icon'
import React, { Fragment, useEffect, useState} from 'react'
import { ClusterManagementPageHeader, NavigationPath } from '../ClusterManagement'
let moment = require('moment');

const managedClusterCols: IAcmTableColumn<ManagedCluster>[] = [
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

const discoveredClusterCols: IAcmTableColumn<DiscoveredCluster>[] = [
    {
        header: 'Name',
        sort: 'info.name',
        search: 'info.name',
        cell: (discoveredCluster) => (
            <span style={{ whiteSpace: 'nowrap' }} key="dcName">
                <a href={discoveredCluster.info.console} key="dcConsoleURL"><span key="dcNamelink">&nbsp; {discoveredCluster.info.name}</span></a>
            </span>
        )
    },
    {
        header: 'Status',
        sort: 'info.status',
        search: 'info.status',
        cell: (discoveredCluster) => (
            <span style={{ whiteSpace: 'nowrap' }} key="dcStatusParent">
                {discoveredCluster.info.status === 'Active' ? (
                    <CheckIcon color="green" key="ready-icon" />
                ) : (
                    <Fragment key="ready-icon"></Fragment>
                )}
                {discoveredCluster.info.status !== 'Active' ? (
                    <ExclamationIcon color="red" key="offline-icon" />
                ) : (
                    <Fragment key="offline-icon"></Fragment>
                )}
                <span key="dcStatus">&nbsp; {discoveredCluster.info.status}</span>
            </span>
        ),
    },
    {
        header: 'Connected From',
        cell: (discoveredCluster) => (
            <span key="connectedFrom">&nbsp; {discoveredCluster.metadata.ownerReferences?.[0].name ?? "N/A"}</span>
        ),
    },
    {
        header: 'Distribution Version',
        sort: 'info.openshiftVersion',
        cell: 'info.openshiftVersion',
    },
    {
        header: 'Infrastructure Provider',
        sort: 'info.cloudProvider',
        cell: (discoveredCluster) => (
            <span style={{ whiteSpace: 'nowrap' }} key="dcCloudProviderParent">
                {discoveredCluster.info.cloudProvider === 'aws' ? 
                    [
                        <AWSIcon key="aws-icon"/>,
                        <span key="dcCloudProvider"> Amazon Web Services</span>
                    ] 
                    : 
                    discoveredCluster.info.cloudProvider
                }
            </span>
        ),
    },
    {
        header: 'Last Active',
        sort: 'info.activity_timestamp',
        cell: (discoveredCluster) => (
            <span style={{ whiteSpace: 'nowrap' }} key="dcLastActive">
                {discoveredCluster.info.activity_timestamp === undefined ? 
                    [
                        "N/A"
                    ] 
                    : 
                        moment.duration(Math.abs(new Date().getTime() - new Date(discoveredCluster.info.activity_timestamp).getTime())).humanize()
                }
            </span>
        )
    },
    {
        header: 'Created',
        sort: 'info.creation_timestamp',
        cell: (discoveredCluster) => (
            <span style={{ whiteSpace: 'nowrap' }} key="dcCreationTimestamp">
                {discoveredCluster.info.creation_timestamp === undefined ? 
                    [
                        "N/A"
                    ] 
                    : 
                    moment.duration(Math.abs(new Date().getTime() - new Date(discoveredCluster.info.creation_timestamp).getTime())).humanize()
                }
            </span>
        )
    },
    {
        header: 'Discovered',
        sort: 'metadata.creationTimestamp',
        cell: (discoveredCluster) => (
            <span style={{ whiteSpace: 'nowrap' }} key="dcObjCreationTimestamp">
                {discoveredCluster.info.creation_timestamp === undefined ? 
                    [
                        "N/A"
                    ] 
                    : 
                    moment.duration(Math.abs(new Date().getTime() - new Date(discoveredCluster.metadata.creationTimestamp ?? "").getTime())).humanize()
                }
            </span>
        )
    },
]

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
    const discoveredClustersQuery = DiscoveredClusters()

    useEffect(() => {
        managedClustersQuery.startPolling(10 * 1000)
        return managedClustersQuery.stopPolling
    }, [managedClustersQuery])

    useEffect(() => {
        discoveredClustersQuery.startPolling(10 * 1000)
        return discoveredClustersQuery.stopPolling
    }, [discoveredClustersQuery])

    // if (managedClustersQuery.loading || discoveredClustersQuery.loading) {
    //     return <AcmLoadingPage />
    // } else if (managedClustersQuery.error) {
    //     return <ErrorPage error={managedClustersQuery.error} />
    // } else if (discoveredClustersQuery.error) {
    //     return <ErrorPage error={discoveredClustersQuery.error} />
    // } 
    return (
        <AcmPageCard>
            <ClustersTable
                managedClusters={managedClustersQuery.data?.items || [] as ManagedCluster[]}
                discoveredCluster={discoveredClustersQuery.data?.items || [] as DiscoveredCluster[]}
                deleteCluster={managedClusters.delete}
                refresh={managedClustersQuery.refresh}
            />
        </AcmPageCard>
    )
}

export function ClustersTable(props: {
    managedClusters: ManagedCluster[]
    discoveredCluster: DiscoveredCluster[]
    deleteCluster: (name: string, namespace: string) => void
    refresh: () => void
}) {
    const [view, setView] = useState<string>('first')

    function mckeyFn(cluster: ManagedCluster) {
        return cluster.metadata.uid!
    }
    function dckeyFn(cluster: DiscoveredCluster) {
        return cluster.metadata.uid!
    }
    const history = useHistory()
    if (view === 'first') {
        return (
            <AcmTable<ManagedCluster>
                plural="clusters"
                items={props.managedClusters}
                columns={managedClusterCols}
                keyFn={mckeyFn}
                key="managedClustersTable"
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
                emptyState={<AcmEmptyState title="No managed clusters found" key="mcEmptyState"/>}
                extraToolbarControls={
                    <ToggleGroup>
                        <ToggleGroupItem isSelected={true} text="Managed" buttonId="first" onChange={(selected, event) => setView(event.currentTarget.id)}/>
                        <ToggleGroupItem isSelected={false} text="Discovered" buttonId="second" onChange={(selected, event) => setView(event.currentTarget.id)}/>
                    </ToggleGroup>
                }
            />
        )
    } else {
        return (
            <AcmTable<DiscoveredCluster>
                plural="discoveredclusters"
                items={props.discoveredCluster}
                columns={discoveredClusterCols}
                keyFn={dckeyFn}
                key="discoveredClustersTable"
                tableActions={[
                    {
                        id: 'editDiscoveryConfigBtn',
                        title: 'Edit filters for discovered clusters',
                        click: () => {}, // TODO: Make this button work
                    },
                ]}
                bulkActions={[]}
                rowActions={[
                    { id: 'importCluster', title: 'Import Cluster', click: (item) => {}, },
                ]}
                emptyState={<AcmEmptyState title="No discovered clusters found" key="dcEmptyState"/>}
                extraToolbarControls={
                    <ToggleGroup>
                        <ToggleGroupItem isSelected={false} text="Managed" buttonId="first" onChange={(selected, event) => setView(event.currentTarget.id)}/>
                        <ToggleGroupItem isSelected={true} text="Discovered" buttonId="second" onChange={(selected, event) => setView(event.currentTarget.id)}/>
                    </ToggleGroup>
                }
            />
        )
    }
}