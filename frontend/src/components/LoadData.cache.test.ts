/* Copyright Contributors to the Open Cluster Management project */

import type { WatchEvent } from '../atoms'
import { updateSetterCache } from './updateSetterCache'

const groupVersion = 'cluster.open-cluster-management.io'
const kind = 'ManagedCluster'

function watchEvent(type: WatchEvent['type'], namespace?: string): WatchEvent {
  return {
    type,
    object: {
      kind,
      apiVersion: `${groupVersion}/v1`,
      metadata: {
        name: 'cluster-1',
        ...(namespace === undefined ? {} : { namespace }),
        resourceVersion: '1',
      },
    },
  }
}

describe('updateSetterCache', () => {
  it('removes a cluster-scoped resource when the delete event has an empty namespace', () => {
    const caches = { [groupVersion]: { [kind]: {} } }

    updateSetterCache(caches, groupVersion, kind, [watchEvent('MODIFIED')])
    expect(Object.keys(caches[groupVersion][kind])).toHaveLength(1)

    updateSetterCache(caches, groupVersion, kind, [watchEvent('DELETED', '')])
    expect(Object.keys(caches[groupVersion][kind])).toHaveLength(0)
  })
})
