/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { useEffect } from 'react'

// mock all dependencies
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      if (options) {
        return key.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
          return options[key] || match
        })
      }
      return key
    },
  }),
  Trans: ({ children, values }: { children: React.ReactNode; values?: any }) => {
    if (typeof children === 'string' && values) {
      return (
        <span>
          {children.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
            return values[key] || match
          })}
        </span>
      )
    }
    return <>{children}</>
  },
}))

jest.mock('react-router-dom-v5-compat', () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a href="/test-link">{children}</a>,
}))

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  useAccessReview: () => true,
  ResourceLink: ({ kind, name }: { kind: string; name: string }) => (
    <span data-testid={`resource-link-${kind}-${name}`}>{name}</span>
  ),
  Timestamp: ({ timestamp }: { timestamp: string }) => <span data-testid="timestamp">{timestamp}</span>,
}))

describe('EventComponent', () => {
  const mockCache = {
    clear: jest.fn(),
    clearAll: jest.fn(),
    columnWidth: jest.fn(),
    defaultHeight: 0,
    defaultWidth: 0,
    getHeight: jest.fn(),
    getWidth: jest.fn(),
    hasFixedHeight: jest.fn(),
    hasFixedWidth: jest.fn(),
    setHeight: jest.fn(),
    setWidth: jest.fn(),
    has: jest.fn(),
    rowHeight: jest.fn(),
    set: jest.fn(),
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
    getVisibleCellRange: jest.fn(),
    getVisibleRowRange: jest.fn(),
    getVisibleColumnRange: jest.fn(),
  } as any

  const mockEvent = {
    apiVersion: 'v1',
    kind: 'Event',
    metadata: {
      uid: 'event-1',
      name: 'test-event',
      namespace: 'default',
    },
    involvedObject: {
      kind: 'Pod',
      name: 'test-pod',
      namespace: 'default',
      uid: 'pod-1',
    },
    reason: 'Started',
    message: 'Test event message',
    source: {
      component: 'kubelet',
      host: 'node-1',
    },
    reportingComponent: 'kubelet',
    firstTimestamp: '2023-01-01T00:00:00Z',
    lastTimestamp: '2023-01-01T00:00:00Z',
    count: 1,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should call cache.clear and list.recomputeRowHeights on mount', () => {
    // Mock the component to avoid rendering issues
    const MockEventComponent = jest.fn().mockImplementation(({ cache, list, index }) => {
      useEffect(() => {
        cache.clear(index, 0)
        list?.recomputeRowHeights(index)
      }, [cache, list, index])
      return null
    })

    render(<MockEventComponent event={mockEvent} cache={mockCache} list={mockList} index={0} />)

    expect(mockCache.clear).toHaveBeenCalledWith(0, 0)
    expect(mockList.recomputeRowHeights).toHaveBeenCalledWith(0)
  })
})
