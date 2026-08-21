/* Copyright Contributors to the Open Cluster Management project */
import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import { FleetResourceEventStream } from './FleetResourceEventStream'
import { useFleetK8sAPIPath, useHubClusterName } from '../api'
import { fleetWatch } from '../internal/apiRequests'

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
        return key.replaceAll(/{{(\w+)}}/g, (match, placeholder) => options[placeholder] || match)
      }
      return key.replace('public~', '')
    },
  }),
}))

jest.mock('../api', () => ({
  useFleetK8sAPIPath: jest.fn(),
  useHubClusterName: jest.fn(),
}))

jest.mock('../internal/apiRequests', () => ({
  fleetWatch: jest.fn(),
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

import type { FleetWatchCallbacks } from '../internal/apiRequests'

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

  let capturedCallbacks: FleetWatchCallbacks
  let mockAbortController: AbortController

  beforeEach(() => {
    jest.clearAllMocks()
    mockAbortController = new AbortController()
    mockUseHubClusterName.mockReturnValue(['hub-cluster', true, undefined])
    mockUseFleetK8sAPIPath.mockReturnValue(['/api/proxy/plugin/mce/console/multicloud', true, undefined])
    mockFleetWatch.mockImplementation((_model, _query, _basePath, callbacks) => {
      capturedCallbacks = callbacks
      return mockAbortController
    })
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
        '/api/proxy/plugin/mce/console/multicloud',
        expect.objectContaining({
          onEvent: expect.any(Function),
          onError: expect.any(Function),
          onClose: expect.any(Function),
        })
      )
    })
  })

  it('should show streaming state after connection starts', async () => {
    render(<FleetResourceEventStream resource={mockResource} />)

    await waitFor(() => {
      expect(screen.getByText('Streaming events...')).toBeInTheDocument()
    })
  })

  it('should handle onEvent callback', async () => {
    render(<FleetResourceEventStream resource={mockResource} />)

    await waitFor(() => {
      expect(mockFleetWatch).toHaveBeenCalled()
    })

    act(() => {
      capturedCallbacks.onEvent({
        type: 'ADDED',
        object: {
          metadata: { uid: 'event-uid', name: 'test-event' },
          count: 1,
          lastTimestamp: '2023-01-01T00:00:00Z',
        },
      })
    })

    await waitFor(() => {
      expect(screen.getByText('Events: 1')).toBeInTheDocument()
    })
  })

  it('should handle onError callback', async () => {
    render(<FleetResourceEventStream resource={mockResource} />)

    await waitFor(() => {
      expect(mockFleetWatch).toHaveBeenCalled()
    })

    act(() => {
      capturedCallbacks.onError(new Error('Stream failed'))
    })

    await waitFor(() => {
      expect(screen.getByTitle('Error loading events')).toBeInTheDocument()
    })
  })

  it('should toggle play/pause state', async () => {
    render(<FleetResourceEventStream resource={mockResource} />)

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
        expect.any(String),
        expect.any(Object)
      )
    })
  })
})
