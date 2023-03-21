/* Copyright Contributors to the Open Cluster Management project */

import {
  AcmButton,
  AcmDropdown,
  AcmEmptyState,
  AcmEmptyStateImage,
  AcmInlineProvider,
  AcmPageContent,
  AcmTable,
  compareStrings,
  IAcmTableColumn,
  Provider,
} from '../../../../ui-components'
import { ActionList, ActionListItem, Bullseye, ButtonVariant, PageSection, TextContent } from '@patternfly/react-core'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import * as moment from 'moment'
import { Fragment, useMemo } from 'react'
import { Trans, useTranslation } from '../../../../lib/acm-i18next'
import { Link, useHistory } from 'react-router-dom'
import { DOC_LINKS, viewDocumentation } from '../../../../lib/doc-util'
import { createBackCancelLocation, NavigationPath } from '../../../../NavigationPath'
import { DiscoveredCluster, DiscoveryConfig, ProviderConnection, unpackProviderConnection } from '../../../../resources'
import { useRecoilState, useSharedAtoms } from '../../../../shared-recoil'

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
  const { t } = useTranslation()

  return (
    <AcmEmptyState
      title={t('emptystate.defaultState.title')}
      message={<Trans i18nKey="emptystate.defaultState.msg" components={{ italic: <em />, bold: <strong /> }} />}
      key="dcEmptyState"
      showIcon={true}
      action={
        <div>
          <AcmButton component={Link} to={NavigationPath.addCredentials}>
            {t('emptystate.addCredential')}
          </AcmButton>
          <TextContent>{viewDocumentation(DOC_LINKS.DISCOVERED_CLUSTERS, t)}</TextContent>
        </div>
      }
    />
  )
}

