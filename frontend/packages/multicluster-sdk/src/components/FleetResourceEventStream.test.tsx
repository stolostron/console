/* Copyright Contributors to the Open Cluster Management project */
import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import { FleetResourceEventStream } from './FleetResourceEventStream'
import { useFleetK8sAPIPath, useHubClusterName } from '../api'

// mock the external dependencies
const mockConsoleFetchJSON = jest.fn()
jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  ResourceEventStream: jest.fn(({ resource }) => (
    <div id="fallback-resource-event-stream">ResourceEventStream for {resource.metadata.name}</div>
  )),
  consoleFetchJSON: (...args: any[]) => mockConsoleFetchJSON(...args),
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
  buildResourceURL: jest.fn(({ basePath, model, ns, queryParams }) => {
    let url = `${basePath}/api/v1`
    if (ns) url += `/namespaces/${ns}`
    url += `/${model.plural}`
    if (queryParams) {
      const params = new URLSearchParams(queryParams).toString()
      if (params) url += `?${params}`
    }
    return url
  }),
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

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    mockUseHubClusterName.mockReturnValue(['hub-cluster', true, undefined])
    mockUseFleetK8sAPIPath.mockReturnValue(['/api/proxy/plugin/mce/console/multicloud', true, undefined])
    mockConsoleFetchJSON.mockResolvedValue({ items: [] })
  })

  afterEach(() => {
    jest.useRealTimers()
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

  it('should fetch events via polling for managed cluster resources', async () => {
    const mockEvents = [
      {
        metadata: { uid: 'event-1', name: 'event-1' },
        lastTimestamp: '2023-01-01T00:00:01Z',
      },
    ]
    mockConsoleFetchJSON.mockResolvedValue({ items: mockEvents })

    render(<FleetResourceEventStream resource={mockResource} />)

    await act(async () => {
      await jest.advanceTimersByTimeAsync(0)
    })

    await waitFor(() => {
      expect(mockConsoleFetchJSON).toHaveBeenCalled()
    })
  })

  it('should show polling state after data loads', async () => {
    mockConsoleFetchJSON.mockResolvedValue({ items: [] })

    render(<FleetResourceEventStream resource={mockResource} />)

    await act(async () => {
      await jest.advanceTimersByTimeAsync(0)
    })

    await waitFor(() => {
      expect(screen.getByText('Polling events...')).toBeInTheDocument()
    })
  })

  it('should display events after successful fetch', async () => {
    const mockEvents = [
      {
        metadata: { uid: 'event-uid', name: 'test-event' },
        count: 1,
        lastTimestamp: '2023-01-01T00:00:00Z',
      },
    ]
    mockConsoleFetchJSON.mockResolvedValue({ items: mockEvents })

    render(<FleetResourceEventStream resource={mockResource} />)

    await act(async () => {
      await jest.advanceTimersByTimeAsync(0)
    })

    await waitFor(() => {
      expect(screen.getByText('Events: 1')).toBeInTheDocument()
    })
  })

  it('should show error state on fetch failure', async () => {
    mockConsoleFetchJSON.mockRejectedValue(new Error('Fetch failed'))

    render(<FleetResourceEventStream resource={mockResource} />)

    await act(async () => {
      await jest.advanceTimersByTimeAsync(0)
    })

    await waitFor(() => {
      expect(screen.getByTitle('Error loading events')).toBeInTheDocument()
    })
  })

  it('should toggle play/pause state', async () => {
    mockConsoleFetchJSON.mockResolvedValue({ items: [] })

    render(<FleetResourceEventStream resource={mockResource} />)

    await act(async () => {
      await jest.advanceTimersByTimeAsync(0)
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
    mockConsoleFetchJSON.mockResolvedValue({ items: [] })

    render(<FleetResourceEventStream resource={mockResource} />)

    await act(async () => {
      await jest.advanceTimersByTimeAsync(0)
    })

    await waitFor(() => {
      expect(screen.getByTitle('No events')).toBeInTheDocument()
    })
  })
})
