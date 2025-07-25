/* Copyright Contributors to the Open Cluster Management project */
import { MAX_MESSAGES, EventInvolvedObject, EventKind } from './constants'

describe('constants', () => {
  describe('MAX_MESSAGES', () => {
    it('should be set to 500', () => {
      expect(MAX_MESSAGES).toBe(500)
    })
  })

  describe('EventInvolvedObject type', () => {
    it('should allow all optional properties', () => {
      const involvedObject: EventInvolvedObject = {
        apiVersion: 'v1',
        kind: 'Pod',
        name: 'test-pod',
        uid: 'test-uid',
        namespace: 'default',
      }

      expect(involvedObject.apiVersion).toBe('v1')
      expect(involvedObject.kind).toBe('Pod')
      expect(involvedObject.name).toBe('test-pod')
      expect(involvedObject.uid).toBe('test-uid')
      expect(involvedObject.namespace).toBe('default')
    })

    it('should allow partial properties', () => {
      const involvedObject: EventInvolvedObject = {
        kind: 'Pod',
        name: 'test-pod',
      }

      expect(involvedObject.kind).toBe('Pod')
      expect(involvedObject.name).toBe('test-pod')
      expect(involvedObject.apiVersion).toBeUndefined()
      expect(involvedObject.uid).toBeUndefined()
      expect(involvedObject.namespace).toBeUndefined()
    })

    it('should allow empty object', () => {
      const involvedObject: EventInvolvedObject = {}

      expect(involvedObject.apiVersion).toBeUndefined()
      expect(involvedObject.kind).toBeUndefined()
      expect(involvedObject.name).toBeUndefined()
      expect(involvedObject.uid).toBeUndefined()
      expect(involvedObject.namespace).toBeUndefined()
    })
  })

  describe('EventKind type', () => {
    it('should extend K8sResourceCommon with event-specific properties', () => {
      const event: EventKind = {
        apiVersion: 'v1',
        kind: 'Event',
        metadata: {
          name: 'test-event',
          namespace: 'default',
          uid: 'event-uid',
        },
        reportingComponent: 'kubelet',
        action: 'Started',
        count: 1,
        type: 'Normal',
        involvedObject: {
          kind: 'Pod',
          name: 'test-pod',
          uid: 'pod-uid',
          namespace: 'default',
        },
        message: 'Test event message',
        eventTime: '2023-01-01T00:00:00Z',
        lastTimestamp: '2023-01-01T00:00:00Z',
        firstTimestamp: '2023-01-01T00:00:00Z',
        reason: 'Started',
        source: {
          component: 'kubelet',
          host: 'node-1',
        },
        series: {
          count: 1,
          lastObservedTime: '2023-01-01T00:00:00Z',
          state: 'Ongoing',
        },
      }

      // test K8sResourceCommon properties
      expect(event.apiVersion).toBe('v1')
      expect(event.kind).toBe('Event')
      expect(event.metadata?.name).toBe('test-event')

      // test EventKind specific properties
      expect(event.reportingComponent).toBe('kubelet')
      expect(event.action).toBe('Started')
      expect(event.count).toBe(1)
      expect(event.type).toBe('Normal')
      expect(event.involvedObject.kind).toBe('Pod')
      expect(event.message).toBe('Test event message')
      expect(event.reason).toBe('Started')
      expect(event.source.component).toBe('kubelet')
      expect(event.source.host).toBe('node-1')
      expect(event.series?.count).toBe(1)
      expect(event.series?.state).toBe('Ongoing')
    })

    it('should allow minimal event with required properties', () => {
      const event: EventKind = {
        apiVersion: 'v1',
        kind: 'Event',
        metadata: {
          name: 'test-event',
        },
        involvedObject: {
          kind: 'Pod',
          name: 'test-pod',
        },
        source: {
          component: 'kubelet',
        },
      }

      expect(event.apiVersion).toBe('v1')
      expect(event.kind).toBe('Event')
      expect(event.involvedObject.kind).toBe('Pod')
      expect(event.source.component).toBe('kubelet')
    })
  })
})
