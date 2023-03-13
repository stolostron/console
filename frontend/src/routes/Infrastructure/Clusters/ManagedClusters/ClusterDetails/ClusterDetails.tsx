/* Copyright Contributors to the Open Cluster Management project */

import { Page } from '@patternfly/react-core'
import { matchPath, generatePath } from 'react-router'
import {
  AgentClusterInstallK8sResource,
  AgentK8sResource,
  HostedClusterK8sResource,
  InfraEnvK8sResource,
} from 'openshift-assisted-ui-lib/cim'
import { createContext, Fragment, Suspense, useEffect, useState } from 'react'
import { Link, Redirect, Route, RouteComponentProps, Switch, useHistory, useLocation } from 'react-router-dom'
import { ErrorPage } from '../../../../../components/ErrorPage'
import { usePrevious } from '../../../../../components/usePrevious'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { canUser } from '../../../../../lib/rbac-util'
import { getClusterNavPath, NavigationPath } from '../../../../../NavigationPath'
import {
  Addon,
  Cluster,
  ClusterCurator,
  ClusterDeployment,
  ClusterStatus,
  getCluster,
  getResource,
  ManagedCluster,
  mapAddons,
  ResourceError,
  ResourceErrorCode,
  SecretDefinition,
} from '../../../../../resources'
import { useRecoilValue, useSharedAtoms, useSharedRecoil } from '../../../../../shared-recoil'
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
import { ClusterActionDropdown } from '../components/ClusterActionDropdown'
import { ClusterDestroy } from '../components/ClusterDestroy'
import { DownloadConfigurationDropdown } from '../components/DownloadConfigurationDropdown'
import { useAllClusters } from '../components/useAllClusters'
import { MachinePoolsPageContent } from './ClusterMachinePools/ClusterMachinePools'
import { NodePoolsPageContent } from './ClusterNodes/ClusterNodes'
import { ClusterOverviewPageContent } from './ClusterOverview/ClusterOverview'
import { ClustersSettingsPageContent } from './ClusterSettings/ClusterSettings'
import HypershiftKubeconfigDownload from '../components/HypershiftKubeconfigDownload'
import { ClusterAction, clusterSupportsAction } from '../utils/cluster-actions'

export const ClusterContext = createContext<{
  readonly cluster?: Cluster
  readonly managedCluster?: ManagedCluster
  readonly clusterCurator?: ClusterCurator
  readonly addons?: Addon[]
  readonly clusterDeployment?: ClusterDeployment
  readonly agents?: AgentK8sResource[]
  readonly agentClusterInstall?: AgentClusterInstallK8sResource
  // readonly infraEnv?: InfraEnvK8sResource
  readonly infraEnvAIFlow?: InfraEnvK8sResource
  readonly hostedCluster?: HostedClusterK8sResource
  readonly selectedHostedCluster?: HostedClusterK8sResource
}>({})

