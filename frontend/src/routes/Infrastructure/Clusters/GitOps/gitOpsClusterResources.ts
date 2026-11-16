/* Copyright Contributors to the Open Cluster Management project */

import { rbacCreate, rbacGet, rbacPatch } from '~/lib/rbac-util'
import type { IResource } from '~/resources'
import { getResource, reconcileResources, ResourceError, ResourceErrorCode } from '~/resources/utils'
import type { GitOpsCluster } from '~/resources/gitops-cluster'
import { GitOpsClusterApiVersion, GitOpsClusterKind, GitopsClusterDefinition } from '~/resources/gitops-cluster'
import {
  ManagedClusterSetBindingApiVersion,
  ManagedClusterSetBindingDefinition,
  ManagedClusterSetBindingKind,
  type ManagedClusterSetBinding,
} from '~/resources/managed-cluster-set-binding'
import { PlacementApiVersionBeta, PlacementDefinition, PlacementKind, type Placement } from '~/resources/placement'
import { PolicyApiVersion, PolicyDefinition, PolicyKind, type Policy } from '~/resources/policy'
import { createSubjectAccessReview } from '~/resources/self-subject-access-review'
import {
  SubscriptionOperatorApiVersion,
  SubscriptionOperatorDefinition,
  SubscriptionOperatorKind,
  type SubscriptionOperator,
} from '~/resources/subscription-operator'

export const ArgoCDApiVersion = 'argoproj.io/v1beta1'
export const ArgoCDKind = 'ArgoCD'
export const ArgoCDDefinition: IResource = { apiVersion: ArgoCDApiVersion, kind: ArgoCDKind }

export const AppProjectApiVersion = 'argoproj.io/v1alpha1'
export const AppProjectKind = 'AppProject'
export const AppProjectDefinition: IResource = { apiVersion: AppProjectApiVersion, kind: AppProjectKind }

export const GITOPS_OPERATOR_SUBSCRIPTION_NAME = 'openshift-gitops-operator'
export const GITOPS_OPERATOR_SUBSCRIPTION_NAMESPACE = 'openshift-gitops-operator'

export const AGENT_SUBSCRIPTION_ENV = [
  { name: 'ARGOCD_CLUSTER_CONFIG_NAMESPACES', value: 'openshift-gitops,local-cluster' },
  { name: 'ARGOCD_PRINCIPAL_TLS_SERVER_ALLOW_GENERATE', value: 'false' },
  { name: 'ARGOCD_PRINCIPAL_REDIS_SERVER_ADDRESS', value: 'openshift-gitops-redis:6379' },
] as const

export const AGENT_AUTH =
  'mtls:CN=system:open-cluster-management:cluster:([^:]+):addon:gitops-addon:agent:gitops-addon-agent'

export type GitOpsClusterWizardData = GitOpsCluster & {
  transformed?: {
    pushModelEnabled?: boolean
  }
}

export function isAgentEnabled(gitOpsCluster?: GitOpsCluster): boolean {
  return (
    gitOpsCluster?.spec?.gitopsAddon?.enabled === true &&
    gitOpsCluster?.spec?.gitopsAddon?.argoCDAgent?.enabled === true
  )
}

export function isPushModelEnabled(gitOpsCluster?: GitOpsClusterWizardData): boolean {
  return gitOpsCluster?.transformed?.pushModelEnabled === true
}

export function placementNameFor(gitOpsClusterName: string): string {
  // Empty wizard name must still yield a valid DNS-1123 name (not "-placement").
  const base = gitOpsClusterName.trim() || 'gitopscluster'
  return `${base}-placement`
}

export function policyNameFor(gitOpsClusterName: string): string {
  const base = gitOpsClusterName.trim() || 'gitopscluster'
  return `${base}-argocd-policy`
}

