/* Copyright Contributors to the Open Cluster Management project */

import { render, screen, waitFor } from '@testing-library/react'
import { RecoilRoot } from 'recoil'
import { axe } from 'jest-axe'
import type { TopologyNode } from '~/routes/Applications/ApplicationDetails/ApplicationTopology/types'
import { LogsModal } from './LogsModal'

const mockFetchRetry = jest.fn()
const mockFleetLogsRequest = jest.fn()
const mockUseLocalHubName = jest.fn(() => 'local-cluster')
const mockCreateResourceURL = jest.fn(() => 'https://search.example/pod')

jest.mock('~/hooks/use-local-hub', () => ({
  useLocalHubName: () => mockUseLocalHubName(),
}))

jest.mock('~/resources/utils', () => ({
  ...jest.requireActual('~/resources/utils'),
  fetchRetry: (...args: unknown[]) => mockFetchRetry(...args),
  getBackendUrl: () => '',
  isRequestAbortedError: (err: { name?: string }) => err?.name === 'AbortError',
}))

jest.mock('~/resources/utils/fleet-logs-request', () => ({
  fleetLogsRequest: (...args: unknown[]) => mockFleetLogsRequest(...args),
}))

jest.mock('../helpers/diagram-helpers', () => {
  const actual = jest.requireActual('../helpers/diagram-helpers') as typeof import('../helpers/diagram-helpers')
  return {
    ...actual,
    createResourceURL: () => mockCreateResourceURL(),
  }
})

jest.mock('@patternfly/react-log-viewer', () => ({
  LogViewer: ({
    data,
    toolbar,
    header,
    footer,
    height,
  }: {
    data: string
    toolbar: React.ReactNode
    header: React.ReactNode
    footer: React.ReactNode
    height?: string
  }) => (
    <div id="log-viewer" data-height={height}>
      {toolbar}
      {header}
      <pre>{data}</pre>
      {footer}
    </div>
  ),
}))

jest.mock('screenfull', () => {
  const state = {
    isFullscreen: false,
    changeHandler: undefined as (() => void) | undefined,
  }
  return {
    isEnabled: true,
    get isFullscreen() {
      return state.isFullscreen
    },
    set isFullscreen(value: boolean) {
      state.isFullscreen = value
    },
    on: jest.fn((event: string, handler: () => void) => {
      if (event === 'change') {
        state.changeHandler = handler
      }
    }),
    off: jest.fn(),
    toggle: jest.fn(() => {
      state.isFullscreen = !state.isFullscreen
      state.changeHandler?.()
    }),
    __reset() {
      state.isFullscreen = false
      state.changeHandler = undefined
    },
  }
})

import screenfull from 'screenfull'
import { clickElement } from '~/lib/test-util'

type MockScreenfull = typeof screenfull & {
  __reset: () => void
  toggle: jest.Mock
}

const mockScreenfull = screenfull as MockScreenfull

jest.mock('~/routes/Search/Details/LogsPage', () => ({
  LogsHeader: ({ cluster, namespace }: { cluster: string; namespace: string }) => (
    <div>{`Cluster: ${cluster} Namespace: ${namespace}`}</div>
  ),
  LogsToolbar: ({
    containers,
    setContainer,
    setPreviousLogs,
    previousLogs,
    toggleFullscreen,
    isFullscreen,
  }: {
    containers: string[]
    setContainer: (c: string) => void
    setPreviousLogs: (v: boolean) => void
    previousLogs: boolean
    toggleFullscreen: () => void
    isFullscreen: boolean
  }) => (
    <div id="logs-toolbar">
      {containers.map((container) => (
        <button key={container} type="button" onClick={() => setContainer(container)}>
          {container}
        </button>
      ))}
      <button type="button" onClick={() => setPreviousLogs(!previousLogs)}>
        toggle-previous
      </button>
      <button type="button" onClick={toggleFullscreen}>
        {isFullscreen ? 'Collapse' : 'Expand'}
      </button>
    </div>
  ),
  LogsFooterButton: () => <div id="logs-footer" />,
}))

const podNode: TopologyNode = {
  id: 'pod-node',
  name: 'workload',
  namespace: 'default',
  type: 'pod',
  specs: {
    podModel: {
      workload: [
        {
          name: 'pod-a',
          namespace: 'default',
          cluster: 'local-cluster',
          kind: 'Pod',
          apiversion: 'v1',
          container: 'app;sidecar',
          restarts: 1,
          _hubClusterResource: 'true',
        },
        {
          name: 'pod-b',
          namespace: 'default',
          cluster: 'managed-1',
          kind: 'Pod',
          apiversion: 'v1',
          container: 'worker',
          restarts: 0,
          _hubClusterResource: 'false',
        },
      ],
    },
  },
}

