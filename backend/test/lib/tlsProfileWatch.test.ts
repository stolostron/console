/* Copyright Contributors to the Open Cluster Management project */

import nock from 'nock'
import type { SecureContextOptions } from 'node:tls'
import { watchTLSSecurityProfile } from '../../src/lib/tlsProfileWatch'
import * as serviceAccountTokenModule from '../../src/lib/serviceAccountToken'

jest.mock('../../src/lib/serviceAccountToken')

type ProfileChangeHandler = (opts: SecureContextOptions) => Promise<void>

const mockedGetServiceAccountToken = serviceAccountTokenModule.getServiceAccountToken as jest.MockedFunction<
  typeof serviceAccountTokenModule.getServiceAccountToken
>
const mockedGetCACertificate = serviceAccountTokenModule.getCACertificate as jest.MockedFunction<
  typeof serviceAccountTokenModule.getCACertificate
>

function createProfileChangeMock(): jest.MockedFunction<ProfileChangeHandler> {
  return jest.fn<Promise<void>, [SecureContextOptions]>().mockResolvedValue(undefined)
}

const API_PATH = '/apis/config.openshift.io/v1/apiservers'

function makeAPIServerList(resourceVersion: string, profileType?: string, minTLSVersion?: string, ciphers?: string[]) {
  const spec: Record<string, unknown> = {}
  if (profileType) {
    const profile: Record<string, unknown> = { type: profileType }
    if (profileType === 'Custom') {
      profile.custom = { minTLSVersion, ciphers }
    }
    spec.tlsSecurityProfile = profile
  }
  return {
    apiVersion: 'config.openshift.io/v1',
    kind: 'APIServerList',
    metadata: { resourceVersion },
    items: [
      {
        apiVersion: 'config.openshift.io/v1',
        kind: 'APIServer',
        metadata: { name: 'cluster', resourceVersion },
        spec,
      },
    ],
  }
}

