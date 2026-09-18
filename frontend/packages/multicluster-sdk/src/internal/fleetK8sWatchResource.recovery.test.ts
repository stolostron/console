/* Copyright Contributors to the Open Cluster Management project */

import { consoleFetchJSON, type K8sModel } from '@openshift-console/dynamic-plugin-sdk'
import type { FleetWatchK8sResource } from '../types'
import { buildResourceURL, fleetWatch } from './apiRequests'
import { startWatch } from './fleetK8sWatchResource'
import { useFleetK8sWatchResourceStore } from './fleetK8sWatchResourceStore'

jest.mock('./apiRequests', () => ({
  buildResourceURL: jest.fn(),
  fleetWatch: jest.fn(),
}))

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  ...jest.requireActual<typeof import('@openshift-console/dynamic-plugin-sdk')>(
    '@openshift-console/dynamic-plugin-sdk'
  ),
  consoleFetchJSON: jest.fn(),
}))

class TestWebSocket extends EventTarget implements WebSocket {
  readonly CONNECTING = 0
  readonly OPEN = 1
  readonly CLOSING = 2
  readonly CLOSED = 3
  binaryType: BinaryType = 'blob'
  readonly bufferedAmount = 0
  readonly extensions = ''
  onclose: ((this: WebSocket, event: CloseEvent) => unknown) | null = null
  onerror: ((this: WebSocket, event: Event) => unknown) | null = null
  onmessage: ((this: WebSocket, event: MessageEvent) => unknown) | null = null
  onopen: ((this: WebSocket, event: Event) => unknown) | null = null
  readonly protocol = ''
  readyState = this.OPEN
  readonly url: string

  constructor(url: string) {
    super()
    this.url = url
  }

  close = jest.fn(() => {
    this.readyState = this.CLOSED
  })

  send(): void {}

  receive(data: string): boolean {
    const messageHandler = this.onmessage
    if (!messageHandler) return false
    messageHandler.call(this, new MessageEvent('message', { data }))
    return true
  }
}

const mockConsoleFetchJSON = jest.mocked(consoleFetchJSON)
const mockBuildResourceURL = jest.mocked(buildResourceURL)
const mockFleetWatch = jest.mocked(fleetWatch)

describe('fleetK8sWatchResource expired watch recovery', () => {
  const model: K8sModel = {
    apiVersion: 'v1',
    apiGroup: 'core',
    kind: 'Pod',
    plural: 'pods',
    namespaced: true,
    abbr: 'P',
    label: 'Pod',
    labelPlural: 'Pods',
  }
  const resource: FleetWatchK8sResource = {
    cluster: 'test-cluster',
    namespace: 'default',
    isList: true,
  }
  const basePath = '/api/fleet'
  const requestPath = '/api/fleet/api/v1/namespaces/default/pods'

  beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllMocks()
    useFleetK8sWatchResourceStore.setState({ cache: {} })
    mockBuildResourceURL.mockReturnValue(requestPath)
  })

  afterEach(() => {
    const store = useFleetK8sWatchResourceStore.getState()
    Object.values(store.cache).forEach((entry) => entry.socket?.close())
    jest.clearAllTimers()
    useFleetK8sWatchResourceStore.setState({ cache: {} })
    jest.useRealTimers()
  })

  it('starts a fresh LIST and one replacement socket when the watch reports an expired resourceVersion', async () => {
    // Given an active list watch created from resourceVersion 100
    const socketOne = new TestWebSocket('watch-1')
    const socketTwo = new TestWebSocket('watch-2')
    mockConsoleFetchJSON
      .mockResolvedValueOnce({ items: [], metadata: { resourceVersion: '100' } })
      .mockResolvedValueOnce({ items: [], metadata: { resourceVersion: '200' } })
    const replacementSocketOpened = new Promise<void>((resolve) => {
      mockFleetWatch.mockReturnValueOnce(socketOne).mockImplementationOnce(() => {
        resolve()
        return socketTwo
      })
    })
    await startWatch(resource, model, basePath)
    expect(mockConsoleFetchJSON).toHaveBeenCalledTimes(1)
    expect(mockFleetWatch).toHaveBeenCalledTimes(1)

    // When socket 1 delivers an in-band Kubernetes Expired Status
    const messageDelivered = socketOne.receive(
      JSON.stringify({
        type: 'ERROR',
        object: { apiVersion: 'v1', kind: 'Status', reason: 'Expired', code: 410 },
      })
    )

    // Then recovery immediately performs a fresh LIST before opening exactly one replacement socket
    expect(messageDelivered).toBe(true)
    expect(mockConsoleFetchJSON).toHaveBeenCalledTimes(2)
    expect(mockConsoleFetchJSON).toHaveBeenNthCalledWith(2, requestPath, 'GET')
    await replacementSocketOpened
    expect(socketOne.close).toHaveBeenCalledTimes(1)
    expect(socketOne.readyState).toBe(socketOne.CLOSED)
    expect(mockFleetWatch).toHaveBeenCalledTimes(2)
    expect(mockFleetWatch).toHaveBeenNthCalledWith(
      2,
      model,
      expect.objectContaining({ resourceVersion: '200' }),
      basePath
    )
  })

  it('ignores a deletion refresh that resolves after the socket has been replaced', async () => {
    const singleResource: FleetWatchK8sResource = { ...resource, isList: false, name: 'test-pod' }
    const socketOne = new TestWebSocket('watch-1')
    const socketTwo = new TestWebSocket('watch-2')
    let resolveDeletion: (value: unknown) => void = () => {}
    let resolveRecovery: (value: unknown) => void = () => {}
    const deletionRequest = new Promise<unknown>((resolve) => {
      resolveDeletion = resolve
    })
    const recoveryRequest = new Promise<unknown>((resolve) => {
      resolveRecovery = resolve
    })

    mockConsoleFetchJSON
      .mockResolvedValueOnce({ metadata: { resourceVersion: '100' }, uid: 'initial' })
      .mockReturnValueOnce(deletionRequest)
      .mockReturnValueOnce(recoveryRequest)
    const replacementSocketOpened = new Promise<void>((resolve) => {
      mockFleetWatch.mockReturnValueOnce(socketOne).mockImplementationOnce(() => {
        resolve()
        return socketTwo
      })
    })

    await startWatch(singleResource, model, basePath)

    // Start a single-resource deletion confirmation, leaving its GET pending.
    socketOne.receive(
      JSON.stringify({
        type: 'DELETED',
        object: { apiVersion: 'v1', kind: 'Pod', metadata: { uid: 'initial' } },
      })
    )

    // Expire the same watch before the deletion confirmation completes.
    socketOne.receive(
      JSON.stringify({
        type: 'ERROR',
        object: { apiVersion: 'v1', kind: 'Status', reason: 'Expired', code: 410 },
      })
    )
    resolveRecovery({ metadata: { resourceVersion: '200' }, uid: 'replacement' })
    await replacementSocketOpened

    // The older deletion GET must not overwrite the replacement watch's state.
    resolveDeletion({ metadata: { resourceVersion: '150' }, uid: 'stale' })
    await Promise.resolve()

    expect(useFleetK8sWatchResourceStore.getState().getResourceVersion(requestPath)).toBe('200')
    expect(useFleetK8sWatchResourceStore.getState().getResult(requestPath)?.data).toEqual({
      cluster: 'test-cluster',
      metadata: { resourceVersion: '200' },
      uid: 'replacement',
    })
  })
})
