/* Copyright Contributors to the Open Cluster Management project */
import nock from 'nock'
import {
  canAccess,
  canGetResource,
  resetAccessCache,
  getAccessCache,
  cleanupAccessCache,
  hashAccessToken,
  ACCESS_CACHE_TTL,
  ACCESS_CACHE_MAX_TOKENS,
  ACCESS_CACHE_MAX_ENTRIES_PER_TOKEN,
} from '../../src/routes/events'

describe('events Route RBAC (ACM-39327)', () => {
  describe('Access Cache Cleanup', () => {
    beforeEach(() => {
      resetAccessCache()
      process.env.CLUSTER_API_URL = 'https://api.test-cluster.com:6443'
    })

    afterEach(() => {
      resetAccessCache()
      delete process.env.CLUSTER_API_URL
      nock.cleanAll()
    })

    it('should cache RBAC access check results under hashed token keys', async () => {
      const mockToken = 'test-token-123'
      const resource = { kind: 'Pod', apiVersion: 'v1', metadata: { namespace: 'default', name: 'test-pod' } }

      nock(process.env.CLUSTER_API_URL || '')
        .post('/apis/authorization.k8s.io/v1/selfsubjectaccessreviews')
        .reply(200, { status: { allowed: true } })

      const result1 = await canAccess(resource, 'get', mockToken)
      const result2 = await canAccess(resource, 'get', mockToken)

      expect(result1).toBe(true)
      expect(result1).toBe(result2)
      expect(getAccessCache()[mockToken]).toBeUndefined()
      expect(getAccessCache()[hashAccessToken(mockToken)]['get:Pod:default:test-pod']).toBeDefined()
    })

    it('should use distinct cache keys per verb', async () => {
      const mockToken = 'test-token-verb'
      const resource = { kind: 'Pod', apiVersion: 'v1', metadata: { namespace: 'default', name: 'test-pod' } }

      nock(process.env.CLUSTER_API_URL || '')
        .post('/apis/authorization.k8s.io/v1/selfsubjectaccessreviews')
        .reply(200, { status: { allowed: true } })
      nock(process.env.CLUSTER_API_URL || '')
        .post('/apis/authorization.k8s.io/v1/selfsubjectaccessreviews')
        .reply(200, { status: { allowed: false } })

      expect(await canAccess(resource, 'get', mockToken)).toBe(true)
      expect(await canAccess(resource, 'list', mockToken)).toBe(false)

      const tokenCache = getAccessCache()[hashAccessToken(mockToken)]
      expect(tokenCache['get:Pod:default:test-pod']).toBeDefined()
      expect(tokenCache['list:Pod:default:test-pod']).toBeDefined()
    })

    it('should respect TTL and refetch after expiry', async () => {
      const cache = getAccessCache()
      const mockToken = 'test-token-ttl'
      const tokenKey = hashAccessToken(mockToken)

      cache[tokenKey] = {
        'get:Secret:default:credentials': {
          time: Date.now() - ACCESS_CACHE_TTL - 1000,
          promise: Promise.resolve(true),
        },
      }

      nock(process.env.CLUSTER_API_URL || '')
        .post('/apis/authorization.k8s.io/v1/selfsubjectaccessreviews')
        .reply(200, { status: { allowed: false } })

      const result = await canAccess(
        { kind: 'Secret', apiVersion: 'v1', metadata: { namespace: 'default', name: 'credentials' } },
        'get',
        mockToken
      )
      expect(result).toBe(false)
    })

    it('should remove stale cache entries during cleanup', () => {
      const cache = getAccessCache()
      const now = Date.now()

      cache['token1'] = {
        stale: { time: now - ACCESS_CACHE_TTL - 1000, promise: Promise.resolve(true) },
        fresh: { time: now - 30000, promise: Promise.resolve(true) },
      }
      cache['token2'] = { 'stale-only': { time: now - ACCESS_CACHE_TTL - 5000, promise: Promise.resolve(false) } }

      cleanupAccessCache()

      expect(cache['token1']['stale']).toBeUndefined()
      expect(cache['token1']['fresh']).toBeDefined()
      expect(cache['token2']).toBeUndefined()
    })

    it('should enforce maximum token limit with LRU eviction', () => {
      const cache = getAccessCache()
      const now = Date.now()
      const tokenCount = ACCESS_CACHE_MAX_TOKENS + 100

      for (let i = 0; i < tokenCount; i++) {
        cache[`token-${i}`] = {
          'Pod:default:test': { time: now - (i / tokenCount) * 50 * 1000, promise: Promise.resolve(true) },
        }
      }

      cleanupAccessCache()

      expect(Object.keys(cache).length).toBe(ACCESS_CACHE_MAX_TOKENS)
      expect(cache['token-0']).toBeDefined()
      expect(cache[`token-${tokenCount - 1}`]).toBeUndefined()
    })

    it('should enforce maximum entries per token', () => {
      const cache = getAccessCache()
      const tokenKey = hashAccessToken('test-token-entry-cap')
      const now = Date.now()
      cache[tokenKey] = {}

      for (let i = 0; i < ACCESS_CACHE_MAX_ENTRIES_PER_TOKEN + 50; i++) {
        cache[tokenKey][`get:Pod:default:pod-${i}`] = {
          time: now - i,
          promise: Promise.resolve(false),
        }
      }

      cleanupAccessCache()

      expect(Object.keys(cache[tokenKey]).length).toBeLessThanOrEqual(ACCESS_CACHE_MAX_ENTRIES_PER_TOKEN)
    })
  })

  /**
   * ACM-39327: restricted users must not trigger O(N) SelfSubjectAccessReviews when the SSE
   * filter falls through after cluster-scoped list is denied. SelfSubjectRulesReview is
   * namespaced: cache one review per token+namespace, never treat `default` as global allow.
   */
  describe('SelfSubjectRulesReview short-circuit (ACM-39327)', () => {
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

    beforeEach(() => {
      resetAccessCache()
      process.env.CLUSTER_API_URL = 'https://api.test-cluster.com:6443'
    })

    afterEach(() => {
      resetAccessCache()
      delete process.env.CLUSTER_API_URL
      nock.cleanAll()
    })

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

    it('should allow only named cluster-scoped resources from resourceNames rules', async () => {
      nockRulesReview(() => ({
        incomplete: false,
        resourceRules: [
          {
            verbs: ['get'],
            apiGroups: ['cluster.open-cluster-management.io'],
            resources: ['managedclusters'],
            resourceNames: ['allowed-cluster'],
          },
        ],
      }))

      expect(await canGetResource(managedCluster('allowed-cluster'), 'partial-user-token')).toBe(true)
      expect(await canGetResource(managedCluster('other-cluster'), 'partial-user-token')).toBe(false)
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
  })
})
