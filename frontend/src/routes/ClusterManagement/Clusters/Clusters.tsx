import {
    AcmButton,
    AcmEmptyState,
    AcmLabels,
    AcmPageCard,
    AcmTable,
    IAcmTableColumn,
} from '@open-cluster-management/ui-components'
import { Page, ToggleGroup, ToggleGroupItem } from '@patternfly/react-core'
import AWSIcon from '@patternfly/react-icons/dist/js/icons/aws-icon'
import CheckIcon from '@patternfly/react-icons/dist/js/icons/check-circle-icon'
import { default as ExclamationIcon } from '@patternfly/react-icons/dist/js/icons/exclamation-circle-icon'
import React, { Fragment, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useHistory } from 'react-router-dom'
import { deleteResource } from '../../../lib/resource-request'
import { useQuery } from '../../../lib/useQuery'
import { DiscoveredCluster, listDiscoveredClusters } from '../../../resources/discovered-cluster'
import { listManagedClusters, ManagedCluster } from '../../../resources/managed-cluster'
import { ClusterManagementPageHeader, NavigationPath } from '../ClusterManagement'
let moment = require('moment')

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

const discoveredClusterCols: IAcmTableColumn<DiscoveredCluster>[] = [
    {
        header: 'Name',
        sort: 'spec.name',
        search: 'spec.name',
        cell: (discoveredCluster) => (
            <span style={{ whiteSpace: 'nowrap' }} key="dcName">
                <a href={discoveredCluster.spec.console} key="dcConsoleURL">
                    <span key="dcNamelink">{discoveredCluster.spec.name}</span>
                </a>
            </span>
        ),
    },
    {
        header: 'Status',
        sort: 'spec.subscription.status',
        search: 'spec.subscription.status',
        cell: (discoveredCluster) => (
            <span style={{ whiteSpace: 'nowrap' }} key="dcStatusParent">
                {discoveredCluster.spec.subscription.status === 'Active' ? (
                    <CheckIcon color="green" key="ready-icon" />
                ) : (
                    <Fragment key="ready-icon"></Fragment>
                )}
                {discoveredCluster.spec.subscription.status !== 'Active' ? (
                    <ExclamationIcon color="red" key="offline-icon" />
                ) : (
                    <Fragment key="offline-icon"></Fragment>
                )}
                <span key="dcStatus">&nbsp; {capitalizeFirstLetter(discoveredCluster.spec.subscription.status)}</span>
            </span>
        ),
    },
    {
        header: 'Connected From',
        tooltip: 'TODO',
        cell: (discoveredCluster) => (
            <span key="connectedFrom">
                &nbsp;{' '}
                {discoveredCluster.spec.providerConnections === undefined
                    ? ['N/A']
                    : discoveredCluster.spec.providerConnections![0].name ?? 'N/A'}
            </span>
        ),
    },
    {
        header: 'Distribution Version',
        sort: 'spec.openshiftVersion',
        cell: (discoveredCluster) => (
            <span key="openShiftVersion">&nbsp; {'OpenShift '.concat(discoveredCluster.spec.openshiftVersion)}</span>
        ),
    },
    {
        header: 'Infrastructure Provider',
        sort: 'spec.cloudProvider',
        cell: (discoveredCluster) => (
            <span style={{ whiteSpace: 'nowrap' }} key="dcCloudProviderParent">
                {discoveredCluster.spec.cloudProvider === 'aws'
                    ? [<AWSIcon key="aws-icon" />, <span key="dcCloudProvider"> Amazon Web Services</span>]
                    : discoveredCluster.spec.cloudProvider}
            </span>
        ),
    },
    {
        header: 'Last Active',
        sort: 'spec.activity_timestamp',
        cell: (discoveredCluster) => (
            <span style={{ whiteSpace: 'nowrap' }} key="dcLastActive">
                {discoveredCluster.spec.activity_timestamp === undefined
                    ? ['N/A']
                    : moment
                          .duration(
                              Math.abs(
                                  new Date().getTime() - new Date(discoveredCluster.spec.activity_timestamp).getTime()
                              )
                          )
                          .humanize()}
            </span>
        ),
    },
    {
        header: 'Created',
        sort: 'spec.creation_timestamp',
        cell: (discoveredCluster) => (
            <span style={{ whiteSpace: 'nowrap' }} key="dcCreationTimestamp">
                {discoveredCluster.spec.creation_timestamp === undefined
                    ? ['N/A']
                    : moment
                          .duration(
                              Math.abs(
                                  new Date().getTime() - new Date(discoveredCluster.spec.creation_timestamp).getTime()
                              )
                          )
                          .humanize()}
            </span>
        ),
    },
    {
        header: 'Discovered',
        sort: 'metadata.creationTimestamp',
        cell: (discoveredCluster) => (
            <span style={{ whiteSpace: 'nowrap' }} key="dcObjCreationTimestamp">
                {discoveredCluster.spec.creation_timestamp === undefined
                    ? ['N/A']
                    : moment
                          .duration(
                              Math.abs(
                                  new Date().getTime() -
                                      new Date(discoveredCluster.metadata.creationTimestamp ?? '').getTime()
                              )
                          )
                          .humanize()}
            </span>
        ),
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
    const managedClustersQuery = useQuery(listManagedClusters)
    const discoveredClustersQuery = useQuery(listDiscoveredClusters)

    useEffect(() => {
        managedClustersQuery.startPolling(10 * 1000)
        return managedClustersQuery.stopPolling
    }, [managedClustersQuery])

    useEffect(() => {
        discoveredClustersQuery.startPolling(10 * 1000)
        return discoveredClustersQuery.stopPolling
    }, [discoveredClustersQuery])

    return (
        <AcmPageCard>
            <ClustersTable
                discoveredClusters={discoveredClustersQuery.data}
                managedClusters={managedClustersQuery.data}
                deleteCluster={deleteResource}
                refresh={managedClustersQuery.refresh}
            />
        </AcmPageCard>
    )
}

export function ClustersTable(props: {
    managedClusters?: ManagedCluster[]
    discoveredClusters?: DiscoveredCluster[]
    deleteCluster: (managedCluster: ManagedCluster) => void
    refresh: () => void
}) {
    const { t } = useTranslation(['cluster'])
    const [view, setView] = useState<string>('managedToggleBtn')

    function mckeyFn(cluster: ManagedCluster) {
        return cluster.metadata.uid!
    }
    function dckeyFn(cluster: DiscoveredCluster) {
        return cluster.metadata.uid!
    }
    const history = useHistory()
    if (view === 'managedToggleBtn') {
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
                extraToolbarControls={
                    <ToggleGroup>
                        <ToggleGroupItem
                            isSelected={true}
                            text={t('managed')}
                            buttonId="managedToggleBtn"
                            onChange={(selected, event) => setView(event.currentTarget.id)}
                        />
                        <ToggleGroupItem
                            isSelected={false}
                            text={t('discovered')}
                            buttonId="discoveredToggleBtn"
                            onChange={(selected, event) => setView(event.currentTarget.id)}
                        />
                    </ToggleGroup>
                }
            />
        )
    } else {
        return (
            <AcmTable<DiscoveredCluster>
                plural="discoveredclusters"
                items={props.discoveredClusters ?? []}
                columns={discoveredClusterCols}
                keyFn={dckeyFn}
                key="discoveredClustersTable"
                tableActions={[
                    {
                        id: 'editClusterDiscvoveryBtn',
                        title: t('discovery.edit'),
                        click: () => {}, // TODO: Make this button work
                    },
                    {
                        id: 'disableClusterDiscvoveryBtn',
                        title: t('discovery.disable'),
                        click: () => {}, // TODO: Make this button work
                    },
                ]}
                bulkActions={[]}
                rowActions={[{ id: 'importCluster', title: t('discovery.import'), click: (item) => {} }]}
                emptyState={
                    <AcmEmptyState
                        action={<AcmButton>{t('discovery.enablediscoverybtn')}</AcmButton>}
                        title={t('discovery.emptyStateHeader')}
                        message={t('discovery.emptyStateMsg')}
                        key="dcEmptyState"
                    />
                }
                extraToolbarControls={
                    <ToggleGroup>
                        <ToggleGroupItem
                            isSelected={false}
                            text={t('managed')}
                            buttonId="managedToggleBtn"
                            onChange={(selected, event) => setView(event.currentTarget.id)}
                        />
                        <ToggleGroupItem
                            isSelected={true}
                            text={t('discovered')}
                            buttonId="discoveredToggleBtn"
                            onChange={(selected, event) => setView(event.currentTarget.id)}
                        />
                    </ToggleGroup>
                }
            />
        )
    }
}

function capitalizeFirstLetter(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1)
}
