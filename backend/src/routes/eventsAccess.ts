/* Copyright Contributors to the Open Cluster Management project */
import pluralize from 'pluralize'
import { jsonPost } from '../lib/json-request'
import { logger } from '../lib/logger'
import {
  deleteTimedCacheEntry,
  getKindGetAccessCacheStore,
  getSubjectRulesCacheStore,
  getSsarCacheEntry,
  getTimedCacheEntry,
  hashAccessToken,
  replaceSsarCachePromise,
  setSsarCacheEntry,
  setTimedCacheEntry,
} from './eventsCache'

export interface SubjectRulesStatus {
  incomplete: boolean
  /** True when the SelfSubjectRulesReview request itself failed. */
  unavailable?: boolean
  /** Set when an authorizer could not fully enumerate rules; partial lists must not be trusted as complete. */
  evaluationError?: string
  resourceRules: Array<{
    verbs?: string[]
    apiGroups?: string[]
    resources?: string[]
    resourceNames?: string[]
  }>
}

export type KindGetAccess =
  | { type: 'deny-all' }
  | { type: 'allow-all' }
  | { type: 'allow-names'; names: Set<string> }
  | { type: 'incomplete' }

export type AccessResource = { kind: string; apiVersion: string; metadata?: { name?: string; namespace?: string } }

/** SSRR requires a namespace; cluster-scoped kinds are reviewed in this probe namespace only. */
const CLUSTER_SCOPED_RULES_NAMESPACE = 'default'

/**
 * Kinds watched by the console that are cluster-scoped in Kubernetes (not inferred from metadata.namespace).
 * Keep aligned with cluster-scoped entries in backend/src/routes/events.ts definitions.
 */
const CLUSTER_SCOPED_KINDS = new Set([
  'AgentServiceConfig',
  'CertificateSigningRequest',
  'ClusterCurator',
  'ClusterImageSet',
  'ClusterManagementAddOn',
  'ClusterVersion',
  'DiscoveredCluster',
  'DiscoveryConfig',
  'Infrastructure',
  'ManagedCluster',
  'ManagedClusterSet',
  'ManagedClusterSetBinding',
  'MultiClusterEngine',
  'Namespace',
  'Placement',
  'PlacementDecision',
  'Search',
  'StorageClass',
])

function isClusterScopedKind(kind: string): boolean {
  return CLUSTER_SCOPED_KINDS.has(kind)
}

const subjectRulesCache = getSubjectRulesCacheStore()
const kindGetAccessCache = getKindGetAccessCacheStore()

export function canListClusterScopedKind(resource: AccessResource, token: string): Promise<boolean> {
  return canAccess({ kind: resource.kind, apiVersion: resource.apiVersion }, 'list', token)
}

export function canListNamespacedScopedKind(resource: AccessResource, token: string): Promise<boolean> {
  if (!resource.metadata?.namespace) return Promise.resolve(false)
  return canAccess(
    {
      kind: resource.kind,
      apiVersion: resource.apiVersion,
      metadata: { namespace: resource.metadata.namespace },
    },
    'list',
    token
  )
}

function apiGroupFromVersion(apiVersion: string): string {
  return apiVersion.includes('/') ? apiVersion.split('/')[0] : ''
}

function resourcePluralName(kind: string): string {
  return pluralize(kind.toLowerCase())
}

function rulesNamespaceFor(resource: AccessResource): string {
  if (isClusterScopedKind(resource.kind)) {
    return CLUSTER_SCOPED_RULES_NAMESPACE
  }
  return resource.metadata?.namespace || CLUSTER_SCOPED_RULES_NAMESPACE
}

/**
 * Used by SSE eventFilter after cluster-scoped list is denied.
 * Namespaced resources are reviewed in the resource's namespace (cached per token+namespace).
 * Cluster-scoped resources use a probe-namespace review only as a negative/named-binding cache;
 * unrestricted grants from that probe are confirmed with SSAR so RoleBindings in `default`
 * cannot impersonate cluster-scoped access.
 */
