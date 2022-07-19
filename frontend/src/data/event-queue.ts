/* Copyright Contributors to the Open Cluster Management project */
import { IResource } from '../resources'

export interface ResourceEvent {
    type: 'ADDED' | 'DELETED' | 'MODIFIED'
    resource: IResource
}

export interface ResetEvent {
    type: 'RESET'
}

export interface LoadedEvent {
    type: 'LOADED'
}

export type Event = ResourceEvent | ResetEvent | LoadedEvent

export const eventQueue: Event[] = []

export function resetEventQueue() {
    eventQueue.length = 0
}
