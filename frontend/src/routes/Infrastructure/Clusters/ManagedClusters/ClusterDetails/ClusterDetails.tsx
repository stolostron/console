/* Copyright Contributors to the Open Cluster Management project */

import { Page } from '@patternfly/react-core'
import {
  AgentClusterInstallK8sResource,
  AgentK8sResource,
  HostedClusterK8sResource,
  InfraEnvK8sResource,
} from '@openshift-assisted/ui-lib/cim'
import { Fragment, Suspense, useEffect, useMemo, useState } from 'react'
import {
  generatePath,
  Link,
  useParams,
  useNavigate,
  Outlet,
  useOutletContext,
  useMatch,
} from 'react-router-dom-v5-compat'
import { ErrorPage } from '../../../../../components/ErrorPage'
import { usePrevious } from '../../../../../components/usePrevious'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { canUser } from '../../../../../lib/rbac-util'
import { NavigationPath, UNKNOWN_NAMESPACE } from '../../../../../NavigationPath'
import {
  ClusterCurator,
  ClusterDeployment,
  ManagedCluster,
  ManagedClusterAddOn,
  SecretDefinition,
} from '../../../../../resources'
import {
  Addon,
  Cluster,
  ClusterStatus,
  getCluster,
  getResource,
  mapAddons,
  ResourceError,
  ResourceErrorCode,
} from '../../../../../resources/utils'
import { useRecoilValue, useSharedAtoms } from '../../../../../shared-recoil'
import {
  AcmActionGroup,
  AcmButton,
  AcmLaunchLink,
  AcmPage,
  AcmPageHeader,
  AcmSecondaryNav,
  AcmSecondaryNavItem,
  Provider,
} from '../../../../../ui-components'
import { KubevirtProviderAlert } from '../../../../../components/KubevirtProviderAlert'
import { useVirtualMachineDetection } from '../../../../../hooks/useVirtualMachineDetection'
import { ClusterActionDropdown } from '../components/ClusterActionDropdown'
import { ClusterDestroy } from '../components/ClusterDestroy'
import { DownloadConfigurationDropdown } from '../components/DownloadConfigurationDropdown'
import HypershiftKubeconfigDownload from '../components/HypershiftKubeconfigDownload'
import { ClusterAction, clusterSupportsAction } from '../utils/cluster-actions'
import keyBy from 'lodash/keyBy'

export type ClusterDetailsContext = {
  readonly cluster?: Cluster
  readonly managedCluster?: ManagedCluster
  readonly clusterCurator?: ClusterCurator
  readonly addons?: Addon[]
  readonly clusterDeployment?: ClusterDeployment
  readonly agents?: AgentK8sResource[]
  readonly agentClusterInstall?: AgentClusterInstallK8sResource
  readonly infraEnvAIFlow?: InfraEnvK8sResource
  readonly hostedCluster?: HostedClusterK8sResource
  readonly canGetSecret: boolean
}

export function showMachinePools(cluster: Cluster) {
  return (
    cluster.isHive &&
    cluster.isManaged &&
    cluster.provider &&
    ![Provider.baremetal, Provider.hostinventory, Provider.nutanix].includes(cluster.provider)
  )
}

