/* Copyright Contributors to the Open Cluster Management project */

import {
    AcmAlertContext,
    AcmButton,
    AcmEmptyState,
    AcmEmptyStateImage,
    AcmInlineStatus,
    AcmInlineProvider,
    StatusType,
    AcmPageContent,
    AcmTable,
    IAcmTableColumn,
    Provider,
    compareStrings,
} from '@open-cluster-management/ui-components'
import { Title, CardHeader, PageSection, Card, CardBody, Stack, StackItem } from '@patternfly/react-core'
import AddIcon from '@patternfly/react-icons/dist/js/icons/add-circle-o-icon'
import ExternalLink from '@patternfly/react-icons/dist/js/icons/external-link-alt-icon'
import * as moment from 'moment'
import { useContext, useEffect, useState } from 'react'
import { useTranslation, Trans } from 'react-i18next'
import { Link, useHistory } from 'react-router-dom'
import { NavigationPath } from '../../../NavigationPath'
import { DiscoveredCluster } from '../../../resources/discovered-cluster'
import { ProviderConnection, unpackProviderConnection } from '../../../resources/provider-connection'
import { useRecoilState } from 'recoil'
import { DiscoveryConfig } from '../../../resources/discovery-config'
import { discoveredClusterState, discoveryConfigState, secretsState } from '../../../atoms'

