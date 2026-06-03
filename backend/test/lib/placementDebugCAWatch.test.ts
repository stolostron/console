/* Copyright Contributors to the Open Cluster Management project */

import nock from 'nock'
import { watchPlacementDebugCA, getPlacementDebugCA } from '../../src/lib/placementDebugCAWatch'
import * as serviceAccountTokenModule from '../../src/lib/serviceAccountToken'

jest.mock('../../src/lib/serviceAccountToken')

const mockedGetServiceAccountToken = serviceAccountTokenModule.getServiceAccountToken as jest.MockedFunction<
  typeof serviceAccountTokenModule.getServiceAccountToken
>
const mockedGetCACertificate = serviceAccountTokenModule.getCACertificate as jest.MockedFunction<
  typeof serviceAccountTokenModule.getCACertificate
>

const API_PATH = '/api/v1/namespaces/open-cluster-management-hub/configmaps'
const TEST_CA = '-----BEGIN CERTIFICATE-----\nTEST_CA_DATA\n-----END CERTIFICATE-----'
const UPDATED_CA = '-----BEGIN CERTIFICATE-----\nUPDATED_CA_DATA\n-----END CERTIFICATE-----'

function makeConfigMapList(resourceVersion: string, caData?: string) {
  const items =
    caData !== undefined
      ? [
          {
            metadata: { name: 'ca-bundle-configmap', resourceVersion },
            data: { 'ca-bundle.crt': caData },
          },
        ]
      : []
  return { metadata: { resourceVersion }, items }
}

function makeConfigMapListNoKey(resourceVersion: string) {
  return {
    metadata: { resourceVersion },
    items: [
      {
        metadata: { name: 'ca-bundle-configmap', resourceVersion },
        data: { 'some-other-key': 'value' },
      },
    ],
  }
}

function makeWatchEvent(type: string, resourceVersion: string, caData?: string, extra?: Record<string, unknown>) {
  const data: Record<string, string> = {}
  if (caData !== undefined) data['ca-bundle.crt'] = caData
  return JSON.stringify({
    type,
    object: {
      metadata: { name: 'ca-bundle-configmap', resourceVersion },
      data: caData !== undefined ? data : undefined,
      ...extra,
    },
  })
}

function waitForCalls(fn: { mock: { calls: unknown[][] } }, count: number, timeoutMs = 5000): Promise<void> {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs
    const check = setInterval(() => {
      if (fn.mock.calls.length >= count) {
        clearInterval(check)
        resolve()
      } else if (Date.now() > deadline) {
        clearInterval(check)
        reject(new Error(`Timed out waiting for ${count} calls, got ${fn.mock.calls.length}`))
      }
    }, 20)
  })
}