function makeWatchEvent(
  type: string,
  resourceVersion: string,
  profileType?: string,
  minTLSVersion?: string,
  extra?: Record<string, unknown>
) {
  const spec: Record<string, unknown> = {}
  if (profileType) {
    spec.tlsSecurityProfile = { type: profileType }
    if (minTLSVersion) {
      ;(spec.tlsSecurityProfile as Record<string, unknown>).custom = { minTLSVersion }
    }
  }
  return JSON.stringify({
    type,
    object: {
      apiVersion: 'config.openshift.io/v1',
      kind: 'APIServer',
      metadata: { name: 'cluster', resourceVersion },
      spec,
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

describe('tlsProfileWatch', () => {
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
    // Allow the async list+watch loop to observe the stop flag and exit
    // before the next test resets it via watchTLSSecurityProfile
    await new Promise((resolve) => setTimeout(resolve, 50))
  })

  afterAll(() => {
    if (originalClusterApiUrl === undefined) {
      delete process.env.CLUSTER_API_URL
    } else {
      process.env.CLUSTER_API_URL = originalClusterApiUrl
    }
  })

  it('should call onProfileChange after the initial list with Intermediate profile', async () => {
    const onProfileChange = createProfileChangeMock()

    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query(true)
      .reply(200, makeAPIServerList('1000', 'Intermediate'))

    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query((q) => q.watch !== undefined)
      .delay(60000)
      .reply(200, '')

    stopWatch = watchTLSSecurityProfile(onProfileChange)

    await waitForCalls(onProfileChange, 1)

    expect(onProfileChange).toHaveBeenCalledTimes(1)
    expect(onProfileChange.mock.calls[0][0].minVersion).toBe('TLSv1.2')
  })

  it('should call onProfileChange with Old profile TLSv1 minVersion', async () => {
    const onProfileChange = createProfileChangeMock()

    nock('https://api.test-cluster.com:6443').get(API_PATH).query(true).reply(200, makeAPIServerList('1000', 'Old'))

    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query((q) => q.watch !== undefined)
      .delay(60000)
      .reply(200, '')

    stopWatch = watchTLSSecurityProfile(onProfileChange)

    await waitForCalls(onProfileChange, 1)

    expect(onProfileChange.mock.calls[0][0].minVersion).toBe('TLSv1')
  })

  it('should call onProfileChange with Modern profile TLSv1.3 minVersion', async () => {
    const onProfileChange = createProfileChangeMock()

    nock('https://api.test-cluster.com:6443').get(API_PATH).query(true).reply(200, makeAPIServerList('1000', 'Modern'))

    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query((q) => q.watch !== undefined)
      .delay(60000)
      .reply(200, '')

    stopWatch = watchTLSSecurityProfile(onProfileChange)

    await waitForCalls(onProfileChange, 1)

    expect(onProfileChange.mock.calls[0][0].minVersion).toBe('TLSv1.3')
  })

  it('should default to Intermediate when no TLS profile is set on the APIServer', async () => {
    const onProfileChange = createProfileChangeMock()

    const listBody = {
      apiVersion: 'config.openshift.io/v1',
      kind: 'APIServerList',
      metadata: { resourceVersion: '500' },
      items: [
        {
          apiVersion: 'config.openshift.io/v1',
          kind: 'APIServer',
          metadata: { name: 'cluster', resourceVersion: '500' },
          spec: {},
        },
      ],
    }

    nock('https://api.test-cluster.com:6443').get(API_PATH).query(true).reply(200, listBody)

    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query((q) => q.watch !== undefined)
      .delay(60000)
      .reply(200, '')

    stopWatch = watchTLSSecurityProfile(onProfileChange)

    await waitForCalls(onProfileChange, 1)

    expect(onProfileChange.mock.calls[0][0].minVersion).toBe('TLSv1.2')
  })

  it('should not call onProfileChange when list returns empty items', async () => {
    const onProfileChange = createProfileChangeMock()

    const emptyList = {
      apiVersion: 'config.openshift.io/v1',
      kind: 'APIServerList',
      metadata: { resourceVersion: '100' },
      items: [] as unknown[],
    }

    nock('https://api.test-cluster.com:6443').get(API_PATH).query(true).reply(200, emptyList)

    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query((q) => q.watch !== undefined)
      .delay(60000)
      .reply(200, '')

    stopWatch = watchTLSSecurityProfile(onProfileChange)

    await new Promise((resolve) => setTimeout(resolve, 200))

    expect(onProfileChange).not.toHaveBeenCalled()
  })

  it('should not call onProfileChange a second time when the profile has not changed', async () => {
    const onProfileChange = createProfileChangeMock()

    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query(true)
      .reply(200, makeAPIServerList('1000', 'Intermediate'))

    const watchBody =
      makeWatchEvent('MODIFIED', '1001', 'Intermediate') +
      '\n' +
      makeWatchEvent('MODIFIED', '1002', 'Intermediate') +
      '\n'

    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query((q) => q.watch !== undefined)
      .reply(200, watchBody)

    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query((q) => q.watch !== undefined)
      .delay(60000)
      .reply(200, '')

    stopWatch = watchTLSSecurityProfile(onProfileChange)

    await waitForCalls(onProfileChange, 1)
    await new Promise((resolve) => setTimeout(resolve, 300))

    expect(onProfileChange).toHaveBeenCalledTimes(1)
  })

  it('should call onProfileChange when the watch delivers a profile change', async () => {
    const onProfileChange = createProfileChangeMock()

    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query(true)
      .reply(200, makeAPIServerList('1000', 'Intermediate'))

    const watchBody = makeWatchEvent('MODIFIED', '1001', 'Modern') + '\n'

    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query((q) => q.watch !== undefined)
      .reply(200, watchBody)

    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query((q) => q.watch !== undefined)
      .delay(60000)
      .reply(200, '')

    stopWatch = watchTLSSecurityProfile(onProfileChange)

    await waitForCalls(onProfileChange, 2)

    expect(onProfileChange).toHaveBeenCalledTimes(2)
    expect(onProfileChange.mock.calls[0][0].minVersion).toBe('TLSv1.2')
    expect(onProfileChange.mock.calls[1][0].minVersion).toBe('TLSv1.3')
  })

  it('should handle BOOKMARK events without calling onProfileChange', async () => {
    const onProfileChange = createProfileChangeMock()

    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query(true)
      .reply(200, makeAPIServerList('1000', 'Intermediate'))

    const bookmarkEvent = JSON.stringify({
      type: 'BOOKMARK',
      object: {
        apiVersion: 'config.openshift.io/v1',
        kind: 'APIServer',
        metadata: { name: 'cluster', resourceVersion: '2000' },
        spec: {},
      },
    })
    const watchBody = bookmarkEvent + '\n'

    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query((q) => q.watch !== undefined)
      .reply(200, watchBody)

    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query((q) => q.watch !== undefined)
      .delay(60000)
      .reply(200, '')

    stopWatch = watchTLSSecurityProfile(onProfileChange)

    await waitForCalls(onProfileChange, 1)
    await new Promise((resolve) => setTimeout(resolve, 300))

    expect(onProfileChange).toHaveBeenCalledTimes(1)
  })

  it('should re-list after a watch ERROR event with "too old resource version"', async () => {
    const onProfileChange = createProfileChangeMock()
    let listCount = 0

    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query((q) => q.watch === undefined)
      .reply(200, () => {
        listCount++
        return makeAPIServerList('1000', 'Intermediate')
      })

    const errorEvent = JSON.stringify({
      type: 'ERROR',
      object: {
        apiVersion: 'config.openshift.io/v1',
        kind: 'APIServer',
        metadata: { name: 'cluster' },
        spec: {},
        message: 'too old resource version: 1000 (5000)',
      },
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
        return makeAPIServerList('5000', 'Intermediate')
      })

    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query((q) => q.watch !== undefined)
      .delay(60000)
      .reply(200, '')

    stopWatch = watchTLSSecurityProfile(onProfileChange)

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
    const onProfileChange = createProfileChangeMock()

    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query(true)
      .reply(200, makeAPIServerList('1000', 'Intermediate'))

    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query((q) => q.watch !== undefined)
      .delay(60000)
      .reply(200, '')

    stopWatch = watchTLSSecurityProfile(onProfileChange)

    await waitForCalls(onProfileChange, 1)

    stopWatch()

    await new Promise((resolve) => setTimeout(resolve, 200))

    const callCount = onProfileChange.mock.calls.length
    await new Promise((resolve) => setTimeout(resolve, 200))
    expect(onProfileChange).toHaveBeenCalledTimes(callCount)
  })

  it('should call onProfileChange on ADDED event during watch', async () => {
    const onProfileChange = createProfileChangeMock()

    const emptyList = {
      apiVersion: 'config.openshift.io/v1',
      kind: 'APIServerList',
      metadata: { resourceVersion: '100' },
      items: [] as unknown[],
    }

    nock('https://api.test-cluster.com:6443').get(API_PATH).query(true).reply(200, emptyList)

    const addedEvent = makeWatchEvent('ADDED', '200', 'Modern')
    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query((q) => q.watch !== undefined)
      .reply(200, addedEvent + '\n')

    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query((q) => q.watch !== undefined)
      .delay(60000)
      .reply(200, '')

    stopWatch = watchTLSSecurityProfile(onProfileChange)

    await waitForCalls(onProfileChange, 1)

    expect(onProfileChange).toHaveBeenCalledTimes(1)
    expect(onProfileChange.mock.calls[0][0].minVersion).toBe('TLSv1.3')
  })

  it('should retry immediately when watch stream ends prematurely', async () => {
    const onProfileChange = createProfileChangeMock()
    let listCount = 0

    // First list
    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query((q) => q.watch === undefined)
      .reply(200, () => {
        listCount++
        return makeAPIServerList('1000', 'Intermediate')
      })

    // Watch responds with empty body — causes "Premature close", which retries the watch
    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query((q) => q.watch !== undefined)
      .reply(200, '')

    // Second watch also ends — causes another "Premature close", which retries the watch again
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

    stopWatch = watchTLSSecurityProfile(onProfileChange)

    await waitForCalls(onProfileChange, 1)
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Only one list call — premature close retries the watch, not the full list+watch cycle
    expect(listCount).toBe(1)
    expect(onProfileChange).toHaveBeenCalledTimes(1)
  })

  it('should use the service account token from getServiceAccountToken', async () => {
    mockedGetServiceAccountToken.mockReturnValue('custom-sa-token')
    const onProfileChange = createProfileChangeMock()

    const scope = nock('https://api.test-cluster.com:6443', {
      reqheaders: { authorization: 'Bearer custom-sa-token' },
    })
      .get(API_PATH)
      .query(true)
      .reply(200, makeAPIServerList('1000', 'Intermediate'))

    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query((q) => q.watch !== undefined)
      .delay(60000)
      .reply(200, '')

    stopWatch = watchTLSSecurityProfile(onProfileChange)

    await waitForCalls(onProfileChange, 1)

    expect(scope.isDone()).toBe(true)
    expect(mockedGetServiceAccountToken).toHaveBeenCalled()
  })

  it('should handle multiple profile changes in a single watch stream', async () => {
    const onProfileChange = createProfileChangeMock()

    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query(true)
      .reply(200, makeAPIServerList('1000', 'Intermediate'))

    const watchBody =
      makeWatchEvent('MODIFIED', '1001', 'Modern') + '\n' + makeWatchEvent('MODIFIED', '1002', 'Old') + '\n'

    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query((q) => q.watch !== undefined)
      .reply(200, watchBody)

    nock('https://api.test-cluster.com:6443')
      .get(API_PATH)
      .query((q) => q.watch !== undefined)
      .delay(60000)
      .reply(200, '')

    stopWatch = watchTLSSecurityProfile(onProfileChange)

    await waitForCalls(onProfileChange, 3)

    expect(onProfileChange).toHaveBeenCalledTimes(3)
    expect(onProfileChange.mock.calls[0][0].minVersion).toBe('TLSv1.2')
    expect(onProfileChange.mock.calls[1][0].minVersion).toBe('TLSv1.3')
    expect(onProfileChange.mock.calls[2][0].minVersion).toBe('TLSv1')
  })
})