export default function ClusterDetailsPage({
  match: {
    params: { name, namespace },
  },
}: RouteComponentProps<{ namespace: string; name: string }>) {
  const location = useLocation()
  const history = useHistory()
  const { t } = useTranslation()

  const { waitForAll } = useSharedRecoil()
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
  } = useSharedAtoms()
  const [
    managedClusters,
    clusterDeployments,
    managedClusterInfos,
    certificateSigningRequests,
    managedClusterAddons,
    clusterManagementAddons,
    clusterClaims,
    clusterCurators,
    agentClusterInstalls,
    agents,
    infraEnvs,
    hostedClusters,
    nodePools,
  ] = useRecoilValue(
    waitForAll([
      managedClustersState,
      clusterDeploymentsState,
      managedClusterInfosState,
      certificateSigningRequestsState,
      managedClusterAddonsState,
      clusterManagementAddonsState,
      clusterClaimsState,
      clusterCuratorsState,
      agentClusterInstallsState,
      agentsState,
      infraEnvironmentsState,
      hostedClustersState,
      nodePoolsState,
    ])
  )

  const managedCluster = managedClusters.find((mc) => mc.metadata?.name === name)
  const clusterDeployment = clusterDeployments.find(
    (cd) => cd.metadata?.name === name && cd.metadata?.namespace === namespace
  )
  const managedClusterInfo = managedClusterInfos.find(
    (mci) => mci.metadata?.name === name && mci.metadata?.namespace === name
  )
  const clusterAddons = managedClusterAddons.filter((mca) => mca.metadata?.namespace === name)
  const addons = mapAddons(clusterManagementAddons, clusterAddons)

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

  const clusterExists = !!managedCluster || !!clusterDeployment || !!managedClusterInfo || !!hostedCluster

  const clusters = useAllClusters()
  const selectedHostedCluster = clusters.find((c) => c.name === name && c.namespace === namespace)
  const selectedHostedClusterResource = hostedClusters.find(
    (hc) => hc.metadata?.name === name && hc.metadata?.namespace === namespace
  )

  const cluster = getCluster(
    managedClusterInfo,
    clusterDeployment,
    certificateSigningRequests,
    managedCluster,
    clusterAddons,
    clusterManagementAddons,
    clusterClaim,
    clusterCurator,
    agentClusterInstall,
    hostedCluster,
    selectedHostedClusterResource,
    nodePools
  )
  const prevCluster = usePrevious(cluster)
  const showMachinePoolTab =
    cluster.isHive &&
    cluster.isManaged &&
    cluster.provider &&
    ![Provider.baremetal, Provider.hostinventory].includes(cluster.provider)

  const [canGetSecret, setCanGetSecret] = useState<boolean>(true)
  useEffect(() => {
    const canGetSecret = canUser('get', SecretDefinition, namespace)
    canGetSecret.promise.then((result) => setCanGetSecret(result.status?.allowed!)).catch((err) => console.error(err))
    return () => canGetSecret.abort()
  }, [namespace])

  if (
    (prevCluster?.isHive && prevCluster?.status === ClusterStatus.destroying) ||
    (!prevCluster?.isHive && prevCluster?.status === ClusterStatus.detaching)
  ) {
    return <ClusterDestroy isLoading={clusterExists} cluster={prevCluster!} />
  }

  if (!clusterExists && !selectedHostedCluster) {
    return (
      <Page>
        <ErrorPage
          error={new ResourceError(ResourceErrorCode.NotFound)}
          actions={
            <AcmButton
              role="link"
              onClick={() => history.push(NavigationPath.clusters)}
              style={{ marginRight: '10px' }}
            >
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
      <DownloadConfigurationDropdown key={'DownloadConfigurationDropdown-cluster-action'} canGetSecret={canGetSecret} />
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
    <ClusterContext.Provider
      value={{
        cluster,
        managedCluster,
        clusterCurator,
        addons,
        agentClusterInstall,
        agents,
        clusterDeployment,
        // infraEnv,
        infraEnvAIFlow,
        hostedCluster,
        selectedHostedCluster: selectedHostedClusterResource,
      }}
    >
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
                <span style={{ color: 'var(--pf-global--Color--200)' }}>{cluster.hive.clusterClaimName}</span>
              )
            }
            navigation={
              <AcmSecondaryNav>
                <AcmSecondaryNavItem
                  isActive={
                    !!matchPath(location.pathname, {
                      path: NavigationPath.clusterOverview,
                      exact: true,
                      strict: false,
                    })
                  }
                >
                  <Link to={generatePath(NavigationPath.clusterOverview, { name, namespace })}>
                    {t('tab.overview')}
                  </Link>
                </AcmSecondaryNavItem>
                <AcmSecondaryNavItem
                  isActive={
                    !!matchPath(location.pathname, {
                      path: NavigationPath.clusterNodes,
                      exact: true,
                      strict: false,
                    })
                  }
                >
                  <Link to={generatePath(NavigationPath.clusterNodes, { name, namespace })}>{t('tab.nodes')}</Link>
                </AcmSecondaryNavItem>
                {showMachinePoolTab && (
                  <AcmSecondaryNavItem
                    isActive={
                      !!matchPath(location.pathname, {
                        path: NavigationPath.clusterMachinePools,
                        exact: true,
                        strict: false,
                      })
                    }
                  >
                    <Link to={generatePath(NavigationPath.clusterMachinePools, { name, namespace })}>
                      {t('tab.machinepools')}
                    </Link>
                  </AcmSecondaryNavItem>
                )}
                <AcmSecondaryNavItem
                  isActive={
                    !!matchPath(location.pathname, {
                      path: NavigationPath.clusterSettings,
                      exact: true,
                      strict: false,
                    })
                  }
                >
                  <Link to={generatePath(NavigationPath.clusterSettings, { name, namespace })}>{t('tab.addons')}</Link>
                </AcmSecondaryNavItem>
              </AcmSecondaryNav>
            }
            actions={<AcmActionGroup>{clusterActionGroupChildren}</AcmActionGroup>}
          />
        }
      >
        <Suspense fallback={<Fragment />}>
          <Switch>
            <Route exact path={NavigationPath.clusterOverview}>
              <ClusterOverviewPageContent
                canGetSecret={canGetSecret}
                selectedHostedClusterResource={selectedHostedClusterResource}
              />
            </Route>
            <Route exact path={NavigationPath.clusterNodes}>
              <NodePoolsPageContent />
            </Route>
            {showMachinePoolTab && (
              <Route exact path={NavigationPath.clusterMachinePools}>
                <MachinePoolsPageContent />
              </Route>
            )}
            <Route exact path={NavigationPath.clusterSettings}>
              <ClustersSettingsPageContent />
            </Route>
            <Route exact path={NavigationPath.clusterDetails}>
              <Redirect to={getClusterNavPath(NavigationPath.clusterOverview, cluster)} />
            </Route>
          </Switch>
        </Suspense>
      </AcmPage>
    </ClusterContext.Provider>
  )
}
