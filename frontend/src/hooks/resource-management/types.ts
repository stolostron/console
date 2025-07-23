/* Copyright Contributors to the Open Cluster Management project */
import { SetterOrUpdater } from 'recoil'
import { IResource } from '../../resources'
import { WatchEvent } from '../../atoms'

export interface ResourceSetter {
  apiVersion: string
  kind: string
  setter: SetterOrUpdater<any[]>
}

export interface ResourceMapper {
  apiVersion: string
  kind: string
  setter: SetterOrUpdater<Record<string, any[]>>
  keyBy: string[]
}

export interface ResourceSetterRegistry {
  setters: Record<string, Record<string, SetterOrUpdater<any[]>>>
  mappers: Record<
    string,
    Record<
      string,
      {
        setter: SetterOrUpdater<Record<string, any[]>>
        mcaches: Record<string, Record<string, Record<string, IResource[]>>>
        keyBy: string[]
      }
    >
  >
  caches: Record<string, Record<string, Record<string, IResource>>>
}

export interface EventProcessingOptions {
  onEventProcessed?: (eventType: string, resourceCount: number) => void
  batchSize?: number
  processInterval?: number
}

export interface GlobalStateData {
  isGlobalHub: boolean
  localHubName: string
  isHubSelfManaged: boolean | undefined
}

export interface ServerSideEventData {
  type: 'ADDED' | 'MODIFIED' | 'DELETED' | 'START' | 'EOP' | 'LOADED' | 'SETTINGS'
  object?: IResource
  settings?: any
}

export type ResourceEventHandler = (events: WatchEvent[]) => void