export function canGetResource(resource: AccessResource, token: string): Promise<boolean> {
  return resolveKindGetAccess(resource, token).then((access) => {
    // Probe-namespace SSRR cannot distinguish RoleBindings from ClusterRoleBindings.
    // Any non-deny cluster-scoped result must be confirmed with SSAR (not only allow-all/allow-names).
    if (isClusterScopedKind(resource.kind) && access.type !== 'deny-all') {
      return canAccess(resource, 'get', token)
    }
    return applyKindGetAccess(access, resource, token, () =>
      canListNamespacedScopedKind(resource, token).then((nsAllowed) => {
        if (nsAllowed) return true
        return canAccess(resource, 'get', token)
      })
    )
  })
}

function applyKindGetAccess(
  access: KindGetAccess,
  resource: AccessResource,
  token: string,
  onIncomplete?: () => Promise<boolean>
): Promise<boolean> {
  switch (access.type) {
    case 'deny-all':
      return Promise.resolve(false)
    case 'allow-all':
      return Promise.resolve(true)
    case 'allow-names':
      return Promise.resolve(resource.metadata?.name ? access.names.has(resource.metadata.name) : false)
    case 'incomplete':
      return onIncomplete ? onIncomplete() : canAccess(resource, 'get', token)
  }
}

/**
 * One SelfSubjectRulesReview per token+namespace.
 * ClusterRoleBindings appear in every namespace; RoleBindings appear only in their namespace.
 */
function getSubjectRules(token: string, namespace: string): Promise<SubjectRulesStatus> {
  const cacheKey = `${hashAccessToken(token)}:${namespace}`
  const existing = getTimedCacheEntry<SubjectRulesStatus>(cacheKey, subjectRulesCache)
  if (existing) {
    return existing.promise
  }

  const promise = jsonPost<{
    status?: {
      incomplete?: boolean
      evaluationError?: string
      resourceRules?: SubjectRulesStatus['resourceRules']
    }
  }>(
    process.env.CLUSTER_API_URL + '/apis/authorization.k8s.io/v1/selfsubjectrulesreviews',
    {
      apiVersion: 'authorization.k8s.io/v1',
      kind: 'SelfSubjectRulesReview',
      metadata: {},
      spec: { namespace },
    },
    token
  )
    .then((result) => {
      // jsonPost resolves on HTTP errors; treat non-2xx as review unavailable (SSAR fallback).
      if (result.statusCode < 200 || result.statusCode >= 300) {
        throw new Error(`SelfSubjectRulesReview failed with status ${result.statusCode}`)
      }
      return {
        incomplete: result.body?.status?.incomplete ?? false,
        evaluationError: result.body?.status?.evaluationError,
        resourceRules: result.body?.status?.resourceRules ?? [],
      }
    })
    .catch((err: unknown) => {
      logger.warn({ msg: 'SelfSubjectRulesReview failed; falling back to per-object SSAR', error: err })
      // Do not retain a failed review under ACCESS_CACHE_TTL; next call should retry SSRR.
      deleteTimedCacheEntry(cacheKey, subjectRulesCache)
      return {
        incomplete: true,
        unavailable: true,
        resourceRules: [] as SubjectRulesStatus['resourceRules'],
      }
    })

  setTimedCacheEntry(cacheKey, subjectRulesCache, { time: Date.now(), promise })
  return promise
}

function ruleGrantsKindAccess(
  rule: SubjectRulesStatus['resourceRules'][number],
  group: string,
  resourcePlural: string,
  accessVerbs: Set<string>
): { allowAll: true } | { names: string[] } | null {
  const verbs = rule.verbs ?? []
  if (!verbs.includes('*') && !verbs.some((verb) => accessVerbs.has(verb))) return null

  const groups = rule.apiGroups ?? []
  if (!groups.includes('*') && !groups.includes(group)) return null

  const resources = rule.resources ?? []
  if (!resources.includes('*') && !resources.includes(resourcePlural)) return null

  const resourceNames = rule.resourceNames
  if (!resourceNames || resourceNames.length === 0 || resourceNames.includes('*')) {
    return { allowAll: true }
  }
  return { names: resourceNames }
}

