/* Copyright Contributors to the Open Cluster Management project */
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import type { WatchEvent } from '../atoms'
import type { IResource } from '../resources'

export function resourceKey(object: WatchEvent['object']): string {
  return `${object.metadata.namespace}/${object.metadata.name}`
}

export function applyWatchEventsToCache(cache: Record<string, IResource>, watchEvents: WatchEvent[]): void {
  for (const watchEvent of watchEvents) {
    const key = resourceKey(watchEvent.object)
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
}

export function groupWatchEventsByKind(watchEvents: WatchEvent[]): Record<string, Record<string, WatchEvent[]>> {
  return watchEvents.reduce(
    (resourceTypeMap, eventData) => {
      const groupVersion = eventData.object.apiVersion.split('/')[0]
      const kind = eventData.object.kind
      if (!resourceTypeMap[groupVersion]) resourceTypeMap[groupVersion] = {}
      if (!resourceTypeMap[groupVersion][kind]) resourceTypeMap[groupVersion][kind] = []
      resourceTypeMap[groupVersion][kind].push(eventData)
      return resourceTypeMap
    },
    {} as Record<string, Record<string, WatchEvent[]>>
  )
}
