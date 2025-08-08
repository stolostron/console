/* Copyright Contributors to the Open Cluster Management project */
import React from 'react'
import { render, screen } from '@testing-library/react'
import EventComponent from './EventComponent'

// mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      if (options?.sourceComponent) {
        return `Generated from ${options.sourceComponent}`
      }
      if (options?.sourceHost) {
        return `on ${options.sourceHost}`
      }
      return key
    },
  }),
  Trans: ({ children, values }: { children: React.ReactNode; values?: any }) => {
    if (values?.sourceComponent) {
      return <span>Generated from {values.sourceComponent}</span>
    }
    if (values?.eventCount) {
      return <span>{values.eventCount} times</span>
    }
    return <span>{children}</span>
  },
}))

// mock router
jest.mock('react-router-dom-v5-compat', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
}))

// mock dynamic plugin SDK
jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  ResourceLink: ({ name, kind }: { name: string; kind: string }) => (
    <span>
      {name} ({kind})
    </span>
  ),
  Timestamp: ({ timestamp }: { timestamp: string }) => <span>{timestamp}</span>,
  useAccessReview: () => [false, true], // return false
  K8sVerb: {},
}))

// mock utils
jest.mock('./utils', () => ({
  getFirstTime: () => null,
  getLastTime: () => '2024-01-01T00:00:00Z',
  NodeModel: { apiGroup: 'v1', plural: 'nodes' },
  referenceFor: () => 'Pod',
  resourcePathFromModel: () => '/nodes/test-node',
  typeFilter: () => false,
}))

describe('EventComponent', () => {
  it('renders without crashing and shows message', () => {
    const event = {
      message: 'Test event message',
      type: 'Normal',
      lastTimestamp: '2024-01-01T00:00:00Z',
      involvedObject: {
        kind: 'Pod',
        name: 'test-pod',
        namespace: 'default',
        apiVersion: 'v1',
        uid: 'uid',
      },
      count: 1,
      reason: 'Created',
      source: { component: 'test-component' },
      reportingComponent: '',
      reportingInstance: '',
      metadata: { uid: 'event-uid', name: 'event', namespace: 'default' },
      cluster: 'test-cluster',
    }

    // mock cache and list objects with required methods
    const mockCache = {
      clear: jest.fn(),
      clearAll: jest.fn(),
      columnWidth: jest.fn(),
      defaultHeight: 50,
      defaultWidth: 100,
      getHeight: jest.fn(),
      getWidth: jest.fn(),
      hasFixedHeight: jest.fn(),
      hasFixedWidth: jest.fn(),
      setHeight: jest.fn(),
      setWidth: jest.fn(),
    } as any

    const mockList = {
      recomputeRowHeights: jest.fn(),
      forceUpdateGrid: jest.fn(),
      getOffsetForRow: jest.fn(),
      invalidateCellSizeAfterRender: jest.fn(),
      measureAllRows: jest.fn(),
      scrollToPosition: jest.fn(),
      scrollToRow: jest.fn(),
      scrollToColumn: jest.fn(),
      getScrollPosition: jest.fn(),
      getScrollLeft: jest.fn(),
      getScrollTop: jest.fn(),
    } as any

    render(<EventComponent event={event as any} cache={mockCache} list={mockList} index={0} />)

    expect(screen.getByText('Test event message')).toBeInTheDocument()
    expect(screen.getByText('test-pod (Pod)')).toBeInTheDocument()
  })
})
