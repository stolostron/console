/* Copyright Contributors to the Open Cluster Management project */

import {
  AGENT_AUTH,
  AGENT_SUBSCRIPTION_ENV,
  AppProjectKind,
  ArgoCDKind,
  buildGitOpsClusterResources,
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

describe('gitOpsClusterResources', () => {
  it('builds create defaults without agent extras when agent is off', () => {
    const resources = buildGitOpsClusterResources({
      name: 'fleet',
      namespace: 'openshift-gitops',
      agentEnabled: false,
    })
    expect(resources.map((r) => r.kind)).toEqual([GitOpsClusterKind, PlacementKind])
    expect(isAgentEnabled(resources[0] as never)).toBe(false)
    const placement = resources[1]
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
      GitOpsClusterKind,
      PlacementKind,
      'ManagedClusterSetBinding',
      ArgoCDKind,
      AppProjectKind,
      SubscriptionOperatorKind,
      PolicyKind,
    ])
    expect(isAgentEnabled(resources[0] as never)).toBe(true)
    expect(isPushModelEnabled(resources[0] as never)).toBe(false)

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

  it('creates AppProject wildcards and named helpers', () => {
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
        metadata: { name: 'fleet', namespace: 'openshift-gitops' },
        spec: {
          argoServer: { argoNamespace: 'openshift-gitops' },
          placementRef: { kind: PlacementKind, apiVersion: 'cluster.open-cluster-management.io/v1beta1', name: 'targets' },
        },
      },
    })
    expect(gitOps.spec?.placementRef?.name).toBe('targets')
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
})
