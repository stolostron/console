/* Copyright Contributors to the Open Cluster Management project */
import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import { FleetResourceEventStream } from './FleetResourceEventStream'
import { fleetWatch, useFleetK8sAPIPath, useHubClusterName } from '../api'

// mock the external dependencies
jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  ResourceEventStream: jest.fn(({ resource }) => (
    <div id="fallback-resource-event-stream">ResourceEventStream for {resource.metadata.name}</div>
  )),
}))

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      if (options) {
        return key.replace(/{{(\w+)}}/g, (match, placeholder) => options[placeholder] || match)
      }
      return key.replace('public~', '')
    },
  }),
}))

jest.mock('../api', () => ({
  fleetWatch: jest.fn(),
  useFleetK8sAPIPath: jest.fn(),
  useHubClusterName: jest.fn(),
}))

jest.mock('../internal/FleetResourceEventStream/utils', () => ({
  EventModel: {
    apiVersion: 'v1',
    kind: 'Event',
    plural: 'events',
  },
  sortEvents: jest.fn((events) => events.sort((a: any, b: any) => b.lastTimestamp?.localeCompare(a.lastTimestamp))),
}))

jest.mock('../internal/FleetResourceEventStream/constants', () => ({
  MAX_MESSAGES: 500,
}))

jest.mock('../internal/FleetResourceEventStream/TogglePlay', () =>
  jest.fn(({ active, onClick }) => (
    <button id="toggle-play" onClick={onClick}>
      {active ? 'Pause' : 'Play'}
    </button>
  ))
)

jest.mock('../internal/FleetResourceEventStream/EventStreamList', () => ({
  EventStreamList: jest.fn(({ events }) => <div id="event-stream-list">Events: {events.length}</div>),
}))

jest.mock('../internal/FleetResourceEventStream/EventComponent', () =>
  jest.fn(() => <div id="event-component">Event Component</div>)
)

// create typed mock references
const mockFleetWatch = jest.mocked(fleetWatch)
const mockUseFleetK8sAPIPath = jest.mocked(useFleetK8sAPIPath)
const mockUseHubClusterName = jest.mocked(useHubClusterName)

