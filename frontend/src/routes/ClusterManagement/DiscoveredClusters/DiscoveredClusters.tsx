import {
    AcmButton,
    AcmEmptyState,
    AcmPageCard,
    AcmTable,
    IAcmTableColumn,
} from '@open-cluster-management/ui-components'
import { Page } from '@patternfly/react-core'
import AWSIcon from '@patternfly/react-icons/dist/js/icons/aws-icon'
import CheckIcon from '@patternfly/react-icons/dist/js/icons/check-circle-icon'
import { default as ExclamationIcon } from '@patternfly/react-icons/dist/js/icons/exclamation-circle-icon'
import React, { Fragment, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '../../../lib/useQuery'
import { DiscoveredCluster, listDiscoveredClusters } from '../../../resources/discovered-cluster'
let moment = require('moment')

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

export default function DiscoveredClustersPage() {
    return (
        <Page>
            <DiscoveredClustersPageContent />
        </Page>
    )
}

export function DiscoveredClustersPageContent() {
    const discoveredClustersQuery = useQuery(listDiscoveredClusters)
    useEffect(() => {
        discoveredClustersQuery.startPolling(10 * 1000)
        return discoveredClustersQuery.stopPolling
    }, [discoveredClustersQuery])

    return (
        <AcmPageCard>
            <DiscoveredClustersTable discoveredClusters={discoveredClustersQuery.data} />
        </AcmPageCard>
    )
}

export function DiscoveredClustersTable(props: { discoveredClusters?: DiscoveredCluster[] }) {
    const { t } = useTranslation(['cluster'])

    function dckeyFn(cluster: DiscoveredCluster) {
        return cluster.metadata.uid!
    }

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
        />
    )
}

function capitalizeFirstLetter(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1)
}
