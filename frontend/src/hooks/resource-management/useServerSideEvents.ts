/* Copyright Contributors to the Open Cluster Management project */
import get from 'lodash/get'
import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useSetRecoilState } from 'recoil'
import { settingsState, WatchEvent } from '../../atoms'
import { PluginDataContext } from '../../lib/PluginDataContext'
import { IResource } from '../../resources'
import { getBackendUrl } from '../../resources/utils'
import { EventProcessingOptions, ResourceSetterRegistry, ServerSideEventData } from './types'

interface UseServerSideEventsProps {
  registry: ResourceSetterRegistry
  options?: EventProcessingOptions
}

interface UseServerSideEventsResult {
  eventsLoaded: boolean
  eventSource: EventSource | null
}

/**
 * Custom hook that manages Server-Side Events from the backend and processes
 * resource watch events to update the application state.
 */
export function useServerSideEvents({ registry, options = {} }: UseServerSideEventsProps): UseServerSideEventsResult {
  const { setLoadStarted } = useContext(PluginDataContext)
  const [eventsLoaded, setEventsLoaded] = useState(false)
  const [eventSource, setEventSource] = useState<EventSource | null>(null)
  const setSettings = useSetRecoilState(settingsState)

  const eventQueueRef = useRef<WatchEvent[]>([])
  const { setters, mappers, caches } = registry

  const { onEventProcessed, processInterval = 500 } = options

  /**
   * Processes watch events for simple array-based resources
   */
  const processArrayResource = useCallback((setter: any, cache: Record<string, IResource>, watchEvents: WatchEvent[]) => {
    setter(() => {
      for (const watchEvent of watchEvents) {
        const key = `${watchEvent.object.metadata.namespace}/${watchEvent.object.metadata.name}`

        switch (watchEvent.type) {
          case 'ADDED':
          case 'MODIFIED':
            cache[key] = watchEvent.object
            break
          case 'DELETED':
            delete cache[key]
            break
        }
      }
      return Object.values(cache)
    })
  }, [])

  /**
   * Processes watch events for mapped resources (keyed by namespace, etc.)
   */
  const processMappedResource = useCallback((
    mapper: {
      setter: any
      mcaches: Record<string, Record<string, Record<string, IResource[]>>>
      keyBy: string[]
    },
    watchEvents: WatchEvent[]
  ) => {
    const { setter, mcaches, keyBy } = mapper

    setter(() => {
      const map = mcaches[Object.keys(mcaches)[0]]?.[Object.keys(mcaches[Object.keys(mcaches)[0]])[0]]

      for (const watchEvent of watchEvents) {
        // Build the key from the specified key fields
        const key = keyBy
          .map((partKey) => get(watchEvent.object, partKey))
          .filter(Boolean)
          .join('/')

        if (!map[key]) map[key] = []
        const arr = map[key]

        const index = arr.findIndex(
          (resource) =>
            resource.metadata?.name === watchEvent.object.metadata.name &&
            resource.metadata?.namespace === watchEvent.object.metadata.namespace
        )

        switch (watchEvent.type) {
          case 'ADDED':
          case 'MODIFIED':
            if (index !== -1) {
              arr[index] = watchEvent.object
            } else {
              arr.push(watchEvent.object)
            }
            break
          case 'DELETED':
            if (index !== -1) {
              arr.splice(index, 1)
            }
            break
        }
      }

      return { ...map }
    })
  }, [])

  /**
   * Processes a batch of watch events and updates the corresponding resource states
   */
  const processEventQueue = useCallback(() => {
    const eventQueue = eventQueueRef.current
    if (eventQueue.length === 0) return

    // Group events by resource type for efficient processing
    const resourceTypeMap = eventQueue.reduce(
      (acc, eventData) => {
        const apiVersion = eventData.object.apiVersion
        const groupVersion = apiVersion.split('/')[0]
        const kind = eventData.object.kind

        if (!acc[groupVersion]) acc[groupVersion] = {}
        if (!acc[groupVersion][kind]) acc[groupVersion][kind] = []
        acc[groupVersion][kind].push(eventData)

        return acc
      },
      {} as Record<string, Record<string, WatchEvent[]>>
    )

    // Clear the queue
    eventQueue.length = 0

    // Process each resource type
    let totalProcessed = 0
    for (const groupVersion in resourceTypeMap) {
      for (const kind in resourceTypeMap[groupVersion]) {
        const watchEvents = resourceTypeMap[groupVersion]?.[kind]
        if (!watchEvents) continue

        const setter = setters[groupVersion]?.[kind]
        if (setter) {
          // Handle simple array-based resources
          processArrayResource(setter, caches[groupVersion]?.[kind], watchEvents)
          totalProcessed += watchEvents.length
        } else {
          // Handle mapped resources (keyed by namespace, etc.)
          const mapper = mappers[groupVersion]?.[kind]
          if (mapper) {
            processMappedResource(mapper, watchEvents)
            totalProcessed += watchEvents.length
          }
        }
      }
    }

    // Notify about processed events
    if (onEventProcessed && totalProcessed > 0) {
      onEventProcessed('batch', totalProcessed)
    }
  }, [setters, mappers, caches, onEventProcessed, processArrayResource, processMappedResource])

  /**
   * Processes incoming Server-Side Event messages
   */
  const processMessage = useCallback((event: MessageEvent) => {
    if (!event.data) return

    try {
      const data = JSON.parse(event.data) as ServerSideEventData

      switch (data.type) {
        case 'ADDED':
        case 'MODIFIED':
        case 'DELETED':
          if (data.object) {
            eventQueueRef.current.push(data as WatchEvent)
          }
          break

        case 'START':
          eventQueueRef.current.length = 0
          break

        case 'EOP': // End of Packet
          setLoadStarted(() => {
            processEventQueue()
            return true
          })
          break

        case 'LOADED':
          setEventsLoaded((prevLoaded) => {
            if (!prevLoaded) {
              processEventQueue()
            }
            return true
          })
          break

        case 'SETTINGS':
          if (data.settings) {
            setSettings(data.settings)
          }
          break
      }
    } catch (err) {
      console.error('Failed to process SSE message:', err)
    }
  }, [setLoadStarted, setEventsLoaded, setSettings, processEventQueue])

  /**
   * Starts the Server-Side Events connection
   */
  const startWatch = useCallback(() => {
    const evtSource = new EventSource(`${getBackendUrl()}/events`, {
      withCredentials: true,
    })

    evtSource.onmessage = processMessage
    evtSource.onerror = () => {
      console.log('EventSource error, readyState:', evtSource.readyState)

      if (evtSource.readyState === EventSource.CLOSED) {
        // Reconnect after a delay
        setTimeout(() => {
          startWatch()
        }, 1000)
      }
    }

    setEventSource(evtSource)
    return evtSource
  }, [processMessage])

  // Set up the Server-Side Events connection and processing interval
  useEffect(() => {
    const evtSource = startWatch()
    const interval = setInterval(processEventQueue, processInterval)

    return () => {
      clearInterval(interval)
      if (evtSource) {
        evtSource.close()
      }
    }
    // This effect should only run once to establish the SSE connection
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    eventsLoaded,
    eventSource,
  }
}
