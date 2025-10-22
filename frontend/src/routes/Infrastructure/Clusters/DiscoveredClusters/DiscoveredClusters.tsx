/* Copyright Contributors to the Open Cluster Management project */

import {
  AcmButton,
  AcmDropdown,
  AcmEmptyState,
  AcmInlineProvider,
  AcmPageContent,
  AcmTable,
  compareStrings,
  IAcmTableColumn,
  Provider,
} from '../../../../ui-components'
import { ActionList, ActionListItem, Bullseye, ButtonVariant, PageSection } from '@patternfly/react-core'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { Fragment, useCallback, useMemo } from 'react'
import { Trans, useTranslation } from '../../../../lib/acm-i18next'
import { Link, useNavigate } from 'react-router-dom-v5-compat'
import { DOC_LINKS, ViewDocumentationLink } from '../../../../lib/doc-util'
import { navigateToBackCancelLocation, NavigationPath } from '../../../../NavigationPath'
import { DiscoveredCluster, DiscoveryConfig, ProviderConnection, unpackProviderConnection } from '../../../../resources'
import { useRecoilValue, useSharedAtoms } from '../../../../shared-recoil'
import { getISOStringTimestamp } from '../../../../resources/utils'
import AcmTimestamp from '../../../../lib/AcmTimestamp'
import {
  getInfrastructureProvider,
  searchInfrastructureProvider,
  getFullTypeByAcronymForDiscoveryClustersType,
  getClusterTypeGroup,
  CLUSTER_TYPE_GROUPS,
} from './DiscoveryConfig/discoveryConfigFilters'

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
      title={t("You don't have any discovered clusters yet")}
      message={
        <Trans
          i18nKey="Credentials of <italic>Red Hat OpenShift Cluster Manager</italic> type must be added to configure Discovery. To get started, add your credentials."
          components={{ italic: <em /> }}
        />
      }
      key="dcEmptyState"
      showSearchIcon={true}
      action={
        <div>
          <AcmButton component={Link} to={NavigationPath.addCredentials}>
            {t('emptystate.addCredential')}
          </AcmButton>
          <ViewDocumentationLink doclink={DOC_LINKS.DISCOVERED_CLUSTERS} />
        </div>
      }
    />
  )
}

function EmptyStateCRHCredentials(props: { credentials?: ProviderConnection[] }) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const onSelect = (credential: string) => {
    sessionStorage.setItem('DiscoveryCredential', credential)
    navigate(NavigationPath.createDiscovery)
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
        <ViewDocumentationLink doclink={DOC_LINKS.DISCOVERED_CLUSTERS} />
      </div>
    ) : (
      <div>
        <AcmButton component={Link} to={NavigationPath.createDiscovery}>
          {t('emptystate.enableClusterDiscovery')}
        </AcmButton>
        <ViewDocumentationLink doclink={DOC_LINKS.DISCOVERED_CLUSTERS} />
      </div>
    )
  return (
    <AcmEmptyState
      action={action}
      title={t("You don't have any discovered clusters yet")}
      message={
        <Trans
          i18nKey="emptystate.credentials.msg"
          components={{ bold: <strong /> }}
          values={{ discoveryConfigTotal: props.credentials?.length }}
        />
      }
      key="dcEmptyState"
      showSearchIcon={true}
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
      showSearchIcon={true}
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
          <ViewDocumentationLink doclink={DOC_LINKS.DISCOVERED_CLUSTERS} />
        </div>
      }
    />
  )
}