export default function DiscoveredClustersPage() {
    return (
        <AcmPageContent id="discovered-clusters">
            <PageSection>
                <DiscoveredClustersPageContent />
            </PageSection>
        </AcmPageContent>
    )
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

function EmptyStateCRHCredentials(props: { credentials?: ProviderConnection[] }) {
    const { t } = useTranslation(['discovery'])
    return (
        <AcmEmptyState
            action={
                <AcmButton component={Link} to={NavigationPath.addDiscoveryConfig}>
                    {t('emptystate.enableClusterDiscovery')}
                </AcmButton>
            }
            title={t('emptystate.credentials.title')}
            message={
                <Trans
                    i18nKey={'discovery:emptystate.credentials.msg'}
                    components={{ bold: <strong /> }}
                    values={{ discoveryConfigTotal: props.credentials?.length }}
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
    const { t } = useTranslation(['discovery'])
    const alertContext = useContext(AcmAlertContext)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => alertContext.clearAlerts, [])

    const [discoveredClusters] = useRecoilState(discoveredClusterState)
    const [secrets] = useRecoilState(secretsState)
    const credentials = secrets.map(unpackProviderConnection)
    const [discoveryConfigs] = useRecoilState(discoveryConfigState)

    const cloudRedHatCredentials: ProviderConnection[] = []
    credentials.forEach((credential) => {
        const provider = credential.metadata.labels!['cluster.open-cluster-management.io/provider']
        if (provider === Provider.redhatcloud) {
            cloudRedHatCredentials.push(credential)
        }
    })

    const unmanagedClusters: DiscoveredCluster[] = []
    discoveredClusters.forEach((discoveredCluster) => {
        const isManaged = discoveredCluster.spec.isManagedCluster
        if (!isManaged) {
            unmanagedClusters.push(discoveredCluster)
        }
    })

    sessionStorage.removeItem('DiscoveredClusterName')
    sessionStorage.removeItem('DiscoveredClusterConsoleURL')

    return (
        <Stack hasGutter>
            <StackItem>
                <Card>
                    <CardHeader>
                        <Title headingLevel="h4">{t('quickActions')}</Title>
                        <span>
                            &nbsp;
                            <Link to={NavigationPath.addCredentials}>
                                {t('quickActions.AddRHOCMCredential')} <AddIcon />
                            </Link>
                        </span>
                    </CardHeader>
                </Card>
            </StackItem>
            <StackItem>
                <Card>
                    <CardBody>
                        <DiscoveredClustersTable
                            discoveredClusters={unmanagedClusters}
                            credentials={credentials}
                            discoveryConfigs={discoveryConfigs}
                        />
                    </CardBody>
                </Card>
            </StackItem>
        </Stack>
    )
}

export function DiscoveredClustersTable(props: {
    discoveredClusters?: DiscoveredCluster[]
    credentials?: ProviderConnection[]
    discoveryConfigs?: DiscoveryConfig[]
}) {
    const { t } = useTranslation(['discovery'])
    const history = useHistory()

    const [emptyState, setEmptyState] = useState<React.ReactNode>()

    useEffect(() => {
        if (!props.credentials || !props.discoveredClusters || !props.discoveryConfigs) {
            setEmptyState(<EmptyStateNoCRHCredentials />) // An object is possibly undefined, return default empty state
        } else if (props.credentials.length === 0 && props.discoveryConfigs?.length === 0) {
            setEmptyState(<EmptyStateNoCRHCredentials />) // No credentials exist, guide user to set up credentials
        } else if (props.credentials.length > 0 && props.discoveryConfigs?.length === 0) {
            setEmptyState(<EmptyStateCRHCredentials credentials={props.credentials} />) // Credential is set up, guide user to set up discovery config
        } else if (props.credentials.length > 0 && props.discoveryConfigs?.length > 0) {
            setEmptyState(<EmptyStateAwaitingDiscoveredClusters />) //Discoveryconfig is set up, wait for discoveredclusters to appear
        } else {
            setEmptyState(<EmptyStateNoCRHCredentials />) // If unable to meet any of the above cases, return default state
        }
    }, [props.discoveredClusters, props.credentials, props.discoveryConfigs])

    const discoveredClusterCols: IAcmTableColumn<DiscoveredCluster>[] = [
        {
            header: t('dcTbl.name'),
            sort: 'spec.display_name',
            search: (discoveredCluster: DiscoveredCluster) => [
                discoveredCluster.spec.console,
                discoveredCluster.spec.display_name,
            ],
            cell: (discoveredCluster) => (
                <span style={{ whiteSpace: 'nowrap' }} key="dcName">
                    <a target="_blank" rel="noreferrer" href={discoveredCluster.spec.console} key="dcConsoleURL">
                        <ExternalLink />
                        <span key="dcNamelink" style={{ marginLeft: '16px' }}>
                            {discoveredCluster.spec.display_name}
                        </span>
                    </a>
                </span>
            ),
        },
        {
            header: t('dcTbl.status'),
            sort: 'spec.status',
            search: 'spec.status',
            cell: (discoveredCluster) => {
                let type: StatusType
                switch (discoveredCluster.spec.status) {
                    case 'Active':
                        type = StatusType.healthy
                        break
                    default:
                        type = StatusType.unknown
                }
                return <AcmInlineStatus type={type} status={capitalizeFirstLetter(discoveredCluster.spec.status)} />
            },
        },
        {
            header: t('dcTbl.namespace'),
            sort: (a: DiscoveredCluster, b: DiscoveredCluster) =>
                compareStrings(a?.metadata.namespace, b?.metadata.namespace),
            search: (discoveredCluster) => discoveredCluster?.metadata.namespace ?? '-',
            cell: (discoveredCluster) => discoveredCluster?.metadata.namespace ?? '-',
        },
        {
            header: t('dcTbl.distributionVersion'),
            sort: 'spec.openshiftVersion',
            search: (discoveredCluster) => {
                if (discoveredCluster.spec.openshiftVersion) {
                    return [
                        discoveredCluster.spec.openshiftVersion,
                        'openshift ' + discoveredCluster.spec.openshiftVersion,
                    ]
                } else {
                    return '-'
                }
            },
            cell: (discoveredCluster) => {
                if (discoveredCluster.spec.openshiftVersion) {
                    return (
                        <span key="openShiftVersion">
                            {'OpenShift '.concat(discoveredCluster.spec.openshiftVersion)}
                        </span>
                    )
                } else {
                    return '-'
                }
            },
        },
        {
            header: t('dcTbl.infrastructureProvider'),
            sort: 'spec.cloudProvider',
            search: (discoveredCluster) =>
                discoveredCluster?.spec.cloudProvider ? searchCloudProvider(discoveredCluster.spec.cloudProvider) : '',
            cell: (discoveredCluster) =>
                discoveredCluster?.spec.cloudProvider ? (
                    <AcmInlineProvider provider={getProvider(discoveredCluster?.spec.cloudProvider)} />
                ) : (
                    '-'
                ),
        },
        {
            header: t('dcTbl.lastActive'),
            sort: 'spec.activity_timestamp',
            cell: (discoveredCluster) => (
                <span style={{ whiteSpace: 'nowrap' }} key="dcLastActive">
                    {discoveredCluster.spec.activity_timestamp === undefined
                        ? ['N/A']
                        : moment
                              .duration(
                                  Math.abs(
                                      new Date().getTime() -
                                          new Date(discoveredCluster.spec.activity_timestamp).getTime()
                                  )
                              )
                              .humanize()}
                </span>
            ),
        },
        {
            header: t('dcTbl.created'),
            sort: 'spec.creation_timestamp',
            cell: (discoveredCluster) => (
                <span style={{ whiteSpace: 'nowrap' }} key="dcCreationTimestamp">
                    {discoveredCluster.spec.creation_timestamp === undefined
                        ? ['N/A']
                        : moment
                              .duration(
                                  Math.abs(
                                      new Date().getTime() -
                                          new Date(discoveredCluster.spec.creation_timestamp).getTime()
                                  )
                              )
                              .humanize()}
                </span>
            ),
        },
        {
            header: t('dcTbl.discovered'),
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

    return (
        <AcmTable<DiscoveredCluster>
            plural={t('discoveredClusters')}
            items={props.discoveredClusters}
            columns={discoveredClusterCols}
            keyFn={dckeyFn}
            key="tbl-discoveredclusters"
            tableActions={[]}
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
    )
}

function dckeyFn(cluster: DiscoveredCluster) {
    return cluster.metadata.uid!
}

function capitalizeFirstLetter(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1)
}

function getProvider(provider: string) {
    switch (provider) {
        case Provider.gcp:
            return Provider.gcp
        case Provider.aws:
            return Provider.aws
        case 'azure':
            return Provider.azure
        case 'vsphere':
            return Provider.vmware
        case 'baremetal':
            return Provider.baremetal
        case 'openstack':
            return Provider.openstack
        case Provider.other:
        default:
            return Provider.other
    }
}

function searchCloudProvider(provider: string) {
    switch (provider.toLowerCase()) {
        case Provider.gcp:
            return [Provider.gcp, 'google cloud platform']
        case Provider.aws:
            return [Provider.aws, 'amazon web services']
        case 'azure':
            return [Provider.azure, 'microsoft azure']
        case 'vsphere':
            return [Provider.vmware, 'vsphere', 'vmware vsphere']
        case 'baremetal':
            return [Provider.baremetal, 'bare metal']
        case 'openstack':
            return [Provider.openstack, 'red hat openstack']
        case Provider.other:
        default:
            return [Provider.other, provider]
    }
}
