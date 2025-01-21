/* Copyright Contributors to the Open Cluster Management project */
/* istanbul ignore file */
import { useContext, useMemo } from 'react'
import {
  generatePath,
  LinkProps,
  Location,
  Navigate,
  NavigateFunction,
  ParamParseKey,
  PathMatch,
  PathParam,
  To,
  useLocation,
  useMatch,
  useNavigate,
} from 'react-router-dom-v5-compat'
import { LostChangesContext } from './components/LostChanges'
import { Cluster } from './resources/utils'

export const UNKNOWN_NAMESPACE = '~managed-cluster'

export const getClusterNavPath = (
  navPath:
    | NavigationPath.editCluster
    | NavigationPath.clusterDetails
    | NavigationPath.clusterOverview
    | NavigationPath.clusterSettings
    | NavigationPath.clusterMachinePools
    | NavigationPath.clusterNodes,
  cluster: Cluster
) =>
  generatePath(navPath, {
    name: cluster.name,
    namespace: (cluster.isHypershift ? cluster.hypershift?.hostingNamespace : cluster.namespace) ?? UNKNOWN_NAMESPACE,
  })

type ChildPath<B extends NavigationPath> = NavigationPath & `${B}${string}`
type RelativePath<B extends NavigationPath, T extends NavigationPath> = T extends `${B}${infer R}` ? R | `${R}/*` : void

export enum MatchType {
  SubRoutes = '/*',
  Exact = '',
}

function getRoutePath<B extends NavigationPath, T extends ChildPath<B>>({
  basePath = '',
  targetPath,
  match = MatchType.Exact,
}: {
  basePath?: B | ''
  targetPath: T
  match?: MatchType
}): RelativePath<B, T> {
  return `${targetPath.slice(basePath.length)}${match.toString()}` as RelativePath<B, T>
}

export function createRoutePathFunction<B extends NavigationPath>(
  basePath: B
): (targetPath: ChildPath<B>, match?: MatchType) => RelativePath<B, ChildPath<B>> {
  return (targetPath, match) => getRoutePath({ basePath, targetPath, match })
}

export enum NavigationPath {
  // Home
  home = '/multicloud/home',
  welcome = '/multicloud/home/welcome',
  overview = '/multicloud/home/overview',

  // Search
  search = '/multicloud/search',
  resources = '/multicloud/search/resources',
  resourceYAML = '/multicloud/search/resources/yaml',
  resourceRelated = '/multicloud/search/resources/related',
  resourceLogs = '/multicloud/search/resources/logs',

  // Infrastructure
  infrastructure = '/multicloud/infrastructure',

  // Infrastructure - Clusters - Managed Clusters
  clusters = '/multicloud/infrastructure/clusters',
  managedClusters = '/multicloud/infrastructure/clusters/managed',
  createAWSControlPlane = '/multicloud/infrastructure/clusters/create/aws/control-plane',
  createBMControlPlane = '/multicloud/infrastructure/clusters/create/hostinventory/control-plane',
  createKubeVirtControlPlane = '/multicloud/infrastructure/clusters/create/kubevirt/control-plane',
  createDiscoverHost = '/multicloud/infrastructure/clusters/create/discover-host',
  createCluster = '/multicloud/infrastructure/clusters/create',
  createAWSCLI = '/multicloud/infrastructure/clusters/create/aws/cli',
  createKubeVirt = '/multicloud/infrastructure/clusters/create/kubevirt',
  editCluster = '/multicloud/infrastructure/clusters/edit/:namespace/:name',
  clusterDetails = '/multicloud/infrastructure/clusters/details/:namespace/:name',
  clusterOverview = '/multicloud/infrastructure/clusters/details/:namespace/:name/overview',
  clusterSettings = '/multicloud/infrastructure/clusters/details/:namespace/:name/settings',
  clusterMachinePools = '/multicloud/infrastructure/clusters/details/:namespace/:name/machinepools',
  clusterNodes = '/multicloud/infrastructure/clusters/details/:namespace/:name/nodes',
  importCluster = '/multicloud/infrastructure/clusters/import',
  importCommand = '/multicloud/infrastructure/clusters/import/:clusterName',