export function DiscoveredClustersPageContent() {
  const { discoveredClusterState, discoveryConfigState, secretsState } = useSharedAtoms()
  const discoveredClusters = useRecoilValue(discoveredClusterState)
  const secrets = useRecoilValue(secretsState)
  const credentials = secrets.map(unpackProviderConnection)
  const discoveryConfigs = useRecoilValue(discoveryConfigState)

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
  sessionStorage.removeItem('DiscoveredClusterID')
  sessionStorage.removeItem('DiscoveryType')
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
  const navigate = useNavigate()

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
      exportContent: (discoveredCluster) => discoveredCluster.spec.displayName,
    },
    {
      header: t('dcTbl.lastActive'),
      sort: 'spec.activityTimestamp',
      cell: (discoveredCluster) => (
        <span style={{ whiteSpace: 'nowrap' }} key="dcLastActive">
          <AcmTimestamp timestamp={discoveredCluster.spec.activityTimestamp} />
        </span>
      ),
      exportContent: (discoveredCluster) => {
        if (discoveredCluster.spec.activityTimestamp) {
          return getISOStringTimestamp(discoveredCluster.spec.activityTimestamp)
        }
      },
    },
    {
      header: t('dcTbl.namespace'),
      sort: (a: DiscoveredCluster, b: DiscoveredCluster) =>
        compareStrings(a?.metadata.namespace, b?.metadata.namespace),
      search: (discoveredCluster) => discoveredCluster?.metadata.namespace ?? '-',
      cell: (discoveredCluster) => discoveredCluster?.metadata.namespace ?? '-',
      exportContent: (discoveredCluster) => discoveredCluster?.metadata.namespace ?? '-',
    },
    {
      header: t('dcTbl.type'),
      sort: (a: DiscoveredCluster, b: DiscoveredCluster) =>
        compareStrings(
          getFullTypeByAcronymForDiscoveryClustersType(a?.spec?.type ?? '', t),
          getFullTypeByAcronymForDiscoveryClustersType(b?.spec?.type ?? '', t)
        ),
      search: (discoveredCluster) => {
        if (discoveredCluster.spec.type) {
          // get the specific cluster type display name
          const typeName = getFullTypeByAcronymForDiscoveryClustersType(discoveredCluster.spec.type, t) || '-'

          // get the group this type belongs to, for searching by group name)
          const group = getClusterTypeGroup(discoveredCluster.spec.type)
          const groupName = group ? CLUSTER_TYPE_GROUPS[group].displayName : ''

          // returning raw type code, display name and the group name (if it is there)
          return [discoveredCluster.spec.type, typeName, groupName].filter(Boolean)
        } else {
          return '-'
        }
      },
      cell: (discoveredCluster) =>
        discoveredCluster?.spec.type
          ? getFullTypeByAcronymForDiscoveryClustersType(discoveredCluster?.spec.type, t)
          : '-',
      exportContent: (discoveredCluster) =>
        discoveredCluster?.spec.type
          ? getFullTypeByAcronymForDiscoveryClustersType(discoveredCluster?.spec.type, t)
          : '-',
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
      exportContent: (discoveredCluster) => discoveredCluster.spec.openshiftVersion ?? '-',
    },
    {
      header: t('dcTbl.infrastructureProvider'),
      sort: 'spec.cloudProvider',
      search: (discoveredCluster) =>
        discoveredCluster?.spec.cloudProvider ? searchInfrastructureProvider(discoveredCluster.spec.cloudProvider) : '',
      cell: (discoveredCluster) =>
        discoveredCluster?.spec.cloudProvider ? (
          <AcmInlineProvider provider={getInfrastructureProvider(discoveredCluster?.spec.cloudProvider)} />
        ) : (
          '-'
        ),
      exportContent: (discoveredCluster) => getInfrastructureProvider(discoveredCluster?.spec.cloudProvider) || '-',
    },
    {
      header: t('dcTbl.created'),
      sort: 'spec.creationTimestamp',
      cell: (discoveredCluster) => (
        <span style={{ whiteSpace: 'nowrap' }} key="dcCreationTimestamp">
          <AcmTimestamp timestamp={discoveredCluster.spec.creationTimestamp} />
        </span>
      ),
      exportContent: (discoveredCluster) => {
        if (discoveredCluster.spec.creationTimestamp) {
          return getISOStringTimestamp(discoveredCluster.spec.creationTimestamp)
        }
      },
    },
    {
      header: t('dcTbl.discovered'),
      sort: 'metadata.creationTimestamp',
      cell: (discoveredCluster) => (
        <span style={{ whiteSpace: 'nowrap' }} key="dcObjCreationTimestamp">
          <AcmTimestamp timestamp={discoveredCluster.metadata.creationTimestamp} />
        </span>
      ),
      exportContent: (discoveredCluster) => {
        if (discoveredCluster.metadata?.creationTimestamp) {
          return getISOStringTimestamp(discoveredCluster.metadata?.creationTimestamp)
        }
      },
    },
  ]

  const rowActionResolver = useCallback(
    (item: DiscoveredCluster) => {
      return item.spec.type !== 'MultiClusterEngineHCP' // DiscoveredClusters representing HostedClusters only support auto-import
        ? [
            {
              id: 'importCluster',
              title: t('discovery.import'),
              click: (item: DiscoveredCluster) => {
                sessionStorage.setItem('DiscoveredClusterDisplayName', item.spec.displayName)
                sessionStorage.setItem('DiscoveredClusterConsoleURL', item.spec.console)
                sessionStorage.setItem('DiscoveredClusterApiURL', item.spec?.apiUrl ?? '')
                sessionStorage.setItem('DiscoveryCredential', item.spec.credential?.name ?? '')
                sessionStorage.setItem('DiscoveredClusterID', item.spec?.rhocmClusterId ?? '')
                sessionStorage.setItem('DiscoveryType', item.spec.type ?? '')
                navigateToBackCancelLocation(navigate, NavigationPath.importCluster)
              },
            },
          ]
        : []
    },
    [navigate, t]
  )

  return (
    <Fragment>
      <AcmTable<DiscoveredCluster>
        items={props.discoveredClusters}
        columns={discoveredClusterCols}
        keyFn={dckeyFn}
        key="tbl-discoveredclusters"
        showExportButton
        exportFilePrefix="discoveredclusters"
        tableActionButtons={[
          {
            id: 'configureDiscovery',
            title: t('discovery.configureDiscovery'),
            click: () => navigate(NavigationPath.configureDiscovery),
            variant: ButtonVariant.primary,
          },
          {
            id: 'addDiscovery',
            title: t('discovery.addDiscovery'),
            click: () => navigate(NavigationPath.createDiscovery),
            variant: ButtonVariant.secondary,
          },
        ]}
        rowActionResolver={rowActionResolver}
        emptyState={emptyState}
      />
    </Fragment>
  )
}

function dckeyFn(cluster: DiscoveredCluster) {
  return cluster.metadata.uid!
}