export default function ClusterDetailsPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { name = '', namespace = '' } = useParams()
  const {
    agentClusterInstallsState,
    agentsState,
    certificateSigningRequestsState,
    clusterClaimsState,
    clusterCuratorsState,
    clusterDeploymentsState,
    clusterManagementAddonsState,
    hostedClustersState,
    infraEnvironmentsState,
    managedClusterAddonsState,
    managedClusterInfosState,
    managedClustersState,
    nodePoolsState,
    discoveredClusterState,
  } = useSharedAtoms()
  const managedClusters = useRecoilValue(managedClustersState)
  const clusterDeployments = useRecoilValue(clusterDeploymentsState)
  const managedClusterInfos = useRecoilValue(managedClusterInfosState)
  const certificateSigningRequests = useRecoilValue(certificateSigningRequestsState)
  const allManagedClusterAddons = useRecoilValue(managedClusterAddonsState)
  const allClusterManagementAddons = useRecoilValue(clusterManagementAddonsState)
  const clusterClaims = useRecoilValue(clusterClaimsState)
  const clusterCurators = useRecoilValue(clusterCuratorsState)
  const agentClusterInstalls = useRecoilValue(agentClusterInstallsState)
  const agents = useRecoilValue(agentsState)
  const infraEnvs = useRecoilValue(infraEnvironmentsState)
  const hostedClusters = useRecoilValue(hostedClustersState)
  const nodePools = useRecoilValue(nodePoolsState)
  const discoveredClusters = useRecoilValue(discoveredClusterState)
  const clusterManagementAddOns = keyBy(allClusterManagementAddons, 'metadata.name')

  const managedCluster = managedClusters.find((mc) => mc.metadata?.name === name)
  const clusterDeployment = clusterDeployments.find(
    (cd) => cd.metadata?.name === name && cd.metadata?.namespace === namespace
  )
  const managedClusterInfo = managedClusterInfos.find(
    (mci) => mci.metadata?.name === name && mci.metadata?.namespace === name
  )

  const managedClusterAddOns: ManagedClusterAddOn[] = allManagedClusterAddons?.[name || ''] || []
  const addons = mapAddons(clusterManagementAddOns, managedClusterAddOns)

  const clusterClaim = clusterClaims.find(
    (cc) =>
      cc.spec?.namespace === clusterDeployment?.metadata?.name &&
      cc.spec?.namespace === clusterDeployment?.metadata?.namespace
  )

  const clusterCurator = clusterCurators.find((cc) => cc.metadata?.namespace === namespace)

  const agentClusterInstall = agentClusterInstalls.find(
    (aci) =>
      aci.metadata?.name === clusterDeployment?.spec?.clusterInstallRef?.name &&
      clusterDeployment?.spec?.clusterInstallRef?.kind === 'AgentClusterInstall' &&
      clusterDeployment?.metadata?.namespace === aci.metadata?.namespace
  )

  const hostedCluster = hostedClusters.find((hc) => hc.metadata?.name === name && hc.metadata?.namespace === namespace)
  const infraEnvAIFlow = infraEnvs.find(
    (ie: InfraEnvK8sResource) =>
      ie.spec?.clusterRef?.name === clusterDeployment?.metadata?.name &&
      ie.spec?.clusterRef?.namespace === clusterDeployment?.metadata?.namespace
  )

  const discoveredCluster = discoveredClusters.find((dc) => dc.spec.displayName === managedCluster?.metadata.name)

  const clusterExists = !!managedCluster || !!clusterDeployment || !!managedClusterInfo || !!hostedCluster

  const cluster = getCluster({
    managedClusterInfo,
    clusterDeployment,
    certificateSigningRequests,
    managedCluster,
    managedClusterAddOns,
    clusterManagementAddOns,
    clusterClaim,
    clusterCurator,
    agentClusterInstall,
    hostedCluster,
    nodePools,
    discoveredCluster,
  })
  const prevCluster = usePrevious(cluster)
  const showMachinePoolTab = showMachinePools(cluster)

  const [canGetSecret, setCanGetSecret] = useState<boolean>(true)
  useEffect(() => {
    if (namespace !== UNKNOWN_NAMESPACE) {
      const canGetSecret = canUser('get', SecretDefinition, namespace)
      canGetSecret.promise.then((result) => setCanGetSecret(result.status?.allowed!)).catch((err) => console.error(err))
      return () => canGetSecret.abort()
    }
  }, [namespace])

  // Check for VirtualMachine resources on this specific cluster
  const { hasVirtualMachines } = useVirtualMachineDetection({ clusterName: name })
  const clusterDetailsContext = useMemo<ClusterDetailsContext>(
    () => ({
      cluster,
      managedCluster,
      clusterCurator,
      addons,
      agentClusterInstall,
      agents,
      clusterDeployment,
      infraEnvAIFlow,
      hostedCluster,
      canGetSecret,
    }),
    [
      addons,
      agentClusterInstall,
      agents,
      canGetSecret,
      cluster,
      clusterCurator,
      clusterDeployment,
      hostedCluster,
      infraEnvAIFlow,
      managedCluster,
    ]
  )

  const { isFineGrainedRbacEnabledState } = useSharedAtoms()
  const isFineGrainedRbacEnabled = useRecoilValue(isFineGrainedRbacEnabledState)

  const isClusterOverview = !!useMatch(NavigationPath.clusterOverview)
  const isClusterNodes = !!useMatch(NavigationPath.clusterNodes)
  const isClusterMachinePools = !!useMatch(NavigationPath.clusterMachinePools)
  const isClusterSettings = !!useMatch(NavigationPath.clusterSettings)
  const isClusterRoleAssignments = !!useMatch(NavigationPath.clusterRoleAssignments)

  if (
    (prevCluster?.isHive && prevCluster?.status === ClusterStatus.destroying) ||
    (!prevCluster?.isHive && prevCluster?.status === ClusterStatus.detaching)
  ) {
    return <ClusterDestroy isLoading={clusterExists} cluster={prevCluster!} agentClusterInstall={agentClusterInstall} />
  }

  if (!clusterExists) {
    return (
      <Page>
        <ErrorPage
          error={new ResourceError(ResourceErrorCode.NotFound)}
          actions={
            <AcmButton role="link" onClick={() => navigate(NavigationPath.clusters)} style={{ marginRight: '10px' }}>
              {t('button.backToClusters')}
            </AcmButton>
          }
        />
      </Page>
    )
  }

  const clusterActionGroupChildren = []
  const addonLinks = addons.filter((addon) => addon.launchLink)
  if (addonLinks.length > 0) {
    clusterActionGroupChildren.push(
      <AcmLaunchLink
        key={'AcmLaunchLink-cluster-action'}
        links={addonLinks?.map((addon) => ({
          id: addon.launchLink?.displayText!,
          text: addon.launchLink?.displayText!,
          href: addon.launchLink?.href!,
        }))}
      />
    )
  }
  if (cluster?.hive.secrets?.installConfig || (cluster?.kubeconfig && !cluster.isHypershift)) {
    clusterActionGroupChildren.push(
      <DownloadConfigurationDropdown
        key={'DownloadConfigurationDropdown-cluster-action'}
        cluster={cluster}
        canGetSecret={canGetSecret}
      />
    )
  }
  if (cluster?.isHypershift && cluster?.kubeconfig) {
    clusterActionGroupChildren.push(
      <HypershiftKubeconfigDownload
        hostedCluster={hostedCluster}
        fetchSecret={(name, namespace) =>
          getResource({ kind: 'Secret', apiVersion: 'v1', metadata: { name, namespace } }).promise
        }
      />
    )
  }
  if (
    Object.values(ClusterAction).some((clusterAction) => clusterSupportsAction(cluster, clusterAction as ClusterAction))
  ) {
    clusterActionGroupChildren.push(
      <ClusterActionDropdown key={'ClusterActionDropdown-cluster-action'} cluster={cluster!} isKebab={false} />
    )
  }

  return (
    <AcmPage
      hasDrawer
      header={
        <AcmPageHeader
          breadcrumb={[
            { text: t('Clusters'), to: NavigationPath.clusters },
            { text: cluster.displayName!, to: '' },
          ]}
          title={cluster.displayName!}
          description={
            cluster.hive.clusterClaimName && (
              <span style={{ color: 'var(--pf-v5-global--Color--200)' }}>{cluster.hive.clusterClaimName}</span>
            )
          }
          navigation={
            <AcmSecondaryNav>
              <AcmSecondaryNavItem isActive={isClusterOverview}>
                <Link to={generatePath(NavigationPath.clusterOverview, { name, namespace })}>{t('tab.overview')}</Link>
              </AcmSecondaryNavItem>
              <AcmSecondaryNavItem isActive={isClusterNodes}>
                <Link to={generatePath(NavigationPath.clusterNodes, { name, namespace })}>{t('tab.nodes')}</Link>
              </AcmSecondaryNavItem>
              {showMachinePoolTab && (
                <AcmSecondaryNavItem isActive={isClusterMachinePools}>
                  <Link to={generatePath(NavigationPath.clusterMachinePools, { name, namespace })}>
                    {t('tab.machinepools')}
                  </Link>
                </AcmSecondaryNavItem>
              )}
              <AcmSecondaryNavItem isActive={isClusterSettings}>
                <Link to={generatePath(NavigationPath.clusterSettings, { name, namespace })}>{t('tab.addons')}</Link>
              </AcmSecondaryNavItem>
              {isFineGrainedRbacEnabled && (
                <AcmSecondaryNavItem isActive={isClusterRoleAssignments}>
                  <Link to={generatePath(NavigationPath.clusterRoleAssignments, { name, namespace })}>
                    {t('Role assignments')}
                  </Link>
                </AcmSecondaryNavItem>
              )}
            </AcmSecondaryNav>
          }
          actions={<AcmActionGroup>{clusterActionGroupChildren}</AcmActionGroup>}
        />
      }
    >
      {hasVirtualMachines && (
        <div style={{ marginTop: '1rem', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
          <KubevirtProviderAlert variant="clusterDetails" component="hint" />
        </div>
      )}
      <Suspense fallback={<Fragment />}>
        <Outlet context={clusterDetailsContext} />
      </Suspense>
    </AcmPage>
  )
}

export function useClusterDetailsContext() {
  return useOutletContext<Required<ClusterDetailsContext>>()
}
