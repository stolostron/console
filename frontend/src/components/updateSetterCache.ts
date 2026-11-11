/* Copyright Contributors to the Open Cluster Management project */

// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import type { WatchEvent } from '../atoms'
import type { IResource } from '../resources'

export function updateSetterCache(
  caches: Record<string, Record<string, Record<string, IResource>>>,
  groupVersion: string,
  kind: string,
  watchEvents: WatchEvent[]
) {
  const cache = caches[groupVersion]?.[kind]
  for (const watchEvent of watchEvents) {
    const key = `${watchEvent.object.metadata.namespace ?? ''}/${watchEvent.object.metadata.name}`
    switch (watchEvent.type) {
      case 'ADDED':
      case 'MODIFIED':
        cache[key] = watchEvent.object as IResource
        break
      case 'DELETED':
        delete cache[key]
        break
    }
  }
}
