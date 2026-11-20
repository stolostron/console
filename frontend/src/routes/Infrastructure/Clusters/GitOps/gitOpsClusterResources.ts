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

/**
 * Live names stay. Draft follows the GitOpsCluster name only while it still has the previous
 * auto name (or the empty-draft default). YAML renames (e.g. `*-placement2`, `*2-placement`) stay.
 */
export function resolvePlacementDraftName(
  gitOpsClusterName: string,
  existingPlacementName: string | undefined,
  options?: { isLive?: boolean; previousGitOpsClusterName?: string }
): string {
  const autoName = placementNameFor(gitOpsClusterName)
  if (options?.isLive && existingPlacementName) {
    return existingPlacementName
  }
  if (!existingPlacementName) {
    return autoName
  }
  const previousAutoName = placementNameFor(options?.previousGitOpsClusterName ?? gitOpsClusterName)
  const emptyDraftAutoName = placementNameFor('')
  if (
    existingPlacementName === previousAutoName ||
    existingPlacementName === autoName ||
    existingPlacementName === emptyDraftAutoName
  ) {
    return autoName
  }
  return existingPlacementName
}

export function createGitOpsClusterResource(options: {
  name: string
  namespace: string
  agentEnabled: boolean
  pushModelEnabled?: boolean
  existing?: GitOpsCluster
  previousGitOpsClusterName?: string
}): GitOpsClusterWizardData {
  const { name, namespace, agentEnabled, pushModelEnabled = false, existing, previousGitOpsClusterName } = options
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
        name: resolvePlacementDraftName(name, existing?.spec?.placementRef?.name, {
          isLive: Boolean(existing?.metadata?.uid),
          previousGitOpsClusterName,
        }),
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
  previousGitOpsClusterName?: string
}): Placement {
  const { name, namespace, clusterSets, existing, previousGitOpsClusterName } = options
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
      name: resolvePlacementDraftName(name, existing?.metadata?.name, {
        isLive: Boolean(existing?.metadata?.uid),
        previousGitOpsClusterName,
      }),
      namespace,
    },
    spec,
  }
}

function bindingMatchesClusterSet(binding: ManagedClusterSetBinding, namespace: string, clusterSet: string): boolean {
  return (
    binding.metadata.namespace === namespace &&
    (binding.spec.clusterSet === clusterSet || binding.metadata.name === clusterSet)
  )
}

/**
 * Prefer wizard/YAML draft bindings for selected cluster sets; fall back to live bindings
 * only when the draft has no entry for that set. With no selected sets, keep the draft list
 * (empty Placement clusterSets means "all sets bound to the namespace").
 */
export function preferDraftManagedClusterSetBindings(options: {
  namespace: string
  clusterSets: string[]
  draftBindings: ManagedClusterSetBinding[]
  liveBindings: ManagedClusterSetBinding[]
}): ManagedClusterSetBinding[] {
  const { namespace, clusterSets, draftBindings, liveBindings } = options
  if (clusterSets.length === 0) {
    return draftBindings
  }
  return clusterSets.flatMap((clusterSet) => {
    const draft = draftBindings.find((binding) => bindingMatchesClusterSet(binding, namespace, clusterSet))
    if (draft) {
      return [draft]
    }
    const live = liveBindings.find((binding) => bindingMatchesClusterSet(binding, namespace, clusterSet))
    return live ? [live] : []
  })
}

