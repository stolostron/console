/* Copyright Contributors to the Open Cluster Management project */

import {
    AcmAlertContext,
    AcmButton,
    AcmEmptyState,
    AcmEmptyStateImage,
    AcmPageContent,
    AcmTable,
    IAcmTableColumn,
} from '@open-cluster-management/ui-components'
import { PageSection } from '@patternfly/react-core'
import AWSIcon from '@patternfly/react-icons/dist/js/icons/aws-icon'
import CheckIcon from '@patternfly/react-icons/dist/js/icons/check-circle-icon'
import ExternalLink from '@patternfly/react-icons/dist/js/icons/external-link-alt-icon'
import { default as ExclamationIcon } from '@patternfly/react-icons/dist/js/icons/exclamation-circle-icon'
import * as moment from 'moment'
import { Fragment, useContext, useEffect, useState } from 'react'
import { useTranslation, Trans } from 'react-i18next'
import { Link, useHistory } from 'react-router-dom'
import { ConfirmModal, IConfirmModalProps } from '../../../components/ConfirmModal'
import { getErrorInfo } from '../../../components/ErrorPage'
import { deleteResource } from '../../../lib/resource-request'
import { ProviderID } from '../../../lib/providers'
import { NavigationPath } from '../../../NavigationPath'
import { DiscoveredCluster } from '../../../resources/discovered-cluster'
import { ProviderConnection } from '../../../resources/provider-connection'
import { useRecoilState } from 'recoil'
import { DiscoveryConfig, DiscoveryConfigApiVersion, DiscoveryConfigKind } from '../../../resources/discovery-config'
import { providerConnectionsState, discoveredClusterState, discoveryConfigState } from '../../../atoms'

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
        sort: 'spec.status',
        search: 'spec.status',
        cell: (discoveredCluster) => (
            <span style={{ whiteSpace: 'nowrap' }} key="dcStatusParent">
                {discoveredCluster.spec.status === 'Active' ? (
                    <CheckIcon color="green" key="ready-icon" />
                ) : (
                    <Fragment key="ready-icon"></Fragment>
                )}
                {discoveredCluster.spec.status !== 'Active' ? (
                    <ExclamationIcon color="red" key="offline-icon" />
                ) : (
                    <Fragment key="offline-icon"></Fragment>
                )}
                <span key="dcStatus">&nbsp; {capitalizeFirstLetter(discoveredCluster.spec.status)}</span>
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

function deleteDiscoveryConfig(config: DiscoveryConfig) {
    deleteResource({
        apiVersion: DiscoveryConfigApiVersion,
        kind: DiscoveryConfigKind,
        metadata: { name: config.metadata.name, namespace: config.metadata.namespace },
    })
}

function EmptyStateNoCRHCredentials() {
    const { t } = useTranslation(['discovery'])
    return (
        <AcmEmptyState
            title={t('emptystate.defaultState.title')}
            message={<Trans i18nKey={'discovery:emptystate.defaultState.msg'} components={{ bold: <strong /> }} />}
            key="dcEmptyState"
            showIcon={true}
            image={AcmEmptyStateImage.folder}
            action={
                <AcmButton component={Link} to={NavigationPath.addCredentials}>
                    {t('emptystate.addCredential')}
                </AcmButton>
            }
        />
    )
}

function EmptyStateProviderConnections(props: { providerConnections?: ProviderConnection[] }) {
    const { t } = useTranslation(['discovery'])
    return (
        <AcmEmptyState
            action={
                <AcmButton component={Link} to={NavigationPath.discoveryConfig}>
                    {t('emptystate.enableClusterDiscovery')}
                </AcmButton>
            }
            title={t('emptystate.providerConnections.title')}
            message={
                <Trans
                    i18nKey={'discovery:emptystate.providerConnections.msg'}
                    components={{ bold: <strong /> }}
                    values={{ discoveryConfigTotal: props.providerConnections?.length }}
                />
            }
            key="dcEmptyState"
            showIcon={true}
            image={AcmEmptyStateImage.folder}
        />
    )
}

function EmptyStateAwaitingDiscoveredClusters() {
    const { t } = useTranslation(['discovery'])
    return (
        <AcmEmptyState
            title={t('emptystate.discoveryEnabled.title')}
            message={t('emptystate.discoveryEnabled.msg')}
            key="dcEmptyState"
            showIcon={true}
            image={AcmEmptyStateImage.folder}
            action={
                <AcmButton variant="link">
                    <span style={{ whiteSpace: 'nowrap' }} key="dcStatusParent">
                        {t('emptystate.viewDocumentation')} <ExternalLink />
                    </span>
                </AcmButton>
            }
        />
    )
}

export function DiscoveredClustersPageContent() {
    const alertContext = useContext(AcmAlertContext)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => alertContext.clearAlerts, [])

    const [discoveredClusters] = useRecoilState(discoveredClusterState)
    const [providerConnections] = useRecoilState(providerConnectionsState)
    const [discoveryConfigs] = useRecoilState(discoveryConfigState)

    const cloudRedHatCredentials: ProviderConnection[] = []
    providerConnections.forEach((credential) => {
        const labels = credential.metadata.labels!['cluster.open-cluster-management.io/provider']
        if (labels === ProviderID.CRH) {
            cloudRedHatCredentials.push(credential)
        }
    })

    sessionStorage.removeItem('DiscoveredClusterName')
    sessionStorage.removeItem('DiscoveredClusterConsoleURL')

    return (
        <DiscoveredClustersTable
            discoveredClusters={discoveredClusters}
            providerConnections={cloudRedHatCredentials}
            discoveryConfigs={discoveryConfigs}
        />
    )
}