function evaluateKindGetAccess(rules: SubjectRulesStatus, group: string, resourcePlural: string): KindGetAccess {
  const accessVerbs = new Set(['get', 'list', 'watch'])

  // Authorizer reported partial rule enumeration; empty rules still deny-all (none-user fast path).
  if (rules.evaluationError) {
    if (rules.resourceRules.length === 0) return { type: 'deny-all' }
    return { type: 'incomplete' }
  }

  let allowAll = false
  const names = new Set<string>()

  for (const rule of rules.resourceRules) {
    const match = ruleGrantsKindAccess(rule, group, resourcePlural, accessVerbs)
    if (!match) continue
    if ('allowAll' in match) {
      allowAll = true
      break
    }
    for (const name of match.names) names.add(name)
  }

  if (allowAll) return { type: 'allow-all' }
  if (names.size > 0) return { type: 'allow-names', names }
  // The review request failed; defer to the per-object SSAR fallback.
  if (rules.unavailable === true) return { type: 'incomplete' }
  // OpenShift often sets incomplete=true even when the user has no bindings and resourceRules
  // is empty. Treat empty rules as deny-all so we do not fall back to O(N) namespaced SSARs.
  if (rules.resourceRules.length === 0) return { type: 'deny-all' }
  // Non-empty but incomplete: authorizer may have omitted grants for this kind — fall back.
  if (rules.incomplete) return { type: 'incomplete' }
  return { type: 'deny-all' }
}

function resolveKindGetAccess(resource: AccessResource, token: string): Promise<KindGetAccess> {
  const group = apiGroupFromVersion(resource.apiVersion)
  const plural = resourcePluralName(resource.kind)
  const namespace = rulesNamespaceFor(resource)
  // Permission checks are by API group, not version; keep cache keys version-free.
  const cacheKey = `${hashAccessToken(token)}:${namespace}:${group}:${plural}`
  const existing = getTimedCacheEntry<KindGetAccess>(cacheKey, kindGetAccessCache)
  if (existing) {
    return existing.promise
  }

  const promise = getSubjectRules(token, namespace).then((rules) => evaluateKindGetAccess(rules, group, plural))
  setTimedCacheEntry(cacheKey, kindGetAccessCache, { time: Date.now(), promise })
  return promise
}

export function canAccess(resource: AccessResource, verb: 'get' | 'list' | 'create', token: string): Promise<boolean> {
  // Cache is cleaned up periodically by cleanupAccessCache() to prevent unbounded memory growth
  const tokenKey = hashAccessToken(token)
  const key = `${verb}:${resource.kind}:${resource.metadata?.namespace}:${resource.metadata?.name}`
  const existing = getSsarCacheEntry(tokenKey, key)
  if (existing) {
    return existing.promise
  }

  const resourceName = resourcePluralName(resource.kind)
  const promise = jsonPost<{ status: { allowed: boolean } }>(
    process.env.CLUSTER_API_URL + '/apis/authorization.k8s.io/v1/selfsubjectaccessreviews',
    {
      apiVersion: 'authorization.k8s.io/v1',
      kind: 'SelfSubjectAccessReview',
      metadata: {},
      spec: {
        resourceAttributes: {
          group: apiGroupFromVersion(resource.apiVersion),
          name: resource.metadata?.name,
          namespace:
            resource.metadata?.namespace ?? (resource.kind === 'Namespace' ? resource.metadata?.name : undefined),
          resource: resourceName,
          verb,
        },
      },
    },
    token
  ).then((result) => {
    const allowed = result.body.status.allowed
    if (process.env.LOG_ACCESS === 'true') {
      logger.debug({
        msg: 'access',
        allowed,
        verb,
        resource: resourceName,
        name: resource.metadata?.name,
        namespace: resource.metadata?.namespace,
      })
    }
    // Replace in-flight promise with a settled boolean promise to drop large closures.
    replaceSsarCachePromise(tokenKey, key, promise, allowed)
    return allowed
  })

  setSsarCacheEntry(tokenKey, key, {
    time: Date.now(),
    promise,
  })
  return promise
}
