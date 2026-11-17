/* Copyright Contributors to the Open Cluster Management project */

import type { Policy, PolicyDependency, PolicySet } from '~/resources'
import { buildDependencySummaryPlan, policyKey, summarizeDependencyPlan } from './policyDependencySummary'

const policyVersion = 'policy.open-cluster-management.io/v1'

function dependency(kind: string, name: string, compliance: PolicyDependency['compliance']): PolicyDependency {
  return { apiVersion: policyVersion, kind, name, compliance }
}

function root(dependencies: PolicyDependency[], clusters = ['east']): Policy {
  return {
    apiVersion: policyVersion,
    kind: 'Policy',
    metadata: { name: 'parent', namespace: 'policies' },
    spec: {
      disabled: false,
      dependencies,
      'policy-templates': [
        {
          objectDefinition: { apiVersion: policyVersion, kind: 'ConfigurationPolicy', metadata: { name: 'template' } },
        },
      ],
    },
    status: { status: clusters.map((clustername) => ({ clustername, clusternamespace: clustername })) },
  }
}

function replica(source: Policy, cluster: string): Policy {
  return {
    ...source,
    metadata: {
      ...source.metadata,
      name: `${source.metadata.namespace}.${source.metadata.name}`,
      namespace: cluster,
      labels: { 'policy.open-cluster-management.io/cluster-name': cluster },
    },
    spec: {
      ...source.spec,
      dependencies: source.spec.dependencies?.map((dep) =>
        dep.kind === 'Policy' ? { ...dep, name: `policies.${dep.name}` } : dep
      ),
    },
    status: { compliant: 'Pending' },
  }
}

function policyReference(name: string, cluster: string, compliant: 'Compliant' | 'NonCompliant' | 'Pending'): Policy {
  return {
    ...replica(root([], [cluster]), cluster),
    metadata: {
      name: `policies.${name}`,
      namespace: cluster,
      labels: { 'policy.open-cluster-management.io/cluster-name': cluster },
    },
    status: { compliant },
  }
}

const noHosted = new Map<string, { cluster: string; namespace: string }>()

test('counts required NonCompliant and Pending states against observed Policy copies', () => {
  const source = root([dependency('Policy', 'a', 'NonCompliant'), dependency('Policy', 'b', 'Pending')])
  const plan = buildDependencySummaryPlan(
    [source],
    [
      source,
      replica(source, 'east'),
      policyReference('a', 'east', 'NonCompliant'),
      policyReference('b', 'east', 'Pending'),
    ],
    [],
    noHosted
  )
  expect(summarizeDependencyPlan(plan).get(policyKey(source))).toMatchObject({ total: 2, met: 2, notMet: 0 })
  expect(plan.searchQueries).toHaveLength(0)
})

test('a mismatch on one cluster wins over an unreadable result on another', () => {
  const source = root([dependency('Policy', 'a', 'Compliant')], ['east', 'west'])
  const plan = buildDependencySummaryPlan(
    [source],
    [source, replica(source, 'east'), replica(source, 'west'), policyReference('a', 'east', 'NonCompliant')],
    [],
    noHosted
  )
  expect(summarizeDependencyPlan(plan).get(policyKey(source))).toMatchObject({ total: 1, notMet: 1, unknown: 0 })
})

test('a missing reference remains unknown, and no dependencies display as empty', () => {
  const source = root([dependency('Policy', 'missing', 'Compliant')])
  const empty = root([])
  empty.metadata.name = 'empty'
  const plan = buildDependencySummaryPlan([source, empty], [source, replica(source, 'east')], [], noHosted)
  expect(summarizeDependencyPlan(plan).get(policyKey(source))).toMatchObject({ total: 1, unknown: 1, notMet: 0 })
  expect(summarizeDependencyPlan(plan).get(policyKey(empty))).toMatchObject({ total: 0, unknown: 0 })
})

test('Search observations are matched by full identity and absence is unknown', () => {
  const source = root([dependency('ConfigurationPolicy', 'config-a', 'Compliant')])
  const plan = buildDependencySummaryPlan([source], [source, replica(source, 'east')], [], noHosted)
  expect(plan.searchQueries).toHaveLength(1)
  expect(summarizeDependencyPlan(plan).get(policyKey(source))).toMatchObject({ total: 1, unknown: 1 })
  const good = {
    apigroup: 'policy.open-cluster-management.io',
    apiversion: 'v1',
    kind: 'ConfigurationPolicy',
    cluster: 'east',
    namespace: 'east',
    name: 'config-a',
    compliant: 'Compliant',
  }
  expect(summarizeDependencyPlan(plan, [[good]]).get(policyKey(source))).toMatchObject({ met: 1, unknown: 0 })
  expect(summarizeDependencyPlan(plan, [[{ ...good, namespace: 'other' }]]).get(policyKey(source))).toMatchObject({
    met: 0,
    unknown: 1,
  })
  expect(summarizeDependencyPlan(plan, [[{ ...good, compliant: 'Pending' }]]).get(policyKey(source))).toMatchObject({
    notMet: 1,
  })
})

