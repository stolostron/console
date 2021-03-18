/* Copyright Contributors to the Open Cluster Management project */

import {
    AcmAlertContext,
    AcmButton,
    AcmEmptyState,
    AcmPageContent,
    AcmTable,
    IAcmTableColumn,
} from '@open-cluster-management/ui-components'
import { PageSection } from '@patternfly/react-core'
import AWSIcon from '@patternfly/react-icons/dist/js/icons/aws-icon'
import CheckIcon from '@patternfly/react-icons/dist/js/icons/check-circle-icon'
import { default as ExclamationIcon } from '@patternfly/react-icons/dist/js/icons/exclamation-circle-icon'
import * as moment from 'moment'
import { Fragment, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useHistory } from 'react-router-dom'
import { ConfirmModal, IConfirmModalProps } from '../../../components/ConfirmModal'
import { ErrorPage, getErrorInfo } from '../../../components/ErrorPage'
import { deleteResource, ResourceError } from '../../../lib/resource-request'
import { useQuery } from '../../../lib/useQuery'
import { NavigationPath } from '../../../NavigationPath'
import { DiscoveredCluster, listDiscoveredClusters } from '../../../resources/discovered-cluster'
import {
    DiscoveryConfigApiVersion,
    DiscoveryConfigKind,
    listDiscoveryConfigs,
} from '../../../resources/discovery-config'

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
        <AcmPageContent id="discovered-clusters">
            <PageSection variant="light" isFilled={true}>
                <DiscoveredClustersPageContent />
            </PageSection>
        </AcmPageContent>
    )
}

async function disableDiscovery(): Promise<void> {
    const result = listDiscoveryConfigs()
    const discConfig = await result.promise
    discConfig.forEach(deleteDiscoveryConfig)
}

function deleteDiscoveryConfig(config) {
    deleteResource({
        apiVersion: DiscoveryConfigApiVersion,
        kind: DiscoveryConfigKind,
        metadata: { name: config.metadata.name, namespace: config.metadata.namespace },
    })
}

function DiscoveredClustersEmptyState() {
    const { t } = useTranslation(['cluster'])
    return (
        <AcmEmptyState
            action={
                <AcmButton component={Link} to={NavigationPath.discoveryConfig}>
                    {t('discovery.enablediscoverybtn')}
                </AcmButton>
            }
            title={t('discovery.emptyStateHeader')}
            message={t('discovery.emptyStateMsg')}
            key="dcEmptyState"
            showIcon={false}
        />
    )
}

export function DiscoveredClustersPageContent() {
    const { data, error, startPolling } = useQuery(listDiscoveredClusters)
    useEffect(startPolling, [startPolling])

    sessionStorage.removeItem('DiscoveredClusterName')
    sessionStorage.removeItem('DiscoveredClusterConsoleURL')

    if (error) {
        if (error instanceof ResourceError && error.code === 404) {
            return <DiscoveredClustersEmptyState />
        }
        return <ErrorPage error={error} />
    }
    return <DiscoveredClustersTable discoveredClusters={data} />
}

export function DiscoveredClustersTable(props: { discoveredClusters?: DiscoveredCluster[] }) {
    const { t } = useTranslation(['cluster'])
    const alertContext = useContext(AcmAlertContext)
    const history = useHistory()
    const [modalProps, setModalProps] = useState<IConfirmModalProps>({
        open: false,
    })
    return (
        <Fragment>
            <ConfirmModal {...modalProps} />
            <AcmTable<DiscoveredCluster>
                plural="discovered clusters"
                items={props.discoveredClusters}
                columns={discoveredClusterCols}
                keyFn={dckeyFn}
                key="discoveredClustersTable"
                tableActions={[
                    {
                        id: 'editClusterDiscvoveryBtn',
                        title: t('discovery.edit'),
                        click: () => {
                            history.push(NavigationPath.discoveryConfig)
                        },
                    },
                    {
                        id: 'disableClusterDiscvoveryBtn',
                        title: t('discovery.disable'),
                        click: () => {
                            setModalProps({
                                open: true,
                                title: t('disable.title'),
                                confirm: async () => {
                                    try {
                                        await disableDiscovery()
                                        setModalProps({ open: false })
                                    } catch (err) {
                                        alertContext.addAlert(getErrorInfo(err)) //TODO: not currently displaying within modal
                                    }
                                },
                                confirmText: t('disable.button'),
                                message: t('disable.message'),
                                isDanger: true,
                                cancel: () => {
                                    setModalProps({ open: false })
                                },
                            })
                        },
                    },
                ]}
                bulkActions={[]}
                rowActions={[
                    {
                        id: 'importCluster',
                        title: t('discovery.import'),
                        click: (item) => {
                            sessionStorage.setItem('DiscoveredClusterName', item.spec.name)
                            sessionStorage.setItem('DiscoveredClusterConsoleURL', item.spec.console)
                            history.push(NavigationPath.importCluster)
                        },
                    },
                ]}
                emptyState={<DiscoveredClustersEmptyState />}
            />
        </Fragment>
    )
}

function dckeyFn(cluster: DiscoveredCluster) {
    return cluster.metadata.uid!
}

function capitalizeFirstLetter(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1)
}
