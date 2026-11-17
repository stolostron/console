/* Copyright Contributors to the Open Cluster Management project */

import type { Policy, PolicyDependency, PolicySet } from '~/resources'
import type { SearchInput } from '../../Search/search-sdk/search-sdk'

const policyGroup = 'policy.open-cluster-management.io'
const policyVersion = 'v1'
const policySetVersion = 'v1beta1'
const searchableKinds = new Set(['ConfigurationPolicy', 'CertificatePolicy', 'OperatorPolicy'])
const maxSearchQueries = 50
const maxNamesPerQuery = 100

export interface DependencySummary {
  total: number
  met: number
  notMet: number
  unknown: number
  invalid: number
  notEvaluated: boolean
  unavailable: boolean
}

interface Requirement {
  key: string
  resourceKey: string
  group: string
  version: string
  kind: string
  name: string
  namespace: string
  required: PolicyDependency['compliance']
  invalid: boolean
  unresolved: boolean
}

interface Observation {
  type: 'policy' | 'search' | 'unknown'
  key?: string
  required: PolicyDependency['compliance']
}

interface Condition {
  invalid: boolean
  observations: Observation[]
}

interface PolicyPlan {
  conditions: Map<string, Condition>
  notEvaluated: boolean
  unavailable: boolean
}

export interface DependencySummaryPlan {
  policies: Map<string, PolicyPlan>
  searchQueries: SearchInput[]
  searchTargets: Map<string, number>
}

export interface SearchObservation {
  apigroup?: string
  apiversion?: string
  kind?: string
  cluster?: string
  namespace?: string
  name?: string
  compliant?: string
}

export function policyKey(policy: Policy): string {
  return `${policy.metadata.namespace ?? ''}/${policy.metadata.name ?? ''}`
}

function groupVersion(apiVersion: string): { group: string; version: string } {
  const slash = apiVersion.indexOf('/')
  return slash < 0
    ? { group: '', version: apiVersion }
    : { group: apiVersion.slice(0, slash), version: apiVersion.slice(slash + 1) }
}

function normalizedRequirements(
  policy: Policy,
  policySets: Map<string, PolicySet>
): { requirements: Requirement[]; unresolved: boolean } {
  const sourceNamespace = policy.metadata.namespace ?? ''
  const root = policy.spec.dependencies ?? []
  const templates = policy.spec['policy-templates'] ?? []
  const scopes: Pick<(typeof templates)[number], 'extraDependencies'>[] = templates.length ? templates : [{}]
  const requirements: Requirement[] = []
  let unresolved = false

  for (const template of scopes) {
    const dependencies = [...root, ...(template.extraDependencies ?? [])]
    const seen = new Map<string, PolicyDependency['compliance']>()
    const conflicts = new Set<string>()
    const start = requirements.length
    for (const dependency of dependencies) {
      const { group, version } = groupVersion(dependency.apiVersion ?? '')
      let expanded = [dependency]
      if (group === policyGroup && version === policySetVersion && dependency.kind === 'PolicySet') {
        const namespace = dependency.namespace || sourceNamespace
        const set = policySets.get(`${namespace}/${dependency.name}`)
        if (set) {
          expanded = set.spec.policies.map((name) => ({
            apiVersion: `${policyGroup}/${policyVersion}`,
            kind: 'Policy',
            name: `${namespace}.${name}`,
            compliance: dependency.compliance,
          }))
        } else {
          unresolved = true
        }
      }

      for (const item of expanded) {
        const gv = groupVersion(item.apiVersion ?? '')
        const isPolicy = gv.group === policyGroup && item.kind === 'Policy'
        const name = isPolicy
          ? item.namespace
            ? `${item.namespace}.${item.name}`
            : item.name.includes('.')
              ? item.name
              : `${sourceNamespace}.${item.name}`
          : item.name
        // ACM policy kinds are evaluated in the target cluster namespace, regardless of the authored namespace.
        const namespace = gv.group === policyGroup && item.kind.endsWith('Policy') ? '' : (item.namespace ?? '')
        const resourceKey = JSON.stringify([gv.group, gv.version, item.kind, namespace, name])
        const conflict = seen.has(resourceKey) && seen.get(resourceKey) !== item.compliance
        if (conflict) conflicts.add(resourceKey)
        seen.set(resourceKey, item.compliance)
        requirements.push({
          key: JSON.stringify([resourceKey, item.compliance]),
          resourceKey,
          group: gv.group,
          version: gv.version,
          kind: item.kind,
          name,
          namespace,
          required: item.compliance,
          invalid: !gv.version || !item.kind || !name || !item.compliance,
          unresolved: item.kind === 'PolicySet',
        })
      }
    }
    for (let index = start; index < requirements.length; index++) {
      const requirement = requirements[index]
      requirement.invalid ||= conflicts.has(requirement.resourceKey)
    }
  }

  return { requirements, unresolved }
}

