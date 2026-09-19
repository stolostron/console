/* Copyright Contributors to the Open Cluster Management project */
import { ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { SetterOrUpdater } from 'recoil'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { useEventStreamIdleGracePeriod, useEventStreamIdleTimeout, WatchEvent } from '../atoms'
import { applyWatchEventsToCache, groupWatchEventsByKind } from '../hooks/applyWatchEventsToCache'
import { useWatchEventStream } from '../hooks/useWatchEventStream'
import { PluginDataContext } from '../lib/PluginDataContext'
import { usePageActivity } from '../lib/usePageActivity'
import type { IResource } from '../resources'

export interface StreamResource {
  apiVersion: string
  kind: string
  setState: SetterOrUpdater<any[]>
}

export interface LoadedContext {
  isReconnecting: boolean
}

export interface LoadDataAbstractProps {
  path: string
  /** Recoil atom contract for simple single-kind (or few-kind) streams. */
  resources?: StreamResource[]
  /** Escape hatch for streams that need custom caches (mappers, reconnect flush). */
  applyWatchEvents?: (events: WatchEvent[]) => void
  reset?: () => void
  onSettings?: (settings: Record<string, string>) => void
  onEndOfPacket?: () => void
  onLoaded?: (ctx: LoadedContext) => void
  /** When true, drive PluginDataContext idle/reconnect overlay. Default false. */
  driveAppLifecycle?: boolean
  children?: ReactNode
}

function resourceCacheKey(apiVersion: string, kind: string): string {
  return `${apiVersion.split('/')[0]}/${kind}`
}

export function LoadDataAbstract(props: LoadDataAbstractProps) {
  const { mounted, setIsStreamIdle, setIsReconnecting } = useContext(PluginDataContext)
  const idleTimeoutMs = useEventStreamIdleTimeout()
  const gracePeriodMs = useEventStreamIdleGracePeriod()
  const { isActive } = usePageActivity(idleTimeoutMs, mounted)
  const wasActiveRef = useRef(true)
  const isReconnectingRef = useRef(false)
  const streamStoppedRef = useRef(false)
  const graceTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const eventSourceRef = useRef<EventSource>()
  const processIntervalRef = useRef<ReturnType<typeof setInterval>>()
  const [restartKey, setRestartKey] = useState(0)
  const cachesRef = useRef<Record<string, Record<string, IResource>>>({})

  const resourcesRef = useRef(props.resources)
  resourcesRef.current = props.resources
  const applyWatchEventsRef = useRef(props.applyWatchEvents)
  applyWatchEventsRef.current = props.applyWatchEvents
  const resetRef = useRef(props.reset)
  resetRef.current = props.reset
  const onLoadedRef = useRef(props.onLoaded)
  onLoadedRef.current = props.onLoaded
  const driveAppLifecycle = props.driveAppLifecycle ?? false

  const applyFromResources = useCallback((events: WatchEvent[]) => {
    const resources = resourcesRef.current
    if (!resources?.length) return
    const grouped = groupWatchEventsByKind(events)
    for (const resource of resources) {
      const groupVersion = resource.apiVersion.split('/')[0]
      const watchEvents = grouped[groupVersion]?.[resource.kind]
      if (!watchEvents) continue
      const cacheKey = resourceCacheKey(resource.apiVersion, resource.kind)
      if (!cachesRef.current[cacheKey]) cachesRef.current[cacheKey] = {}
      applyWatchEventsToCache(cachesRef.current[cacheKey], watchEvents)
      resource.setState(Object.values(cachesRef.current[cacheKey]))
    }
  }, [])

  const resetFromResources = useCallback(() => {
    const resources = resourcesRef.current
    if (!resources?.length) return
    for (const resource of resources) {
      const cacheKey = resourceCacheKey(resource.apiVersion, resource.kind)
      cachesRef.current[cacheKey] = {}
      resource.setState([])
    }
  }, [])

  const applyWatchEvents = useCallback(
    (events: WatchEvent[]) => {
      if (applyWatchEventsRef.current) {
        applyWatchEventsRef.current(events)
        return
      }
      applyFromResources(events)
    },
    [applyFromResources]
  )

  const handleReset = useCallback(() => {
    if (resetRef.current) {
      resetRef.current()
      return
    }
    resetFromResources()
  }, [resetFromResources])

  const stopStream = useCallback(() => {
    streamStoppedRef.current = true
    eventSourceRef.current?.close()
    eventSourceRef.current = undefined
    if (processIntervalRef.current) {
      clearInterval(processIntervalRef.current)
      processIntervalRef.current = undefined
    }
  }, [])

  useEffect(() => {
    if (!isActive && wasActiveRef.current) {
      wasActiveRef.current = false
      if (driveAppLifecycle) {
        setIsStreamIdle(true)
      }
      if (gracePeriodMs <= 0) {
        stopStream()
      } else {
        graceTimerRef.current = setTimeout(stopStream, gracePeriodMs)
      }
    } else if (isActive && !wasActiveRef.current) {
      wasActiveRef.current = true
      if (graceTimerRef.current) {
        clearTimeout(graceTimerRef.current)
        graceTimerRef.current = undefined
      }
      if (streamStoppedRef.current) {
        streamStoppedRef.current = false
        isReconnectingRef.current = true
        if (driveAppLifecycle) {
          setIsStreamIdle(false)
          setIsReconnecting(true)
        }
        handleReset()
        setRestartKey((k) => k + 1)
      } else if (driveAppLifecycle) {
        setIsStreamIdle(false)
      }
    }
  }, [driveAppLifecycle, gracePeriodMs, handleReset, isActive, setIsReconnecting, setIsStreamIdle, stopStream])

  const onLoaded = useCallback(() => {
    const isReconnecting = isReconnectingRef.current
    onLoadedRef.current?.({ isReconnecting })
    if (isReconnecting) {
      isReconnectingRef.current = false
      if (driveAppLifecycle) {
        setIsReconnecting(false)
      }
    }
  }, [driveAppLifecycle, setIsReconnecting])

  useWatchEventStream({
    path: props.path,
    restartKey,
    streamStoppedRef,
    eventSourceRef,
    processIntervalRef,
    applyWatchEvents,
    onSettings: props.onSettings,
    onEndOfPacket: props.onEndOfPacket,
    onLoaded,
  })

  return useMemo(() => (props.children ? <>{props.children}</> : null), [props.children])
}
