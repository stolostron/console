/* Copyright Contributors to the Open Cluster Management project */
import { EventKind } from './constants'
import {
  getFirstTime,
  getLastTime,
  sortEvents,
  getParentScrollableElement,
  referenceFor,
  groupVersionFor,
  resourcePathFromModel,
  typeFilter,
  EventModel,
  NodeModel,
} from './utils'

describe('utils', () => {
  describe('getFirstTime', () => {
    it('should return firstTimestamp when available', () => {
      const event: EventKind = {
        apiVersion: 'v1',
        kind: 'Event',
        metadata: { name: 'test' },
        firstTimestamp: '2023-01-01T00:00:00Z',
        eventTime: '2023-01-01T00:01:00Z',
      } as EventKind

      expect(getFirstTime(event)).toBe('2023-01-01T00:00:00Z')
    })

    it('should return eventTime when firstTimestamp is not available', () => {
      const event: EventKind = {
        apiVersion: 'v1',
        kind: 'Event',
        metadata: { name: 'test' },
        eventTime: '2023-01-01T00:01:00Z',
      } as EventKind

      expect(getFirstTime(event)).toBe('2023-01-01T00:01:00Z')
    })

    it('should return undefined when neither is available', () => {
      const event: EventKind = {
        apiVersion: 'v1',
        kind: 'Event',
        metadata: { name: 'test' },
      } as EventKind

      expect(getFirstTime(event)).toBeUndefined()
    })
  })

  describe('getLastTime', () => {
    it('should return lastTimestamp when available', () => {
      const event: EventKind = {
        apiVersion: 'v1',
        kind: 'Event',
        metadata: { name: 'test' },
        lastTimestamp: '2023-01-01T00:00:00Z',
        eventTime: '2023-01-01T00:01:00Z',
      } as EventKind

      expect(getLastTime(event)).toBe('2023-01-01T00:00:00Z')
    })

    it('should return series.lastObservedTime when lastTimestamp is not available', () => {
      const event: EventKind = {
        apiVersion: 'v1',
        kind: 'Event',
        metadata: { name: 'test' },
        series: {
          count: 1,
          lastObservedTime: '2023-01-01T00:00:00Z',
        },
        eventTime: '2023-01-01T00:01:00Z',
      } as EventKind

      expect(getLastTime(event)).toBe('2023-01-01T00:00:00Z')
    })

    it('should return eventTime when neither lastTimestamp nor series is available', () => {
      const event: EventKind = {
        apiVersion: 'v1',
        kind: 'Event',
        metadata: { name: 'test' },
        eventTime: '2023-01-01T00:01:00Z',
      } as EventKind

      expect(getLastTime(event)).toBe('2023-01-01T00:01:00Z')
    })
  })

  describe('sortEvents', () => {
    it('should sort events by last time, first time, and name', () => {
      const events: EventKind[] = [
        {
          apiVersion: 'v1',
          kind: 'Event',
          metadata: { name: 'event-2' },
          lastTimestamp: '2023-01-01T00:02:00Z',
          firstTimestamp: '2023-01-01T00:01:00Z',
        },
        {
          apiVersion: 'v1',
          kind: 'Event',
          metadata: { name: 'event-1' },
          lastTimestamp: '2023-01-01T00:02:00Z',
          firstTimestamp: '2023-01-01T00:01:00Z',
        },
        {
          apiVersion: 'v1',
          kind: 'Event',
          metadata: { name: 'event-3' },
          lastTimestamp: '2023-01-01T00:03:00Z',
          firstTimestamp: '2023-01-01T00:01:00Z',
        },
      ] as EventKind[]

      const sorted = sortEvents(events)
      expect(sorted[0]?.metadata?.name).toBe('event-3')
      expect(sorted[1]?.metadata?.name).toBe('event-2')
      expect(sorted[2]?.metadata?.name).toBe('event-1')
    })
  })

  describe('getParentScrollableElement', () => {
    it('should return undefined when no scrollable parent is found', () => {
      const element = document.createElement('div')
      element.style.overflow = 'visible'

      expect(getParentScrollableElement(element)).toBeUndefined()
    })

    it('should return element with scroll overflow', () => {
      const parent = document.createElement('div')
      parent.style.overflow = 'scroll'
      const child = document.createElement('div')
      parent.appendChild(child)

      expect(getParentScrollableElement(child)).toBe(parent)
    })

    it('should return element with auto overflow', () => {
      const parent = document.createElement('div')
      parent.style.overflow = 'auto'
      const child = document.createElement('div')
      parent.appendChild(child)

      expect(getParentScrollableElement(child)).toBe(parent)
    })
  })

  describe('referenceFor', () => {
    it('should return empty string when kind is not provided', () => {
      expect(referenceFor({} as any)).toBe('')
    })

    it('should return core reference for core resources', () => {
      expect(referenceFor({ kind: 'Pod', apiVersion: 'v1' } as any)).toBe('core~v1~Pod')
    })

    it('should return group reference for non-core resources', () => {
      expect(referenceFor({ kind: 'Deployment', apiVersion: 'apps/v1' } as any)).toBe('apps~v1~Deployment')
    })
  })

  describe('groupVersionFor', () => {
    it('should parse core apiVersion', () => {
      expect(groupVersionFor('v1')).toEqual({ group: 'core', version: 'v1' })
    })

    it('should parse group apiVersion', () => {
      expect(groupVersionFor('apps/v1')).toEqual({ group: 'apps', version: 'v1' })
    })
  })

  describe('resourcePathFromModel', () => {
    it('should generate path for namespaced resource', () => {
      const path = resourcePathFromModel(EventModel, 'test-event', 'default')
      expect(path).toBe('/k8s/ns/default/events/test-event')
    })

    it('should generate path for cluster-scoped resource', () => {
      const path = resourcePathFromModel(NodeModel, 'test-node')
      expect(path).toBe('/k8s/cluster/nodes/test-node')
    })

    it('should generate path for namespaced resource without namespace', () => {
      const path = resourcePathFromModel(EventModel, 'test-event')
      expect(path).toBe('/k8s/all-namespaces/events/test-event')
    })

    it('should handle special characters in name', () => {
      const path = resourcePathFromModel(EventModel, 'test#event', 'default')
      expect(path).toBe('/k8s/ns/default/events/test%23event')
    })
  })

  describe('typeFilter', () => {
    it('should return true for all event type', () => {
      const event = { type: 'normal' } as EventKind
      expect(typeFilter('all', event)).toBe(true)
    })

    it('should return true for matching event type', () => {
      const event = { type: 'warning' } as EventKind
      expect(typeFilter('warning', event)).toBe(true)
    })

    it('should return false for non-matching event type', () => {
      const event = { type: 'normal' } as EventKind
      expect(typeFilter('warning', event)).toBe(false)
    })

    it('should default to normal type', () => {
      const event = {} as EventKind
      expect(typeFilter('normal', event)).toBe(true)
    })
  })

  describe('models', () => {
    it('should export EventModel with correct properties', () => {
      expect(EventModel.kind).toBe('Event')
      expect(EventModel.plural).toBe('events')
      expect(EventModel.namespaced).toBe(true)
    })

    it('should export NodeModel with correct properties', () => {
      expect(NodeModel.kind).toBe('Node')
      expect(NodeModel.plural).toBe('nodes')
      expect(NodeModel.namespaced).toBeUndefined()
    })
  })
})
