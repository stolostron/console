/* Copyright Contributors to the Open Cluster Management project */

import { nockIgnoreApiPaths, nockIgnoreRBAC } from '~/lib/nock-util'
import {
  AGENT_AUTH,
  AGENT_SUBSCRIPTION_ENV,
  AppProjectKind,
  ArgoCDKind,
  buildGitOpsClusterResources,
  collectMissingPermissions,
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
import { PlacementKind } from '~/resources/placement'
import { PolicyKind } from '~/resources/policy'
import {
  SubscriptionOperatorApiVersion,
  SubscriptionOperatorKind,
  type SubscriptionOperator,
} from '~/resources/subscription-operator'
import { getResource, reconcileResources, ResourceError, ResourceErrorCode } from '~/resources/utils'

jest.mock('~/resources/utils/resource-request', () => {
  const actual = jest.requireActual('~/resources/utils/resource-request')
  return {
    ...actual,
    getResource: jest.fn(),
    reconcileResources: jest.fn(async () => undefined),
  }
})

const mockGetResource = getResource as jest.Mock
const mockReconcileResources = reconcileResources as jest.Mock

describe('gitOpsClusterResources', () => {
  beforeEach(() => {
    nockIgnoreApiPaths()
    nockIgnoreRBAC()
    mockGetResource.mockReset()
    mockReconcileResources.mockReset()
    mockReconcileResources.mockResolvedValue(undefined)
  })

  it('builds create defaults without agent extras when agent is off', () => {
    const resources = buildGitOpsClusterResources({
      name: 'fleet',
      namespace: 'openshift-gitops',
      agentEnabled: false,
    })
    expect(resources.map((r) => r.kind)).toEqual([PlacementKind, GitOpsClusterKind])
    expect(isAgentEnabled(resources[1] as never)).toBe(false)
    const placement = resources[0]
    expect(placement.metadata?.name).toBe('fleet-placement')
    expect((placement as { spec?: { predicates?: unknown[] } }).spec?.predicates).toEqual([
      {
        requiredClusterSelector: {
          labelSelector: {
            matchExpressions: [
              { key: 'vendor', operator: 'In', values: ['OpenShift'] },
              { key: 'local-cluster', operator: 'DoesNotExist' },
            ],
          },
        },
      },
    ])
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
    const resources = buildGitOpsClusterResources({
      name: 'agent-gitops',
      namespace: 'openshift-gitops',
      agentEnabled: true,
      pushModelEnabled: false,
      existingArgoCD: existingArgo,
      existingSubscription: existingSub,
      clusterSets: ['default'],
    })
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
    const resources = buildGitOpsClusterResources({
      name: 'agent-gitops',
      namespace: 'openshift-gitops',
      agentEnabled: true,
      pushModelEnabled: false,
    })
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

    const resources = buildGitOpsClusterResources({
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
    })
    expect(resources.find((r) => r.kind === PlacementKind)?.metadata?.name).toBe(customName)
    expect(
      (resources.find((r) => r.kind === GitOpsClusterKind) as { spec?: { placementRef?: { name?: string } } }).spec
        ?.placementRef?.name
    ).toBe(customName)

    const ensured = ensureGitOpsClusterPlacement(resources)
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
    const resources = buildGitOpsClusterResources({
      name: 'fleet',
      namespace: 'openshift-gitops',
      agentEnabled: false,
      clusterSets: [],
      existingBindings: [binding as never],
      includeBindings: true,
    })
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
    const ensured = ensureGitOpsClusterPlacement([gitOps])
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
      },
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

    await expect(reconcileGitOpsWizardResources([desired])).resolves.toEqual({ gitOpsCluster: 'created' })
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
    await expect(reconcileGitOpsWizardResources([desired])).resolves.toEqual({ gitOpsCluster: 'updated' })
    expect(mockReconcileResources).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          metadata: expect.objectContaining({ uid: 'live-uid', resourceVersion: '3', name: 'fleet' }),
        }),
      ],
      [live]
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

    await expect(reconcileGitOpsWizardResources([gitOpsCluster, placement])).rejects.toMatchObject({
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
      [expect.objectContaining({ kind: PlacementKind, metadata: expect.objectContaining({ name: 'fleet-placement' }) })]
    )
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

    await reconcileGitOpsWizardResources([keep], [keep, removedPolicy as never])
    expect(mockReconcileResources).toHaveBeenNthCalledWith(
      1,
      [expect.objectContaining({ kind: GitOpsClusterKind })],
      [keep]
    )
    expect(mockReconcileResources).toHaveBeenNthCalledWith(2, [], [removedPolicy])
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
    const missing = await collectMissingPermissions([resource])
    // nockIgnoreRBAC allows all; ensure both get and create were evaluated (no missing)
    expect(missing).toEqual([])
  })

  it('checks get and patch permissions when the resource already exists', async () => {
    const resource = createGitOpsClusterResource({
      name: 'fleet',
      namespace: 'openshift-gitops',
      agentEnabled: false,
    })
    resource.metadata.uid = 'existing-uid'
    const missing = await collectMissingPermissions([resource])
    expect(missing).toEqual([])
  })
})
