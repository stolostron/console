/* Copyright Contributors to the Open Cluster Management project */
import { act, renderHook } from '@testing-library/react-hooks'
import { useRef } from 'react'
import { installFakeEventSource } from '../lib/test-event-source'
import { useWatchEventStream } from './useWatchEventStream'

jest.mock('../resources/utils', () => ({
  getBackendUrl: () => '',
}))

describe('useWatchEventStream', () => {
  let fake: ReturnType<typeof installFakeEventSource>

  beforeEach(() => {
    fake = installFakeEventSource()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
    fake.restore()
  })

  function renderStream(path = '/events/rbac', streamStopped = false) {
    const applyWatchEvents = jest.fn()
    const onEndOfPacket = jest.fn()
    const onLoaded = jest.fn()
    const onSettings = jest.fn()
    const { result, rerender, unmount } = renderHook(
      (props: { path: string; restartKey: number }) => {
        const streamStoppedRef = useRef(streamStopped)
        const eventSourceRef = useRef<EventSource>()
        const processIntervalRef = useRef<ReturnType<typeof setInterval>>()
        streamStoppedRef.current = streamStopped
        useWatchEventStream({
          path: props.path,
          restartKey: props.restartKey,
          streamStoppedRef,
          eventSourceRef,
          processIntervalRef,
          applyWatchEvents,
          onEndOfPacket,
          onLoaded,
          onSettings,
        })
        return { eventSourceRef, streamStoppedRef }
      },
      { initialProps: { path, restartKey: 0 } }
    )
    return { applyWatchEvents, onEndOfPacket, onLoaded, onSettings, result, rerender, unmount }
  }

  it('opens the path with credentials', () => {
    renderStream('/events/rbac')
    expect(fake.sources).toHaveLength(1)
    expect(fake.sources[0].url).toBe('/events/rbac')
    expect(fake.sources[0].withCredentials).toBe(true)
  })

  it('applies ADDED on EOP and calls onEndOfPacket', () => {
    const { applyWatchEvents, onEndOfPacket } = renderStream()
    const object = {
      kind: 'ClusterRole',
      apiVersion: 'rbac.authorization.k8s.io/v1',
      metadata: { name: 'admin', namespace: '', resourceVersion: '1' },
    }
    act(() => {
      fake.sources[0].emit({ type: 'START' })
      fake.sources[0].emit({ type: 'ADDED', object })
      fake.sources[0].emit({ type: 'EOP' })
    })
    expect(applyWatchEvents).toHaveBeenCalledWith([expect.objectContaining({ type: 'ADDED', object })])
    expect(onEndOfPacket).toHaveBeenCalledTimes(1)
  })

  it('drops queued events on START', () => {
    const { applyWatchEvents } = renderStream()
    const object = {
      kind: 'ClusterRole',
      apiVersion: 'rbac.authorization.k8s.io/v1',
      metadata: { name: 'admin', namespace: '', resourceVersion: '1' },
    }
    act(() => {
      fake.sources[0].emit({ type: 'ADDED', object })
      fake.sources[0].emit({ type: 'START' })
      fake.sources[0].emit({ type: 'EOP' })
    })
    expect(applyWatchEvents).not.toHaveBeenCalled()
  })

  it('calls onLoaded after flushing the queue', () => {
    const { applyWatchEvents, onLoaded } = renderStream()
    act(() => {
      fake.sources[0].emit({ type: 'LOADED' })
    })
    expect(applyWatchEvents).not.toHaveBeenCalled()
    expect(onLoaded).toHaveBeenCalledTimes(1)
  })

  it('forwards SETTINGS', () => {
    const { onSettings } = renderStream()
    act(() => {
      fake.sources[0].emit({ type: 'SETTINGS', settings: { FOO: 'bar' } })
    })
    expect(onSettings).toHaveBeenCalledWith({ FOO: 'bar' })
  })

  it('reconnects after CLOSED unless the stream was stopped', () => {
    renderStream('/events', false)
    act(() => {
      fake.sources[0].triggerError()
    })
    expect(fake.sources).toHaveLength(1)
    act(() => {
      jest.advanceTimersByTime(1000)
    })
    expect(fake.sources).toHaveLength(2)
  })

  it('does not reconnect when the stream was stopped for idle', () => {
    renderStream('/events', true)
    act(() => {
      fake.sources[0].triggerError()
      jest.advanceTimersByTime(1000)
    })
    expect(fake.sources).toHaveLength(1)
  })
})
