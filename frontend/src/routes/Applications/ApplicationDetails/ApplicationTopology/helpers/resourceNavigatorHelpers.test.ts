/* Copyright Contributors to the Open Cluster Management project */

import {
  buildNavigatorGroups,
  findInitialNavigatorSelection,
  filterNavigatorGroups,
  flattenNavigatorGroups,
  navigatorPulseSortIndex,
  pulseToDrawerIcon,
  sortNavigatorItems,
} from './resourceNavigatorHelpers'
import type { ResourceNavigatorItem } from './resourceNavigatorHelpers'
import type { TopologyNode } from '../types'

describe('resourceNavigatorHelpers', () => {
  test('pulseToDrawerIcon maps colors', () => {
    expect(pulseToDrawerIcon('red')).toBe('failure')
    expect(pulseToDrawerIcon('green')).toBe('success')
    expect(pulseToDrawerIcon(undefined)).toBe('pending')
  })

  test('findInitialNavigatorSelection prefers red pulse', () => {
    const items = [
      { id: '1', name: 'a', cluster: 'c1', pulse: 'green' as const },
      { id: '2', name: 'b', cluster: 'c1', pulse: 'red' as const },
    ]
    expect(findInitialNavigatorSelection(items)?.id).toBe('2')
  })

  test('filterNavigatorGroups hides empty clusters', () => {
    const groups = [
      {
        groupId: 'c1',
        groupTitle: 'c1',
        items: [{ id: '1', name: 'pod-a', cluster: 'c1', namespace: 'ns' }],
      },
      {
        groupId: 'c2',
        groupTitle: 'c2',
        items: [{ id: '2', name: 'pod-b', cluster: 'c2', namespace: 'ns' }],
      },
    ]
    const filtered = filterNavigatorGroups(groups, 'pod-a')
    expect(filtered).toHaveLength(1)
    expect(filtered[0].groupId).toBe('c1')
  })

  test('filterNavigatorGroups matches substring in NavGroup or NavItem name', () => {
    const groups = [
      {
        groupId: 'local-cluster',
        groupTitle: 'local-cluster',
        items: [
          { id: '1', name: 'nginx-deployment', cluster: 'local-cluster' },
          { id: '2', name: 'redis-pod', cluster: 'local-cluster' },
        ],
      },
      {
        groupId: 'remote',
        groupTitle: 'remote',
        items: [{ id: '3', name: 'nginx-service', cluster: 'remote' }],
      },
    ]

    // Substring of group title keeps all items in that group
    const byGroup = filterNavigatorGroups(groups, 'local')
    expect(byGroup).toHaveLength(1)
    expect(byGroup[0].items).toHaveLength(2)

    // Substring of item name across groups
    const byItem = filterNavigatorGroups(groups, 'nginx')
    expect(byItem).toHaveLength(2)
    expect(byItem.flatMap((g) => g.items).map((i) => i.id)).toEqual(['1', '3'])

    // Tokens may match group title and item name together
    const byBoth = filterNavigatorGroups(groups, 'local redis')
    expect(byBoth).toHaveLength(1)
    expect(byBoth[0].items.map((i) => i.id)).toEqual(['2'])
  })

  test('sortNavigatorItems groups by type and orders pulse error before waiting', () => {
    const items: ResourceNavigatorItem[] = [
      { id: '1', name: 'b', cluster: 'c1', resourceType: 'pod', pulse: 'orange' },
      { id: '2', name: 'a', cluster: 'c1', resourceType: 'deployment', pulse: 'red' },
      { id: '3', name: 'c', cluster: 'c1', resourceType: 'pod', pulse: 'red' },
    ]
    const sorted = sortNavigatorItems(items)
    expect(sorted.map((i) => i.id)).toEqual(['2', '3', '1'])
    expect(navigatorPulseSortIndex('red')).toBeLessThan(navigatorPulseSortIndex('orange'))
  })

  test('buildNavigatorGroups for applicationset applications', () => {
    const node: TopologyNode = {
      id: 'appset-1',
      uid: 'appset-1',
      name: 'my-appset',
      namespace: 'ns',
      type: 'applicationset',
      specs: {
        appSetApps: [
          { metadata: { name: 'app-b', namespace: 'ns' }, spec: {} },
          { metadata: { name: 'app-a', namespace: 'ns' }, spec: {} },
        ],
      },
    }
    const groups = buildNavigatorGroups(node, 'application')
    const items = flattenNavigatorGroups(groups)
    expect(items).toHaveLength(2)
    expect(items[0].name).toBe('app-a')
  })
})
