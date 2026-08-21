/* Copyright Contributors to the Open Cluster Management project */

import { Writable } from 'node:stream'
import * as compression from '../../src/lib/compression'
import { getEventResourceMeta, ServerSideEvents, type ServerSideEvent } from '../../src/lib/server-side-events'

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

describe('ServerSideEvents filter-before-inflate (ACM-39327)', () => {
  beforeEach(() => {
    ServerSideEvents.reset()
    jest.restoreAllMocks()
  })

  afterEach(() => {
    ServerSideEvents.eventFilter = undefined
    ServerSideEvents.reset()
  })

  it('does not inflate denied events', async () => {
    const inflateSpy = jest.spyOn(compression, 'inflateEvent')
    ServerSideEvents.eventFilter = () => Promise.resolve(false)

    const writableStream = new Writable({
      write(_chunk, _encoding, callback) {
        callback()
      },
    })
    const clients = ServerSideEvents.getClients()
    clients['deny-client'] = {
      token: 'token',
      writableStream,
      compressionStream: undefined,
      eventQueue: [],
    }

    await ServerSideEvents.pushEvent({
      data: {
        type: 'MODIFIED',
        meta: {
          kind: 'ManagedCluster',
          apiVersion: 'cluster.open-cluster-management.io/v1',
          name: 'cluster-1',
        },
        object: Buffer.from('should-not-inflate'),
      },
    })

    // Allow the async eventQueue filter/processClient work to settle.
    await new Promise((resolve) => setImmediate(resolve))
    await new Promise((resolve) => setImmediate(resolve))

    expect(inflateSpy).not.toHaveBeenCalled()
  })

  it('inflates events only after the filter allows them', async () => {
    const inflateSpy = jest.spyOn(compression, 'inflateEvent').mockImplementation((event) => Promise.resolve(event))
    ServerSideEvents.eventFilter = () => Promise.resolve(true)

    const writableStream = new Writable({
      write(_chunk, _encoding, callback) {
        callback()
      },
    })
    const clients = ServerSideEvents.getClients()
    clients['allow-client'] = {
      token: 'token',
      writableStream,
      compressionStream: undefined,
      eventQueue: [],
    }

    const event: ServerSideEvent = {
      data: {
        type: 'MODIFIED',
        meta: {
          kind: 'ManagedCluster',
          apiVersion: 'cluster.open-cluster-management.io/v1',
          name: 'cluster-1',
        },
        object: {
          kind: 'ManagedCluster',
          apiVersion: 'v1',
          metadata: { name: 'cluster-1', namespace: '', resourceVersion: '1' },
        },
      },
    }
    await ServerSideEvents.pushEvent(event)

    await new Promise((resolve) => setImmediate(resolve))
    await new Promise((resolve) => setImmediate(resolve))

    expect(inflateSpy).toHaveBeenCalled()
  })
})