export function DiscoveredClustersTable(props: {
    discoveredClusters?: DiscoveredCluster[]
    providerConnections?: ProviderConnection[]
    discoveryConfigs?: DiscoveryConfig[]
}) {
    const { t } = useTranslation(['discovery'])
    const alertContext = useContext(AcmAlertContext)
    const history = useHistory()
    const [modalProps, setModalProps] = useState<IConfirmModalProps>({
        open: false,
        confirm: () => {},
        cancel: () => {},
        title: '',
        message: '',
    })

    const [emptyState, setEmptyState] = useState<React.ReactNode>()

    useEffect(() => {
        if (!props.providerConnections || !props.discoveredClusters || !props.discoveryConfigs) {
            setEmptyState(<EmptyStateNoCRHCredentials />) // An object is possibly undefined, return default empty state
        } else if (props.providerConnections.length === 0 && props.discoveryConfigs.length === 0) {
            setEmptyState(<EmptyStateNoCRHCredentials />) // No provider connections exist, guide user to set up provider connection
        } else if (props.providerConnections.length > 0 && props.discoveryConfigs.length === 0) {
            setEmptyState(<EmptyStateProviderConnections providerConnections={props.providerConnections} />) // Provider connection is set up, guide user to set up discovery config
        } else if (props.providerConnections.length > 0 && props.discoveryConfigs.length > 0) {
            setEmptyState(<EmptyStateAwaitingDiscoveredClusters />) //Discoveryconfig is set up, wait for discoveredclusters to appear
        } else {
            setEmptyState(<EmptyStateNoCRHCredentials />) // If unable to meet any of the above cases, return default state
        }
    }, [props.discoveredClusters, props.providerConnections, props.discoveryConfigs])

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
                                        if (props.discoveryConfigs) {
                                            await props.discoveryConfigs.forEach(deleteDiscoveryConfig)
                                            setModalProps({
                                                open: false,
                                                confirm: () => {},
                                                cancel: () => {},
                                                title: '',
                                                message: '',
                                            })
                                        } else {
                                            throw Error('Error retrieving discoveryconfigs')
                                        }
                                    } catch (err) {
                                        alertContext.addAlert(getErrorInfo(err)) //TODO: not currently displaying within modal
                                    }
                                },
                                confirmText: t('disable.button'),
                                message: t('disable.message'),
                                isDanger: true,
                                cancel: () => {
                                    setModalProps({
                                        open: false,
                                        confirm: () => {},
                                        cancel: () => {},
                                        title: '',
                                        message: '',
                                    })
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
                emptyState={emptyState}
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