function selectedClusters(policy: Policy): string[] | undefined {
  if (!policy.status) return undefined
  const clusters = new Set<string>()
  for (const placement of policy.status.placement ?? []) {
    for (const decision of placement.decisions ?? []) {
      if (decision.clusterName && !placement.exclusions?.some((item) => item.clusterName === decision.clusterName)) {
        clusters.add(decision.clusterName)
      }
    }
  }
  if (policy.status.placement?.some((placement) => placement.decisions?.length)) return [...clusters]
  for (const status of policy.status.status ?? []) if (status.clustername) clusters.add(status.clustername)
  return [...clusters]
}

function searchKey(group: string, version: string, kind: string, cluster: string, namespace: string, name: string) {
  return JSON.stringify([group, version, kind, cluster, namespace, name])
}

export function buildDependencySummaryPlan(
  sourcePolicies: Policy[],
  allPolicies: Policy[],
  policySets: PolicySet[],
  hostedClusters: Map<string, { cluster: string; namespace: string }>
): DependencySummaryPlan {
  const sets = new Map(policySets.map((set) => [`${set.metadata.namespace}/${set.metadata.name}`, set]))
  const replicas = new Map<string, Policy>()
  for (const policy of allPolicies) {
    const cluster = policy.metadata.labels?.['policy.open-cluster-management.io/cluster-name']
    if (cluster) replicas.set(`${cluster}/${policy.metadata.name}`, policy)
  }

  const plans = new Map<string, PolicyPlan>()
  const searchTargets = new Map<string, number>()
  const groups = new Map<
    string,
    { group: string; version: string; kind: string; cluster: string; namespace: string; names: Set<string> }
  >()

  for (const policy of sourcePolicies) {
    const declarations = [
      ...(policy.spec.dependencies ?? []),
      ...(policy.spec['policy-templates'] ?? []).flatMap((t) => t.extraDependencies ?? []),
    ]
    const plan: PolicyPlan = { conditions: new Map(), notEvaluated: false, unavailable: false }
    plans.set(policyKey(policy), plan)
    if (declarations.length === 0) continue

    const clusters = selectedClusters(policy)
    const noEvaluation = policy.spec.disabled || clusters?.length === 0 || policy.spec['policy-templates']?.length === 0
    plan.notEvaluated = Boolean(noEvaluation)
    const clusterNames = noEvaluation || !clusters ? [''] : clusters
    const authored = normalizedRequirements(policy, sets)
    const authoredKeys = new Set(authored.requirements.map((req) => req.key))

    for (const cluster of clusterNames) {
      const replica = cluster
        ? replicas.get(`${cluster}/${policy.metadata.namespace}.${policy.metadata.name}`)
        : undefined
      const propagated = replica ? normalizedRequirements(replica, sets) : undefined
      const propagatedKeys = new Set(propagated?.requirements.map((req) => req.key) ?? [])
      const replicaCurrent = Boolean(
        propagated &&
        !authored.unresolved &&
        authoredKeys.size === propagatedKeys.size &&
        [...authoredKeys].every((key) => propagatedKeys.has(key))
      )
      const effective = replicaCurrent ? propagated! : authored
      plan.unavailable ||= effective.unresolved
      for (const req of effective.requirements) {
        let condition = plan.conditions.get(req.key)
        if (!condition) {
          condition = { invalid: req.invalid, observations: [] }
          plan.conditions.set(req.key, condition)
        }
        condition.invalid ||= req.invalid
        if (noEvaluation) continue
        if (!cluster || !replicaCurrent || req.unresolved || req.invalid) {
          condition.observations.push({ type: 'unknown', required: req.required })
          continue
        }
        if (req.group === policyGroup && req.version === policyVersion && req.kind === 'Policy') {
          const observed = replicas.get(`${cluster}/${req.name}`)
          condition.observations.push({
            type: observed ? 'policy' : 'unknown',
            key: observed?.status?.compliant,
            required: req.required,
          })
          continue
        }
        if (req.group !== policyGroup || !searchableKinds.has(req.kind)) {
          condition.observations.push({ type: 'unknown', required: req.required })
          continue
        }
        const location = hostedClusters.get(cluster) ?? { cluster, namespace: cluster }
        const target = searchKey(req.group, req.version, req.kind, location.cluster, location.namespace, req.name)
        condition.observations.push({ type: 'search', key: target, required: req.required })
        const groupKey = JSON.stringify([req.group, req.version, req.kind, location.cluster, location.namespace])
        let group = groups.get(groupKey)
        if (!group) {
          group = {
            group: req.group,
            version: req.version,
            kind: req.kind,
            cluster: location.cluster,
            namespace: location.namespace,
            names: new Set(),
          }
          groups.set(groupKey, group)
        }
        group.names.add(req.name)
      }
    }
    if (plan.conditions.size === 0) plan.unavailable = true
  }

  const searchQueries: SearchInput[] = []
  for (const group of groups.values()) {
    const names = [...group.names].sort()
    for (let start = 0; start < names.length && searchQueries.length < maxSearchQueries; start += maxNamesPerQuery) {
      const batch = names.slice(start, start + maxNamesPerQuery)
      const index = searchQueries.length
      searchQueries.push({
        filters: [
          { property: 'apigroup', values: [group.group] },
          { property: 'apiversion', values: [group.version] },
          { property: 'kind', values: [group.kind] },
          { property: 'cluster', values: [group.cluster] },
          { property: 'namespace', values: [group.namespace] },
          { property: 'name', values: batch },
        ],
        relatedKinds: ['$DO-NOT-RETURN'],
        limit: batch.length + 1,
      })
      for (const name of batch) {
        searchTargets.set(
          searchKey(group.group, group.version, group.kind, group.cluster, group.namespace, name),
          index
        )
      }
    }
  }
  return { policies: plans, searchQueries, searchTargets }
}