test('PolicySet expansion counts members, while an unresolved set is unavailable', () => {
  const source = root([
    { ...dependency('PolicySet', 'bundle', 'Compliant'), apiVersion: 'policy.open-cluster-management.io/v1beta1' },
  ])
  const set: PolicySet = {
    apiVersion: 'policy.open-cluster-management.io/v1beta1',
    kind: 'PolicySet',
    metadata: { name: 'bundle', namespace: 'policies' },
    spec: { description: '', policies: ['a', 'b'] },
  }
  const plan = buildDependencySummaryPlan([source], [source], [set], noHosted)
  expect(summarizeDependencyPlan(plan).get(policyKey(source))).toMatchObject({ total: 2, unknown: 2 })
  const unresolved = buildDependencySummaryPlan([source], [source], [], noHosted)
  expect(summarizeDependencyPlan(unresolved).get(policyKey(source))).toMatchObject({ unavailable: true })
})

test('disabled and unplaced policies are not evaluated', () => {
  const disabled = root([dependency('Policy', 'a', 'Compliant')])
  disabled.spec.disabled = true
  expect(
    summarizeDependencyPlan(buildDependencySummaryPlan([disabled], [disabled], [], noHosted)).get(policyKey(disabled))
  ).toMatchObject({
    total: 1,
    notEvaluated: true,
  })
  const unplaced = root([dependency('Policy', 'a', 'Compliant')], [])
  expect(
    summarizeDependencyPlan(buildDependencySummaryPlan([unplaced], [unplaced], [], noHosted)).get(policyKey(unplaced))
  ).toMatchObject({
    total: 1,
    notEvaluated: true,
  })
})

test('hosted mapping redirects template lookup to the hosting cluster', () => {
  const source = root([dependency('OperatorPolicy', 'operator-a', 'Compliant')])
  const hosted = new Map([['east', { cluster: 'host', namespace: 'east-hosted' }]])
  const plan = buildDependencySummaryPlan([source], [source, replica(source, 'east')], [], hosted)
  const filters = plan.searchQueries[0].filters ?? []
  expect(filters).toContainEqual({ property: 'cluster', values: ['host'] })
  expect(filters).toContainEqual({ property: 'namespace', values: ['east-hosted'] })
})

test('a stale propagated declaration does not make a newly authored prerequisite look met', () => {
  const old = root([dependency('Policy', 'old', 'Compliant')])
  const current = root([dependency('Policy', 'new', 'Compliant')])
  const plan = buildDependencySummaryPlan(
    [current],
    [current, replica(old, 'east'), policyReference('old', 'east', 'Compliant')],
    [],
    noHosted
  )
  expect(summarizeDependencyPlan(plan).get(policyKey(current))).toMatchObject({ total: 1, met: 0, unknown: 1 })
})

test('an incomplete Search batch does not produce a healthy count', () => {
  const source = root([dependency('ConfigurationPolicy', 'a', 'Compliant')])
  const plan = buildDependencySummaryPlan([source], [source, replica(source, 'east')], [], noHosted)
  const observation = {
    apigroup: 'policy.open-cluster-management.io',
    apiversion: 'v1',
    kind: 'ConfigurationPolicy',
    cluster: 'east',
    namespace: 'east',
    name: 'a',
    compliant: 'Compliant',
  }
  expect(summarizeDependencyPlan(plan, [[observation, observation]]).get(policyKey(source))).toMatchObject({
    met: 0,
    unknown: 1,
  })
})

test('template extras join the root count and conflicting states are invalid', () => {
  const source = root([dependency('Policy', 'shared', 'Compliant')])
  source.spec['policy-templates']![0].extraDependencies = [
    dependency('Policy', 'shared', 'NonCompliant'),
    dependency('Policy', 'other', 'Pending'),
  ]
  const plan = buildDependencySummaryPlan([source], [source, replica(source, 'east')], [], noHosted)
  expect(summarizeDependencyPlan(plan).get(policyKey(source))).toMatchObject({ total: 3, invalid: 2, unknown: 1 })
})

test('placement exclusions remove clusters from the evaluation set', () => {
  const source = root([dependency('Policy', 'a', 'Compliant')], ['east', 'west'])
  source.status!.placement = [
    {
      placementBinding: 'binding',
      decisions: [{ clusterName: 'east' }, { clusterName: 'west' }],
      exclusions: [{ clusterName: 'west' }],
    },
  ]
  const plan = buildDependencySummaryPlan(
    [source],
    [source, replica(source, 'east'), policyReference('a', 'east', 'Compliant')],
    [],
    noHosted
  )
  expect(summarizeDependencyPlan(plan).get(policyKey(source))).toMatchObject({ total: 1, met: 1, unknown: 0 })
})

test('a Policy with no status is unknown rather than unplaced', () => {
  const source = root([dependency('Policy', 'a', 'Compliant')])
  delete source.status
  const plan = buildDependencySummaryPlan([source], [source], [], noHosted)
  expect(summarizeDependencyPlan(plan).get(policyKey(source))).toMatchObject({
    total: 1,
    unknown: 1,
    notEvaluated: false,
  })
})
