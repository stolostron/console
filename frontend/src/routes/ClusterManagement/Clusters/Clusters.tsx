import {
    AcmEmptyState,
    AcmLabels,
    AcmPageCard,
    AcmTable,
    IAcmTableColumn,
} from '@open-cluster-management/ui-components'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useHistory } from 'react-router-dom'
import { deleteResource } from '../../../lib/resource-request'
import { useQuery } from '../../../lib/useQuery'
import { NavigationPath } from '../../../NavigationPath'
import { listManagedClusters, ManagedCluster } from '../../../resources/managed-cluster'

const managedClusterCols: IAcmTableColumn<ManagedCluster>[] = [
    {
        header: 'Name',
        sort: 'metadata.name',
        search: 'metadata.name',
        cell: (managedCluster) => (
            <Link to={NavigationPath.clusterDetails.replace(':id', managedCluster.metadata.name as string)}>
                {managedCluster.metadata.name}
            </Link>
        ),
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

export default function ClustersPage() {
    return <ClustersPageContent />
}

export function ClustersPageContent() {
    const managedClustersQuery = useQuery(listManagedClusters)
    useEffect(() => {
        managedClustersQuery.startPolling(10 * 1000)
        return managedClustersQuery.stopPolling
    }, [managedClustersQuery])

    return (
        <AcmPageCard>
            <ClustersTable
                managedClusters={managedClustersQuery.data}
                deleteCluster={deleteResource}
                refresh={managedClustersQuery.refresh}
            />
        </AcmPageCard>
    )
}

export function ClustersTable(props: {
    managedClusters?: ManagedCluster[]
    deleteCluster: (managedCluster: ManagedCluster) => void
    refresh: () => void
}) {
    sessionStorage.removeItem('DiscoveredClusterName')
    sessionStorage.removeItem("DiscoveredClusterConsoleURL")

    const { t } = useTranslation(['cluster'])

    function mckeyFn(cluster: ManagedCluster) {
        return cluster.metadata.uid!
    }

    const history = useHistory()
    return (
        <AcmTable<ManagedCluster>
            plural="clusters"
            items={props.managedClusters ?? []}
            columns={managedClusterCols}
            keyFn={mckeyFn}
            key="managedClustersTable"
            tableActions={[
                {
                    id: 'createCluster',
                    title: t('managed.createCluster'),
                    click: () => history.push(NavigationPath.createCluster),
                },
                {
                    id: 'importCluster',
                    title: t('managed.importCluster'),
                    click: () => history.push(NavigationPath.importCluster),
                },
            ]}
            bulkActions={[
                {
                    id: 'destroyCluster',
                    title: t('managed.destroy'),
                    click: (managedClusters) => {
                        // TODO props.deleteCluster
                        props.refresh()
                    },
                },
                { id: 'detachCluster', title: t('managed.detachSelected'), click: (managedClusters) => {} },
                { id: 'upgradeClusters', title: t('managed.upgradeSelected'), click: (managedClusters) => {} },
            ]}
            rowActions={[
                { id: 'editLabels', title: t('managed.editLabels'), click: (managedCluster) => {} },
                { id: 'launchToCluster', title: t('managed.launch'), click: (managedCluster) => {} },
                { id: 'upgradeCluster', title: t('managed.upgrade'), click: (managedCluster) => {} },
                { id: 'searchCluster', title: t('managed.search'), click: (managedCluster) => {} },
                { id: 'detachCluster', title: t('managed.detached'), click: (managedCluster) => {} },
            ]}
            emptyState={<AcmEmptyState title={t('managed.emptyStateHeader')} key="mcEmptyState" />}
        />
    )
}
