/* Copyright Contributors to the Open Cluster Management project */

import { getEventResourceMeta, type ServerSideEvent } from '../../src/lib/server-side-events'

describe('getEventResourceMeta', () => {
  it('prefers meta over object when both are present', () => {
    const event: ServerSideEvent = {
      data: {
        type: 'MODIFIED',
        meta: {
          kind: 'ManagedCluster',
          apiVersion: 'cluster.open-cluster-management.io/v1',
          name: 'from-meta',
        },
        object: {
          kind: 'ManagedCluster',
          apiVersion: 'cluster.open-cluster-management.io/v1',
          metadata: { name: 'from-object', namespace: '', resourceVersion: '1' },
        },
      },
    }
    expect(getEventResourceMeta(event)?.name).toBe('from-meta')
  })

  it('reads identity from inflated object when meta is missing', () => {
    const event: ServerSideEvent = {
      data: {
        type: 'MODIFIED',
        object: {
          kind: 'Policy',
          apiVersion: 'policy.open-cluster-management.io/v1',
          metadata: { name: 'p1', namespace: 'ns1', resourceVersion: '1' },
        },
      },
    }
    expect(getEventResourceMeta(event)).toEqual({
      kind: 'Policy',
      apiVersion: 'policy.open-cluster-management.io/v1',
      name: 'p1',
      namespace: 'ns1',
    })
  })

  it('returns undefined for compressed object without meta', () => {
    const event: ServerSideEvent = {
      data: {
        type: 'MODIFIED',
        object: Buffer.from('compressed'),
      },
    }
    expect(getEventResourceMeta(event)).toBeUndefined()
  })
})