export function createGitOpsClusterResource(options: {
  name: string
  namespace: string
  agentEnabled: boolean
  pushModelEnabled?: boolean
  existing?: GitOpsCluster
}): GitOpsClusterWizardData {
  const { name, namespace, agentEnabled, pushModelEnabled = false, existing } = options
  const resource: GitOpsClusterWizardData = {
    apiVersion: GitOpsClusterApiVersion,
    kind: GitOpsClusterKind,
    metadata: {
      ...existing?.metadata,
      name,
      namespace,
    },
    spec: {
      ...existing?.spec,
      argoServer: {
        ...existing?.spec?.argoServer,
        argoNamespace: namespace,
      },
      placementRef: {
        kind: PlacementKind,
        apiVersion: PlacementApiVersionBeta,
        // Only keep placementRef on live edit objects. Create drafts must rename with the form name.
        name:
          existing?.metadata?.uid && existing.spec?.placementRef?.name
            ? existing.spec.placementRef.name
            : placementNameFor(name),
      },
    },
    transformed: {
      pushModelEnabled: agentEnabled ? pushModelEnabled : false,
    },
  }

  if (agentEnabled) {
    resource.spec!.gitopsAddon = {
      ...existing?.spec?.gitopsAddon,
      enabled: true,
      argoCDAgent: {
        ...existing?.spec?.gitopsAddon?.argoCDAgent,
        enabled: true,
      },
    }
  } else if (resource.spec) {
    delete resource.spec.gitopsAddon
  }

  return resource
}

export function createPlacementResource(options: {
  name: string
  namespace: string
  clusterSets?: string[]
  existing?: Placement
}): Placement {
  const { name, namespace, clusterSets, existing } = options
  const defaultPredicates: NonNullable<Placement['spec']['predicates']> = [
    {
      requiredClusterSelector: {
        labelSelector: {
          matchExpressions: [
            {
              key: 'vendor',
              operator: 'In',
              values: ['OpenShift'],
            },
            {
              key: 'local-cluster',
              operator: 'DoesNotExist',
            },
          ],
        },
      },
    },
  ]

  const selectedClusterSets = clusterSets ?? existing?.spec?.clusterSets
  const spec: Placement['spec'] = {
    // Preserve fields such as numberOfClusters from the live Placement.
    ...existing?.spec,
    tolerations: existing?.spec?.tolerations ?? [
      {
        key: 'cluster.open-cluster-management.io/unreachable',
        operator: 'Exists',
      },
      {
        key: 'cluster.open-cluster-management.io/unavailable',
        operator: 'Exists',
      },
    ],
    predicates: existing?.spec?.predicates?.length ? existing.spec.predicates : defaultPredicates,
  }

  if (clusterSets !== undefined) {
    if (clusterSets.length > 0) {
      spec.clusterSets = clusterSets
    } else {
      delete spec.clusterSets
    }
  } else if (selectedClusterSets?.length) {
    spec.clusterSets = selectedClusterSets
  }

  return {
    apiVersion: PlacementApiVersionBeta,
    kind: PlacementKind,
    metadata: {
      ...existing?.metadata,
      // Only keep the Placement name when it already exists on the cluster (has uid).
      // Create drafts start as "*-placement" and must rename as the user types the GitOpsCluster name.
      name: existing?.metadata?.uid ? (existing.metadata.name ?? placementNameFor(name)) : placementNameFor(name),
      namespace,
    },
    spec,
  }
}

export function createManagedClusterSetBindings(options: {
  namespace: string
  clusterSets: string[]
  existingBindings?: ManagedClusterSetBinding[]
}): ManagedClusterSetBinding[] {
  const { namespace, clusterSets, existingBindings = [] } = options
  return clusterSets.map((clusterSet) => {
    const existing = existingBindings.find(
      (binding) =>
        binding.metadata.namespace === namespace &&
        (binding.spec.clusterSet === clusterSet || binding.metadata.name === clusterSet)
    )
    return (
      existing ?? {
        apiVersion: ManagedClusterSetBindingApiVersion,
        kind: ManagedClusterSetBindingKind,
        metadata: { name: clusterSet, namespace },
        spec: { clusterSet },
      }
    )
  })
}

function cloneResource<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export function findArgoCDInNamespace(argoCDs: IResource[], namespace: string): IResource | undefined {
  return argoCDs.find((item) => item.metadata?.namespace === namespace)
}

