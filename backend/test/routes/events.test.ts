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
   * filter falls through after cluster-scoped list is denied. One SelfSubjectRulesReview per
   * token/kind short-circuits deny-all / allow-names without per-object or per-namespace SSARs.
   */
  describe('SelfSubjectRulesReview short-circuit (ACM-39327)', () => {
    const managedCluster = (name: string) => ({
      kind: 'ManagedCluster',
      apiVersion: 'cluster.open-cluster-management.io/v1',
      metadata: { name },
    })

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
      nock(process.env.CLUSTER_API_URL || '')
        .post('/apis/authorization.k8s.io/v1/selfsubjectrulesreviews')
        .reply(200, { status: { incomplete: false, resourceRules: [] } })

      const ssarScope = nock(process.env.CLUSTER_API_URL || '')
        .post('/apis/authorization.k8s.io/v1/selfsubjectaccessreviews')
        .reply(200, { status: { allowed: true } })

      expect(await canGetResource(managedCluster('cluster-1'), 'none-user-token')).toBe(false)
      expect(ssarScope.isDone()).toBe(false)
    })

    it('should use a single rules review for many gets of the same kind', async () => {
      let rulesCalls = 0
      nock(process.env.CLUSTER_API_URL || '')
        .post('/apis/authorization.k8s.io/v1/selfsubjectrulesreviews')
        .reply(200, () => {
          rulesCalls++
          return { status: { incomplete: false, resourceRules: [] } }
        })

      const ssarScope = nock(process.env.CLUSTER_API_URL || '')
        .post('/apis/authorization.k8s.io/v1/selfsubjectaccessreviews')
        .times(1)
        .reply(200, { status: { allowed: true } })

      const results = await Promise.all(
        Array.from({ length: 500 }, (_, i) => canGetResource(managedCluster(`cluster-${i}`), 'scale-none-token'))
      )

      expect(results.every((allowed) => allowed === false)).toBe(true)
      expect(rulesCalls).toBe(1)
      // Regression guard: must not fall back to per-object SSAR for deny-all.
      expect(ssarScope.isDone()).toBe(false)
    })

    it('should use a single rules review across many namespaces of the same kind', async () => {
      let rulesCalls = 0
      nock(process.env.CLUSTER_API_URL || '')
        .post('/apis/authorization.k8s.io/v1/selfsubjectrulesreviews')
        .reply(200, () => {
          rulesCalls++
          return { status: { incomplete: true, resourceRules: [] } }
        })

      const results = await Promise.all(
        Array.from({ length: 200 }, (_, i) =>
          canGetResource(
            {
              kind: 'ManagedClusterInfo',
              apiVersion: 'internal.open-cluster-management.io/v1beta1',
              metadata: { name: `cluster-${i}`, namespace: `cluster-${i}` },
            },
            'namespaced-none-token'
          )
        )
      )

      expect(results.every((allowed) => allowed === false)).toBe(true)
      expect(rulesCalls).toBe(1)
    })

    it('should allow only named resources from resourceNames rules', async () => {
      nock(process.env.CLUSTER_API_URL || '')
        .post('/apis/authorization.k8s.io/v1/selfsubjectrulesreviews')
        .reply(200, {
          status: {
            incomplete: false,
            resourceRules: [
              {
                verbs: ['get'],
                apiGroups: ['cluster.open-cluster-management.io'],
                resources: ['managedclusters'],
                resourceNames: ['allowed-cluster'],
              },
            ],
          },
        })

      expect(await canGetResource(managedCluster('allowed-cluster'), 'partial-user-token')).toBe(true)
      expect(await canGetResource(managedCluster('other-cluster'), 'partial-user-token')).toBe(false)
    })

    it('should allow all resources when rules grant unrestricted get/list/watch', async () => {
      nock(process.env.CLUSTER_API_URL || '')
        .post('/apis/authorization.k8s.io/v1/selfsubjectrulesreviews')
        .reply(200, {
          status: {
            incomplete: false,
            resourceRules: [
              {
                verbs: ['get', 'list', 'watch'],
                apiGroups: ['cluster.open-cluster-management.io'],
                resources: ['managedclusters'],
              },
            ],
          },
        })

      const ssarScope = nock(process.env.CLUSTER_API_URL || '')
        .post('/apis/authorization.k8s.io/v1/selfsubjectaccessreviews')
        .reply(200, { status: { allowed: false } })

      expect(await canGetResource(managedCluster('any-cluster'), 'viewer-token')).toBe(true)
      expect(ssarScope.isDone()).toBe(false)
    })

    it('should fall back to SSAR when rules review is incomplete with non-empty rules', async () => {
      nock(process.env.CLUSTER_API_URL || '')
        .post('/apis/authorization.k8s.io/v1/selfsubjectrulesreviews')
        .reply(200, {
          status: {
            incomplete: true,
            resourceRules: [
              {
                verbs: ['get'],
                apiGroups: [''],
                resources: ['pods'],
              },
            ],
          },
        })
      const ssarScope = nock(process.env.CLUSTER_API_URL || '')
        .post('/apis/authorization.k8s.io/v1/selfsubjectaccessreviews')
        .reply(200, { status: { allowed: true } })

      expect(await canGetResource(managedCluster('cluster-1'), 'incomplete-user-token')).toBe(true)
      expect(ssarScope.isDone()).toBe(true)
    })

    it('should deny-all when rules are empty even if incomplete is true (OpenShift none user)', async () => {
      nock(process.env.CLUSTER_API_URL || '')
        .post('/apis/authorization.k8s.io/v1/selfsubjectrulesreviews')
        .reply(200, { status: { incomplete: true, resourceRules: [] } })

      const ssarScope = nock(process.env.CLUSTER_API_URL || '')
        .post('/apis/authorization.k8s.io/v1/selfsubjectaccessreviews')
        .reply(200, { status: { allowed: true } })

      expect(await canGetResource(managedCluster('cluster-1'), 'openshift-none-token')).toBe(false)
      expect(ssarScope.isDone()).toBe(false)
    })

    it('should fall back to SSAR when SelfSubjectRulesReview request fails', async () => {
      nock(process.env.CLUSTER_API_URL || '')
        .post('/apis/authorization.k8s.io/v1/selfsubjectrulesreviews')
        .reply(500, { message: 'internal error' })

      const ssarScope = nock(process.env.CLUSTER_API_URL || '')
        .post('/apis/authorization.k8s.io/v1/selfsubjectaccessreviews')
        .reply(200, { status: { allowed: true } })

      expect(await canGetResource(managedCluster('cluster-1'), 'ssrr-fail-token')).toBe(true)
      expect(ssarScope.isDone()).toBe(true)
    })
  })
})
