import { Button, Page } from '@patternfly/react-core'
import CheckIcon from '@patternfly/react-icons/dist/js/icons/check-circle-icon'
import { default as ExclamationIcon } from '@patternfly/react-icons/dist/js/icons/exclamation-circle-icon'
import MinusCircleIcon from '@patternfly/react-icons/dist/js/icons/minus-circle-icon'
import { ICell, sortable } from '@patternfly/react-table'
import React, { Fragment } from 'react'
import { useHistory } from 'react-router-dom'
import { AcmLabels } from '../../../components/AcmLabels'
import { AcmPageCard } from '../../../components/AcmPage'
import { AcmTable, compareNumbers, compareStrings } from '../../../components/AcmTable'
import { EmptyPage } from '../../../components/EmptyPage'
import { ErrorPage } from '../../../components/ErrorPage'
import { LoadingPage } from '../../../components/LoadingPage'
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
        return <LoadingPage />
    } else if (error) {
        return <ErrorPage error={error} />
    } else if (!data?.managedClusters || data.managedClusters.length === 0) {
        return <EmptyPage title="No clusters found." message="No managed clusters found." action="Create cluster" />
    }
    return (
        <AcmPageCard>
            <ClustersTable managedClusters={data.managedClusters as ManagedCluster[]} />
        </AcmPageCard>
    )
}

export function ClustersTable(props: { managedClusters: ManagedCluster[] }) {
    const columns: ICell[] = [
        { title: 'Name', transforms: [sortable] },
        { title: 'Status', transforms: [sortable] },
        { title: 'Distribution', transforms: [sortable] },
        { title: 'Labels' },
        { title: 'Nodes', transforms: [sortable] },
    ]
    function sortFn(managedClusters: ManagedCluster[], column: number) {
        switch (column) {
            case 1:
                managedClusters = managedClusters.sort((a, b) => compareStrings(a.metadata.name, b.metadata.name))
                break
            case 2:
                managedClusters = managedClusters.sort((a, b) => compareStrings(a.displayStatus, b.displayStatus))
                break
            case 3:
                managedClusters = managedClusters.sort((a, b) =>
                    compareStrings(a?.status?.version?.kubernetes, b?.status?.version?.kubernetes)
                )
                break
            case 5:
                managedClusters = managedClusters.sort((a, b) =>
                    compareNumbers(a?.info?.status?.nodeList?.length, b?.info?.status?.nodeList?.length)
                )
                break
        }
        return managedClusters
    }
    function keyFn(secret: ManagedCluster) {
        return secret.metadata.uid
    }
    function cellsFn(managedCluster: ManagedCluster) {
        return [
            <Button key="column-1" variant="link" isInline>
                {managedCluster?.metadata?.name}
            </Button>,
            <Fragment key="column-2">
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
            </Fragment>,
            <Fragment key="column-3">
                {managedCluster?.status?.version?.kubernetes ? managedCluster?.status?.version?.kubernetes : '-'}
            </Fragment>,
            <Fragment key="column-4">
                <AcmLabels labels={managedCluster?.metadata?.labels} />
            </Fragment>,
            <Fragment key="column-5">
                {managedCluster?.info?.status?.nodeList?.length ? managedCluster?.info?.status?.nodeList?.length : '-'}
            </Fragment>,
        ]
    }
    const history = useHistory()
    return (
        <AcmTable<ManagedCluster>
            plural="clusters"
            items={props.managedClusters}
            searchKeys={['metadata.name', 'metadata.labels', 'displayStatus']}
            columns={columns}
            sortFn={sortFn}
            keyFn={keyFn}
            cellsFn={cellsFn}
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
