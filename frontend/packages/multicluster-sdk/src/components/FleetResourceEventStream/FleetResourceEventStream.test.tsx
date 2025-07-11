/* Copyright Contributors to the Open Cluster Management project */
import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import FleetResourceEventStream from './FleetResourceEventStream'
import { FleetK8sResourceCommon } from '../../types'

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  ResourceEventStream: ({ resource }: { resource: any }) => (
    <div data-testid="openshift-resource-event-stream">OpenShift ResourceEventStream for {resource.metadata?.name}</div>
  ),
}))

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  ResourceEventStream: ({ resource }: { resource: any }) => (
    <div id="openshift-resource-event-stream">OpenShift ResourceEventStream for {resource.metadata?.name}</div>
  ),
}))

// mock PatternFly components
jest.mock('@patternfly/react-core', () => ({
  EmptyState: ({ title, children }: any) => (
    <div id="empty-state">
      <h2>{title}</h2>
      {children}
    </div>
  ),
  PageSection: ({ children }: any) => <div id="page-section">{children}</div>,
  Spinner: () => <div id="spinner">Loading...</div>,
}))

// mock @patternfly/react-styles
jest.mock('@patternfly/react-styles', () => ({
  css: (...classes: any[]) => classes.join(' '),
}))

// mock fleet API hooks
const mockUseHubClusterName = jest.fn()
const mockUseFleetK8sAPIPath = jest.fn()
const mockFleetWatch = jest.fn()

jest.mock('../../api', () => ({
  useHubClusterName: () => mockUseHubClusterName(),
  useFleetK8sAPIPath: (cluster: string) => mockUseFleetK8sAPIPath(cluster),
  fleetWatch: (...args: any[]) => mockFleetWatch(...args),
}))

// mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      if (options) {
        return key.replace(/{{(\w+)}}/g, (match, placeholder) => options[placeholder] || match)
      }
      return key
    },
  }),
}))

jest.mock('./TogglePlay', () => {
  return function TogglePlay({ active, onClick }: any) {
    return (
      <button id="toggle-play" onClick={onClick}>
        {active ? 'Pause' : 'Play'}
      </button>
    )
  }
})

jest.mock('./EventStreamList', () => {
  return function EventStreamList({ events }: any) {
    return <div id="event-stream-list">Events: {events.length}</div>
  }
})

// mock utils and constants
jest.mock('./utils', () => ({
  EventModel: { kind: 'Event', apiVersion: 'v1', plural: 'events' },
  sortEvents: (events: any[]) => events.sort((a, b) => a.metadata?.uid?.localeCompare(b.metadata?.uid)),
}))

jest.mock('./constants', () => ({
  MAX_MESSAGES: 50,
}))

describe('FleetResourceEventStream', () => {
  const mockResource: FleetK8sResourceCommon = {
    metadata: {
      name: 'test-pod',
      namespace: 'default',
      uid: 'test-uid-123',
    },
    kind: 'Pod',
    apiVersion: 'v1',
    cluster: 'managed-cluster-1',
  }

  const hubClusterResource: FleetK8sResourceCommon = {
    metadata: {
      name: 'hub-pod',
      namespace: 'openshift-system',
      uid: 'hub-uid-456',
    },
    kind: 'Pod',
    apiVersion: 'v1',
    // without cluster property
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseHubClusterName.mockReturnValue(['hub-cluster', true, undefined])
    mockUseFleetK8sAPIPath.mockReturnValue(['http://mock-api-path', true])

    // mock WebSocket
    global.WebSocket = jest.fn().mockImplementation(() => ({
      onopen: null,
      onclose: null,
      onmessage: null,
      onerror: null,
      close: jest.fn(),
      readyState: 1,
    })) as any
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Fallback to OpenShift ResourceEventStream', () => {
    it('should fallback when no cluster is specified', () => {
      render(<FleetResourceEventStream resource={hubClusterResource} />)

      expect(screen.getByTestId('openshift-resource-event-stream')).toBeInTheDocument()
      expect(screen.getByTestId('openshift-resource-event-stream')).toHaveTextContent(
        'OpenShift ResourceEventStream for hub-pod'
      )
    })

    it('should fallback when cluster equals hub cluster', () => {
      const hubResource = { ...mockResource, cluster: 'hub-cluster' }
      render(<FleetResourceEventStream resource={hubResource} />)

      expect(screen.getByTestId('openshift-resource-event-stream')).toBeInTheDocument()
    })

    it('should fallback when cluster is undefined', () => {
      const resourceWithoutCluster = { ...mockResource }
      delete resourceWithoutCluster.cluster

      render(<FleetResourceEventStream resource={resourceWithoutCluster} />)

      expect(screen.getByTestId('openshift-resource-event-stream')).toBeInTheDocument()
    })
  })

  describe('Managed Cluster Event Streaming', () => {
    it('should render loading state initially', () => {
      mockFleetWatch.mockReturnValue(undefined)

      render(<FleetResourceEventStream resource={mockResource} />)

      expect(screen.getByTestId('spinner')).toBeInTheDocument()
      expect(screen.getByText('public~Loading events...')).toBeInTheDocument()
    })

    it('should setup websocket connection for managed cluster', () => {
      const mockWebSocket = {
        onopen: null,
        onclose: null,
        onmessage: null,
        onerror: null,
        close: jest.fn(),
        readyState: 1,
      }
      mockFleetWatch.mockReturnValue(mockWebSocket)

      render(<FleetResourceEventStream resource={mockResource} />)

      expect(mockFleetWatch).toHaveBeenCalledWith(
        expect.objectContaining({ kind: 'Event' }),
        expect.objectContaining({
          cluster: 'managed-cluster-1',
          ns: 'default',
          fieldSelector: 'involvedObject.uid=test-uid-123,involvedObject.name=test-pod,involvedObject.kind=Pod',
        }),
        'http://mock-api-path'
      )
    })
  })

  describe('Error Handling', () => {
    it('should display error state on websocket error', async () => {
      const mockWebSocket = {
        onopen: null,
        onclose: null,
        onmessage: null,
        onerror: null,
        close: jest.fn(),
        readyState: 1,
      }
      mockFleetWatch.mockReturnValue(mockWebSocket)

      render(<FleetResourceEventStream resource={mockResource} />)

      // wait for the component to assign the onerror handler, then simulate the error
      await waitFor(() => {
        expect(mockWebSocket.onerror).not.toBeNull()
      })

      // websocket should simulate an error by calling the onerror handler that was assigned by the component
      if (mockWebSocket.onerror && typeof mockWebSocket.onerror === 'function') {
        ;(mockWebSocket.onerror as (event: Event) => void)({} as Event)
      }

      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument()
        expect(screen.getByText('public~Error loading events')).toBeInTheDocument()
      })
    })
  })
})