describe('placementDebugCAWatch', () => {
  let stopWatch: (() => void) | undefined
  const originalClusterApiUrl = process.env.CLUSTER_API_URL

  beforeEach(() => {
    jest.clearAllMocks()
    stopWatch = undefined
    process.env.CLUSTER_API_URL = 'https://api.test-cluster.com:6443'
    mockedGetServiceAccountToken.mockReturnValue('mock-token')
    mockedGetCACertificate.mockReturnValue(undefined)
  })

  afterEach(async () => {
    stopWatch?.()
    stopWatch = undefined
    nock.abortPendingRequests()
    nock.cleanAll()
    await new Promise((resolve) => setTimeout(resolve, 50))
  })

  afterAll(() => {
    if (originalClusterApiUrl === undefined) {
      delete process.env.CLUSTER_API_URL
    } else {
      process.env.CLUSTER_API_URL = originalClusterApiUrl
    }
  })

  it('should call onCAChange after the initial list with CA bundle present', async () => {
    const onCAChange = jest.fn()

    nock('https://api.test-cluster.com:6443').get(API_PATH).query(true).reply(200, makeConfigMapList('1000', TEST_CA))

    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query((q) => q.watch !== undefined)
      .delay(60000)
      .reply(200, '')

    stopWatch = watchPlacementDebugCA(onCAChange)

    await waitForCalls(onCAChange, 1)

    expect(onCAChange).toHaveBeenCalledTimes(1)
    expect(getPlacementDebugCA()).toBe(TEST_CA)
  })

  it('should not call onCAChange when list returns empty items', async () => {
    const onCAChange = jest.fn()

    nock('https://api.test-cluster.com:6443').get(API_PATH).query(true).reply(200, makeConfigMapList('1000'))

    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query((q) => q.watch !== undefined)
      .delay(60000)
      .reply(200, '')

    stopWatch = watchPlacementDebugCA(onCAChange)

    await new Promise((resolve) => setTimeout(resolve, 200))

    expect(onCAChange).not.toHaveBeenCalled()
    expect(getPlacementDebugCA()).toBeUndefined()
  })

  it('should not call onCAChange when ConfigMap exists but ca-bundle.crt key is missing', async () => {
    const onCAChange = jest.fn()

    nock('https://api.test-cluster.com:6443').get(API_PATH).query(true).reply(200, makeConfigMapListNoKey('1000'))

    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query((q) => q.watch !== undefined)
      .delay(60000)
      .reply(200, '')

    stopWatch = watchPlacementDebugCA(onCAChange)

    await new Promise((resolve) => setTimeout(resolve, 200))

    expect(onCAChange).not.toHaveBeenCalled()
    expect(getPlacementDebugCA()).toBeUndefined()
  })

  it('should clear CA and call onCAChange when relist finds ConfigMap removed', async () => {
    const onCAChange = jest.fn()

    // First list returns CA
    nock('https://api.test-cluster.com:6443').get(API_PATH).query(true).reply(200, makeConfigMapList('1000', TEST_CA))

    // Watch returns ERROR to trigger relist
    const errorEvent = makeWatchEvent('ERROR', '1001', undefined, {
      message: 'too old resource version: 1000 (5000)',
    })
    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query((q) => q.watch !== undefined)
      .reply(200, errorEvent + '\n')

    // Relist returns empty — ConfigMap was deleted
    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query((q) => q.watch === undefined)
      .reply(200, makeConfigMapList('5000'))

    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query((q) => q.watch !== undefined)
      .delay(60000)
      .reply(200, '')

    stopWatch = watchPlacementDebugCA(onCAChange)

    await waitForCalls(onCAChange, 2)

    expect(onCAChange).toHaveBeenCalledTimes(2)
    expect(getPlacementDebugCA()).toBeUndefined()
  })

  it('should call onCAChange when watch delivers ADDED event', async () => {
    const onCAChange = jest.fn()

    nock('https://api.test-cluster.com:6443').get(API_PATH).query(true).reply(200, makeConfigMapList('1000'))

    const addedEvent = makeWatchEvent('ADDED', '1001', TEST_CA)
    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query((q) => q.watch !== undefined)
      .reply(200, addedEvent + '\n')

    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query((q) => q.watch !== undefined)
      .delay(60000)
      .reply(200, '')

    stopWatch = watchPlacementDebugCA(onCAChange)

    await waitForCalls(onCAChange, 1)

    expect(onCAChange).toHaveBeenCalledTimes(1)
    expect(getPlacementDebugCA()).toBe(TEST_CA)
  })

  it('should call onCAChange when watch delivers MODIFIED event with new CA', async () => {
    const onCAChange = jest.fn()

    nock('https://api.test-cluster.com:6443').get(API_PATH).query(true).reply(200, makeConfigMapList('1000', TEST_CA))

    const modifiedEvent = makeWatchEvent('MODIFIED', '1001', UPDATED_CA)
    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query((q) => q.watch !== undefined)
      .reply(200, modifiedEvent + '\n')

    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query((q) => q.watch !== undefined)
      .delay(60000)
      .reply(200, '')

    stopWatch = watchPlacementDebugCA(onCAChange)

    await waitForCalls(onCAChange, 2)

    expect(onCAChange).toHaveBeenCalledTimes(2)
    expect(getPlacementDebugCA()).toBe(UPDATED_CA)
  })

  it('should not call onCAChange a second time when CA has not changed', async () => {
    const onCAChange = jest.fn()

    nock('https://api.test-cluster.com:6443').get(API_PATH).query(true).reply(200, makeConfigMapList('1000', TEST_CA))

    const watchBody =
      makeWatchEvent('MODIFIED', '1001', TEST_CA) + '\n' + makeWatchEvent('MODIFIED', '1002', TEST_CA) + '\n'

    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query((q) => q.watch !== undefined)
      .reply(200, watchBody)

    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query((q) => q.watch !== undefined)
      .delay(60000)
      .reply(200, '')

    stopWatch = watchPlacementDebugCA(onCAChange)

    await waitForCalls(onCAChange, 1)
    await new Promise((resolve) => setTimeout(resolve, 300))

    expect(onCAChange).toHaveBeenCalledTimes(1)
  })

  it('should clear CA on DELETED event', async () => {
    const onCAChange = jest.fn()

    nock('https://api.test-cluster.com:6443').get(API_PATH).query(true).reply(200, makeConfigMapList('1000', TEST_CA))

    const deletedEvent = makeWatchEvent('DELETED', '1001')
    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query((q) => q.watch !== undefined)
      .reply(200, deletedEvent + '\n')

    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query((q) => q.watch !== undefined)
      .delay(60000)
      .reply(200, '')

    stopWatch = watchPlacementDebugCA(onCAChange)

    await waitForCalls(onCAChange, 2)

    expect(onCAChange).toHaveBeenCalledTimes(2)
    expect(getPlacementDebugCA()).toBeUndefined()
  })

  it('should handle BOOKMARK events without calling onCAChange', async () => {
    const onCAChange = jest.fn()

    nock('https://api.test-cluster.com:6443').get(API_PATH).query(true).reply(200, makeConfigMapList('1000', TEST_CA))

    const bookmarkEvent = JSON.stringify({
      type: 'BOOKMARK',
      object: { metadata: { name: 'ca-bundle-configmap', resourceVersion: '2000' } },
    })
    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query((q) => q.watch !== undefined)
      .reply(200, bookmarkEvent + '\n')

    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query((q) => q.watch !== undefined)
      .delay(60000)
      .reply(200, '')

    stopWatch = watchPlacementDebugCA(onCAChange)

    await waitForCalls(onCAChange, 1)
    await new Promise((resolve) => setTimeout(resolve, 300))

    expect(onCAChange).toHaveBeenCalledTimes(1)
  })

  it('should re-list after a watch ERROR event with "too old resource version"', async () => {
    const onCAChange = jest.fn()
    let listCount = 0

    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query((q) => q.watch === undefined)
      .reply(200, () => {
        listCount++
        return makeConfigMapList('1000', TEST_CA)
      })

    const errorEvent = makeWatchEvent('ERROR', '1001', undefined, {
      message: 'too old resource version: 1000 (5000)',
    })
    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query((q) => q.watch !== undefined)
      .reply(200, errorEvent + '\n')

    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query((q) => q.watch === undefined)
      .reply(200, () => {
        listCount++
        return makeConfigMapList('5000', TEST_CA)
      })

    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query((q) => q.watch !== undefined)
      .delay(60000)
      .reply(200, '')

    stopWatch = watchPlacementDebugCA(onCAChange)

    await new Promise<void>((resolve, reject) => {
      const deadline = Date.now() + 5000
      const interval = setInterval(() => {
        if (listCount >= 2) {
          clearInterval(interval)
          resolve()
        } else if (Date.now() > deadline) {
          clearInterval(interval)
          reject(new Error(`Timed out waiting for relist; listCount=${listCount}`))
        }
      }, 20)
    })

    expect(listCount).toBeGreaterThanOrEqual(2)
  })

  it('should stop the loop when the stop function is called', async () => {
    const onCAChange = jest.fn()

    nock('https://api.test-cluster.com:6443').get(API_PATH).query(true).reply(200, makeConfigMapList('1000', TEST_CA))

    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query((q) => q.watch !== undefined)
      .delay(60000)
      .reply(200, '')

    stopWatch = watchPlacementDebugCA(onCAChange)

    await waitForCalls(onCAChange, 1)

    stopWatch()

    await new Promise((resolve) => setTimeout(resolve, 200))

    const callCount = onCAChange.mock.calls.length
    await new Promise((resolve) => setTimeout(resolve, 200))
    expect(onCAChange).toHaveBeenCalledTimes(callCount)
  })

  it('should retry watch (not full relist) on premature close', async () => {
    const onCAChange = jest.fn()
    let listCount = 0

    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query((q) => q.watch === undefined)
      .reply(200, () => {
        listCount++
        return makeConfigMapList('1000', TEST_CA)
      })

    // Watch responds with empty body — causes "Premature close"
    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query((q) => q.watch !== undefined)
      .reply(200, '')

    // Second watch also ends
    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query((q) => q.watch !== undefined)
      .reply(200, '')

    // Third watch stays open
    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query((q) => q.watch !== undefined)
      .delay(60000)
      .reply(200, '')

    stopWatch = watchPlacementDebugCA(onCAChange)

    await waitForCalls(onCAChange, 1)
    await new Promise((resolve) => setTimeout(resolve, 500))

    expect(listCount).toBe(1)
    expect(onCAChange).toHaveBeenCalledTimes(1)
  })

  it('should use the service account token from getServiceAccountToken', async () => {
    mockedGetServiceAccountToken.mockReturnValue('custom-sa-token')
    const onCAChange = jest.fn()

    const scope = nock('https://api.test-cluster.com:6443', {
      reqheaders: { authorization: 'Bearer custom-sa-token' },
    })
      .get(API_PATH)
      .query(true)
      .reply(200, makeConfigMapList('1000', TEST_CA))

    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query((q) => q.watch !== undefined)
      .delay(60000)
      .reply(200, '')

    stopWatch = watchPlacementDebugCA(onCAChange)

    await waitForCalls(onCAChange, 1)

    expect(scope.isDone()).toBe(true)
    expect(mockedGetServiceAccountToken).toHaveBeenCalled()
  })

  it('should handle multiple CA changes in a single watch stream', async () => {
    const onCAChange = jest.fn()

    nock('https://api.test-cluster.com:6443').get(API_PATH).query(true).reply(200, makeConfigMapList('1000', TEST_CA))

    const watchBody =
      makeWatchEvent('MODIFIED', '1001', UPDATED_CA) + '\n' + makeWatchEvent('MODIFIED', '1002', TEST_CA) + '\n'

    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query((q) => q.watch !== undefined)
      .reply(200, watchBody)

    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query((q) => q.watch !== undefined)
      .delay(60000)
      .reply(200, '')

    stopWatch = watchPlacementDebugCA(onCAChange)

    await waitForCalls(onCAChange, 3)

    expect(onCAChange).toHaveBeenCalledTimes(3)
    expect(getPlacementDebugCA()).toBe(TEST_CA)
  })
})
