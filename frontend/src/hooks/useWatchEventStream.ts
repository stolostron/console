/* Copyright Contributors to the Open Cluster Management project */
import { MutableRefObject, useEffect, useRef } from 'react'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { ServerSideEventData, THROTTLE_EVENTS_DELAY, WatchEvent } from '../atoms'
import { getBackendUrl } from '../resources/utils'

export interface WatchEventStreamHandlers {
  applyWatchEvents: (events: WatchEvent[]) => void
  onSettings?: (settings: Record<string, string>) => void
  onEndOfPacket?: () => void
  onLoaded?: () => void
}

export interface UseWatchEventStreamOptions extends WatchEventStreamHandlers {
  path: string
  restartKey: number
  streamStoppedRef: MutableRefObject<boolean>
  eventSourceRef: MutableRefObject<EventSource | undefined>
  processIntervalRef: MutableRefObject<ReturnType<typeof setInterval> | undefined>
}

export function useWatchEventStream({
  path,
  restartKey,
  streamStoppedRef,
  eventSourceRef,
  processIntervalRef,
  applyWatchEvents,
  onSettings,
  onEndOfPacket,
  onLoaded,
}: UseWatchEventStreamOptions): void {
  const applyWatchEventsRef = useRef(applyWatchEvents)
  applyWatchEventsRef.current = applyWatchEvents
  const onSettingsRef = useRef(onSettings)
  onSettingsRef.current = onSettings
  const onEndOfPacketRef = useRef(onEndOfPacket)
  onEndOfPacketRef.current = onEndOfPacket
  const onLoadedRef = useRef(onLoaded)
  onLoadedRef.current = onLoaded

  useEffect(() => {
    const eventQueue: WatchEvent[] = []

    function processEventQueue() {
      if (eventQueue.length === 0) return
      const watchEvents = eventQueue.splice(0)
      applyWatchEventsRef.current(watchEvents)
    }

    function processMessage(event: MessageEvent) {
      if (!event.data) return
      try {
        const data = JSON.parse(event.data) as ServerSideEventData
        switch (data.type) {
          case 'ADDED':
          case 'MODIFIED':
          case 'DELETED':
            eventQueue.push(data)
            break
          case 'START':
            eventQueue.length = 0
            break
          case 'EOP':
            processEventQueue()
            onEndOfPacketRef.current?.()
            break
          case 'LOADED':
            processEventQueue()
            onLoadedRef.current?.()
            break
          case 'SETTINGS':
            onSettingsRef.current?.(data.settings)
            break
        }
      } catch (err) {
        console.error(err)
      }
    }

    let evtSource: EventSource | undefined
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined

    function startWatch() {
      evtSource = new EventSource(`${getBackendUrl()}${path}`, { withCredentials: true })
      eventSourceRef.current = evtSource
      evtSource.onmessage = processMessage
      evtSource.onerror = function () {
        console.log('EventSource', 'error', 'readyState', evtSource?.readyState)
        if (streamStoppedRef.current) return
        if (evtSource?.readyState === EventSource.CLOSED) {
          reconnectTimer = setTimeout(() => {
            startWatch()
          }, 1000)
        }
      }
    }
    startWatch()

    const timeout = setInterval(processEventQueue, THROTTLE_EVENTS_DELAY)
    processIntervalRef.current = timeout
    return () => {
      clearInterval(timeout)
      if (reconnectTimer) clearTimeout(reconnectTimer)
      if (evtSource) evtSource.close()
      eventSourceRef.current = undefined
      processIntervalRef.current = undefined
    }
  }, [eventSourceRef, path, processIntervalRef, restartKey, streamStoppedRef])
}