describe('FleetResourceEventStream', () => {
  const mockResource = {
    metadata: {
      name: 'test-pod',
      namespace: 'default',
      uid: 'test-uid',
    },
    kind: 'Pod',
    cluster: 'managed-cluster-1',
  }

  const mockWebSocket = {
    close: jest.fn(),
    onmessage: null as any,
    onopen: null as any,
    onclose: null as any,
    onerror: null as any,
    // add required WebSocket properties
    binaryType: 'blob' as BinaryType,
    bufferedAmount: 0,
    extensions: '',
    protocol: '',
    readyState: WebSocket.CONNECTING,
    url: 'ws://mock-url',
    send: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3,
  } as unknown as WebSocket

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseHubClusterName.mockReturnValue(['hub-cluster', true, undefined])
    mockUseFleetK8sAPIPath.mockReturnValue(['/api/proxy/plugin/acm/console/multicloud', true, undefined])
    mockFleetWatch.mockReturnValue(mockWebSocket)
  })

  it('should fall back to ResourceEventStream for hub cluster resources', () => {
    const hubResource = { ...mockResource, cluster: 'hub-cluster' }
    render(<FleetResourceEventStream resource={hubResource} />)

    expect(screen.getByTestId('fallback-resource-event-stream')).toBeInTheDocument()
  })

  it('should fall back to ResourceEventStream when no cluster is specified', () => {
    const { cluster, ...noClusterResource } = mockResource
    render(<FleetResourceEventStream resource={noClusterResource} />)

    expect(screen.getByTestId('fallback-resource-event-stream')).toBeInTheDocument()
  })

  it('should render fleet event stream for managed cluster resources', async () => {
    render(<FleetResourceEventStream resource={mockResource} />)

    await waitFor(() => {
      expect(screen.getByText('Loading events...')).toBeInTheDocument()
    })

    expect(mockFleetWatch).toHaveBeenCalledWith(
      expect.objectContaining({
        apiVersion: 'v1',
        kind: 'Event',
        plural: 'events',
      }),
      expect.objectContaining({
        cluster: 'managed-cluster-1',
        ns: 'default',
        fieldSelector: 'involvedObject.uid=test-uid,involvedObject.name=test-pod,involvedObject.kind=Pod',
      }),
      '/api/proxy/plugin/acm/console/multicloud'
    )
  })

  it('should handle websocket onopen event', async () => {
    render(<FleetResourceEventStream resource={mockResource} />)

    await waitFor(() => {
      expect(mockWebSocket.onopen).toBeDefined()
    })

    act(() => {
      mockWebSocket.onopen?.({} as Event)
    })

    await waitFor(() => {
      expect(screen.getByText('Streaming events...')).toBeInTheDocument()
    })
  })

  it('should handle websocket onmessage event', async () => {
    render(<FleetResourceEventStream resource={mockResource} />)

    await waitFor(() => {
      expect(mockWebSocket.onmessage).toBeDefined()
    })

    const mockEvent = {
      data: JSON.stringify({
        type: 'ADDED',
        object: {
          metadata: { uid: 'event-uid', name: 'test-event' },
          count: 1,
          lastTimestamp: '2023-01-01T00:00:00Z',
        },
      }),
    } as MessageEvent

    act(() => {
      mockWebSocket.onopen?.({} as Event) // First open the connection
    })

    act(() => {
      mockWebSocket.onmessage?.(mockEvent)
    })

    await waitFor(() => {
      expect(screen.getByText('Events: 1')).toBeInTheDocument()
    })
  })

  it('should handle websocket error', async () => {
    render(<FleetResourceEventStream resource={mockResource} />)

    await waitFor(() => {
      expect(mockWebSocket.onerror).toBeDefined()
    })

    act(() => {
      mockWebSocket.onerror?.({} as Event)
    })

    await waitFor(() => {
      expect(screen.getByTitle('Error loading events')).toBeInTheDocument()
    })
  })

  it('should handle websocket close', async () => {
    render(<FleetResourceEventStream resource={mockResource} />)

    await waitFor(() => {
      expect(mockWebSocket.onclose).toBeDefined()
    })

    act(() => {
      mockWebSocket.onclose?.({ wasClean: false, reason: 'Connection lost' } as CloseEvent)
    })

    await waitFor(() => {
      expect(screen.getByTitle('Error loading events')).toBeInTheDocument()
    })
  })

  it('should toggle play/pause state', async () => {
    render(<FleetResourceEventStream resource={mockResource} />)

    act(() => {
      mockWebSocket.onopen?.({} as Event)
    })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument()
    })

    const toggleButton = screen.getByRole('button', { name: /pause/i })
    expect(toggleButton).toHaveTextContent('Pause')

    act(() => {
      toggleButton.click()
    })

    expect(toggleButton).toHaveTextContent('Play')
  })

  it('should show empty state when no events', async () => {
    render(<FleetResourceEventStream resource={mockResource} />)

    act(() => {
      mockWebSocket.onopen?.({} as Event)
    })

    await waitFor(() => {
      expect(screen.getByTitle('No events')).toBeInTheDocument()
    })
  })

  it('should handle cluster-scoped resources without namespace', async () => {
    const clusterScopedResource = {
      metadata: {
        name: 'test-node',
        uid: 'node-uid',
      },
      kind: 'Node',
      cluster: 'managed-cluster-1',
    }

    render(<FleetResourceEventStream resource={clusterScopedResource} />)

    await waitFor(() => {
      expect(mockFleetWatch).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          cluster: 'managed-cluster-1',
          fieldSelector: 'involvedObject.uid=node-uid,involvedObject.name=test-node,involvedObject.kind=Node',
        }),
        expect.any(String)
      )
    })
  })

  it('should handle kubernetes 410 gone error silently', async () => {
    render(<FleetResourceEventStream resource={mockResource} />)

    await waitFor(() => {
      expect(mockWebSocket.onmessage).toBeDefined()
    })

    const mockError410Event = {
      data: JSON.stringify({
        type: 'ERROR',
        object: { code: 410, message: 'watch expired' },
      }),
    } as MessageEvent

    act(() => {
      mockWebSocket.onopen?.({} as Event)
    })

    act(() => {
      mockWebSocket.onmessage?.(mockError410Event)
    })

    // should not show error state for 410 gone
    await waitFor(() => {
      expect(screen.queryByTitle('Error loading events')).not.toBeInTheDocument()
    })

    // should clear events
    expect(screen.queryByText(/Events: /)).not.toBeInTheDocument()
  })

  it('should show error for infrastructure timeout (1006) until proper solution', async () => {
    render(<FleetResourceEventStream resource={mockResource} />)

    await waitFor(() => {
      expect(mockWebSocket.onclose).toBeDefined()
    })

    act(() => {
      mockWebSocket.onopen?.({} as Event)
    })

    act(() => {
      mockWebSocket.onclose?.({ code: 1006, wasClean: false, reason: '' } as CloseEvent)
    })

    // should show error state for infrastructure timeouts (until Zhao's heartbeat solution)
    await waitFor(() => {
      expect(screen.queryByTitle('Error loading events')).toBeInTheDocument()
    })
  })

  it('should handle genuine websocket errors properly', async () => {
    render(<FleetResourceEventStream resource={mockResource} />)

    await waitFor(() => {
      expect(mockWebSocket.onclose).toBeDefined()
    })

    act(() => {
      mockWebSocket.onopen?.({} as Event)
    })

    // test non-1006 error code
    act(() => {
      mockWebSocket.onclose?.({ code: 1002, wasClean: false, reason: 'Protocol error' } as CloseEvent)
    })

    await waitFor(() => {
      expect(screen.getByTitle('Error loading events')).toBeInTheDocument()
    })
  })

  it('should handle api errors other than 410 properly', async () => {
    render(<FleetResourceEventStream resource={mockResource} />)

    await waitFor(() => {
      expect(mockWebSocket.onmessage).toBeDefined()
    })

    const mockApiError = {
      data: JSON.stringify({
        type: 'ERROR',
        object: { code: 403, message: 'Forbidden' },
      }),
    } as MessageEvent

    act(() => {
      mockWebSocket.onopen?.({} as Event)
    })

    act(() => {
      mockWebSocket.onmessage?.(mockApiError)
    })

    await waitFor(() => {
      expect(screen.getByTitle('Error loading events')).toBeInTheDocument()
    })
  })

  it('should restart connection when infrastructure timeout occurs', async () => {
    jest.useFakeTimers()
    render(<FleetResourceEventStream resource={mockResource} />)

    await waitFor(() => {
      expect(mockWebSocket.onclose).toBeDefined()
    })

    act(() => {
      mockWebSocket.onopen?.({} as Event)
    })

    // clear the initial call
    mockFleetWatch.mockClear()

    act(() => {
      mockWebSocket.onclose?.({ code: 1006, wasClean: false, reason: '' } as CloseEvent)
    })

    // fast-forward past the 1000ms delay
    act(() => {
      jest.advanceTimersByTime(1100)
    })

    // should create a new connection after the delay
    await waitFor(() => {
      expect(mockFleetWatch).toHaveBeenCalledTimes(1)
    })

    jest.useRealTimers()
  })

  it('should handle normal websocket closure (1000) without error', async () => {
    render(<FleetResourceEventStream resource={mockResource} />)

    await waitFor(() => {
      expect(mockWebSocket.onclose).toBeDefined()
    })

    act(() => {
      mockWebSocket.onopen?.({} as Event)
    })

    // normal closure should not show error
    act(() => {
      mockWebSocket.onclose?.({ code: 1000, wasClean: true, reason: 'Normal closure' } as CloseEvent)
    })

    await waitFor(() => {
      expect(screen.queryByTitle('Error loading events')).not.toBeInTheDocument()
    })
  })

  it('should handle going away websocket closure (1001) without error', async () => {
    render(<FleetResourceEventStream resource={mockResource} />)

    await waitFor(() => {
      expect(mockWebSocket.onclose).toBeDefined()
    })

    act(() => {
      mockWebSocket.onopen?.({} as Event)
    })

    // going away closure should not show error
    act(() => {
      mockWebSocket.onclose?.({ code: 1001, wasClean: false, reason: 'Going away' } as CloseEvent)
    })

    await waitFor(() => {
      expect(screen.queryByTitle('Error loading events')).not.toBeInTheDocument()
    })
  })

  it('should handle 410 Gone with status field', async () => {
    render(<FleetResourceEventStream resource={mockResource} />)

    await waitFor(() => {
      expect(mockWebSocket.onmessage).toBeDefined()
    })

    const mockError410StatusEvent = {
      data: JSON.stringify({
        type: 'ERROR',
        object: { status: 'Gone', message: 'resource version too old' },
      }),
    } as MessageEvent

    act(() => {
      mockWebSocket.onopen?.({} as Event)
    })

    act(() => {
      mockWebSocket.onmessage?.(mockError410StatusEvent)
    })

    // should not show error state for 410 gone (status field variant)
    await waitFor(() => {
      expect(screen.queryByTitle('Error loading events')).not.toBeInTheDocument()
    })

    // should clear events
    expect(screen.queryByText(/Events: /)).not.toBeInTheDocument()
  })
})
