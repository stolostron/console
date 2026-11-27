/* Copyright Contributors to the Open Cluster Management project */

import i18next from 'i18next'
import { nockIgnoreApiPaths, nockRBAC } from '~/lib/nock-util'
import { rbacCreateTestHelper, rbacGetTestHelper, rbacPatchTestHelper } from '~/lib/rbac-util'
import {
  AGENT_AUTH,
  AGENT_SUBSCRIPTION_ENV,
  AppProjectKind,
  ArgoCDKind,
  buildGitOpsClusterResources,
  collectMissingPermissions,
  GITOPS_BINDING_OWNER_ANNOTATION,
  getRemovedGitOpsWizardResources,
  createArgoCDAgentPolicy,
  createDefaultAppProject,
  createGitOpsClusterResource,
  createPlacementResource,
  findGitOpsOperatorSubscription,
  formatMissingPermissions,
  isAgentEnabled,
  isPushModelEnabled,
  mergeGitOpsOperatorSubscription,
  mergeHubArgoCD,
  placementNameFor,
  policyNameFor,
  preferDraftManagedClusterSetBindings,
  ensureGitOpsClusterPlacement,
  orderGitOpsWizardResourcesForApply,
  reconcileGitOpsWizardResources,
  stripTransformedFields,
} from '~/routes/Infrastructure/Clusters/GitOps/gitOpsClusterResources'
import { GitOpsClusterKind } from '~/resources/gitops-cluster'
import type { IResource } from '~/resources'
import { PlacementKind } from '~/resources/placement'
import { PolicyKind } from '~/resources/policy'
import type { ManagedClusterSetBinding } from '~/resources/managed-cluster-set-binding'
import { createSubjectAccessReview } from '~/resources/self-subject-access-review'
import {
  SubscriptionOperatorApiVersion,
  SubscriptionOperatorKind,
  type SubscriptionOperator,
} from '~/resources/subscription-operator'
import { getResource, listResources, reconcileResources, ResourceError, ResourceErrorCode } from '~/resources/utils'

jest.mock('~/resources/utils/resource-request', () => {
  const actual = jest.requireActual('~/resources/utils/resource-request')
  return {
    ...actual,
    getResource: jest.fn(),
    listResources: jest.fn(),
    reconcileResources: jest.fn(async () => undefined),
  }
})

const mockGetResource = getResource as jest.Mock
const mockReconcileResources = reconcileResources as jest.Mock
const mockListResources = listResources as jest.Mock

jest.mock('~/resources/self-subject-access-review', () => ({
  ...jest.requireActual('~/resources/self-subject-access-review'),
  createSubjectAccessReview: jest.fn(),
}))
const mockAccessReview = createSubjectAccessReview as jest.Mock
const { t } = i18next