export function createManagedClusterSetBindings(options: {
  namespace: string
  clusterSets: string[]
  existingBindings?: ManagedClusterSetBinding[]
}): ManagedClusterSetBinding[] {
  const { namespace, clusterSets, existingBindings = [] } = options
  return clusterSets.map((clusterSet) => {
    const existing = existingBindings.find((binding) => bindingMatchesClusterSet(binding, namespace, clusterSet))
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
  // Store/atom values may be Proxies; structuredClone cannot clone them (Sonar S7784).
  return JSON.parse(JSON.stringify(value)) as T // NOSONAR
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
  // Preserve draft/live AppProject.spec (e.g. restricted sourceRepos). Defaults only for new objects.
  if (!existing) {
    ;(base as { spec?: Record<string, unknown> }).spec = {
      sourceNamespaces: ['*'],
      destinations: [{ name: '*', namespace: '*', server: '*' }],
      clusterResourceWhitelist: [{ group: '*', kind: '*' }],
      sourceRepos: ['*'],
    }
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
  /** Prior form name so draft Placement auto-rename still tracks typing without wiping YAML renames. */
  previousGitOpsClusterName?: string
}

/**
 * Recommended SyncEditor / apply order (dependencies before GitOpsCluster):
 * [Placement, ManagedClusterSetBinding(s)?, GitOpsCluster, ArgoCD?, AppProject?, Subscription?, Policy?]
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
    previousGitOpsClusterName,
  } = options

  const placement = createPlacementResource({
    name,
    namespace,
    clusterSets,
    existing: existingPlacement,
    previousGitOpsClusterName,
  })
  const gitOpsCluster = createGitOpsClusterResource({
    name,
    namespace,
    agentEnabled,
    pushModelEnabled,
    existing: existingGitOpsCluster,
    previousGitOpsClusterName,
  })
  // Placement document is the name source of truth when present (YAML may customize it).
  if (gitOpsCluster.spec?.placementRef && placement.metadata?.name) {
    gitOpsCluster.spec.placementRef.name = placement.metadata.name
  }
  // Placement (+ bindings) before GitOpsCluster so a failed GOC create does not leave a dangling placementRef.
  const resources: IResource[] = [placement]

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

  resources.push(gitOpsCluster)

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

/** Apply Priority: Placement and bindings before GitOpsCluster; agent extras after. */
const GITOPS_APPLY_PRIORITY: Record<string, number> = {
  [PlacementKind]: 10,
  [ManagedClusterSetBindingKind]: 20,
  [GitOpsClusterKind]: 30,
  [ArgoCDKind]: 40,
  [AppProjectKind]: 50,
  [SubscriptionOperatorKind]: 60,
  [PolicyKind]: 70,
}

export function orderGitOpsWizardResourcesForApply(resources: IResource[]): IResource[] {
  return resources
    .map((resource, index) => ({ resource, index }))
    .sort((a, b) => {
      const priorityA = GITOPS_APPLY_PRIORITY[a.resource.kind ?? ''] ?? 100
      const priorityB = GITOPS_APPLY_PRIORITY[b.resource.kind ?? ''] ?? 100
      if (priorityA !== priorityB) return priorityA - priorityB
      return a.index - b.index
    })
    .map(({ resource }) => resource)
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

async function upsertResource(resource: IResource): Promise<'created' | 'updated'> {
  const createBody = withoutServerMetadata(resource)
  try {
    const live = await getResource(createBody).promise
    await reconcileResources([withLiveIdentity(resource, live)], [live])
    return 'updated'
  } catch (err) {
    if (err instanceof ResourceError && err.code === ResourceErrorCode.NotFound) {
      await reconcileResources([createBody], [])
      return 'created'
    }
    throw err
  }
}

export type GitOpsClusterUpsertResult = 'created' | 'updated'

export interface ReconcileGitOpsWizardResult {
  /** Outcome for the GitOpsCluster only — Placement/bindings are not surfaced in toasts. */
  gitOpsCluster?: GitOpsClusterUpsertResult
}

/**
 * Apply the wizard YAML as-is: create resources that are missing and patch resources that already exist.
 * Argo CD, AppProject, and the operator Subscription are not deleted when they drop out of the YAML.
 * Newly created resources from a failed pass are rolled back (best effort) so Placement/GOC stay paired.
 */
export async function reconcileGitOpsWizardResources(
  desired: IResource[],
  previousOwned: IResource[] = []
): Promise<ReconcileGitOpsWizardResult> {
  const ordered = orderGitOpsWizardResourcesForApply(desired)
  const createdInThisPass: IResource[] = []
  let gitOpsCluster: GitOpsClusterUpsertResult | undefined

  try {
    // Apply desired resources sequentially so a failed upsert does not leave deletions already applied.
    for (const resource of ordered) {
      const result = await upsertResource(resource)
      if (result === 'created') {
        createdInThisPass.push(withoutServerMetadata(resource))
      }
      if (resource.kind === GitOpsClusterKind) {
        gitOpsCluster = result
      }
    }
  } catch (err) {
    if (createdInThisPass.length > 0) {
      try {
        // Reverse order: undo GitOpsCluster before Placement when both were created this pass.
        await reconcileResources([], [...createdInThisPass].reverse())
      } catch {
        // Prefer surfacing the original apply failure over a rollback error.
      }
    }
    throw err
  }

  const removed = previousOwned.filter(
    (previous) =>
      !PRESERVE_WHEN_ABSENT.has(previous.kind ?? '') && !desired.some((item) => sameResourceIdentity(item, previous))
  )
  if (removed.length > 0) {
    await reconcileResources([], removed)
  }

  return { gitOpsCluster }
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
    // Forbidden / other GET errors must stop preflight; assuming "absent" would let create pass
    // while upsertResource fails on the same GET after earlier resources were already applied.
    throw err
  }
}

export async function collectMissingPermissions(resources: IResource[]): Promise<MissingPermission[]> {
  // Probe existence up front (Forbidden / non-NotFound errors propagate and stop preflight).
  const existenceFlags = await Promise.all(resources.map((resource) => resourceExistsLive(resource)))

  const checks: Promise<import('~/resources/self-subject-access-review').ResourceAttributes>[] = []
  const labels: MissingPermission[] = []

  resources.forEach((resource, index) => {
    const namespace = resource.metadata?.namespace
    const name = resource.metadata?.name
    const kind = resource.kind ?? 'Unknown'
    const definition = definitionForKind(kind) ?? resource
    if (existenceFlags[index]) {
      // Upsert reads with getResource then patches — no full update verb.
      checks.push(rbacGet(definition, namespace, name), rbacPatch(definition, namespace, name))
      labels.push({ kind, verb: 'get', namespace, name }, { kind, verb: 'patch', namespace, name })
    } else {
      // Upsert always GETs first (NotFound → create), so create path still needs get.
      checks.push(rbacGet(definition, namespace, name), rbacCreate(definition, namespace, name))
      labels.push({ kind, verb: 'get', namespace, name }, { kind, verb: 'create', namespace, name })
    }
  })

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

/**
 * Wizard/YAML sync can drop the Placement document while leaving placementRef on the GitOpsCluster.
 * Re-attach a Placement before apply so create never succeeds with a dangling placementRef.
 * When both exist, the Placement document name wins (preserves YAML renames).
 */
export function ensureGitOpsClusterPlacement(resources: IResource[]): IResource[] {
  const stripped = stripTransformedFields(resources)
  const gitOpsCluster = getGitOpsClusterFromResources(stripped)
  if (!gitOpsCluster) {
    return orderGitOpsWizardResourcesForApply(stripped)
  }

  const namespace = gitOpsCluster.metadata?.namespace ?? ''
  const name = gitOpsCluster.metadata?.name ?? ''
  const existingPlacement = getPlacementFromResources(stripped)
  const placementName =
    existingPlacement?.metadata?.name || gitOpsCluster.spec?.placementRef?.name || placementNameFor(name)

  if (!gitOpsCluster.spec) {
    gitOpsCluster.spec = {}
  }
  gitOpsCluster.spec.placementRef = {
    ...gitOpsCluster.spec.placementRef,
    kind: PlacementKind,
    apiVersion: PlacementApiVersionBeta,
    name: placementName,
  }

  if (existingPlacement) {
    existingPlacement.metadata = {
      ...existingPlacement.metadata,
      name: placementName,
      namespace: existingPlacement.metadata?.namespace || namespace,
    }
    return orderGitOpsWizardResourcesForApply(stripped)
  }

  const placement = createPlacementResource({ name, namespace })
  placement.metadata.name = placementName
  return orderGitOpsWizardResourcesForApply([...stripped, placement])
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
