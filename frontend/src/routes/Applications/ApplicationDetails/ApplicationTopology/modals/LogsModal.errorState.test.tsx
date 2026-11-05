/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { StateProvider } from '~/lib/state-provider'
import type { TopologyNode } from '~/routes/Applications/ApplicationDetails/ApplicationTopology/types'
import { LogsModal } from './LogsModal'

// Regression coverage for ACM-48090: clicking "Logs" on a pod whose container never started
// (e.g. ImagePullBackOff) crashed the whole page with
// "Cannot destructure property 'searchedWordIndexes' of ... as it is null."
//
// LogsToolbar (real, unmocked below) always renders LogViewerSearch, which reads
// LogViewerContext/LogViewerToolbarContext from @patternfly/react-log-viewer. Those contexts
// default to null and are only provided inside the real <LogViewer>, scoped to its `toolbar`
// prop (see @patternfly/react-log-viewer/src/LogViewer/LogViewer.tsx). The buggy code rendered
// LogsToolbar outside of <LogViewer> whenever fetching logs failed, so the context was null and
// the destructure crashed.
//
// The real <LogViewer> can't run in jsdom (it measures text via an unimplemented
// HTMLCanvasElement 2D context), so it is mocked here the same way LogsModal.test.tsx mocks it,
// but augmented to provide the *real* LogViewerContext/LogViewerToolbarContext objects around its
// `toolbar` prop, exactly like the real component does. This lets the test faithfully detect
// whether LogsToolbar is ever rendered outside of that provider.
const mockFetchRetry = jest.fn()
const mockFleetLogsRequest = jest.fn()

jest.mock('~/hooks/use-local-hub', () => ({
  useLocalHubName: () => 'local-cluster',
}))

jest.mock('~/resources/utils', () => ({
  ...jest.requireActual('~/resources/utils'),
  fetchRetry: (...args: unknown[]) => mockFetchRetry(...args),
  getBackendUrl: () => '',
  isRequestAbortedError: () => false,
}))

jest.mock('~/resources/utils/fleet-logs-request', () => ({
  fleetLogsRequest: (...args: unknown[]) => mockFleetLogsRequest(...args),
}))

jest.mock('../helpers/diagram-helpers', () => {
  const actual = jest.requireActual('../helpers/diagram-helpers') as typeof import('../helpers/diagram-helpers')
  return {
    ...actual,
    createResourceURL: () => 'https://search.example/pod',
  }
})

jest.mock('screenfull', () => ({
  isEnabled: false,
  on: jest.fn(),
  off: jest.fn(),
  toggle: jest.fn(),
}))

jest.mock('@patternfly/react-log-viewer', () => {
  const actual = jest.requireActual('@patternfly/react-log-viewer')
  return {
    ...actual,
    LogViewer: ({ toolbar, header }: { toolbar?: ReactNode; header?: ReactNode }) => (
      <actual.LogViewerContext.Provider value={{ parsedData: [], searchedInput: '' }}>
        <actual.LogViewerToolbarContext.Provider
          value={{
            searchedWordIndexes: [],
            rowInFocus: { rowIndex: -1, matchIndex: 0 },
            searchedInput: '',
            itemCount: 0,
            currentSearchedItemCount: 0,
            scrollToRow: () => {},
            setRowInFocus: () => {},
            setSearchedInput: () => {},
            setSearchedWordIndexes: () => {},
            setCurrentSearchedItemCount: () => {},
          }}
        >
          <div id="log-viewer">
            {toolbar}
            {header}
          </div>
        </actual.LogViewerToolbarContext.Provider>
      </actual.LogViewerContext.Provider>
    ),
  }
})

URL.createObjectURL = jest.fn(() => 'blob:mock-url')

const imagePullBackOffNode: TopologyNode = {
  id: 'pod-node',
  name: 'workload',
  namespace: 'default',
  type: 'pod',
  specs: {
    podModel: {
      'bad-pod': [
        {
          name: 'bad-pod',
          namespace: 'default',
          cluster: 'local-cluster',
          kind: 'Pod',
          apiversion: 'v1',
          container: 'app',
          restarts: 0,
          _hubClusterResource: 'true',
        },
      ],
    },
  },
}

describe('LogsModal error state (ACM-48090)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    sessionStorage.clear()
  })

  it('renders the toolbar and error alert without crashing when the container has no logs', async () => {
    mockFetchRetry.mockRejectedValue({
      message: 'container "app" in pod "bad-pod" is waiting to start: ImagePullBackOff',
    })

    render(
      <StateProvider>
        <LogsModal open close={jest.fn()} node={imagePullBackOffNode} hubClusterName="local-cluster" />
      </StateProvider>
    )

    expect(await screen.findByText(/ImagePullBackOff/)).toBeInTheDocument()
    // LogViewerSearch must have received a non-null context (no crash) and rendered.
    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument()
  })
})
