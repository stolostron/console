/* Copyright Contributors to the Open Cluster Management project */
import type { WatchEvent } from '../atoms'
import type { IResource } from '../resources'
import { applyWatchEventsToCache, groupWatchEventsByKind, resourceKey } from './applyWatchEventsToCache'

const added: WatchEvent = {
  type: 'ADDED',
  object: {
    kind: 'ClusterRole',
    apiVersion: 'rbac.authorization.k8s.io/v1',
    metadata: { name: 'admin', namespace: undefined as unknown as string, resourceVersion: '1' },
  },
}

const modified: WatchEvent = {
  type: 'MODIFIED',
  object: {
    kind: 'ClusterRole',
    apiVersion: 'rbac.authorization.k8s.io/v1',
    metadata: { name: 'admin', namespace: undefined as unknown as string, resourceVersion: '2' },
  },
}

const deleted: WatchEvent = {
  type: 'DELETED',
  object: {
    kind: 'ClusterRole',
    apiVersion: 'rbac.authorization.k8s.io/v1',
    metadata: { name: 'admin', namespace: undefined as unknown as string, resourceVersion: '2' },
  },
}

const pod: WatchEvent = {
  type: 'ADDED',
  object: {
    kind: 'Pod',
    apiVersion: 'v1',
    metadata: { name: 'nginx', namespace: 'default', resourceVersion: '1' },
  },
}

describe('resourceKey', () => {
  it('joins namespace and name', () => {
    expect(resourceKey(pod.object)).toBe('default/nginx')
  })
})

describe('applyWatchEventsToCache', () => {
  it('adds, updates, and deletes by namespace/name', () => {
    const cache: Record<string, IResource> = {}
    applyWatchEventsToCache(cache, [added])
    expect(Object.keys(cache)).toEqual(['undefined/admin'])
    applyWatchEventsToCache(cache, [modified])
    expect(cache['undefined/admin'].metadata?.resourceVersion).toBe('2')
    applyWatchEventsToCache(cache, [deleted])
    expect(cache).toEqual({})
  })
})

describe('groupWatchEventsByKind', () => {
  it('groups by apiVersion group and kind', () => {
    const grouped = groupWatchEventsByKind([added, pod])
    expect(grouped['rbac.authorization.k8s.io'].ClusterRole).toEqual([added])
    expect(grouped.v1.Pod).toEqual([pod])
  })
})