function EmptyStateCRHCredentials(props: { credentials?: ProviderConnection[] }) {
  const { t } = useTranslation()
  const history = useHistory()

  const onSelect = (credential: string) => {
    sessionStorage.setItem('DiscoveryCredential', credential)
    history.push(NavigationPath.createDiscovery)
  }

  const action =
    props.credentials!.length > 1 ? (
      <div>
        <AcmDropdown
          text={t('discovery.addDiscovery')}
          onSelect={onSelect}
          id="configureDiscoveryDropdown"
          isKebab={false}
          isPrimary={true}
          dropdownItems={props.credentials!.map((credential) => {
            return {
              id: credential.metadata.namespace! + '/' + credential.metadata.name!,
              text: credential.metadata.namespace! + '/' + credential.metadata.name!,
            }
          })}
        />
        <TextContent>{viewDocumentation(DOC_LINKS.DISCOVERED_CLUSTERS, t)}</TextContent>
      </div>
    ) : (
      <div>
        <AcmButton component={Link} to={NavigationPath.createDiscovery}>
          {t('emptystate.enableClusterDiscovery')}
        </AcmButton>
        <TextContent>{viewDocumentation(DOC_LINKS.DISCOVERED_CLUSTERS, t)}</TextContent>
      </div>
    )
  return (
    <AcmEmptyState
      action={action}
      title={t('emptystate.credentials.title')}
      message={
        <Trans
          i18nKey="emptystate.credentials.msg"
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
  const { t } = useTranslation()
  return (
    <AcmEmptyState
      title={t('emptystate.discoveryEnabled.title')}
      message={t('emptystate.discoveryEnabled.msg')}
      key="dcEmptyState"
      showIcon={true}
      image={AcmEmptyStateImage.folder}
      action={
        <div>
          <Bullseye>
            <ActionList>
              <ActionListItem>
                <AcmButton variant={ButtonVariant.primary} component={Link} to={NavigationPath.configureDiscovery}>
                  {t('discovery.configureDiscovery')}
                </AcmButton>
              </ActionListItem>
              <ActionListItem>
                <AcmButton variant={ButtonVariant.secondary} component={Link} to={NavigationPath.createDiscovery}>
                  {t('discovery.addDiscovery')}
                </AcmButton>
              </ActionListItem>
            </ActionList>
          </Bullseye>
          <TextContent>{viewDocumentation(DOC_LINKS.DISCOVERED_CLUSTERS, t)}</TextContent>
        </div>
      }
    />
  )
}

export function DiscoveredClustersPageContent() {
  const { discoveredClusterState, discoveryConfigState, secretsState } = useSharedAtoms()
  const [discoveredClusters] = useRecoilState(discoveredClusterState)
  const [secrets] = useRecoilState(secretsState)
  const credentials = secrets.map(unpackProviderConnection)
  const [discoveryConfigs] = useRecoilState(discoveryConfigState)

  const RHOCMCredentials: ProviderConnection[] = []
  credentials.forEach((credential) => {
    const provider = credential.metadata.labels?.['cluster.open-cluster-management.io/type']
    if (provider === Provider.redhatcloud) {
      RHOCMCredentials.push(credential)
    }
  })

  const unmanagedClusters: DiscoveredCluster[] = []
  discoveredClusters.forEach((discoveredCluster) => {
    const isManaged = discoveredCluster.spec.isManagedCluster
    if (!isManaged) {
      unmanagedClusters.push(discoveredCluster)
    }
  })

  sessionStorage.removeItem('DiscoveredClusterDisplayName')
  sessionStorage.removeItem('DiscoveredClusterConsoleURL')
  sessionStorage.removeItem('DiscoveredClusterApiURL')
  sessionStorage.removeItem('DiscoveryCredential')
  return (
    <Fragment>
      <DiscoveredClustersTable
        discoveredClusters={unmanagedClusters}
        credentials={RHOCMCredentials}
        discoveryConfigs={discoveryConfigs}
      />
    </Fragment>
  )
}

export function DiscoveredClustersTable(props: {
  discoveredClusters?: DiscoveredCluster[]
  credentials?: ProviderConnection[]
  discoveryConfigs?: DiscoveryConfig[]
}) {
  const { t } = useTranslation()
  const history = useHistory()

  const emptyState = useMemo(() => {
    if (!props.credentials || !props.discoveredClusters || !props.discoveryConfigs) {
      return <EmptyStateNoCRHCredentials /> // An object is possibly undefined, return default empty state
    } else if (props.credentials.length === 0 && props.discoveryConfigs?.length === 0) {
      return <EmptyStateNoCRHCredentials /> // No credentials exist, guide user to set up credentials
    } else if (props.credentials.length > 0 && props.discoveryConfigs?.length === 0) {
      return <EmptyStateCRHCredentials credentials={props.credentials} /> // Credential is set up, guide user to set up discovery config
    } else if (props.credentials.length > 0 && props.discoveryConfigs?.length > 0) {
      return <EmptyStateAwaitingDiscoveredClusters /> //Discoveryconfig is set up, wait for discoveredclusters to appear
    } else {
      return <EmptyStateNoCRHCredentials /> // If unable to meet any of the above cases, return default state
    }
  }, [props.discoveredClusters, props.credentials, props.discoveryConfigs])

  const discoveredClusterCols: IAcmTableColumn<DiscoveredCluster>[] = [
    {
      header: t('dcTbl.name'),
      sort: 'spec.displayName',
      search: (discoveredCluster: DiscoveredCluster) => [
        discoveredCluster.spec.console,
        discoveredCluster.spec.displayName,
      ],
      cell: (discoveredCluster) => (
        <span style={{ whiteSpace: 'nowrap' }} key="dcName">
          <a target="_blank" rel="noreferrer" href={discoveredCluster.spec.console} key="dcConsoleURL">
            <ExternalLinkAltIcon />
            <span key="dcNamelink" style={{ marginLeft: '16px' }}>
              {discoveredCluster.spec.displayName}
            </span>
          </a>
        </span>
      ),
    },
    {
      header: t('dcTbl.lastActive'),
      sort: 'spec.activityTimestamp',
      cell: (discoveredCluster) => (
        <span style={{ whiteSpace: 'nowrap' }} key="dcLastActive">
          {discoveredCluster.spec.activityTimestamp === undefined
            ? ['N/A']
            : moment
                .duration(Math.abs(new Date().getTime() - new Date(discoveredCluster.spec.activityTimestamp).getTime()))
                .humanize()}
        </span>
      ),
    },
    {
      header: t('dcTbl.namespace'),
      sort: (a: DiscoveredCluster, b: DiscoveredCluster) =>
        compareStrings(a?.metadata.namespace, b?.metadata.namespace),
      search: (discoveredCluster) => discoveredCluster?.metadata.namespace ?? '-',
      cell: (discoveredCluster) => discoveredCluster?.metadata.namespace ?? '-',
    },
    {
      header: t('dcTbl.type'),
      sort: (a: DiscoveredCluster, b: DiscoveredCluster) =>
        compareStrings(getFullTypeByAcronym(a?.spec?.type || ''), getFullTypeByAcronym(b?.spec?.type || '')),
      search: (discoveredCluster) => {
        if (discoveredCluster.spec.type) {
          return [discoveredCluster.spec.type, getFullTypeByAcronym(discoveredCluster.spec.type) || '-']
        } else {
          return '-'
        }
      },
      cell: (discoveredCluster) =>
        discoveredCluster?.spec.type ? getFullTypeByAcronym(discoveredCluster?.spec.type) : '-',
    },
    {
      header: t('dcTbl.openShiftVersion'),
      sort: 'spec.openshiftVersion',
      search: (discoveredCluster) => {
        if (discoveredCluster.spec.openshiftVersion) {
          return [discoveredCluster.spec.openshiftVersion]
        } else {
          return '-'
        }
      },
      cell: (discoveredCluster) => discoveredCluster.spec.openshiftVersion ?? '-',
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
      header: t('dcTbl.created'),
      sort: 'spec.creationTimestamp',
      cell: (discoveredCluster) => (
        <span style={{ whiteSpace: 'nowrap' }} key="dcCreationTimestamp">
          {discoveredCluster.spec.creationTimestamp === undefined
            ? ['N/A']
            : moment
                .duration(Math.abs(new Date().getTime() - new Date(discoveredCluster.spec.creationTimestamp).getTime()))
                .humanize()}
        </span>
      ),
    },
    {
      header: t('dcTbl.discovered'),
      sort: 'metadata.creationTimestamp',
      cell: (discoveredCluster) => (
        <span style={{ whiteSpace: 'nowrap' }} key="dcObjCreationTimestamp">
          {discoveredCluster.spec.creationTimestamp === undefined
            ? ['N/A']
            : moment
                .duration(
                  Math.abs(
                    new Date().getTime() - new Date(discoveredCluster.metadata.creationTimestamp ?? '').getTime()
                  )
                )
                .humanize()}
        </span>
      ),
    },
  ]

  function getFullTypeByAcronym(acronym: string) {
    switch (acronym.toUpperCase()) {
      case 'MOA':
        return t('type.rosa')
      case 'ROSA':
        return t('type.rosa')
      case 'OCP-ASSISTEDINSTALL':
        return t('type.ocp')
      case 'OCP':
        return t('type.ocp')
      case 'OSD':
        return t('type.osd')
      case 'ARO':
        return t('type.aro')
      default:
        // Unable to find match, return existing acronym
        return acronym
    }
  }

  return (
    <Fragment>
      <AcmTable<DiscoveredCluster>
        items={props.discoveredClusters}
        columns={discoveredClusterCols}
        keyFn={dckeyFn}
        key="tbl-discoveredclusters"
        tableActionButtons={[
          {
            id: 'configureDiscovery',
            title: t('discovery.configureDiscovery'),
            click: () => history.push(NavigationPath.configureDiscovery),
            variant: ButtonVariant.primary,
          },
          {
            id: 'addDiscovery',
            title: t('discovery.addDiscovery'),
            click: () => history.push(NavigationPath.createDiscovery),
            variant: ButtonVariant.secondary,
          },
        ]}
        rowActions={[
          {
            id: 'importCluster',
            title: t('discovery.import'),
            click: (item) => {
              sessionStorage.setItem('DiscoveredClusterDisplayName', item.spec.displayName)
              sessionStorage.setItem('DiscoveredClusterConsoleURL', item.spec.console)
              sessionStorage.setItem('DiscoveredClusterApiURL', item.spec?.apiUrl || '')
              history.push(createBackCancelLocation(NavigationPath.importCluster))
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