/** Apply Agent settings. Reuse an ArgoCD already in this namespace; otherwise emit a new one to create. */
export function mergeHubArgoCD(
  existing: IResource | undefined,
  options: { namespace: string; pushEnabled: boolean }
): IResource {
  const { namespace, pushEnabled } = options
  const sameNamespace = existing?.metadata?.namespace === namespace
  const base: IResource = sameNamespace
    ? cloneResource(existing as IResource)
    : {
        apiVersion: ArgoCDApiVersion,
        kind: ArgoCDKind,
        metadata: { name: 'openshift-gitops', namespace },
      }

  const spec = ((base as { spec?: Record<string, unknown> }).spec ??= {})
  const controller = ((spec.controller as Record<string, unknown> | undefined) ??= {})
  controller.enabled = pushEnabled
  spec.sourceNamespaces = ['*']
  const argoCDAgent = ((spec.argoCDAgent as Record<string, unknown> | undefined) ??= {})
  const principal = ((argoCDAgent.principal as Record<string, unknown> | undefined) ??= {})
  principal.enabled = true
  principal.destinationBasedMapping = true
  principal.auth = AGENT_AUTH
  const principalNamespace = ((principal.namespace as Record<string, unknown> | undefined) ??= {})
  principalNamespace.allowedNamespaces = ['*']
  const server = ((principal.server as Record<string, unknown> | undefined) ??= {})
  const route = ((server.route as Record<string, unknown> | undefined) ??= {})
  route.enabled = true
  base.metadata = {
    ...(sameNamespace ? base.metadata : {}),
    name: sameNamespace ? base.metadata?.name || 'openshift-gitops' : 'openshift-gitops',
    namespace,
  }
  return base
}

export function createDefaultAppProject(namespace: string, existing?: IResource): IResource {
  const base = existing
    ? cloneResource(existing)
    : {
        apiVersion: AppProjectApiVersion,
        kind: AppProjectKind,
        metadata: { name: 'default', namespace },
      }
  base.metadata = {
    ...base.metadata,
    name: 'default',
    namespace,
  }
  ;(base as { spec?: Record<string, unknown> }).spec = {
    sourceNamespaces: ['*'],
    destinations: [{ name: '*', namespace: '*', server: '*' }],
    clusterResourceWhitelist: [{ group: '*', kind: '*' }],
    sourceRepos: ['*'],
  }
  return base
}

export function findGitOpsOperatorSubscription(
  subscriptions: SubscriptionOperator[]
): SubscriptionOperator | undefined {
  return subscriptions.find(
    (subscription) =>
      subscription.spec?.name === GITOPS_OPERATOR_SUBSCRIPTION_NAME ||
      subscription.metadata?.name === GITOPS_OPERATOR_SUBSCRIPTION_NAME
  )
}

export function mergeGitOpsOperatorSubscription(existing?: SubscriptionOperator): SubscriptionOperator {
  const base: SubscriptionOperator = existing
    ? cloneResource(existing)
    : {
        apiVersion: SubscriptionOperatorApiVersion,
        kind: SubscriptionOperatorKind,
        metadata: {
          name: GITOPS_OPERATOR_SUBSCRIPTION_NAME,
          namespace: GITOPS_OPERATOR_SUBSCRIPTION_NAMESPACE,
        },
        spec: { name: GITOPS_OPERATOR_SUBSCRIPTION_NAME },
      }

  const env = [...(base.spec.config?.env ?? [])]
  for (const required of AGENT_SUBSCRIPTION_ENV) {
    const index = env.findIndex((item) => item.name === required.name)
    if (index >= 0) {
      env[index] = { ...env[index], value: required.value }
    } else {
      env.push({ name: required.name, value: required.value })
    }
  }
  base.spec = {
    ...base.spec,
    name: base.spec?.name || GITOPS_OPERATOR_SUBSCRIPTION_NAME,
    config: {
      ...base.spec.config,
      env,
    },
  }
  if (!base.metadata.namespace) {
    base.metadata.namespace = GITOPS_OPERATOR_SUBSCRIPTION_NAMESPACE
  }
  if (!base.metadata.name) {
    base.metadata.name = GITOPS_OPERATOR_SUBSCRIPTION_NAME
  }
  return base
}

