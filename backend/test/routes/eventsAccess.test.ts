/* Copyright Contributors to the Open Cluster Management project */
import nock from 'nock'
import {
  canAccess,
  canGetResource,
  canListClusterScopedKind,
  canListNamespacedScopedKind,
  configureClusterScopedKinds,
} from '../../src/routes/eventsAccess'
import { ACCESS_CACHE_TTL, cleanupAccessCache, resetAccessCache } from '../../src/routes/eventsCache'

describe('eventsAccess', () => {
  const apiUrl = () => process.env.CLUSTER_API_URL || ''
  const managedCluster = (name: string) => ({
    kind: 'ManagedCluster',
    apiVersion: 'cluster.open-cluster-management.io/v1',
    metadata: { name },
  })
  const secret = (namespace: string, name: string) => ({
    kind: 'Secret',
    apiVersion: 'v1',
    metadata: { namespace, name },
  })
  const managedClusterInfo = (cluster: string) => ({
    kind: 'ManagedClusterInfo',
    apiVersion: 'internal.open-cluster-management.io/v1beta1',
    metadata: { name: cluster, namespace: cluster },
  })

  const emptyRules = { incomplete: false, resourceRules: [] as unknown[] }
  const secretGetInNamespace = {
    incomplete: false,
    resourceRules: [{ verbs: ['get'], apiGroups: [''], resources: ['secrets'] }],
  }
  const clusterAdminRules = {
    incomplete: false,
    resourceRules: [{ verbs: ['*'], apiGroups: ['*'], resources: ['*'] }],
  }

  function rulesReviewNamespace(body: unknown): string {
    let parsed = body
    if (typeof body === 'string') {
      try {
        parsed = JSON.parse(body) as unknown
      } catch {
        return ''
      }
    }
    return (parsed as { spec?: { namespace?: string } })?.spec?.namespace || ''
  }

  function nockRulesReview(replyFn: (namespace: string) => { incomplete?: boolean; resourceRules?: unknown[] }) {
    return nock(apiUrl())
      .post('/apis/authorization.k8s.io/v1/selfsubjectrulesreviews')
      .reply(200, (_uri: string, requestBody: unknown) => ({ status: replyFn(rulesReviewNamespace(requestBody)) }))
  }

  function nockRulesReviewStatus(
    replyFn: (namespace: string) => {
      incomplete?: boolean
      evaluationError?: string
      resourceRules?: unknown[]
    }
  ) {
    return nock(apiUrl())
      .post('/apis/authorization.k8s.io/v1/selfsubjectrulesreviews')
      .reply(200, (_uri: string, requestBody: unknown) => ({ status: replyFn(rulesReviewNamespace(requestBody)) }))
  }

  function parseSsarResourceAttributes(body: unknown) {
    const parsed =
      typeof body === 'string'
        ? (JSON.parse(body) as { spec?: { resourceAttributes?: Record<string, string | undefined> } })
        : body
    return (parsed as { spec?: { resourceAttributes?: Record<string, string | undefined> } })?.spec?.resourceAttributes
  }

  function nockSsarGet(matcher: (attrs: Record<string, string | undefined>) => boolean, allowed: boolean) {
    return nock(apiUrl())
      .post('/apis/authorization.k8s.io/v1/selfsubjectaccessreviews', (body: unknown) => {
        const attrs = parseSsarResourceAttributes(body)
        return attrs?.verb === 'get' && matcher(attrs ?? {})
      })
      .reply(200, { status: { allowed } })
  }

  const namedManagedClusterRule = (name: string) => ({
    incomplete: false,
    resourceRules: [
      {
        verbs: ['get'],
        apiGroups: ['cluster.open-cluster-management.io'],
        resources: ['managedclusters'],
        resourceNames: [name],
      },
    ],
  })

  beforeEach(() => {
    resetAccessCache()
    configureClusterScopedKinds(['ManagedCluster', 'ClusterExtension', 'Namespace', 'StorageClass'])
    process.env.CLUSTER_API_URL = 'https://api.test-cluster.com:6443'
  })

  afterEach(() => {
    resetAccessCache()
    delete process.env.CLUSTER_API_URL
    nock.cleanAll()
  })

  describe('canListClusterScopedKind', () => {
    it('should issue a cluster-scoped list SSAR', async () => {
      const resource = managedCluster('cluster-1')
      const ssarScope = nock(apiUrl())
        .post('/apis/authorization.k8s.io/v1/selfsubjectaccessreviews', (body: unknown) => {
          const parsed =
            typeof body === 'string'
              ? (JSON.parse(body) as { spec?: { resourceAttributes?: { verb?: string } } })
              : body
          return (
            (parsed as { spec?: { resourceAttributes?: { verb?: string } } })?.spec?.resourceAttributes?.verb === 'list'
          )
        })
        .reply(200, { status: { allowed: true } })

      expect(await canListClusterScopedKind(resource, 'list-token')).toBe(true)
      expect(ssarScope.isDone()).toBe(true)
    })
  })

  describe('canListNamespacedScopedKind', () => {
    it('should return false when the resource has no namespace', async () => {
      const ssarScope = nock(apiUrl())
        .post('/apis/authorization.k8s.io/v1/selfsubjectaccessreviews')
        .reply(200, { status: { allowed: true } })

      expect(await canListNamespacedScopedKind(managedCluster('cluster-1'), 'list-token')).toBe(false)
      expect(ssarScope.isDone()).toBe(false)
    })

    it('should issue a namespaced list SSAR', async () => {
      const resource = managedClusterInfo('acm39327-mc-01')
      const ssarScope = nock(apiUrl())
        .post('/apis/authorization.k8s.io/v1/selfsubjectaccessreviews', (body: unknown) => {
          const parsed =
            typeof body === 'string'
              ? (JSON.parse(body) as { spec?: { resourceAttributes?: { namespace?: string; verb?: string } } })
              : body
          const attrs = (parsed as { spec?: { resourceAttributes?: { namespace?: string; verb?: string } } })?.spec
            ?.resourceAttributes
          return attrs?.namespace === 'acm39327-mc-01' && attrs?.verb === 'list'
        })
        .reply(200, { status: { allowed: true } })

      expect(await canListNamespacedScopedKind(resource, 'list-token')).toBe(true)
      expect(ssarScope.isDone()).toBe(true)
    })
  })

  /**
   * ACM-39327: restricted users must not trigger O(N) SelfSubjectAccessReviews when the SSE
   * filter falls through after cluster-scoped list is denied. SelfSubjectRulesReview is
   * namespaced: cache one review per token+namespace, never treat `default` as global allow.
   */
  describe('SelfSubjectRulesReview short-circuit (ACM-39327)', () => {
    it('should deny all gets from complete empty rules without per-object SSAR', async () => {
      nockRulesReview(() => emptyRules)

      const ssarScope = nock(apiUrl())
        .post('/apis/authorization.k8s.io/v1/selfsubjectaccessreviews')
        .reply(200, { status: { allowed: true } })

      expect(await canGetResource(managedCluster('cluster-1'), 'none-user-token')).toBe(false)
      expect(ssarScope.isDone()).toBe(false)
    })

    it('should use a single rules review for many cluster-scoped gets of the same kind', async () => {
      let rulesCalls = 0
      nockRulesReview(() => {
        rulesCalls++
        return emptyRules
      })

      const ssarScope = nock(apiUrl())
        .post('/apis/authorization.k8s.io/v1/selfsubjectaccessreviews')
        .times(1)
        .reply(200, { status: { allowed: true } })

      const results = await Promise.all(
        Array.from({ length: 500 }, (_, i) => canGetResource(managedCluster(`cluster-${i}`), 'scale-none-token'))
      )

      expect(results.every((allowed) => allowed === false)).toBe(true)
      expect(rulesCalls).toBe(1)
      expect(ssarScope.isDone()).toBe(false)
    })

    it('should use a single rules review for many namespaced gets in the same namespace', async () => {
      let rulesCalls = 0
      nockRulesReview(() => {
        rulesCalls++
        return emptyRules
      })

      const results = await Promise.all(
        Array.from({ length: 200 }, (_, i) =>
          canGetResource(
            {
              kind: 'ManagedClusterInfo',
              apiVersion: 'internal.open-cluster-management.io/v1beta1',
              metadata: { name: `info-${i}`, namespace: 'acm39327-mc-01' },
            },
            'same-ns-none-token'
          )
        )
      )

      expect(results.every((allowed) => allowed === false)).toBe(true)
      expect(rulesCalls).toBe(1)
    })

    it('should issue one rules review per namespace for a none user, without per-object SSAR', async () => {
      const namespaces = new Set<string>()
      nock(apiUrl())
        .post('/apis/authorization.k8s.io/v1/selfsubjectrulesreviews', (body: unknown) => {
          namespaces.add(rulesReviewNamespace(body))
          return true
        })
        .times(50)
        .reply(200, { status: emptyRules })

      const ssarScope = nock(apiUrl())
        .post('/apis/authorization.k8s.io/v1/selfsubjectaccessreviews')
        .reply(200, { status: { allowed: true } })

      const results = await Promise.all(
        Array.from({ length: 50 }, (_, i) =>
          canGetResource(managedClusterInfo(`cluster-${i}`), 'namespaced-none-token')
        )
      )

      expect(results.every((allowed) => allowed === false)).toBe(true)
      expect(namespaces.size).toBe(50)
      expect(ssarScope.isDone()).toBe(false)
    })

    it('must not treat get secrets in default as access to Credentials in other namespaces', async () => {
      nock(apiUrl())
        .post('/apis/authorization.k8s.io/v1/selfsubjectrulesreviews', (body: unknown) => {
          return rulesReviewNamespace(body) === 'default'
        })
        .reply(200, { status: secretGetInNamespace })
      nock(apiUrl())
        .post('/apis/authorization.k8s.io/v1/selfsubjectrulesreviews', (body: unknown) => {
          return rulesReviewNamespace(body) !== 'default'
        })
        .times(2)
        .reply(200, { status: emptyRules })

      expect(await canGetResource(secret('default', 'default-cred'), 'user1-token')).toBe(true)
      expect(await canGetResource(secret('kube-system', 'other-cred'), 'user1-token')).toBe(false)
      expect(await canGetResource(secret('acm39327-mc-01', 'cluster-cred'), 'user1-token')).toBe(false)
    })

    it('should allow namespaced cluster resources when the user is admin in that cluster namespace', async () => {
      nock(apiUrl())
        .post('/apis/authorization.k8s.io/v1/selfsubjectrulesreviews', (body: unknown) => {
          return rulesReviewNamespace(body) === 'acm39327-mc-01'
        })
        .reply(200, { status: clusterAdminRules })
      nock(apiUrl())
        .post('/apis/authorization.k8s.io/v1/selfsubjectrulesreviews', (body: unknown) => {
          return rulesReviewNamespace(body) !== 'acm39327-mc-01'
        })
        .times(2)
        .reply(200, { status: emptyRules })

      expect(await canGetResource(managedClusterInfo('acm39327-mc-01'), 'cluster-admin-token')).toBe(true)
      expect(await canGetResource(managedClusterInfo('other-cluster'), 'cluster-admin-token')).toBe(false)
      expect(await canGetResource(managedCluster('acm39327-mc-01'), 'cluster-admin-token')).toBe(false)
    })

    it('should confirm named cluster-scoped resources with SSAR before allowing access', async () => {
      nockRulesReview(() => namedManagedClusterRule('allowed-cluster'))
      const ssarScope = nockSsarGet(
        (attrs) =>
          attrs.group === 'cluster.open-cluster-management.io' &&
          attrs.resource === 'managedclusters' &&
          attrs.name === 'allowed-cluster',
        true
      )

      expect(await canGetResource(managedCluster('allowed-cluster'), 'partial-user-token')).toBe(true)
      expect(ssarScope.isDone()).toBe(true)
    })

    it('should deny non-matching names from cluster-scoped allow-names without trusting SSRR alone', async () => {
      nockRulesReview(() => namedManagedClusterRule('allowed-cluster'))
      const ssarScope = nockSsarGet(
        (attrs) =>
          attrs.group === 'cluster.open-cluster-management.io' &&
          attrs.resource === 'managedclusters' &&
          attrs.name === 'other-cluster',
        false
      )

      expect(await canGetResource(managedCluster('other-cluster'), 'partial-user-token')).toBe(false)
      expect(ssarScope.isDone()).toBe(true)
    })

    it('should allow namespaced resources when rules grant unrestricted get/list/watch in that namespace', async () => {
      nockRulesReview(() => ({
        incomplete: false,
        resourceRules: [{ verbs: ['get', 'list', 'watch'], apiGroups: [''], resources: ['secrets'] }],
      }))

      const ssarScope = nock(apiUrl())
        .post('/apis/authorization.k8s.io/v1/selfsubjectaccessreviews')
        .reply(200, { status: { allowed: false } })

      expect(await canGetResource(secret('default', 'any-secret'), 'viewer-token')).toBe(true)
      expect(ssarScope.isDone()).toBe(false)
    })

    it('should confirm cluster-scoped allow-all with SSAR so default RoleBindings are not treated as cluster access', async () => {
      nockRulesReview(() => ({
        incomplete: false,
        resourceRules: [
          {
            verbs: ['get', 'list', 'watch'],
            apiGroups: ['cluster.open-cluster-management.io'],
            resources: ['managedclusters'],
          },
        ],
      }))
      nock(apiUrl())
        .post('/apis/authorization.k8s.io/v1/selfsubjectaccessreviews')
        .reply(200, { status: { allowed: false } })

      expect(await canGetResource(managedCluster('any-cluster'), 'default-role-token')).toBe(false)
    })

    it('should reuse kind access across API versions of the same group', async () => {
      let rulesCalls = 0
      nockRulesReview(() => {
        rulesCalls++
        return emptyRules
      })

      expect(
        await canGetResource(
          { kind: 'Placement', apiVersion: 'cluster.open-cluster-management.io/v1beta1', metadata: { name: 'p1' } },
          'version-token'
        )
      ).toBe(false)
      expect(
        await canGetResource(
          { kind: 'Placement', apiVersion: 'cluster.open-cluster-management.io/v1alpha1', metadata: { name: 'p2' } },
          'version-token'
        )
      ).toBe(false)
      expect(rulesCalls).toBe(1)
    })

    it('should fall back to SSAR when rules review is incomplete with non-empty rules', async () => {
      nockRulesReview(() => ({
        incomplete: true,
        resourceRules: [{ verbs: ['get'], apiGroups: [''], resources: ['pods'] }],
      }))
      const ssarScope = nock(apiUrl())
        .post('/apis/authorization.k8s.io/v1/selfsubjectaccessreviews')
        .reply(200, { status: { allowed: true } })

      expect(await canGetResource(managedCluster('cluster-1'), 'incomplete-user-token')).toBe(true)
      expect(ssarScope.isDone()).toBe(true)
    })

    it('should deny-all when rules are empty even if incomplete is true (OpenShift none user)', async () => {
      nockRulesReview(() => ({ incomplete: true, resourceRules: [] }))

      const ssarScope = nock(apiUrl())
        .post('/apis/authorization.k8s.io/v1/selfsubjectaccessreviews')
        .reply(200, { status: { allowed: true } })

      expect(await canGetResource(managedCluster('cluster-1'), 'openshift-none-token')).toBe(false)
      expect(ssarScope.isDone()).toBe(false)
    })

    it('should fall back to SSAR when SelfSubjectRulesReview request fails', async () => {
      nock(apiUrl())
        .post('/apis/authorization.k8s.io/v1/selfsubjectrulesreviews')
        .reply(500, { message: 'internal error' })

      const ssarScope = nock(apiUrl())
        .post('/apis/authorization.k8s.io/v1/selfsubjectaccessreviews')
        .reply(200, { status: { allowed: true } })

      expect(await canGetResource(managedCluster('cluster-1'), 'ssrr-fail-token')).toBe(true)
      expect(ssarScope.isDone()).toBe(true)
    })

    it('should expire subject rules and kind access caches during cleanup', async () => {
      let rulesCalls = 0
      nock(apiUrl())
        .post('/apis/authorization.k8s.io/v1/selfsubjectrulesreviews')
        .twice()
        .reply(200, () => {
          rulesCalls++
          return { status: { incomplete: false, resourceRules: [] } }
        })

      const start = 1_000_000
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(start)

      await canGetResource(managedCluster('c1'), 'cache-expiry-token')

      nowSpy.mockReturnValue(start + ACCESS_CACHE_TTL + 1)
      cleanupAccessCache()

      nowSpy.mockReturnValue(start + ACCESS_CACHE_TTL + 2)
      await canGetResource(managedCluster('c2'), 'cache-expiry-token')

      nowSpy.mockRestore()
      expect(rulesCalls).toBe(2)
    })
  })

  /**
   * TDD: middle-ground security — SSRR deny-all short-circuit only; any non-deny cluster-scoped
   * result must be confirmed with SSAR. Implementation pending in eventsAccess.ts.
   */
  describe('cluster-scoped SSRR middle-ground security (TDD)', () => {
    it('should deny allow-names from a default RoleBinding when SSAR get is false (Kevin)', async () => {
      nockRulesReview(() => namedManagedClusterRule('acm39327-mc-02'))
      const ssarScope = nockSsarGet(
        (attrs) =>
          attrs.group === 'cluster.open-cluster-management.io' &&
          attrs.resource === 'managedclusters' &&
          attrs.name === 'acm39327-mc-02',
        false
      )

      expect(await canGetResource(managedCluster('acm39327-mc-02'), 'user1-token')).toBe(false)
      expect(ssarScope.isDone()).toBe(true)
    })

    it('should allow allow-names only when SSAR get confirms a real ClusterRoleBinding grant', async () => {
      nockRulesReview(() => namedManagedClusterRule('allowed-cluster'))
      const ssarScope = nockSsarGet(
        (attrs) =>
          attrs.group === 'cluster.open-cluster-management.io' &&
          attrs.resource === 'managedclusters' &&
          attrs.name === 'allowed-cluster',
        true
      )

      expect(await canGetResource(managedCluster('allowed-cluster'), 'clusterrole-user-token')).toBe(true)
      expect(ssarScope.isDone()).toBe(true)
    })

    it('should confirm cluster-scoped allow-all with SSAR and deny when SSAR rejects', async () => {
      nockRulesReview(() => ({
        incomplete: false,
        resourceRules: [
          {
            verbs: ['get', 'list', 'watch'],
            apiGroups: ['cluster.open-cluster-management.io'],
            resources: ['managedclusters'],
          },
        ],
      }))
      const ssarScope = nockSsarGet(
        (attrs) => attrs.group === 'cluster.open-cluster-management.io' && attrs.resource === 'managedclusters',
        false
      )

      expect(await canGetResource(managedCluster('any-cluster'), 'default-role-token')).toBe(false)
      expect(ssarScope.isDone()).toBe(true)
    })

    it('should not trust allow-names on ManagedCluster when metadata.namespace is set without SSAR confirmation', async () => {
      nock(apiUrl())
        .post('/apis/authorization.k8s.io/v1/selfsubjectrulesreviews', (body: unknown) => {
          return rulesReviewNamespace(body) === 'default'
        })
        .reply(200, { status: namedManagedClusterRule('acm39327-mc-02') })
      const ssarScope = nockSsarGet(
        (attrs) =>
          attrs.group === 'cluster.open-cluster-management.io' &&
          attrs.resource === 'managedclusters' &&
          attrs.name === 'acm39327-mc-02',
        false
      )

      expect(
        await canGetResource(
          {
            kind: 'ManagedCluster',
            apiVersion: 'cluster.open-cluster-management.io/v1',
            metadata: { name: 'acm39327-mc-02', namespace: 'default' },
          },
          'user1-token'
        )
      ).toBe(false)
      expect(ssarScope.isDone()).toBe(true)
    })

    it('should treat SSRR evaluationError as incomplete and confirm cluster-scoped access with SSAR', async () => {
      nockRulesReviewStatus(() => ({
        incomplete: false,
        evaluationError: 'webhook authorizer does not support user rule resolution',
        resourceRules: [{ verbs: ['get'], apiGroups: [''], resources: ['pods'] }],
      }))
      const ssarScope = nockSsarGet(
        (attrs) =>
          attrs.group === 'cluster.open-cluster-management.io' &&
          attrs.resource === 'managedclusters' &&
          attrs.name === 'cluster-1',
        true
      )

      expect(await canGetResource(managedCluster('cluster-1'), 'evaluation-error-token')).toBe(true)
      expect(ssarScope.isDone()).toBe(true)
    })

    it('should confirm any non-deny-all cluster-scoped SSRR result with SSAR, not applyKindGetAccess alone', async () => {
      nockRulesReview(() => ({
        incomplete: true,
        resourceRules: [
          {
            verbs: ['get'],
            apiGroups: ['cluster.open-cluster-management.io'],
            resources: ['managedclusters'],
            resourceNames: ['cluster-1'],
          },
        ],
      }))
      const ssarScope = nockSsarGet(
        (attrs) =>
          attrs.group === 'cluster.open-cluster-management.io' &&
          attrs.resource === 'managedclusters' &&
          attrs.name === 'cluster-1',
        false
      )

      expect(await canGetResource(managedCluster('cluster-1'), 'incomplete-named-token')).toBe(false)
      expect(ssarScope.isDone()).toBe(true)
    })
  })

  describe('canAccess', () => {
    it('should post a SelfSubjectAccessReview for the requested verb and resource', async () => {
      const resource = secret('default', 'test-secret')
      const ssarScope = nock(apiUrl())
        .post('/apis/authorization.k8s.io/v1/selfsubjectaccessreviews', (body: unknown) => {
          const parsed =
            typeof body === 'string'
              ? (JSON.parse(body) as { spec?: { resourceAttributes?: { verb?: string; resource?: string } } })
              : body
          const attrs = (parsed as { spec?: { resourceAttributes?: { verb?: string; resource?: string } } })?.spec
            ?.resourceAttributes
          return attrs?.verb === 'create' && attrs?.resource === 'secrets'
        })
        .reply(200, { status: { allowed: true } })

      expect(await canAccess(resource, 'create', 'create-token')).toBe(true)
      expect(ssarScope.isDone()).toBe(true)
    })

    it('should log access checks when LOG_ACCESS is enabled', async () => {
      const { logger } = await import('../../src/lib/logger')
      const debugSpy = jest.spyOn(logger, 'debug').mockImplementation(() => {})
      process.env.LOG_ACCESS = 'true'

      nock(apiUrl())
        .post('/apis/authorization.k8s.io/v1/selfsubjectaccessreviews')
        .reply(200, { status: { allowed: true } })

      await canAccess(
        { kind: 'Pod', apiVersion: 'v1', metadata: { namespace: 'default', name: 'logged-pod' } },
        'get',
        'log-access-token'
      )

      expect(debugSpy).toHaveBeenCalledWith(
        expect.objectContaining({ msg: 'access', allowed: true, verb: 'get', resource: 'pods' })
      )

      debugSpy.mockRestore()
      delete process.env.LOG_ACCESS
    })

    it('should not reuse SSAR results across API groups that share a kind name', async () => {
      const appK8s = {
        kind: 'Application',
        apiVersion: 'app.k8s.io/v1beta1',
        metadata: { namespace: 'ns', name: 'app' },
      }
      const argoApp = {
        kind: 'Application',
        apiVersion: 'argoproj.io/v1alpha1',
        metadata: { namespace: 'ns', name: 'app' },
      }

      nock(apiUrl())
        .post('/apis/authorization.k8s.io/v1/selfsubjectaccessreviews', (body: unknown) => {
          return parseSsarResourceAttributes(body)?.group === 'app.k8s.io'
        })
        .reply(200, { status: { allowed: true } })
      nock(apiUrl())
        .post('/apis/authorization.k8s.io/v1/selfsubjectaccessreviews', (body: unknown) => {
          return parseSsarResourceAttributes(body)?.group === 'argoproj.io'
        })
        .reply(200, { status: { allowed: false } })

      expect(await canAccess(appK8s, 'get', 'group-collision-token')).toBe(true)
      expect(await canAccess(argoApp, 'get', 'group-collision-token')).toBe(false)
    })
  })

  describe('namespaced vs cluster-scoped kind routing (ACM-39327)', () => {
    const placement = (namespace: string, name: string) => ({
      kind: 'Placement',
      apiVersion: 'cluster.open-cluster-management.io/v1beta1',
      metadata: { namespace, name },
    })
    const clusterExtension = (name: string) => ({
      kind: 'ClusterExtension',
      apiVersion: 'olm.operatorframework.io/v1',
      metadata: { name },
    })
    const placementAllowAll = {
      incomplete: false,
      resourceRules: [
        {
          verbs: ['get', 'list', 'watch'],
          apiGroups: ['cluster.open-cluster-management.io'],
          resources: ['placements'],
        },
      ],
    }

    it('must not treat Placement allow-all in default as access to other namespaces', async () => {
      nock(apiUrl())
        .post('/apis/authorization.k8s.io/v1/selfsubjectrulesreviews', (body: unknown) => {
          return rulesReviewNamespace(body) === 'default'
        })
        .reply(200, { status: placementAllowAll })
      nock(apiUrl())
        .post('/apis/authorization.k8s.io/v1/selfsubjectrulesreviews', (body: unknown) => {
          return rulesReviewNamespace(body) === 'other-ns'
        })
        .reply(200, { status: emptyRules })

      expect(await canGetResource(placement('default', 'p-default'), 'placement-token')).toBe(true)
      expect(await canGetResource(placement('other-ns', 'p-other'), 'placement-token')).toBe(false)
    })

    it('should confirm ClusterExtension cluster-scoped grants with SSAR', async () => {
      nockRulesReview(() => ({
        incomplete: false,
        resourceRules: [
          {
            verbs: ['get', 'list', 'watch'],
            apiGroups: ['olm.operatorframework.io'],
            resources: ['clusterextensions'],
          },
        ],
      }))
      const ssarScope = nockSsarGet(
        (attrs) => attrs.group === 'olm.operatorframework.io' && attrs.resource === 'clusterextensions',
        true
      )

      expect(await canGetResource(clusterExtension('ext-1'), 'cluster-extension-token')).toBe(true)
      expect(ssarScope.isDone()).toBe(true)
    })

    it('should retry SelfSubjectRulesReview after an unavailable review', async () => {
      nock(apiUrl())
        .post('/apis/authorization.k8s.io/v1/selfsubjectrulesreviews')
        .reply(500, { message: 'internal error' })
      nock(apiUrl())
        .post('/apis/authorization.k8s.io/v1/selfsubjectaccessreviews')
        .reply(200, { status: { allowed: false } })

      expect(await canGetResource(managedCluster('cluster-1'), 'ssrr-retry-token')).toBe(false)

      nock(apiUrl()).post('/apis/authorization.k8s.io/v1/selfsubjectrulesreviews').reply(200, { status: emptyRules })
      const ssarScope = nock(apiUrl())
        .post('/apis/authorization.k8s.io/v1/selfsubjectaccessreviews')
        .reply(200, { status: { allowed: true } })

      expect(await canGetResource(managedCluster('cluster-2'), 'ssrr-retry-token')).toBe(false)
      expect(ssarScope.isDone()).toBe(false)
    })
  })
})
