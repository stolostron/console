/* Copyright Contributors to the Open Cluster Management project */
import { MAX_MESSAGES, EventInvolvedObject, EventKind } from './constants'

describe('constants', () => {
  describe('MAX_MESSAGES', () => {
    it('should export MAX_MESSAGES constant', () => {
      expect(MAX_MESSAGES).toBe(500)
    })
  })

  describe('EventInvolvedObject type', () => {
    it('should allow optional properties', () => {
      const eventInvolvedObject: EventInvolvedObject = {
        apiVersion: 'v1',
        kind: 'Pod',
        name: 'test-pod',
        uid: '123',
        namespace: 'default',
      }

      expect(eventInvolvedObject.apiVersion).toBe('v1')
      expect(eventInvolvedObject.kind).toBe('Pod')
      expect(eventInvolvedObject.name).toBe('test-pod')
      expect(eventInvolvedObject.uid).toBe('123')
      expect(eventInvolvedObject.namespace).toBe('default')
    })

    it('should allow partial properties', () => {
      const eventInvolvedObject: EventInvolvedObject = {
        kind: 'Pod',
        name: 'test-pod',
      }

      expect(eventInvolvedObject.kind).toBe('Pod')
      expect(eventInvolvedObject.name).toBe('test-pod')
      expect(eventInvolvedObject.apiVersion).toBeUndefined()
      expect(eventInvolvedObject.uid).toBeUndefined()
      expect(eventInvolvedObject.namespace).toBeUndefined()
    })
  })

  describe('EventKind type', () => {
    it('should allow all optional properties', () => {
      const eventKind: EventKind = {
        reportingComponent: 'test-component',
        action: 'test-action',
        count: 5,
        type: 'Normal',
        involvedObject: {
          kind: 'Pod',
          name: 'test-pod',
        },
        message: 'Test message',
        eventTime: '2023-01-01T00:00:00Z',
        lastTimestamp: '2023-01-01T00:00:00Z',
        firstTimestamp: '2023-01-01T00:00:00Z',
        reason: 'TestReason',
        source: {
          component: 'test-source',
          host: 'test-host',
        },
        series: {
          count: 3,
          lastObservedTime: '2023-01-01T00:00:00Z',
          state: 'active',
        },
        apiVersion: 'v1',
        kind: 'Event',
        metadata: {
          name: 'test-event',
          uid: '123',
        },
      }

      expect(eventKind.reportingComponent).toBe('test-component')
      expect(eventKind.action).toBe('test-action')
      expect(eventKind.count).toBe(5)
      expect(eventKind.type).toBe('Normal')
      expect(eventKind.message).toBe('Test message')
      expect(eventKind.eventTime).toBe('2023-01-01T00:00:00Z')
      expect(eventKind.lastTimestamp).toBe('2023-01-01T00:00:00Z')
      expect(eventKind.firstTimestamp).toBe('2023-01-01T00:00:00Z')
      expect(eventKind.reason).toBe('TestReason')
      expect(eventKind.source.component).toBe('test-source')
      expect(eventKind.source.host).toBe('test-host')
      expect(eventKind.series?.count).toBe(3)
      expect(eventKind.series?.lastObservedTime).toBe('2023-01-01T00:00:00Z')
      expect(eventKind.series?.state).toBe('active')
    })

    it('should allow minimal required properties', () => {
      const eventKind: EventKind = {
        involvedObject: {
          kind: 'Pod',
          name: 'test-pod',
        },
        source: {
          component: 'test-source',
        },
        apiVersion: 'v1',
        kind: 'Event',
        metadata: {
          name: 'test-event',
          uid: '123',
        },
      }

      expect(eventKind.involvedObject.kind).toBe('Pod')
      expect(eventKind.source.component).toBe('test-source')
      expect(eventKind.reportingComponent).toBeUndefined()
      expect(eventKind.action).toBeUndefined()
      expect(eventKind.count).toBeUndefined()
      expect(eventKind.type).toBeUndefined()
      expect(eventKind.message).toBeUndefined()
      expect(eventKind.eventTime).toBeUndefined()
      expect(eventKind.lastTimestamp).toBeUndefined()
      expect(eventKind.firstTimestamp).toBeUndefined()
      expect(eventKind.reason).toBeUndefined()
      expect(eventKind.source.host).toBeUndefined()
      expect(eventKind.series).toBeUndefined()
    })
  })
})
