/* Copyright Contributors to the Open Cluster Management project */

const mockTopologyProps: { current?: Record<string, unknown> } = {}

jest.mock('~/shared-recoil', () => ({
  useSharedAtoms: () => ({ placementsState: {} }),
  useRecoilValue: () => [],
}))

jest.mock('~/lib/acm-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

jest.mock('./model/topology', () => ({
  getDiagramElements: jest.fn(() => ({
    diagramElements: { nodes: [{ id: 'n1' }], links: [] },
    alertsPromise: undefined,
  })),
}))

jest.mock('./helpers/diagram-helpers', () => ({
  processResourceActionLink: jest.fn(),
}))

jest.mock('./model/NodeDetailsProvider', () => ({
  nodeDetailsProvider: {},
}))

jest.mock('./topology/Topology', () => ({
  Topology: (props: Record<string, unknown>) => {
    mockTopologyProps.current = props
    return (
      <div id="topology-mock">
        <span id="nodes-count">{(props.elements as { nodes: unknown[] })?.nodes?.length ?? 0}</span>
        <span id="alerts-count">{(props.alerts as unknown[])?.length ?? 0}</span>
        <span id="is-analyzing">{String(props.isAnalyzing)}</span>
        <button
          type="button"
          onClick={() => (props.onEditAppSet as (n: { name: string }) => void)?.({ name: 'test-appset' })}
        >
          edit-appset
        </button>
        <button
          type="button"
          onClick={() =>
            (props.onEditYaml as (n: { name: string }, p?: string) => void)?.({ name: 'test-appset' }, '$.spec')
          }
        >
          edit-yaml
        </button>
        <button
          type="button"
          onClick={() => (props.onViewLogs as (n: { name: string }) => void)?.({ name: 'test-appset' })}
        >
          view-logs
        </button>
        <button
          type="button"
          onClick={() =>
            (props.onSyncResources as (n: { name: string; specs: { appSetApps: unknown[] } }) => void)?.({
              name: 'test-appset',
              specs: { appSetApps: [] },
            })
          }
        >
          sync-resources
        </button>
        <button
          type="button"
          onClick={() =>
            (props.onLaunchArgo as (n: { name: string; namespace: string }) => void)?.({
              name: 'test-appset',
              namespace: 'openshift-gitops',
            })
          }
        >
          launch-argo
        </button>
        <button type="button" onClick={() => (props.onRefreshResources as () => void)?.()}>
          refresh-resources
        </button>
        <button
          type="button"
          onClick={() =>
            (
              props.setDrawerContent as (
                title: string,
                a: boolean,
                b: boolean,
                c: boolean,
                d: boolean,
                content: unknown,
                close: boolean
              ) => void
            )?.('Drawer title', true, true, false, false, null, false)
          }
        >
          open-drawer
        </button>
        <button
          type="button"
          onClick={() =>
            (
              props.setDrawerContent as (
                title: string,
                a: boolean,
                b: boolean,
                c: boolean,
                d: boolean,
                content: unknown,
                close: boolean
              ) => void
            )?.('', false, false, false, false, null, true)
          }
        >
          close-drawer
        </button>
      </div>
    )
  },
}))

jest.mock('./modals/EditAppSetModal', () => ({
  EditAppSetModal: (props: { open: boolean; node?: { name?: string } }) =>
    props.open ? <div id="edit-appset-modal">{props.node?.name}</div> : null,
}))

jest.mock('./modals/EditYamlModal', () => ({
  EditYamlModal: (props: { open: boolean; highlightEditorPath?: string }) =>
    props.open ? <div id="edit-yaml-modal">{props.highlightEditorPath}</div> : null,
}))

jest.mock('./modals/LogsModal', () => ({
  LogsModal: (props: { open: boolean }) => (props.open ? <div id="logs-modal">logs</div> : null),
}))

jest.mock('~/routes/Applications/components/SyncArgoCDModal', () => ({
  SyncArgoCDModal: (props: { open: boolean; appOrAppSet?: { metadata?: { name?: string } } }) =>
    props.open ? <div id="sync-modal">{props.appOrAppSet?.metadata?.name}</div> : null,
}))

jest.mock('./components/DrawerShapes', () => ({
  DrawerShapes: () => <div id="drawer-shapes" />,
}))

jest.mock('./ApplicationTopology.css', () => ({}))
jest.mock('./topology/css/Drawer.css', () => ({}))

import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router'
import { AcmDrawerContext } from '~/ui-components'
import { ApplicationTopologyPageContent } from './ApplicationTopology'
import { getDiagramElements } from './model/topology'
import { processResourceActionLink } from './helpers/diagram-helpers'

const mockGetDiagramElements = getDiagramElements as jest.Mock
const mockProcessResourceActionLink = processResourceActionLink as jest.Mock

function Layout({ context }: { context: Record<string, unknown> }) {
  return <Outlet context={context} />
}

function renderTopology(contextOverrides: Record<string, unknown> = {}) {
  const setDrawerContext = jest.fn()
  const context = {
    applicationData: {
      refreshTime: 1,
      application: { metadata: { name: 'test-appset', namespace: 'openshift-gitops', uid: 'uid-1' } },
      topology: { hubClusterName: 'local-cluster', nodes: [], links: [] },
      statuses: { subscriptions: {} },
    },
    channelControl: { allChannels: [], activeChannel: undefined, setActiveChannel: jest.fn() },
    toolbarControl: {
      activeClusters: [],
      setActiveClusters: jest.fn(),
      allClusters: [],
      setAllClusters: jest.fn(),
      activeApplications: [],
      setActiveApplications: jest.fn(),
      allApplications: [],
      setAllApplications: jest.fn(),
      activeTypes: [],
      setActiveTypes: jest.fn(),
      allTypes: [],
      setAllTypes: jest.fn(),
    },
    ...contextOverrides,
  }

  const result = render(
    <AcmDrawerContext.Provider value={{ drawerContext: undefined, setDrawerContext }}>
      <MemoryRouter>
        <Routes>
          <Route element={<Layout context={context} />}>
            <Route path="*" element={<ApplicationTopologyPageContent />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AcmDrawerContext.Provider>
  )
  return { ...result, setDrawerContext }
}

describe('ApplicationTopologyPageContent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useRealTimers()
    mockGetDiagramElements.mockReturnValue({
      diagramElements: { nodes: [{ id: 'n1' }], links: [] },
      alertsPromise: undefined,
    })
  })

  it('renders topology with diagram elements', async () => {
    renderTopology()
    expect(screen.getByTestId('topology-mock')).toBeInTheDocument()
    expect(screen.getByTestId('drawer-shapes')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByTestId('nodes-count')).toHaveTextContent('1'))
  })

  it('clears elements when topology is missing', async () => {
    renderTopology({
      applicationData: { refreshTime: 1, application: undefined, topology: undefined, statuses: undefined },
    })
    await waitFor(() => expect(screen.getByTestId('nodes-count')).toHaveTextContent('0'))
    expect(mockGetDiagramElements).not.toHaveBeenCalled()
  })

  it('resolves alerts from alertsPromise', async () => {
    mockGetDiagramElements.mockReturnValue({
      diagramElements: { nodes: [{ id: 'n1' }], links: [] },
      alertsPromise: Promise.resolve([{ id: 'a1' }]),
    })
    renderTopology()
    await waitFor(() => expect(screen.getByTestId('alerts-count')).toHaveTextContent('1'))
  })

  it('clears alerts when alerts promise rejects', async () => {
    mockGetDiagramElements.mockReturnValue({
      diagramElements: { nodes: [], links: [] },
      alertsPromise: Promise.reject(new Error('analyze failed')),
    })
    renderTopology()
    await waitFor(() => expect(screen.getByTestId('alerts-count')).toHaveTextContent('0'))
  })

  it('shows analyzing overlay after threshold while alerts are pending', async () => {
    jest.useFakeTimers()
    let resolveAlerts: (value: unknown[]) => void = () => {}
    mockGetDiagramElements.mockReturnValue({
      diagramElements: { nodes: [{ id: 'n1' }], links: [] },
      alertsPromise: new Promise((resolve) => {
        resolveAlerts = resolve
      }),
    })

    renderTopology()
    expect(screen.getByTestId('is-analyzing')).toHaveTextContent('false')

    await act(async () => {
      jest.advanceTimersByTime(1000)
    })
    expect(screen.getByTestId('is-analyzing')).toHaveTextContent('true')

    await act(async () => {
      resolveAlerts([{ id: 'a1' }])
    })
    expect(screen.getByTestId('is-analyzing')).toHaveTextContent('false')
    jest.useRealTimers()
  })

  it('opens modals from topology callbacks', async () => {
    renderTopology()

    await userEvent.click(screen.getByRole('button', { name: 'edit-appset' }))
    expect(screen.getByTestId('edit-appset-modal')).toHaveTextContent('test-appset')

    await userEvent.click(screen.getByRole('button', { name: 'edit-yaml' }))
    expect(screen.getByTestId('edit-yaml-modal')).toHaveTextContent('$.spec')

    await userEvent.click(screen.getByRole('button', { name: 'view-logs' }))
    expect(screen.getByTestId('logs-modal')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'sync-resources' }))
    expect(screen.getByTestId('sync-modal')).toHaveTextContent('test-appset')
  })

  it('opens sync modal from refresh resources', async () => {
    renderTopology()
    await userEvent.click(screen.getByRole('button', { name: 'refresh-resources' }))
    expect(screen.getByTestId('sync-modal')).toHaveTextContent('test-appset')
  })

  it('launches argo editor via processActionLink', async () => {
    renderTopology()
    await userEvent.click(screen.getByRole('button', { name: 'launch-argo' }))
    expect(mockProcessResourceActionLink).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'open_argo_editor',
        name: 'test-appset',
        namespace: 'openshift-gitops',
        cluster: 'local-cluster',
      }),
      expect.any(Function),
      expect.any(Function),
      'local-cluster'
    )
  })

  it('opens and closes the drawer', async () => {
    const { setDrawerContext } = renderTopology()

    await userEvent.click(screen.getByRole('button', { name: 'open-drawer' }))
    expect(setDrawerContext).toHaveBeenCalledWith(expect.objectContaining({ isExpanded: true, title: 'Drawer title' }))

    await userEvent.click(screen.getByRole('button', { name: 'close-drawer' }))
    expect(setDrawerContext).toHaveBeenCalledWith(undefined)
  })
})