describe('gitOpsClusterResources', () => {
  beforeEach(() => {
    nockIgnoreApiPaths()
    mockGetResource.mockReset()
    mockReconcileResources.mockReset()
    mockReconcileResources.mockResolvedValue(undefined)
    mockListResources.mockReset()
    mockListResources.mockReturnValue({ promise: Promise.resolve([]) })
    mockAccessReview.mockReset()
    mockAccessReview.mockReturnValue({ promise: Promise.resolve({ status: { allowed: true } }) })
  })

  it('uses the caller-provided translator for resource errors', async () => {
    const key = 'GitOpsCluster and its Placement must use the same namespace.'
    const translator = i18next.createInstance()
    await translator.init({
      lng: 'en',
      showSupportNotice: false,
      keySeparator: false,
      resources: { en: { translation: { [key]: 'Translated Placement namespace error' } } },
    })
    const gitOpsCluster = createGitOpsClusterResource({ name: 'fleet', namespace: 'gitops-a', agentEnabled: false })
    const placement = createPlacementResource({ name: 'fleet', namespace: 'gitops-b' })
    expect(() => ensureGitOpsClusterPlacement([gitOpsCluster, placement], translator.t)).toThrow(
      'Translated Placement namespace error'
    )
  })

  it('builds create defaults without agent extras when agent is off', () => {
    const resources = buildGitOpsClusterResources(
      {
        name: 'fleet',
        namespace: 'openshift-gitops',
        agentEnabled: false,
      },
      t
    )
    expect(resources.map((r) => r.kind)).toEqual([PlacementKind, GitOpsClusterKind])
    expect(isAgentEnabled(resources[1] as never)).toBe(false)
    const placement = resources[0]
    expect(placement.metadata?.name).toBe('fleet-placement')
    expect((placement as { spec?: { predicates?: unknown[] } }).spec?.predicates).toEqual([
      {
        requiredClusterSelector: {
          labelSelector: {
            matchExpressions: [{ key: 'local-cluster', operator: 'DoesNotExist' }],
          },
        },
      },
    ])
  })

  it('preserves Basic-mode addon options while rebuilding an edit draft', () => {
    const addon = {
      enabled: true,
      overrideExistingConfigs: true,
      argoCDAgent: { enabled: false, mode: 'managed', serverAddress: 'principal.example.com' },
    }
    const existing = createGitOpsClusterResource({ name: 'fleet', namespace: 'openshift-gitops', agentEnabled: false })
    existing.spec!.gitopsAddon = addon
    existing.metadata.uid = 'goc-uid'
    const resources = buildGitOpsClusterResources(
      {
        name: 'fleet',
        namespace: 'openshift-gitops',
        agentEnabled: false,
        existingGitOpsCluster: existing,
      },
      t
    )
    const draft = resources.find((resource) => resource.kind === GitOpsClusterKind) as typeof existing
    expect(draft.spec?.gitopsAddon).toEqual(addon)
    expect(isAgentEnabled(draft)).toBe(false)
    expect(resources.map((resource) => resource.kind)).toEqual([PlacementKind, GitOpsClusterKind])
  })

  it('rejects conflicting namespaces before building or applying a GitOpsCluster edit', async () => {
    const existing = createGitOpsClusterResource({ name: 'fleet', namespace: 'gitops-a', agentEnabled: false })
    existing.metadata.uid = 'goc-uid'
    const placement = createPlacementResource({ name: 'fleet', namespace: 'gitops-b' })
    expect(() =>
      buildGitOpsClusterResources(
        {
          name: 'fleet',
          namespace: 'gitops-a',
          agentEnabled: false,
          existingGitOpsCluster: existing,
          existingPlacement: placement,
        },
        t
      )
    ).toThrow(/same namespace/)
    expect(() => ensureGitOpsClusterPlacement([existing, placement], t)).toThrow(/same namespace/)
    await expect(reconcileGitOpsWizardResources([existing, placement], t)).rejects.toThrow(/same namespace/)
    expect(mockGetResource).not.toHaveBeenCalled()
    expect(mockReconcileResources).not.toHaveBeenCalled()
  })

  it('fills an omitted GitOpsCluster namespace from the selected namespace', () => {
    const existing = createGitOpsClusterResource({ name: 'fleet', namespace: 'openshift-gitops', agentEnabled: false })
    delete existing.metadata.namespace
    existing.metadata.uid = 'goc-uid'
    const placement = createPlacementResource({ name: 'fleet', namespace: 'openshift-gitops' })
    const resources = buildGitOpsClusterResources(
      {
        name: 'fleet',
        namespace: 'openshift-gitops',
        agentEnabled: false,
        existingGitOpsCluster: existing,
        existingPlacement: placement,
      },
      t
    )
    expect(resources.find((resource) => resource.kind === GitOpsClusterKind)?.metadata?.namespace).toBe(
      'openshift-gitops'
    )
    expect(
      ensureGitOpsClusterPlacement([existing, placement], t).find((resource) => resource.kind === GitOpsClusterKind)
        ?.metadata?.namespace
    ).toBe('openshift-gitops')
  })

  it('includes ArgoCD, AppProject, Subscription, and Policy when agent is on', () => {
    const existingArgo = {
      apiVersion: 'argoproj.io/v1beta1',
      kind: ArgoCDKind,
      metadata: { name: 'openshift-gitops', namespace: 'openshift-gitops', uid: 'argo-uid' },
      spec: { ha: { enabled: true } },
    }
    const existingSub: SubscriptionOperator = {
      apiVersion: SubscriptionOperatorApiVersion,
      kind: SubscriptionOperatorKind,
      metadata: { name: 'openshift-gitops-operator', namespace: 'openshift-gitops-operator', uid: 'sub-uid' },
      spec: { name: 'openshift-gitops-operator', config: { env: [{ name: 'KEEP', value: '1' }] } },
    }
    const resources = buildGitOpsClusterResources(
      {
        name: 'agent-gitops',
        namespace: 'openshift-gitops',
        agentEnabled: true,
        pushModelEnabled: false,
        existingArgoCD: existingArgo,
        existingSubscription: existingSub,
        clusterSets: ['default'],
      },
      t
    )
    expect(resources.map((r) => r.kind)).toEqual([
      PlacementKind,
      'ManagedClusterSetBinding',
      GitOpsClusterKind,
      ArgoCDKind,
      AppProjectKind,
      SubscriptionOperatorKind,
      PolicyKind,
    ])
    const gitOpsCluster = resources.find((r) => r.kind === GitOpsClusterKind) as never
    expect(isAgentEnabled(gitOpsCluster)).toBe(true)
    expect(isPushModelEnabled(gitOpsCluster)).toBe(false)

    const argo = resources.find((r) => r.kind === ArgoCDKind) as unknown as {
      spec: { controller: { enabled: boolean }; argoCDAgent: { principal: { auth: string; enabled: boolean } } }
      metadata: { uid?: string }
    }
    expect(argo.metadata.uid).toBe('argo-uid')
    expect(argo.spec.controller.enabled).toBe(false)
    expect(argo.spec.argoCDAgent.principal.enabled).toBe(true)
    expect(argo.spec.argoCDAgent.principal.auth).toBe(AGENT_AUTH)

    const subscription = resources.find((r) => r.kind === SubscriptionOperatorKind) as SubscriptionOperator
    expect(subscription.spec.config?.env?.map((e) => e.name)).toEqual(
      expect.arrayContaining(['KEEP', ...AGENT_SUBSCRIPTION_ENV.map((e) => e.name)])
    )

    const policy = resources.find((r) => r.kind === PolicyKind)
    expect(policy?.metadata?.name).toBe('agent-gitops-argocd-policy')
  })

  it('keeps hub controller enabled when push model is checked', () => {
    const argo = mergeHubArgoCD(undefined, { namespace: 'openshift-gitops', pushEnabled: true }) as unknown as {
      metadata: { name?: string; uid?: string }
      spec: { controller: { enabled: boolean }; sourceNamespaces: string[] }
    }
    expect(argo.metadata.name).toBe('openshift-gitops')
    expect(argo.metadata.uid).toBeUndefined()
    expect(argo.spec.controller.enabled).toBe(true)
    expect(argo.spec.sourceNamespaces).toEqual(['*'])
  })

  it('creates an ArgoCD in the target namespace without reusing another namespace uid', () => {
    const argo = mergeHubArgoCD(
      {
        apiVersion: 'argoproj.io/v1beta1',
        kind: ArgoCDKind,
        metadata: { name: 'other', namespace: 'openshift-cluster-samples-operator', uid: 'wrong-uid' },
      },
      { namespace: 'openshift-gitops', pushEnabled: false }
    )
    expect(argo.metadata?.namespace).toBe('openshift-gitops')
    expect(argo.metadata?.name).toBe('openshift-gitops')
    expect(argo.metadata?.uid).toBeUndefined()
  })

  it('includes a new ArgoCD in agent resources when none exists yet', () => {
    const resources = buildGitOpsClusterResources(
      {
        name: 'agent-gitops',
        namespace: 'openshift-gitops',
        agentEnabled: true,
        pushModelEnabled: false,
      },
      t
    )
    const argo = resources.find((r) => r.kind === ArgoCDKind)
    expect(argo?.metadata?.name).toBe('openshift-gitops')
    expect(argo?.metadata?.namespace).toBe('openshift-gitops')
  })

  it('creates AppProject wildcards for new objects and preserves draft spec', () => {
    const project = createDefaultAppProject('openshift-gitops') as unknown as {
      spec: {
        sourceNamespaces: string[]
        destinations: { name: string }[]
        sourceRepos: string[]
        clusterResourceWhitelist: { group: string; kind: string }[]
      }
    }
    expect(project.spec.sourceNamespaces).toEqual(['*'])
    expect(project.spec.destinations[0].name).toBe('*')
    expect(project.spec.sourceRepos).toEqual(['*'])
    expect(project.spec.clusterResourceWhitelist[0]).toEqual({ group: '*', kind: '*' })
    expect(placementNameFor('x')).toBe('x-placement')
    expect(policyNameFor('x')).toBe('x-argocd-policy')

    const draft = createDefaultAppProject('openshift-gitops', {
      apiVersion: 'argoproj.io/v1alpha1',
      kind: AppProjectKind,
      metadata: { name: 'default', namespace: 'openshift-gitops' },
      spec: { sourceRepos: ['https://github.com/acme/*'] },
    } as never)
    expect((draft as { spec?: { sourceRepos?: string[] } }).spec?.sourceRepos).toEqual(['https://github.com/acme/*'])
  })

  it('finds and merges operator subscription env vars', () => {
    expect(findGitOpsOperatorSubscription([])).toBeUndefined()
    const merged = mergeGitOpsOperatorSubscription()
    expect(merged.metadata.name).toBe('openshift-gitops-operator')
    expect(merged.spec.config?.env).toEqual([...AGENT_SUBSCRIPTION_ENV])
  })

  it.each([false, true])('uses the selected Argo CD Redis service (HA=%s)', (ha) => {
    const argo = {
      apiVersion: 'argoproj.io/v1beta1',
      kind: ArgoCDKind,
      metadata: { name: 'custom-argo', namespace: 'custom-gitops' },
      spec: { ha: { enabled: ha } },
    }
    const subscription = mergeGitOpsOperatorSubscription(undefined, argo)
    expect(subscription.spec.config?.env).toEqual(
      expect.arrayContaining([
        {
          name: 'ARGOCD_PRINCIPAL_REDIS_SERVER_ADDRESS',
          value: ha ? 'custom-argo-redis-ha-haproxy:6379' : 'custom-argo-redis:6379',
        },
        { name: 'ARGOCD_CLUSTER_CONFIG_NAMESPACES', value: 'openshift-gitops,local-cluster,custom-gitops' },
      ])
    )
  })

  it.each(['absent', 'incomplete', 'forbidden'] as const)(
    'stops before all writes when the operator is %s',
    async (state) => {
      const resources = buildGitOpsClusterResources(
        {
          name: 'fleet',
          namespace: 'openshift-gitops',
          agentEnabled: true,
        },
        t
      )
      mockGetResource.mockImplementation(() => ({
        promise:
          state === 'incomplete'
            ? Promise.resolve(mergeGitOpsOperatorSubscription())
            : Promise.reject(
                new ResourceError(state === 'forbidden' ? ResourceErrorCode.Forbidden : ResourceErrorCode.NotFound)
              ),
      }))
      await expect(reconcileGitOpsWizardResources(resources, t)).rejects.toThrow()
      expect(mockReconcileResources).not.toHaveBeenCalled()
      expect(mockGetResource).toHaveBeenCalledTimes(1)
      expect(mockGetResource).toHaveBeenCalledWith(expect.objectContaining({ kind: SubscriptionOperatorKind }))
    }
  )

  it('reuses an installed operator Subscription and preserves its catalog fields', async () => {
    const resources = buildGitOpsClusterResources(
      { name: 'fleet', namespace: 'openshift-gitops', agentEnabled: true },
      t
    )
    const subscription = mergeGitOpsOperatorSubscription()
    subscription.metadata = { ...subscription.metadata, uid: 'operator-uid', resourceVersion: '8' }
    subscription.spec = { ...subscription.spec, source: 'redhat-operators', sourceNamespace: 'openshift-marketplace' }
    mockGetResource.mockImplementation((resource: IResource) => ({
      promise:
        resource.kind === SubscriptionOperatorKind
          ? Promise.resolve(subscription)
          : Promise.reject(new ResourceError(ResourceErrorCode.NotFound)),
    }))
    await reconcileGitOpsWizardResources(resources, t)
    const applied = mockReconcileResources.mock.calls
      .flatMap(([desired]) => desired as IResource[])
      .find((resource) => resource.kind === SubscriptionOperatorKind) as SubscriptionOperator
    expect(applied.spec).toMatchObject({ source: 'redhat-operators', sourceNamespace: 'openshift-marketplace' })
  })

  it('creates policy with spoke ArgoCD and RBAC templates', () => {
    const policy = createArgoCDAgentPolicy({ gitOpsClusterName: 'fleet', namespace: 'openshift-gitops' })
    expect(policy.metadata.name).toBe('fleet-argocd-policy')
    expect(policy.spec['policy-templates']).toHaveLength(2)
    const spoke = policy.spec['policy-templates']![0].objectDefinition.spec!['object-templates']![0]
      .objectDefinition as { spec?: { argoCDAgent?: { agent?: { enabled?: boolean } } } }
    expect(spoke.spec?.argoCDAgent?.agent?.enabled).toBe(true)
  })

  it('strips transformed fields before submit', () => {
    const resource = createGitOpsClusterResource({
      name: 'a',
      namespace: 'ns',
      agentEnabled: true,
      pushModelEnabled: true,
    })
    expect(resource.transformed?.pushModelEnabled).toBe(true)
    const stripped = stripTransformedFields([resource])
    expect('transformed' in stripped[0]).toBe(false)
  })

  it('formats missing permissions for alerts', () => {
    expect(
      formatMissingPermissions([
        { kind: 'Policy', verb: 'create', namespace: 'openshift-gitops', name: 'x-argocd-policy' },
        { kind: 'ArgoCD', verb: 'patch' },
      ])
    ).toEqual(['create Policy (openshift-gitops/x-argocd-policy)', 'patch ArgoCD'])
  })

  it('preserves existing placement predicates on rebuild', () => {
    const existing = createPlacementResource({ name: 'fleet', namespace: 'openshift-gitops' })
    existing.spec.predicates = [
      {
        requiredClusterSelector: {
          labelSelector: { matchLabels: { foo: 'bar' } },
        },
      },
    ]
    const next = createPlacementResource({
      name: 'fleet',
      namespace: 'openshift-gitops',
      existing,
    })
    expect(next.spec.predicates).toEqual(existing.spec.predicates)
  })

  it('preserves existing Placement name, placementRef, and numberOfClusters on edit', () => {
    const existingPlacement = createPlacementResource({ name: 'fleet', namespace: 'openshift-gitops' })
    existingPlacement.metadata.name = 'targets'
    existingPlacement.metadata.uid = 'placement-uid'
    existingPlacement.spec.numberOfClusters = 1

    const placement = createPlacementResource({
      name: 'fleet',
      namespace: 'openshift-gitops',
      existing: existingPlacement,
    })
    expect(placement.metadata.name).toBe('targets')
    expect(placement.metadata.uid).toBe('placement-uid')
    expect(placement.spec.numberOfClusters).toBe(1)

    const gitOps = createGitOpsClusterResource({
      name: 'fleet',
      namespace: 'openshift-gitops',
      agentEnabled: false,
      existing: {
        apiVersion: 'apps.open-cluster-management.io/v1beta1',
        kind: GitOpsClusterKind,
        metadata: { name: 'fleet', namespace: 'openshift-gitops', uid: 'goc-uid' },
        spec: {
          argoServer: { argoNamespace: 'openshift-gitops' },
          placementRef: {
            kind: PlacementKind,
            apiVersion: 'cluster.open-cluster-management.io/v1beta1',
            name: 'targets',
          },
        },
      },
    })
    expect(gitOps.spec?.placementRef?.name).toBe('targets')
  })

  it('renames draft Placement when the GitOpsCluster name changes during create', () => {
    expect(placementNameFor('')).toBe('gitopscluster-placement')

    const draft = createPlacementResource({ name: '', namespace: 'openshift-gitops' })
    expect(draft.metadata.name).toBe('gitopscluster-placement')

    const renamed = createPlacementResource({
      name: 'klee-openshift-gitops',
      namespace: 'openshift-gitops',
      existing: draft,
    })
    expect(renamed.metadata.name).toBe('klee-openshift-gitops-placement')

    const gitOps = createGitOpsClusterResource({
      name: 'klee-openshift-gitops',
      namespace: 'openshift-gitops',
      agentEnabled: false,
      existing: {
        apiVersion: 'apps.open-cluster-management.io/v1beta1',
        kind: GitOpsClusterKind,
        metadata: { name: 'klee-openshift-gitops', namespace: 'openshift-gitops' },
        spec: {
          argoServer: { argoNamespace: 'openshift-gitops' },
          placementRef: {
            kind: PlacementKind,
            apiVersion: 'cluster.open-cluster-management.io/v1beta1',
            name: 'gitopscluster-placement',
          },
        },
      },
    })
    expect(gitOps.spec?.placementRef?.name).toBe('klee-openshift-gitops-placement')
  })

  it('preserves YAML Placement renames on create rebuild and ensure (not only *-placement2)', () => {
    const customName = 'kike-openshift-gitops2-placement'
    const draft = createPlacementResource({ name: 'kike-openshift-gitops', namespace: 'openshift-gitops' })
    draft.metadata.name = customName

    const rebuilt = createPlacementResource({
      name: 'kike-openshift-gitops',
      namespace: 'openshift-gitops',
      existing: draft,
      previousGitOpsClusterName: 'kike-openshift-gitops',
    })
    expect(rebuilt.metadata.name).toBe(customName)

    const resources = buildGitOpsClusterResources(
      {
        name: 'kike-openshift-gitops',
        namespace: 'openshift-gitops',
        agentEnabled: false,
        existingPlacement: draft,
        previousGitOpsClusterName: 'kike-openshift-gitops',
        existingGitOpsCluster: {
          apiVersion: 'apps.open-cluster-management.io/v1beta1',
          kind: GitOpsClusterKind,
          metadata: { name: 'kike-openshift-gitops', namespace: 'openshift-gitops' },
          spec: {
            argoServer: { argoNamespace: 'openshift-gitops' },
            placementRef: {
              kind: PlacementKind,
              apiVersion: 'cluster.open-cluster-management.io/v1beta1',
              name: 'kike-openshift-gitops-placement',
            },
          },
        },
      },
      t
    )
    expect(resources.find((r) => r.kind === PlacementKind)?.metadata?.name).toBe(customName)
    expect(
      (resources.find((r) => r.kind === GitOpsClusterKind) as { spec?: { placementRef?: { name?: string } } }).spec
        ?.placementRef?.name
    ).toBe(customName)

    const ensured = ensureGitOpsClusterPlacement(resources, t)
    expect(ensured.find((r) => r.kind === PlacementKind)?.metadata?.name).toBe(customName)
    expect(
      (ensured.find((r) => r.kind === GitOpsClusterKind) as { spec?: { placementRef?: { name?: string } } }).spec
        ?.placementRef?.name
    ).toBe(customName)
  })

  it('keeps existing ManagedClusterSetBindings when Placement clusterSets are cleared', () => {
    const binding = {
      apiVersion: 'cluster.open-cluster-management.io/v1beta2',
      kind: 'ManagedClusterSetBinding',
      metadata: { name: 'default', namespace: 'openshift-gitops', uid: 'binding-uid' },
      spec: { clusterSet: 'default' },
    }
    const resources = buildGitOpsClusterResources(
      {
        name: 'fleet',
        namespace: 'openshift-gitops',
        agentEnabled: false,
        clusterSets: [],
        existingBindings: [binding as never],
        includeBindings: true,
      },
      t
    )
    expect(resources.some((r) => r.kind === 'ManagedClusterSetBinding' && r.metadata?.name === 'default')).toBe(true)
  })

  it('prefers draft ManagedClusterSetBindings over live ones for selected cluster sets', () => {
    const draft = {
      apiVersion: 'cluster.open-cluster-management.io/v1beta2',
      kind: 'ManagedClusterSetBinding',
      metadata: {
        name: 'kike-cs',
        namespace: 'openshift-gitops',
        annotations: { 'wizard.edited': 'true' },
      },
      spec: { clusterSet: 'kike-cs' },
    }
    const live = {
      apiVersion: 'cluster.open-cluster-management.io/v1beta2',
      kind: 'ManagedClusterSetBinding',
      metadata: { name: 'kike-cs', namespace: 'openshift-gitops', uid: 'live-uid' },
      spec: { clusterSet: 'kike-cs' },
    }
    const preferred = preferDraftManagedClusterSetBindings({
      namespace: 'openshift-gitops',
      clusterSets: ['kike-cs', 'other-cs'],
      draftBindings: [draft as never],
      liveBindings: [
        live as never,
        {
          apiVersion: 'cluster.open-cluster-management.io/v1beta2',
          kind: 'ManagedClusterSetBinding',
          metadata: { name: 'other-cs', namespace: 'openshift-gitops', uid: 'other-uid' },
          spec: { clusterSet: 'other-cs' },
        } as never,
      ],
    })

    expect(preferred).toHaveLength(2)
    expect(preferred[0].metadata.annotations?.['wizard.edited']).toBe('true')
    expect(preferred[0].metadata.uid).toBeUndefined()
    expect(preferred[1].metadata.name).toBe('other-cs')
    expect(preferred[1].metadata.uid).toBe('other-uid')

    expect(
      preferDraftManagedClusterSetBindings({
        namespace: 'openshift-gitops',
        clusterSets: [],
        draftBindings: [draft as never],
        liveBindings: [live as never],
      })
    ).toEqual([draft])
  })

  it('re-attaches Placement when GitOpsCluster has placementRef but Placement is missing', () => {
    const gitOps = createGitOpsClusterResource({
      name: 'orphan',
      namespace: 'openshift-gitops',
      agentEnabled: false,
    })
    const ensured = ensureGitOpsClusterPlacement([gitOps], t)
    expect(ensured.map((r) => r.kind)).toEqual([PlacementKind, GitOpsClusterKind])
    expect(ensured[0].metadata?.name).toBe('orphan-placement')
    expect((ensured[1] as { spec?: { placementRef?: { name?: string } } }).spec?.placementRef?.name).toBe(
      'orphan-placement'
    )
  })

  it('orders Placement and bindings before GitOpsCluster for apply', () => {
    const ordered = orderGitOpsWizardResourcesForApply([
      createGitOpsClusterResource({ name: 'fleet', namespace: 'openshift-gitops', agentEnabled: false }),
      createPlacementResource({ name: 'fleet', namespace: 'openshift-gitops' }),
      {
        apiVersion: 'cluster.open-cluster-management.io/v1beta2',
        kind: 'ManagedClusterSetBinding',
        metadata: { name: 'default', namespace: 'openshift-gitops' },
        spec: { clusterSet: 'default' },
      } as never,
    ])
    expect(ordered.map((r) => r.kind)).toEqual([PlacementKind, 'ManagedClusterSetBinding', GitOpsClusterKind])
  })

  it('reconciles by creating missing resources and patching live ones', async () => {
    const desired = createGitOpsClusterResource({
      name: 'fleet',
      namespace: 'openshift-gitops',
      agentEnabled: false,
    })
    mockGetResource.mockReturnValue({
      promise: Promise.reject(new ResourceError(ResourceErrorCode.NotFound)),
    })

    await expect(reconcileGitOpsWizardResources([desired], t)).resolves.toEqual({ gitOpsCluster: 'created' })
    expect(mockReconcileResources).toHaveBeenCalledWith(
      [expect.objectContaining({ kind: GitOpsClusterKind, metadata: expect.objectContaining({ name: 'fleet' }) })],
      []
    )

    mockReconcileResources.mockClear()
    const live = {
      ...desired,
      metadata: { ...desired.metadata, uid: 'live-uid', resourceVersion: '3' },
    }
    mockGetResource.mockReturnValue({ promise: Promise.resolve(live) })
    await expect(reconcileGitOpsWizardResources([desired], t)).resolves.toEqual({ gitOpsCluster: 'updated' })
    expect(mockReconcileResources).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          metadata: expect.objectContaining({ uid: 'live-uid', resourceVersion: '3', name: 'fleet' }),
        }),
      ],
      [live],
      { requireResourceVersion: true }
    )
  })

  it('rolls back resources created in the same pass when a later upsert fails', async () => {
    const placement = createPlacementResource({ name: 'fleet', namespace: 'openshift-gitops' })
    const gitOpsCluster = createGitOpsClusterResource({
      name: 'fleet',
      namespace: 'openshift-gitops',
      agentEnabled: false,
    })
    // Submit out of order on purpose; apply path reorders Placement before GitOpsCluster.
    mockGetResource
      .mockReturnValueOnce({ promise: Promise.reject(new ResourceError(ResourceErrorCode.NotFound)) })
      .mockReturnValueOnce({ promise: Promise.reject(new ResourceError(ResourceErrorCode.NotFound)) })
    mockReconcileResources
      .mockResolvedValueOnce(undefined) // create Placement
      .mockRejectedValueOnce(new ResourceError(ResourceErrorCode.BadRequest, 'placement create ok, goc failed'))
      .mockResolvedValueOnce(undefined) // rollback Placement

    await expect(reconcileGitOpsWizardResources([gitOpsCluster, placement], t)).rejects.toMatchObject({
      code: ResourceErrorCode.BadRequest,
    })

    expect(mockReconcileResources).toHaveBeenNthCalledWith(1, [expect.objectContaining({ kind: PlacementKind })], [])
    expect(mockReconcileResources).toHaveBeenNthCalledWith(
      2,
      [expect.objectContaining({ kind: GitOpsClusterKind })],
      []
    )
    expect(mockReconcileResources).toHaveBeenNthCalledWith(
      3,
      [],
      [
        expect.objectContaining({
          kind: PlacementKind,
          metadata: expect.objectContaining({ name: 'fleet-placement' }),
        }),
      ],
      { ignoreNotFound: true }
    )
  })

  it.each([false, true])('restores the previous Placement before rollback (restore fails=%s)', async (fails) => {
    const previous = createGitOpsClusterResource({ name: 'fleet', namespace: 'openshift-gitops', agentEnabled: false })
    previous.metadata = { ...previous.metadata, uid: 'goc-uid', resourceVersion: '1' }
    const placement = createPlacementResource({ name: 'new', namespace: 'openshift-gitops' })
    const draft = {
      ...previous,
      spec: { ...previous.spec, placementRef: { ...previous.spec!.placementRef!, name: placement.metadata.name } },
    }
    const current = { ...draft, metadata: { ...draft.metadata, resourceVersion: '2', labels: { concurrent: 'keep' } } }
    const policy = {
      apiVersion: 'policy.open-cluster-management.io/v1',
      kind: PolicyKind,
      metadata: { name: 'fleet-policy', namespace: 'openshift-gitops', uid: 'policy-uid' },
    }
    const extra = {
      apiVersion: 'argoproj.io/v1beta1',
      kind: ArgoCDKind,
      metadata: { name: 'extra', namespace: 'openshift-gitops' },
    }
    let gocReads = 0
    mockGetResource.mockImplementation((resource: IResource) => {
      if (resource.kind === PlacementKind || resource.kind === ArgoCDKind)
        return { promise: Promise.reject(new ResourceError(ResourceErrorCode.NotFound)) }
      if (resource.kind === GitOpsClusterKind)
        return { promise: Promise.resolve(gocReads++ === 0 ? previous : current) }
      return { promise: Promise.resolve(policy) }
    })
    mockReconcileResources
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('Policy update failed'))
      .mockImplementationOnce(async () => {
        if (fails) throw new ResourceError(ResourceErrorCode.Conflict)
      })
      .mockResolvedValue(undefined)
    await expect(
      reconcileGitOpsWizardResources([draft, placement, extra, policy], t, [], { baseline: [previous] })
    ).rejects.toThrow(fails ? /new Placement was retained/ : /Policy update failed/)
    expect(mockReconcileResources).toHaveBeenNthCalledWith(
      5,
      [
        expect.objectContaining({
          metadata: current.metadata,
          spec: expect.objectContaining({ placementRef: previous.spec!.placementRef }),
        }),
      ],
      [current],
      { requireResourceVersion: true }
    )
    const deleted = mockReconcileResources.mock.calls
      .filter(([desired]) => desired.length === 0)
      .flatMap(([, removed]) => removed)
    expect(deleted).toEqual(fails ? [extra] : [extra, placement])
  })

  it('deletes removed owned resources only after desired upserts succeed', async () => {
    const keep = createGitOpsClusterResource({
      name: 'fleet',
      namespace: 'openshift-gitops',
      agentEnabled: false,
    })
    keep.metadata.uid = 'goc-uid'
    const removedPolicy = {
      apiVersion: 'policy.open-cluster-management.io/v1',
      kind: PolicyKind,
      metadata: { name: 'fleet-argocd-policy', namespace: 'openshift-gitops', uid: 'policy-uid' },
    }
    mockGetResource.mockReturnValue({ promise: Promise.resolve(keep) })

    await reconcileGitOpsWizardResources([keep], t, [keep, removedPolicy as never])
    expect(mockReconcileResources).toHaveBeenNthCalledWith(
      1,
      [expect.objectContaining({ kind: GitOpsClusterKind })],
      [keep],
      { requireResourceVersion: true }
    )
    expect(mockReconcileResources).toHaveBeenNthCalledWith(2, [], [removedPolicy], { ignoreNotFound: true })
  })

  it('propagates non-NotFound existence probe errors and requires get on create path', async () => {
    const resource = createGitOpsClusterResource({
      name: 'fleet',
      namespace: 'openshift-gitops',
      agentEnabled: false,
    })
    mockGetResource.mockReturnValue({
      promise: Promise.reject(new ResourceError(ResourceErrorCode.Forbidden, 'denied')),
    })
    await expect(collectMissingPermissions([resource])).rejects.toMatchObject({
      code: ResourceErrorCode.Forbidden,
    })

    mockGetResource.mockReturnValue({
      promise: Promise.reject(new ResourceError(ResourceErrorCode.NotFound)),
    })
    expect(await collectMissingPermissions([resource])).toEqual([])
  })

  it.each([
    { exists: false, denied: 'get' },
    { exists: false, denied: 'create' },
    { exists: true, denied: 'get' },
    { exists: true, denied: 'patch' },
  ])('checks get and the required write verb: %j', async ({ exists, denied }) => {
    const resource = createGitOpsClusterResource({
      name: 'fleet',
      namespace: 'openshift-gitops',
      agentEnabled: false,
    })
    if (exists) resource.metadata.uid = 'existing-uid'
    mockGetResource.mockImplementation(() => ({
      promise: exists ? Promise.resolve(resource) : Promise.reject(new ResourceError(ResourceErrorCode.NotFound)),
    }))
    mockAccessReview.mockImplementation(
      jest.requireActual('~/resources/self-subject-access-review').createSubjectAccessReview
    )
    const { namespace, name } = resource.metadata
    const get = nockRBAC(rbacGetTestHelper(resource, namespace, name), denied !== 'get')
    const write = nockRBAC(
      exists ? rbacPatchTestHelper(resource, namespace, name) : rbacCreateTestHelper(resource, namespace, name),
      denied === 'get'
    )
    const missing = await collectMissingPermissions([resource])
    expect(missing).toEqual([{ kind: GitOpsClusterKind, namespace, name, verb: denied }])
    expect(get.isDone()).toBe(true)
    expect(write.isDone()).toBe(true)
    expect(mockGetResource).toHaveBeenCalledTimes(1)
  })

  it.each([undefined, []])('preserves existing Placement predicates exactly: %j', (predicates) => {
    const placement = createPlacementResource({ name: 'fleet', namespace: 'openshift-gitops' })
    placement.spec.predicates = predicates
    const next = createPlacementResource({ name: 'fleet', namespace: 'openshift-gitops', existing: placement })
    expect(next.spec.predicates).toEqual(predicates)
  })

  it('requires create permission for a UID-bearing draft deleted from the live cluster', async () => {
    const resource = createGitOpsClusterResource({ name: 'fleet', namespace: 'openshift-gitops', agentEnabled: false })
    resource.metadata.uid = 'stale-uid'
    mockGetResource.mockImplementation(() => ({
      promise: Promise.reject(new ResourceError(ResourceErrorCode.NotFound)),
    }))
    mockAccessReview.mockImplementation((attributes) => ({
      promise: Promise.resolve({ status: { allowed: attributes.verb !== 'create' } }),
    }))
    expect(await collectMissingPermissions([resource])).toEqual([
      { kind: GitOpsClusterKind, name: 'fleet', namespace: 'openshift-gitops', verb: 'create' },
    ])
    expect(mockGetResource).toHaveBeenCalledTimes(1)
    expect(mockAccessReview.mock.calls.map(([attributes]) => attributes.verb)).toEqual(['get', 'create'])
  })

  it('still creates a resource removed after a successful existence probe', async () => {
    const resource = createGitOpsClusterResource({ name: 'fleet', namespace: 'openshift-gitops', agentEnabled: false })
    resource.metadata.uid = 'old-uid'
    mockGetResource
      .mockReturnValueOnce({ promise: Promise.resolve(resource) })
      .mockImplementationOnce(() => ({ promise: Promise.reject(new ResourceError(ResourceErrorCode.NotFound)) }))
    expect(await collectMissingPermissions([resource])).toEqual([])
    await expect(reconcileGitOpsWizardResources([resource], t)).resolves.toEqual({ gitOpsCluster: 'created' })
    expect(mockReconcileResources).toHaveBeenCalledWith(
      [expect.objectContaining({ metadata: { name: 'fleet', namespace: 'openshift-gitops' } })],
      []
    )
  })

  it('keeps a live GitOpsCluster custom Placement reference when that Placement is missing', () => {
    const goc = createGitOpsClusterResource({ name: 'fleet', namespace: 'openshift-gitops', agentEnabled: false })
    goc.metadata.uid = 'goc-uid'
    goc.spec!.placementRef!.name = 'custom-targets'
    const resources = buildGitOpsClusterResources(
      {
        name: 'fleet',
        namespace: 'openshift-gitops',
        agentEnabled: false,
        existingGitOpsCluster: goc,
      },
      t
    )
    expect(resources[0].metadata?.name).toBe('custom-targets')
    expect((resources[1] as typeof goc).spec?.placementRef?.name).toBe('custom-targets')
  })

  it.each([
    { owned: true, shared: false, desired: false, removed: true },
    { owned: false, shared: false, desired: false, removed: false },
    { owned: true, shared: true, desired: false, removed: false },
    { owned: true, shared: false, desired: true, removed: false },
  ])('protects shared and unowned bindings: %j', ({ owned, shared, desired, removed }) => {
    const goc = createGitOpsClusterResource({ name: 'fleet', namespace: 'openshift-gitops', agentEnabled: false })
    const binding: ManagedClusterSetBinding = {
      apiVersion: 'cluster.open-cluster-management.io/v1beta2',
      kind: 'ManagedClusterSetBinding',
      metadata: {
        name: 'default',
        namespace: 'openshift-gitops',
        annotations: owned ? { [GITOPS_BINDING_OWNER_ANNOTATION]: 'fleet' } : {},
      },
      spec: { clusterSet: 'default' },
    }
    const otherPlacement = createPlacementResource({ name: 'other', namespace: 'openshift-gitops' })
    // No clusterSets means this other Placement uses every bound set.
    expect(
      getRemovedGitOpsWizardResources(desired ? [goc, binding] : [goc], [goc, binding], shared ? [otherPlacement] : [])
    ).toEqual(removed ? [binding] : [])
  })

  it('does not delete a shared binding in the reconciliation removal path', async () => {
    const goc = createGitOpsClusterResource({ name: 'fleet', namespace: 'openshift-gitops', agentEnabled: false })
    const binding = {
      apiVersion: 'cluster.open-cluster-management.io/v1beta2',
      kind: 'ManagedClusterSetBinding',
      metadata: { name: 'default', namespace: 'openshift-gitops' },
      spec: { clusterSet: 'default' },
    }
    mockGetResource.mockReturnValue({ promise: Promise.resolve(goc) })
    await reconcileGitOpsWizardResources([goc], t, [goc, binding], { placements: [] })
    expect(mockReconcileResources).toHaveBeenCalledTimes(1)
  })

  it.each([
    { desiredSets: ['default'], keepPlacement: true, retainBinding: true },
    { desiredSets: [], keepPlacement: true, retainBinding: true },
    { desiredSets: ['other'], keepPlacement: true, retainBinding: false },
    { desiredSets: ['default'], keepPlacement: false, retainBinding: false },
  ])('evaluates binding references from desired Placements: %j', ({ desiredSets, keepPlacement, retainBinding }) => {
    const goc = createGitOpsClusterResource({ name: 'fleet', namespace: 'openshift-gitops', agentEnabled: false })
    const binding: ManagedClusterSetBinding = {
      apiVersion: 'cluster.open-cluster-management.io/v1beta2',
      kind: 'ManagedClusterSetBinding',
      metadata: {
        name: 'default',
        namespace: 'openshift-gitops',
        annotations: { [GITOPS_BINDING_OWNER_ANNOTATION]: 'fleet' },
      },
      spec: { clusterSet: 'default' },
    }
    const before = createPlacementResource({ name: 'fleet', namespace: 'openshift-gitops', clusterSets: ['default'] })
    const draft = { ...before, spec: { ...before.spec, clusterSets: desiredSets } }
    const removed = getRemovedGitOpsWizardResources(
      keepPlacement ? [goc, draft] : [goc],
      [goc, before, binding],
      [before]
    )
    expect(removed.includes(binding)).toBe(!retainBinding)
  })

  it.each(['referenced', 'unreferenced', 'read-failure'] as const)(
    'uses fresh Placements before binding cleanup: %s',
    async (state) => {
      const goc = createGitOpsClusterResource({ name: 'fleet', namespace: 'openshift-gitops', agentEnabled: false })
      goc.metadata.uid = 'goc-uid'
      const binding: ManagedClusterSetBinding = {
        apiVersion: 'cluster.open-cluster-management.io/v1beta2',
        kind: 'ManagedClusterSetBinding',
        metadata: {
          name: 'default',
          namespace: 'openshift-gitops',
          annotations: { [GITOPS_BINDING_OWNER_ANNOTATION]: 'fleet' },
        },
        spec: { clusterSet: 'default' },
      }
      const placement = createPlacementResource({
        name: 'other',
        namespace: 'openshift-gitops',
        clusterSets: ['default'],
      })
      mockGetResource.mockReturnValue({ promise: Promise.resolve(goc) })
      mockListResources.mockImplementation(() => ({
        promise:
          state === 'read-failure'
            ? Promise.reject(new ResourceError(ResourceErrorCode.Forbidden))
            : Promise.resolve(state === 'referenced' ? [placement] : []),
      }))
      const save = reconcileGitOpsWizardResources([goc], t, [goc, binding], {
        placements: state === 'unreferenced' ? [placement] : [],
      })
      const outcome = await save.catch((error: unknown) => error)
      const expectedFailure = expect.objectContaining({
        message: expect.stringContaining('binding cleanup could not complete'),
      })
      const expectedSuccess = expect.objectContaining({ gitOpsCluster: 'updated' })
      expect(outcome).toEqual(state === 'read-failure' ? expectedFailure : expectedSuccess)
      expect(mockListResources).toHaveBeenCalledWith({
        apiVersion: 'cluster.open-cluster-management.io/v1beta1',
        kind: PlacementKind,
        metadata: { namespace: 'openshift-gitops' },
      })
      expect(mockListResources.mock.invocationCallOrder[0]).toBeGreaterThan(
        mockReconcileResources.mock.invocationCallOrder[0]
      )
      expect(mockReconcileResources.mock.calls.filter(([desired]) => desired.length === 0)).toEqual(
        state === 'unreferenced' ? [[[], [binding], { ignoreNotFound: true }]] : []
      )
    }
  )

  it.each([true, false])(
    'keeps a generated AppProject create-only when baseline recorded absence (exists=%s)',
    async (exists) => {
      const draft = createDefaultAppProject('openshift-gitops')
      const live = { ...draft, spec: { sourceRepos: ['https://example.com/restricted.git'] } }
      mockGetResource.mockImplementation(() => ({
        promise: exists ? Promise.resolve(live) : Promise.reject(new ResourceError(ResourceErrorCode.NotFound)),
      }))
      await reconcileGitOpsWizardResources([draft], t, [], { baseline: [] })
      expect(mockReconcileResources.mock.calls).toEqual(exists ? [] : [[[draft], []]])
    }
  )

  it('reports a conflict if the live version changes after the merge read', async () => {
    const resource = createGitOpsClusterResource({ name: 'fleet', namespace: 'openshift-gitops', agentEnabled: false })
    resource.metadata = { ...resource.metadata, uid: 'goc-uid', resourceVersion: '4' }
    mockGetResource.mockReturnValue({ promise: Promise.resolve(resource) })
    mockReconcileResources.mockRejectedValueOnce(
      new ResourceError(ResourceErrorCode.UnprocessableEntity, 'test failed at /metadata/resourceVersion')
    )
    await expect(reconcileGitOpsWizardResources([resource], t, [], { baseline: [resource] })).rejects.toMatchObject({
      code: ResourceErrorCode.Conflict,
    })
    expect(mockReconcileResources).toHaveBeenCalledTimes(1)
  })

  it.each([false, true])(
    'distinguishes generic patch validation errors from version conflicts (changed=%s)',
    async (changed) => {
      const resource = createGitOpsClusterResource({
        name: 'fleet',
        namespace: 'openshift-gitops',
        agentEnabled: false,
      })
      resource.metadata = { ...resource.metadata, uid: 'goc-uid', resourceVersion: '4' }
      mockGetResource.mockReturnValueOnce({ promise: Promise.resolve(resource) }).mockReturnValueOnce({
        promise: Promise.resolve({
          ...resource,
          metadata: { ...resource.metadata, resourceVersion: changed ? '5' : '4' },
        }),
      })
      mockReconcileResources.mockRejectedValueOnce(
        new ResourceError(ResourceErrorCode.UnprocessableEntity, 'Invalid request')
      )
      await expect(reconcileGitOpsWizardResources([resource], t, [], { baseline: [resource] })).rejects.toMatchObject({
        code: changed ? ResourceErrorCode.Conflict : ResourceErrorCode.UnprocessableEntity,
      })
      expect(mockReconcileResources).toHaveBeenCalledTimes(1)
    }
  )

  it('does not mark a pre-existing binding as owned when a create draft finds it live', async () => {
    const binding = {
      apiVersion: 'cluster.open-cluster-management.io/v1beta2',
      kind: 'ManagedClusterSetBinding',
      metadata: { name: 'default', namespace: 'openshift-gitops', uid: 'binding-uid' },
      spec: { clusterSet: 'default' },
    }
    mockGetResource.mockReturnValue({ promise: Promise.resolve(binding) })
    await reconcileGitOpsWizardResources(
      [{ ...binding, metadata: { ...binding.metadata, annotations: { [GITOPS_BINDING_OWNER_ANNOTATION]: 'fleet' } } }],
      t
    )
    const patched = mockReconcileResources.mock.calls[0][0][0]
    expect(patched.metadata.annotations?.[GITOPS_BINDING_OWNER_ANNOTATION]).toBeUndefined()
  })

  it('tracks draft binding ownership when the GitOpsCluster name changes before creation', () => {
    const first = buildGitOpsClusterResources(
      {
        name: 'first',
        namespace: 'openshift-gitops',
        agentEnabled: false,
        clusterSets: ['default'],
      },
      t
    )
    const binding = first.find((resource) => resource.kind === 'ManagedClusterSetBinding') as ManagedClusterSetBinding
    const next = buildGitOpsClusterResources(
      {
        name: 'renamed',
        namespace: 'openshift-gitops',
        agentEnabled: false,
        clusterSets: ['default'],
        existingBindings: [binding],
      },
      t
    )
    expect(
      next.find((resource) => resource.kind === 'ManagedClusterSetBinding')?.metadata?.annotations?.[
        GITOPS_BINDING_OWNER_ANNOTATION
      ]
    ).toBe('renamed')
    expect(binding.metadata.annotations?.[GITOPS_BINDING_OWNER_ANNOTATION]).toBe('first')
  })

  it('checks and reports delete permissions for resources removed from the baseline', async () => {
    mockAccessReview.mockImplementation((attributes) => ({
      promise: Promise.resolve({ status: { allowed: attributes.verb !== 'delete' } }),
    }))
    const policy = {
      apiVersion: 'policy.open-cluster-management.io/v1',
      kind: PolicyKind,
      metadata: { name: 'old-policy', namespace: 'openshift-gitops', uid: 'policy-uid' },
    }
    expect(await collectMissingPermissions([], [policy])).toEqual([
      { kind: PolicyKind, verb: 'delete', name: 'old-policy', namespace: 'openshift-gitops' },
    ])
  })

  it('preserves concurrent ArgoCD changes while applying only the wizard edits', async () => {
    const baseline = {
      apiVersion: 'argoproj.io/v1beta1',
      kind: ArgoCDKind,
      metadata: { name: 'openshift-gitops', namespace: 'openshift-gitops', uid: 'argo-uid', resourceVersion: '1' },
      spec: { controller: { enabled: true }, ha: { enabled: false } },
    }
    const draft = { ...baseline, spec: { ...baseline.spec, controller: { enabled: false } } }
    const live = {
      ...baseline,
      metadata: { ...baseline.metadata, resourceVersion: '2' },
      spec: { ...baseline.spec, ha: { enabled: true } },
    }
    mockGetResource.mockReturnValue({ promise: Promise.resolve(live) })
    await reconcileGitOpsWizardResources([draft], t, [], { baseline: [baseline] })
    expect(mockReconcileResources).toHaveBeenCalledWith(
      [expect.objectContaining({ spec: { controller: { enabled: false }, ha: { enabled: true } } })],
      [live],
      { requireResourceVersion: true }
    )
    expect(baseline.spec.ha.enabled).toBe(false)
  })

  it('rejects conflicting concurrent ArgoCD edits without patching the resource', async () => {
    const baseline = {
      apiVersion: 'argoproj.io/v1beta1',
      kind: ArgoCDKind,
      metadata: { name: 'openshift-gitops', namespace: 'openshift-gitops', uid: 'argo-uid' },
      spec: { sourceNamespaces: ['original'] },
    }
    const draft = { ...baseline, spec: { sourceNamespaces: ['wizard'] } }
    const live = { ...baseline, spec: { sourceNamespaces: ['concurrent'] } }
    mockGetResource.mockReturnValue({ promise: Promise.resolve(live) })
    await expect(reconcileGitOpsWizardResources([draft], t, [], { baseline: [baseline] })).rejects.toMatchObject({
      code: ResourceErrorCode.Conflict,
    })
    expect(mockReconcileResources).not.toHaveBeenCalled()
  })

  it('rejects a stale ArgoCD draft when its original baseline is unavailable', async () => {
    const draft = {
      apiVersion: 'argoproj.io/v1beta1',
      kind: ArgoCDKind,
      metadata: { name: 'openshift-gitops', namespace: 'openshift-gitops', resourceVersion: '1' },
      spec: { ha: { enabled: false } },
    }
    mockGetResource.mockReturnValue({
      promise: Promise.resolve({
        ...draft,
        metadata: { ...draft.metadata, resourceVersion: '2' },
        spec: { ha: { enabled: true } },
      }),
    })
    await expect(reconcileGitOpsWizardResources([draft], t)).rejects.toMatchObject({ code: ResourceErrorCode.Conflict })
    expect(mockReconcileResources).not.toHaveBeenCalled()
  })
})