export function summarizeDependencyPlan(
  plan: DependencySummaryPlan,
  searchResults?: readonly (readonly SearchObservation[] | null | undefined)[]
): Map<string, DependencySummary> {
  const observations = new Map<string, string | null>()
  const incomplete = new Set<number>()
  for (const [index, query] of plan.searchQueries.entries()) {
    const items = searchResults?.[index]
    if (!items || items.length >= (query.limit ?? 0)) {
      incomplete.add(index)
      continue
    }
    for (const item of items) {
      if (!item.apigroup || !item.apiversion || !item.kind || !item.cluster || !item.name) continue
      const key = searchKey(item.apigroup, item.apiversion, item.kind, item.cluster, item.namespace ?? '', item.name)
      if (!plan.searchTargets.has(key)) continue
      observations.set(key, observations.has(key) ? null : (item.compliant ?? null))
    }
  }

  const summaries = new Map<string, DependencySummary>()
  for (const [key, policy] of plan.policies) {
    const summary: DependencySummary = {
      total: policy.conditions.size,
      met: 0,
      notMet: 0,
      unknown: 0,
      invalid: 0,
      notEvaluated: policy.notEvaluated,
      unavailable: policy.unavailable,
    }
    if (!summary.notEvaluated) {
      for (const condition of policy.conditions.values()) {
        if (condition.invalid) {
          summary.invalid++
          continue
        }
        let mismatch = false
        let unknown = condition.observations.length === 0
        for (const observation of condition.observations) {
          let actual: string | null | undefined
          if (observation.type === 'policy') actual = observation.key
          else if (
            observation.type === 'search' &&
            observation.key &&
            !incomplete.has(plan.searchTargets.get(observation.key) ?? -1)
          ) {
            actual = observations.get(observation.key)
          }
          if (actual === undefined || actual === null || actual === '') unknown = true
          else if (actual !== observation.required) mismatch = true
        }
        if (mismatch) summary.notMet++
        else if (unknown) summary.unknown++
        else summary.met++
      }
    }
    summaries.set(key, summary)
  }
  return summaries
}