export function createArgoCDAgentPolicy(options: {
  gitOpsClusterName: string
  namespace: string
  existing?: Policy
}): Policy {
  const { gitOpsClusterName, namespace, existing } = options
  const name = policyNameFor(gitOpsClusterName)
  if (existing?.spec?.['policy-templates']?.length) {
    return {
      ...existing,
      metadata: {
        ...existing.metadata,
        name,
        namespace,
      },
    }
  }

  // Policy object-templates intentionally carry spoke ArgoCD + RBAC shapes from docs
  const policy = {
    apiVersion: PolicyApiVersion,
    kind: PolicyKind,
    metadata: {
      name,
      namespace,
      annotations: {
        'policy.open-cluster-management.io/standards': 'NIST-CSF',
        'policy.open-cluster-management.io/categories': 'PR.PT Protective Technology',
        'policy.open-cluster-management.io/controls': 'PR.PT-3 Least Functionality',
      },
    },
    spec: {
      remediationAction: 'enforce',
      disabled: false,
      'policy-templates': [
        {
          objectDefinition: {
            apiVersion: PolicyApiVersion,
            kind: 'ConfigurationPolicy',
            metadata: { name: `${gitOpsClusterName}-argocd-config-policy` },
            spec: {
              pruneObjectBehavior: 'None',
              remediationAction: 'enforce',
              severity: 'medium',
              'object-templates': [
                {
                  complianceType: 'musthave',
                  objectDefinition: {
                    apiVersion: ArgoCDApiVersion,
                    kind: ArgoCDKind,
                    metadata: {
                      name: 'acm-openshift-gitops',
                      namespace: 'openshift-gitops',
                      labels: {
                        'apps.open-cluster-management.io/gitopsaddon': 'true',
                      },
                    },
                    spec: {
                      server: { enabled: false },
                      argoCDAgent: {
                        agent: {
                          enabled: true,
                          allowedNamespaces: ['*'],
                          client: {
                            principalServerAddress: '<auto-discovered>',
                            mode: 'managed',
                          },
                          tls: {
                            secretName: 'argocd-agent-client-tls',
                            rootCASecretName: 'argocd-agent-ca',
                          },
                        },
                      },
                    },
                  },
                },
              ],
            },
          },
        },
        {
          objectDefinition: {
            apiVersion: PolicyApiVersion,
            kind: 'ConfigurationPolicy',
            metadata: { name: `${gitOpsClusterName}-argocd-rbac-policy` },
            spec: {
              pruneObjectBehavior: 'None',
              remediationAction: 'enforce',
              severity: 'medium',
              'object-templates': [
                {
                  complianceType: 'musthave',
                  objectDefinition: {
                    apiVersion: 'rbac.authorization.k8s.io/v1',
                    kind: 'ClusterRoleBinding',
                    metadata: { name: 'acm-openshift-gitops-cluster-admin' },
                    roleRef: {
                      apiGroup: 'rbac.authorization.k8s.io',
                      kind: 'ClusterRole',
                      name: 'cluster-admin',
                    },
                    subjects: [
                      {
                        kind: 'ServiceAccount',
                        name: 'acm-openshift-gitops-argocd-application-controller',
                        namespace: 'openshift-gitops',
                      },
                    ],
                  },
                },
                {
                  complianceType: 'musthave',
                  objectDefinition: {
                    apiVersion: 'rbac.authorization.k8s.io/v1',
                    kind: 'ClusterRoleBinding',
                    metadata: { name: 'acm-openshift-gitops-argocd-agent-cluster-reader' },
                    roleRef: {
                      apiGroup: 'rbac.authorization.k8s.io',
                      kind: 'ClusterRole',
                      name: 'view',
                    },
                    subjects: [
                      {
                        kind: 'ServiceAccount',
                        name: 'acm-openshift-gitops-agent-agent',
                        namespace: 'openshift-gitops',
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
      ],
    },
  }
  return policy as Policy
}

export interface BuildGitOpsClusterResourcesOptions {
  name: string
  namespace: string
  agentEnabled: boolean
  pushModelEnabled?: boolean
  clusterSets?: string[]
  existingGitOpsCluster?: GitOpsCluster
  existingPlacement?: Placement
  existingBindings?: ManagedClusterSetBinding[]
  existingArgoCD?: IResource
  existingAppProject?: IResource
  existingSubscription?: SubscriptionOperator
  existingPolicy?: Policy
  includeBindings?: boolean
}

/**
 * Recommended SyncEditor order:
 * [GitOpsCluster, Placement, ManagedClusterSetBinding(s)?, ArgoCD?, AppProject?, Subscription?, Policy?]
 */
export function buildGitOpsClusterResources(options: BuildGitOpsClusterResourcesOptions): IResource[] {
  const {
    name,
    namespace,
    agentEnabled,
    pushModelEnabled = false,
    clusterSets = [],
    existingGitOpsCluster,
    existingPlacement,
    existingBindings = [],
    existingArgoCD,
    existingAppProject,
    existingSubscription,
    existingPolicy,
    includeBindings = true,
  } = options

  const gitOpsCluster = createGitOpsClusterResource({
    name,
    namespace,
    agentEnabled,
    pushModelEnabled,
    existing: existingGitOpsCluster,
  })
  const placement = createPlacementResource({
    name,
    namespace,
    clusterSets,
    existing: existingPlacement,
  })
  const resources: IResource[] = [gitOpsCluster, placement]

  const placementClusterSets = placement.spec.clusterSets ?? clusterSets
  if (includeBindings && placementClusterSets.length > 0) {
    resources.push(
      ...createManagedClusterSetBindings({
        namespace,
        clusterSets: placementClusterSets,
        existingBindings,
      })
    )
  } else if (includeBindings && existingBindings.length > 0) {
    // Empty Placement clusterSets means "all sets bound to the namespace" — keep existing bindings.
    resources.push(
      ...existingBindings.filter(
        (binding) => binding.metadata.namespace === namespace || binding.metadata.namespace === undefined
      )
    )
  }

  if (agentEnabled) {
    resources.push(
      mergeHubArgoCD(existingArgoCD, { namespace, pushEnabled: pushModelEnabled }),
      createDefaultAppProject(namespace, existingAppProject),
      mergeGitOpsOperatorSubscription(existingSubscription),
      createArgoCDAgentPolicy({
        gitOpsClusterName: name,
        namespace,
        existing: existingPolicy,
      })
    )
  }

  return resources
}

export function getGitOpsClusterFromResources(resources: IResource[]): GitOpsClusterWizardData | undefined {
  return resources.find((resource) => resource.kind === GitOpsClusterKind) as GitOpsClusterWizardData | undefined
}

export function getPlacementFromResources(resources: IResource[]): Placement | undefined {
  return resources.find((resource) => resource.kind === PlacementKind) as Placement | undefined
}

function resourceExistsOnCluster(resource: IResource): boolean {
  return Boolean(resource.metadata?.uid || resource.metadata?.resourceVersion || resource.metadata?.generation)
}

function sameResourceIdentity(a: IResource, b: IResource): boolean {
  return a.kind === b.kind && a.metadata?.namespace === b.metadata?.namespace && a.metadata?.name === b.metadata?.name
}

/** Shared hub objects stay when Agent is turned off. Everything else in the YAML is created, updated, or removed. */
const PRESERVE_WHEN_ABSENT = new Set([ArgoCDKind, AppProjectKind, SubscriptionOperatorKind])

function withoutServerMetadata(resource: IResource): IResource {
  const copy = cloneResource(resource) as IResource & { status?: unknown }
  delete copy.status
  if (copy.metadata) {
    delete copy.metadata.uid
    delete copy.metadata.resourceVersion
    delete copy.metadata.generation
    delete copy.metadata.managedFields
    delete copy.metadata.creationTimestamp
    delete copy.metadata.ownerReferences
  }
  return copy
}

function withLiveIdentity(desired: IResource, live: IResource): IResource {
  const copy = withoutServerMetadata(desired)
  // Desired metadata (labels, annotations, finalizers, …) stays the source of truth.
  // Only attach live identity fields required for a successful patch.
  copy.metadata = {
    ...copy.metadata,
    name: desired.metadata?.name ?? live.metadata?.name,
    namespace: desired.metadata?.namespace ?? live.metadata?.namespace,
    uid: live.metadata?.uid,
    resourceVersion: live.metadata?.resourceVersion,
    generation: live.metadata?.generation,
    creationTimestamp: live.metadata?.creationTimestamp,
  }
  return copy
}

async function upsertResource(resource: IResource): Promise<void> {
  const createBody = withoutServerMetadata(resource)
  try {
    const live = await getResource(createBody).promise
    await reconcileResources([withLiveIdentity(resource, live)], [live])
  } catch (err) {
    if (err instanceof ResourceError && err.code === ResourceErrorCode.NotFound) {
      await reconcileResources([createBody], [])
      return
    }
    throw err
  }
}

/**
 * Apply the wizard YAML as-is: create resources that are missing and patch resources that already exist.
 * Argo CD, AppProject, and the operator Subscription are not deleted when they drop out of the YAML.
 */
export async function reconcileGitOpsWizardResources(
  desired: IResource[],
  previousOwned: IResource[] = []
): Promise<void> {
  // Apply desired resources first so a failed upsert does not leave deletions already applied.
  for (const resource of desired) {
    await upsertResource(resource)
  }
  const removed = previousOwned.filter(
    (previous) =>
      !PRESERVE_WHEN_ABSENT.has(previous.kind ?? '') && !desired.some((item) => sameResourceIdentity(item, previous))
  )
  if (removed.length > 0) {
    await reconcileResources([], removed)
  }
}

export interface MissingPermission {
  kind: string
  verb: string
  namespace?: string
  name?: string
}

async function resourceExistsLive(resource: IResource): Promise<boolean> {
  if (resourceExistsOnCluster(resource)) {
    return true
  }
  try {
    await getResource(withoutServerMetadata(resource)).promise
    return true
  } catch (err) {
    if (err instanceof ResourceError && err.code === ResourceErrorCode.NotFound) {
      return false
    }
    // Forbidden / other errors: assume create path; upsert will surface the real failure.
    return false
  }
}

export async function collectMissingPermissions(resources: IResource[]): Promise<MissingPermission[]> {
  const checks: Promise<import('~/resources/self-subject-access-review').ResourceAttributes>[] = []
  const labels: MissingPermission[] = []

  for (const resource of resources) {
    const namespace = resource.metadata?.namespace
    const name = resource.metadata?.name
    const kind = resource.kind ?? 'Unknown'
    const definition = definitionForKind(kind) ?? resource
    // Probe the cluster when the draft has no uid (e.g. generated AppProject) so preflight matches upsert.
    const exists = await resourceExistsLive(resource)
    if (exists) {
      // Upsert reads with getResource then patches — no full update verb.
      checks.push(rbacGet(definition, namespace, name), rbacPatch(definition, namespace, name))
      labels.push({ kind, verb: 'get', namespace, name }, { kind, verb: 'patch', namespace, name })
    } else {
      checks.push(rbacCreate(definition, namespace, name))
      labels.push({ kind, verb: 'create', namespace, name })
    }
  }

  const attributes = await Promise.all(checks)
  const results = await Promise.all(attributes.map((attribute) => createSubjectAccessReview(attribute).promise))

  const missing: MissingPermission[] = []
  results.forEach((result, index) => {
    if (!result.status?.allowed) {
      missing.push(labels[index])
    }
  })
  return missing
}

function definitionForKind(kind: string): IResource | undefined {
  switch (kind) {
    case GitOpsClusterKind:
      return GitopsClusterDefinition
    case PlacementKind:
      return PlacementDefinition
    case ManagedClusterSetBindingKind:
      return ManagedClusterSetBindingDefinition
    case ArgoCDKind:
      return ArgoCDDefinition
    case AppProjectKind:
      return AppProjectDefinition
    case SubscriptionOperatorKind:
      return SubscriptionOperatorDefinition
    case PolicyKind:
      return PolicyDefinition
    default:
      return undefined
  }
}

export function formatMissingPermissions(missing: MissingPermission[]): string[] {
  return missing.map((item) => {
    const scope = [item.namespace, item.name].filter(Boolean).join('/')
    return scope ? `${item.verb} ${item.kind} (${scope})` : `${item.verb} ${item.kind}`
  })
}

export function stripTransformedFields(resources: IResource[]): IResource[] {
  return resources.map((resource) => {
    if (!('transformed' in resource)) {
      return resource
    }
    const clone = { ...resource } as IResource & { transformed?: unknown }
    delete clone.transformed
    return clone
  })
}

export function resourcesSignature(resources: IResource[]): string {
  return resources
    .map((resource) => {
      const goc = resource as GitOpsClusterWizardData
      const agent = isAgentEnabled(goc)
      const push = isPushModelEnabled(goc)
      return `${resource.kind}/${resource.metadata?.namespace}/${resource.metadata?.name}:${agent}:${push}`
    })
    .join('|')
}