  // Infrastructure - Clusters - Cluster Sets
  clusterSets = '/multicloud/infrastructure/clusters/sets',
  createClusterSet = '/multicloud/infrastructure/clusters/sets/create',
  clusterSetDetails = '/multicloud/infrastructure/clusters/sets/details/:id',
  clusterSetOverview = '/multicloud/infrastructure/clusters/sets/details/:id/overview',
  clusterSetAccess = '/multicloud/infrastructure/clusters/sets/details/:id/access',
  clusterSetClusterPools = '/multicloud/infrastructure/clusters/sets/details/:id/cluster-pools',
  clusterSetClusters = '/multicloud/infrastructure/clusters/sets/details/:id/clusters',
  clusterSetManage = '/multicloud/infrastructure/clusters/sets/details/:id/manage-resources',
  clusterSetSubmariner = '/multicloud/infrastructure/clusters/sets/details/:id/submariner',
  clusterSetSubmarinerInstall = '/multicloud/infrastructure/clusters/sets/details/:id/install-submariner',

  // Infrastructure - Clusters - Cluster Pools
  clusterPools = '/multicloud/infrastructure/clusters/pools',
  createClusterPool = '/multicloud/infrastructure/clusters/pools/create',

  // Infrastructure - Clusters - Discovery
  discoveredClusters = '/multicloud/infrastructure/clusters/discovered',
  configureDiscovery = '/multicloud/infrastructure/clusters/discovered/configure',
  createDiscovery = '/multicloud/infrastructure/clusters/discovered/create',

  // Infrastructure - Environments
  infraEnvironments = '/multicloud/infrastructure/environments',
  createInfraEnv = '/multicloud/infrastructure/environments/create',
  infraEnvironmentDetails = '/multicloud/infrastructure/environments/details/:namespace/:name',
  infraEnvironmentHosts = '/multicloud/infrastructure/environments/details/:namespace/:name/hosts',
  infraEnvironmentOverview = '/multicloud/infrastructure/environments/details/:namespace/:name/overview',

  // Infrastructure - Automations
  ansibleAutomations = '/multicloud/infrastructure/automations',
  addAnsibleAutomation = '/multicloud/infrastructure/automations/add',
  editAnsibleAutomation = '/multicloud/infrastructure/automations/edit/:namespace/:name',
  viewAnsibleAutomation = '/multicloud/infrastructure/automations/details/:namespace/:name',

  // Infrastructure - Virtual Machines
  virtualMachines = '/multicloud/infrastructure/virtualmachines',
  virtualMachinesForCluster = '/multicloud/infrastructure/virtualmachines/:cluster',
  virtualMachinesForNamespace = '/multicloud/infrastructure/virtualmachines/:cluster/:namespace',

  // Applications
  applications = '/multicloud/applications',
  advancedConfiguration = '/multicloud/applications/advanced',
  createApplicationArgo = '/multicloud/applications/create/argo',
  createApplicationArgoPullModel = '/multicloud/applications/create/argopullmodel',
  editApplicationArgo = '/multicloud/applications/edit/argo/:namespace/:name',
  createApplicationSubscription = '/multicloud/applications/create/subscription',
  applicationDetails = '/multicloud/applications/details/:namespace/:name',
  applicationOverview = '/multicloud/applications/details/:namespace/:name/overview',
  applicationTopology = '/multicloud/applications/details/:namespace/:name/topology',
  editApplicationSubscription = '/multicloud/applications/edit/subscription/:namespace/:name',

  // Governance
  governance = '/multicloud/governance',
  policies = '/multicloud/governance/policies',
  policySets = '/multicloud/governance/policy-sets',
  createPolicy = '/multicloud/governance/policies/create',
  editPolicy = '/multicloud/governance/policies/edit/:namespace/:name',
  createPolicyAutomation = '/multicloud/governance/policyautomation/create/:namespace/:name',
  editPolicyAutomation = '/multicloud/governance/policyautomation/edit/:namespace/:name',
  policyDetails = '/multicloud/governance/policies/details/:namespace/:name',
  discoveredByCluster = '/multicloud/governance/discovered/:apiGroup/:apiVersion/:kind/:policyName',
  policyDetailsResults = '/multicloud/governance/policies/details/:namespace/:name/results',
  policyDetailsHistory = '/multicloud/governance/policies/details/:namespace/:name/status/:clusterName/templates/:templateName/history',
  policyTemplateDetails = '/multicloud/governance/policies/details/:namespace/:name/template/:clusterName/:apiGroup?/:apiVersion/:kind/:templateName',
  discoveredPolicyDetails = '/multicloud/governance/discovered/:apiGroup/:apiVersion/:kind/:templateName/:templateNamespace?/:clusterName/detail',
  discoveredPolicyYaml = '/multicloud/governance/discovered/:apiGroup/:apiVersion/:kind/:templateName/:templateNamespace?/:clusterName/yaml',
  policyTemplateYaml = '/multicloud/governance/policies/details/:namespace/:name/template/:clusterName/:apiGroup?/:apiVersion/:kind/:templateName/yaml',
  createPolicySet = '/multicloud/governance/policy-sets/create',
  editPolicySet = '/multicloud/governance/policy-sets/edit/:namespace/:name',
  discoveredPolicies = '/multicloud/governance/discovered',

