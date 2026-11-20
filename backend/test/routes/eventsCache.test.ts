/* Copyright Contributors to the Open Cluster Management project */
import { createHash } from 'node:crypto'
import nock from 'nock'
import { canAccess } from '../../src/routes/eventsAccess'
import {
  ACCESS_CACHE_MAX_ENTRIES_PER_TOKEN,
  ACCESS_CACHE_MAX_TOKENS,
  ACCESS_CACHE_TTL,
  cleanupAccessCache,
  deleteTimedCacheEntry,
  getAccessCache,
  getKindGetAccessCacheStore,
  getSsarCacheEntry,
  getSubjectRulesCacheStore,
  getTimedCacheEntry,
  hashAccessToken,
  replaceSsarCachePromise,
  resetAccessCache,
  setSsarCacheEntry,
  setTimedCacheEntry,
  startAccessCacheCleanup,
  stopAccessCacheCleanup,
} from '../../src/routes/eventsCache'

describe('eventsCache', () => {
  beforeEach(() => {
    resetAccessCache()
    process.env.CLUSTER_API_URL = 'https://api.test-cluster.com:6443'
  })

  afterEach(() => {
    resetAccessCache()
    stopAccessCacheCleanup()
    delete process.env.CLUSTER_API_URL
    nock.cleanAll()
  })

  describe('hashAccessToken', () => {
    it('should return a stable SHA-256 hex digest', () => {
      const token = 'test-token-123'
      const expected = createHash('sha256').update(token).digest('hex')
      expect(hashAccessToken(token)).toBe(expected)
      expect(hashAccessToken(token)).toBe(hashAccessToken(token))
    })
  })

  describe('SSAR cache helpers', () => {
    it('should return undefined for expired SSAR cache entries', () => {
      const tokenKey = hashAccessToken('expired-token')
      setSsarCacheEntry(tokenKey, 'get:Pod:default:pod', {
        time: Date.now() - ACCESS_CACHE_TTL - 1000,
        promise: Promise.resolve(true),
      })
      expect(getSsarCacheEntry(tokenKey, 'get:Pod:default:pod')).toBeUndefined()
    })

    it('should replace in-flight SSAR promises with settled booleans', async () => {
      const tokenKey = hashAccessToken('replace-token')
      const key = 'get:Pod:default:pod'
      const inFlight = Promise.resolve(true)
      setSsarCacheEntry(tokenKey, key, { time: Date.now(), promise: inFlight })

      replaceSsarCachePromise(tokenKey, key, inFlight, true)
      const cached = getSsarCacheEntry(tokenKey, key)
      if (!cached) throw new Error('expected SSAR cache entry')
      expect(await cached.promise).toBe(true)
    })

    it('should enforce per-token entry cap when setting SSAR cache entries', () => {
      const tokenKey = hashAccessToken('cap-token')
      const now = Date.now()
      for (let i = 0; i < ACCESS_CACHE_MAX_ENTRIES_PER_TOKEN + 50; i++) {
        setSsarCacheEntry(tokenKey, `get:Pod:default:pod-${i}`, {
          time: now - i,
          promise: Promise.resolve(false),
        })
      }
      cleanupAccessCache()
      expect(Object.keys(getAccessCache()[tokenKey]).length).toBeLessThanOrEqual(ACCESS_CACHE_MAX_ENTRIES_PER_TOKEN)
    })
  })

  describe('timed cache helpers', () => {
    it('should get, set, and delete timed cache entries with TTL', async () => {
      const store = getSubjectRulesCacheStore()
      const cacheKey = 'token:default'

      setTimedCacheEntry(cacheKey, store, { time: Date.now(), promise: Promise.resolve('rules') })
      const cached = getTimedCacheEntry<string>(cacheKey, store)
      if (!cached) throw new Error('expected timed cache entry')
      expect(await cached.promise).toBe('rules')

      setTimedCacheEntry(cacheKey, store, {
        time: Date.now() - ACCESS_CACHE_TTL - 1000,
        promise: Promise.resolve('stale'),
      })
      expect(getTimedCacheEntry<string>(cacheKey, store)).toBeUndefined()

      setTimedCacheEntry(cacheKey, store, { time: Date.now(), promise: Promise.resolve('fresh') })
      deleteTimedCacheEntry(cacheKey, store)
      expect(getTimedCacheEntry<string>(cacheKey, store)).toBeUndefined()
    })
  })

  describe('resetAccessCache', () => {
    it('should clear SSAR, subject rules, and kind-get-access stores', () => {
      const tokenKey = hashAccessToken('reset-token')
      setSsarCacheEntry(tokenKey, 'get:Pod:default:pod', { time: Date.now(), promise: Promise.resolve(true) })
      setTimedCacheEntry('rules-key', getSubjectRulesCacheStore(), {
        time: Date.now(),
        promise: Promise.resolve({ incomplete: false, resourceRules: [] }),
      })
      setTimedCacheEntry('kind-key', getKindGetAccessCacheStore(), {
        time: Date.now(),
        promise: Promise.resolve({ type: 'deny-all' }),
      })

      resetAccessCache()

      expect(getAccessCache()[tokenKey]).toBeUndefined()
      expect(Object.keys(getSubjectRulesCacheStore()).length).toBe(0)
      expect(Object.keys(getKindGetAccessCacheStore()).length).toBe(0)
    })
  })

  describe('cleanupAccessCache', () => {
    it('should remove stale SSAR entries during cleanup', () => {
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

    it('should expire timed caches during cleanup', () => {
      const subjectRules = getSubjectRulesCacheStore()
      const kindGetAccess = getKindGetAccessCacheStore()
      const staleTime = Date.now() - ACCESS_CACHE_TTL - 1000

      setTimedCacheEntry('stale-rules', subjectRules, { time: staleTime, promise: Promise.resolve('old') })
      setTimedCacheEntry('stale-kind', kindGetAccess, {
        time: staleTime,
        promise: Promise.resolve({ type: 'deny-all' }),
      })

      cleanupAccessCache()

      expect(getTimedCacheEntry('stale-rules', subjectRules)).toBeUndefined()
      expect(getTimedCacheEntry('stale-kind', kindGetAccess)).toBeUndefined()
    })
  })

  describe('startAccessCacheCleanup', () => {
    it('should start and stop periodic cleanup without error', () => {
      startAccessCacheCleanup()
      startAccessCacheCleanup()
      stopAccessCacheCleanup()
      stopAccessCacheCleanup()
    })
  })

  describe('SSAR caching via canAccess', () => {
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
      expect(getAccessCache()[hashAccessToken(mockToken)]['get::Pod:default:test-pod']).toBeDefined()
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
      expect(tokenCache['get::Pod:default:test-pod']).toBeDefined()
      expect(tokenCache['list::Pod:default:test-pod']).toBeDefined()
    })

    it('should respect TTL and refetch after expiry', async () => {
      const cache = getAccessCache()
      const mockToken = 'test-token-ttl'
      const tokenKey = hashAccessToken(mockToken)

      cache[tokenKey] = {
        'get::Secret:default:credentials': {
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
  })
})