function renderLogsModal(node: TopologyNode = podNode, processActionLink = jest.fn()) {
  const close = jest.fn()
  const result = render(
    <RecoilRoot>
      <LogsModal open close={close} node={node} hubClusterName="local-cluster" processActionLink={processActionLink} />
    </RecoilRoot>
  )
  return { ...result, close, processActionLink }
}

describe('LogsModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    sessionStorage.clear()
    mockScreenfull.__reset()
    mockFetchRetry.mockResolvedValue({ data: 'hub log line\n' })
    mockFleetLogsRequest.mockResolvedValue({ data: 'fleet log line\n' })
  })

  it('returns null when closed', () => {
    const { container } = render(<LogsModal open={false} />)
    expect(container.firstChild).toBeNull()
  })

  it('shows an error when no pods are found', async () => {
    const emptyNode: TopologyNode = {
      id: 'empty',
      name: 'empty',
      namespace: 'default',
      type: 'pod',
      specs: {},
    }
    const { container } = renderLogsModal(emptyNode)
    expect(screen.getByText(/Error querying resource logs:/)).toBeInTheDocument()
    expect(screen.getByText('No pods found')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('loads hub cluster logs and renders the viewer', async () => {
    const { container, close } = renderLogsModal()
    expect(screen.getByText('Logs')).toBeInTheDocument()
    expect(screen.getByText('View logs in Search details')).toBeInTheDocument()
    // Multiple pods use ResourceNavigator instead of the Select pod dropdown
    expect(screen.getByText('pod-a')).toBeInTheDocument()
    expect(screen.getByText('pod-b')).toBeInTheDocument()

    await waitFor(() => expect(mockFetchRetry).toHaveBeenCalled())
    expect(await screen.findByText('hub log line')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()

    await clickElement(screen.getByRole('button', { name: 'Close' }))
    expect(close).toHaveBeenCalled()
  })

  it('invokes processActionLink from the search details link', async () => {
    const { processActionLink } = renderLogsModal()
    await screen.findByText('hub log line')

    await clickElement(screen.getByRole('button', { name: 'View logs in Search details' }))
    expect(processActionLink).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'open_link',
        kind: 'pod',
        name: 'pod-a',
      }),
      expect.any(Function),
      'local-cluster'
    )
  })

  it('loads managed cluster logs via fleet request when selecting a managed pod', async () => {
    renderLogsModal()
    await screen.findByText('hub log line')

    await clickElement(screen.getByText('pod-b'))

    await waitFor(() => expect(mockFleetLogsRequest).toHaveBeenCalled())
    expect(await screen.findByText('fleet log line')).toBeInTheDocument()
    expect(mockFleetLogsRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        cluster: 'managed-1',
        podName: 'pod-b',
        container: 'worker',
      })
    )
  })

  it('shows fetch errors from hub logs', async () => {
    mockFetchRetry.mockRejectedValue({ message: 'hub failed' })
    renderLogsModal()
    expect(await screen.findByText('hub failed')).toBeInTheDocument()
  })

  it('shows fetch errors from fleet logs', async () => {
    mockFleetLogsRequest.mockResolvedValue({ errorMessage: 'fleet failed', data: '' })
    const managedOnly: TopologyNode = {
      ...podNode,
      specs: {
        podModel: {
          workload: [
            {
              name: 'pod-b',
              namespace: 'default',
              cluster: 'managed-1',
              kind: 'Pod',
              apiversion: 'v1',
              container: 'worker',
              restarts: 0,
              _hubClusterResource: 'false',
            },
          ],
        },
      },
    }
    renderLogsModal(managedOnly)
    expect(await screen.findByText('fleet failed')).toBeInTheDocument()
  })

  it('expands LogViewer to full height when entering fullscreen (ACM-45133)', async () => {
    renderLogsModal()
    await screen.findByText('hub log line')

    const logViewer = screen.getByTestId('log-viewer')
    expect(logViewer).toHaveAttribute('data-height', 'calc(70vh - 200px)')
    expect(logViewer.parentElement).toHaveStyle({ flex: '1', minHeight: '0' })

    await clickElement(screen.getByRole('button', { name: 'Expand' }))

    await waitFor(() => {
      expect(mockScreenfull.toggle).toHaveBeenCalled()
      expect(screen.getByTestId('log-viewer')).toHaveAttribute('data-height', '100%')
      expect(screen.getByTestId('log-viewer').parentElement).toHaveStyle({
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      })
      expect(screen.getByRole('button', { name: 'Collapse' })).toBeInTheDocument()
    })
  })
})