  // Credentials
  credentials = '/multicloud/credentials',
  addCredentials = '/multicloud/credentials/create',
  addAWSType = '/multicloud/credentials/create/aws/type',
  editCredentials = '/multicloud/credentials/edit/:namespace/:name',
  viewCredentials = '/multicloud/credentials/details/:namespace/:name',

  emptyPath = '',
}

export type BackCancelState = {
  /** Number of entries Back button can navigate back in history */
  maxBackSteps?: number
  /** Number of entries Cancel button should navigate back in history to get to starting point */
  cancelSteps?: number
}

export function getBackCancelLocationLinkProps(location: To | Location): Pick<LinkProps, 'to' | 'state'> {
  const newState: BackCancelState = { maxBackSteps: 1, cancelSteps: 1 }

  return {
    to: location,
    state: {
      ...(typeof location !== 'string' && 'state' in location ? location.state : {}),
      ...newState,
    },
  }
}

export function navigateToBackCancelLocation(navigate: NavigateFunction, location: To | Location): void {
  const { to, state } = getBackCancelLocationLinkProps(location)
  navigate(to, { state })
}

export function useBackCancelNavigation(): {
  nextStep: (location: To | Location<BackCancelState>) => () => void
  back: (defaultLocation: To | Location<BackCancelState>) => () => void
  cancel: (defaultLocation: To | Location<BackCancelState>) => () => void
} {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { cancelForm } = useContext(LostChangesContext)

  return useMemo(
    () => ({
      nextStep: (newLocation) => () => {
        const newState: BackCancelState = {
          maxBackSteps: state?.maxBackSteps ? state.maxBackSteps + 1 : 1, // when starting at an intermediate step, back can navigate to this point
          cancelSteps: state?.cancelSteps ? state.cancelSteps + 1 : 0, // when starting at an intermediate step, cancel should go to default
        }
        navigate(newLocation, {
          state: {
            ...(state ?? {}),
            ...(typeof newLocation !== 'string' && 'state' in newLocation ? newLocation.state : {}),
            ...newState,
          },
        })
      },
      back: (defaultLocation) => () => {
        cancelForm()
        if (state?.maxBackSteps) {
          navigate(-1)
        } else {
          navigate(defaultLocation)
        }
      },
      cancel: (defaultLocation) => () => {
        cancelForm()
        if (state?.cancelSteps) {
          navigate(-state.cancelSteps)
        } else {
          navigate(defaultLocation)
        }
      },
    }),
    [cancelForm, navigate, state]
  )
}

export function SubRoutesRedirect<B extends NavigationPath, M extends ChildPath<B>, T extends ChildPath<M>>({
  matchPath,
  targetPath,
}: {
  readonly matchPath: M
  readonly targetPath: T
}) {
  const { search } = useLocation()

  const pathMatch = useMatch(`${matchPath}/*`) as unknown as PathMatch<ParamParseKey<M>>
  type GeneratePathParams = {
    [key in PathParam<T>]: string | null
  }
  const params = pathMatch
    ? (Object.keys(pathMatch.params) as PathParam<M>[]).reduce((params, key) => {
        const originalValue = pathMatch.params[key]
        params[key as unknown as PathParam<T>] = originalValue ?? null
        return params
      }, {} as GeneratePathParams)
    : undefined

  return (
    <Navigate
      to={{
        pathname: generatePath(targetPath, params),
        search,
      }}
      replace
    />
  )
}
