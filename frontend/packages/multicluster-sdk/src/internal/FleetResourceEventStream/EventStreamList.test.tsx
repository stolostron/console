/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { EventStreamList } from './EventStreamList'

// mock dependencies
jest.mock('react-virtualized', () => ({
  List: jest.fn(),
  CellMeasurerCache: jest.fn(() => ({
    clearAll: jest.fn(),
    clear: jest.fn(),
  })),
}))

jest.mock('react-transition-group', () => ({
  CSSTransition: ({ children }: { children: (status: string) => React.ReactNode }) => children('entered'),
}))

describe('EventStreamList', () => {
  const MockEventComponent = jest.fn(() => <div>Mock Event</div>)

  const mockEvents = [
    {
      apiVersion: 'v1',
      kind: 'Event',
      metadata: {
        uid: 'event-1',
        name: 'test-event-1',
        namespace: 'default',
      },
      involvedObject: {
        kind: 'Pod',
        name: 'test-pod',
        namespace: 'default',
        uid: 'pod-1',
      },
      reason: 'Started',
      message: 'Test event 1',
      source: {
        component: 'kubelet',
        host: 'node-1',
      },
      firstTimestamp: '2023-01-01T00:00:00Z',
      lastTimestamp: '2023-01-01T00:00:00Z',
      count: 1,
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render without crashing when events array is not empty', () => {
    expect(() => {
      render(<EventStreamList events={mockEvents} EventComponent={MockEventComponent} />)
    }).not.toThrow()
  })

  it('should render without crashing when events array is empty', () => {
    expect(() => {
      render(<EventStreamList events={[]} EventComponent={MockEventComponent} />)
    }).not.toThrow()
  })

  it('should render without crashing with custom className', () => {
    expect(() => {
      render(<EventStreamList events={mockEvents} EventComponent={MockEventComponent} className="custom-class" />)
    }).not.toThrow()
  })
})
