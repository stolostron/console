/* Copyright Contributors to the Open Cluster Management project */

import { act, render, screen, waitFor, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import userEvent from '@testing-library/user-event'
import { Profiler, type ProfilerOnRenderCallback } from 'react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { StateProvider } from '~/lib/state-provider'
import {
  argoCDsState,
  gitOpsClustersState,
  managedClustersState,
  placementDecisionsState,
  subscriptionsState,
} from '../../atoms'
import {
  nockAggegateRequest,
  nockIgnoreApiPaths,
  nockIgnoreRBAC,
  nockIgnorePlacementDebug,
  nockGet,
  nockList,
  nockSearch,
} from '../../lib/nock-util'
import { defaultPlugin, PluginContext } from '../../lib/PluginContext'
import { getCSVDownloadLink, getCSVExportSpies, waitForText, clickElement, waitTimeout } from '~/lib/test-util'
import {
  ApplicationKind,
  IResource,
  ApplicationSetKind,
  GitOpsCluster,
  GitOpsClusterApiVersion,
  GitOpsClusterKind,
  ManagedCluster,
  ManagedClusterApiVersion,
  ManagedClusterKind,
  SubscriptionKind,
} from '../../resources'
import { getISOStringTimestamp } from '../../resources/utils'
import { AcmToastGroup, AcmToastProvider } from '../../ui-components'
import {
  acmExtension,
  mockApplication0,
  mockApplicationSet0,
  mockApplicationSet1,
  mockArgoApplication1,
  mockArgoApplication2,
  mockFluxApplication0,
  mockOCPApplication0,
  mockPlacementsDecisions,
  mockSearchQueryOCPApplicationsFiltered,
  mockSearchQueryOCPApplicationsFilteredCount,
  mockSearchResponseOCPApplications,
  mockSearchResponseOCPApplicationsCount,
  mockSubscriptions,
} from './Application.sharedmocks'
import Overview from './Overview'
import { useIsAnyNamespaceAuthorized } from '../../lib/rbac-util'

jest.mock('../../lib/rbac-util')
let mockWizardCallbacks: { onCancel?: () => void; onSubmitSuccess?: () => void }[] | undefined
jest.mock('~/routes/Infrastructure/Clusters/GitOps/CreateGitOpsCluster', () => {
  const actual = jest.requireActual('~/routes/Infrastructure/Clusters/GitOps/CreateGitOpsCluster')
  return {
    ...actual,
    CreateGitOpsCluster: (props: { onCancel?: () => void; onSubmitSuccess?: () => void }) => {
      if (!mockWizardCallbacks) return <actual.CreateGitOpsCluster {...props} />
      mockWizardCallbacks.push(props)
      return <button onClick={props.onCancel}>Cancel</button>
    },
  }
})
beforeEach(() => {
  ;(useIsAnyNamespaceAuthorized as jest.Mock).mockImplementation(() => true)
})

function LocationDisplay() {
  const location = useLocation()
  return <div id="location-display">{location.pathname + location.search}</div>
}

async function openRowAction(appName: string, actionName: string) {
  const row = screen.getByText(appName).closest('tr')!
  await clickElement(within(row).getByRole('button', { name: /actions/i }))
  await clickElement(screen.getByText(actionName))
}

const applicationAggregate = {
  req: { page: 1, perPage: 10, search: '', filters: {}, sortBy: { index: 0, direction: 'asc', id: 'name' } },
  res: {
    page: 1,
    items: [
      mockApplication0,
      mockApplicationSet0,
      mockApplicationSet1,
      mockArgoApplication1,
      mockArgoApplication2,
      mockOCPApplication0,
      mockFluxApplication0,
    ],
    emptyResult: false,
    isPreProcessed: false,
  },
}
const fetchAggregate = {
  req: { page: 1, perPage: -1 },
  res: {
    page: 1,
    items: [
      mockApplication0,
      mockApplicationSet0,
      mockApplicationSet1,
      mockArgoApplication1,
      mockArgoApplication2,
      mockOCPApplication0,
      mockFluxApplication0,
    ],
    emptyResult: false,
    isPreProcessed: false,
  },
}
const statusAggregate = {
  req: {},
  res: {
    itemCount: 42,
    filterCounts: undefined,
    systemAppNSPrefixes: [],
  },
}

const hubCluster: ManagedCluster = {
  kind: ManagedClusterKind,
  apiVersion: ManagedClusterApiVersion,
  metadata: {
    name: 'local-cluster',
    namespace: 'local-cluster',
    labels: {
      'local-cluster': 'true',
    },
  },
}

const mockClusters = [hubCluster]

const mockGitOpsCluster: GitOpsCluster = {
  apiVersion: GitOpsClusterApiVersion,
  kind: GitOpsClusterKind,
  metadata: { name: 'gitops-cluster', namespace: 'openshift-gitops' },
  spec: { gitopsAddon: { enabled: false } },
}

const mockAgentEnabledGitOpsCluster: GitOpsCluster = {
  ...mockGitOpsCluster,
  spec: { gitopsAddon: { enabled: true, argoCDAgent: { enabled: true, mode: 'managed' } } },
}

describe('Applications Page', () => {
  beforeEach(async () => {
    localStorage.removeItem('acm-table-filter.applicationTable')
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    nockAggegateRequest('applications', applicationAggregate.req, applicationAggregate.res)
    nockAggegateRequest('statuses', statusAggregate.req, statusAggregate.res)
    render(
      <StateProvider
        initializeStore={(store) => {
          store.set(subscriptionsState, mockSubscriptions)
          store.set(placementDecisionsState, mockPlacementsDecisions)
          store.set(managedClustersState, mockClusters)
          store.set(gitOpsClustersState, [mockGitOpsCluster])
        }}
      >
        <AcmToastProvider>
          <AcmToastGroup />
          <MemoryRouter>
            <PluginContext.Provider
              value={{
                ...defaultPlugin,
                acmExtensions: acmExtension,
              }}
            >
              <LocationDisplay />
              <Overview />
            </PluginContext.Provider>
          </MemoryRouter>
        </AcmToastProvider>
      </StateProvider>
    )
  })

  test('should display info', async () => {
    // wait for page to load
    await waitForText('feng-remote-argo8')
    expect(screen.getByText(SubscriptionKind)).toBeTruthy()
    expect(screen.getByText(mockApplication0.metadata.namespace!)).toBeTruthy()
    expect(screen.getAllByText('Local')).toBeTruthy()

    // appset
    expect(screen.getByText(mockApplicationSet0.metadata.name!)).toBeTruthy()
    await waitForText('Application set', true)

    expect(screen.getByText(mockApplicationSet1.metadata.name!)).toBeTruthy()
    await waitForText('Application set', true)

    // argo app
    expect(screen.getByText(mockArgoApplication1.metadata.name!)).toBeTruthy()
    expect(screen.getByText('feng-remote-argo8')).toBeTruthy()
    expect(screen.getAllByText('Argo CD')).toHaveLength(2)

    // ocp app
    expect(screen.getByText(mockOCPApplication0.name!)).toBeTruthy()
    expect(screen.getByText('OpenShift')).toBeTruthy()

    // flux
    expect(screen.getByText(mockFluxApplication0.name!)).toBeTruthy()
    expect(screen.getByText('OpenShift')).toBeTruthy()

    // labels column header and OCP/Flux apps show label count (e.g. "1 label", "2 labels")
    expect(screen.getByText('Labels')).toBeTruthy()
    expect(screen.getByText('1 label')).toBeTruthy()
    expect(screen.getByText('2 labels')).toBeTruthy()
  })

  test('should show Label filter in filter panel', async () => {
    await waitForText('feng-remote-argo8')

    await clickElement(screen.getByText('Filter'))
    expect(screen.getByRole('button', { name: /^Label$/i })).toBeInTheDocument()
    await clickElement(screen.getByText('Filter'))
  })

  test('should filter', async () => {
    // wait for page to load
    await waitForText('feng-remote-argo8')

    // subscription

    // Open filter
    await clickElement(screen.getByText('Filter'))

    expect(screen.getByRole('checkbox', { name: /subscription/i })).toBeTruthy()
    await clickElement(screen.getByRole('checkbox', { name: /subscription/i }))

    // Close filter
    await clickElement(screen.getByText('Filter'))
    await waitFor(() => expect(screen.queryByRole('checkbox', { name: /subscription/i })).toBeNull())
    expect(screen.queryByText(ApplicationSetKind)).toBeNull()
    expect(screen.queryByText('Discovered')).toBeNull()
    expect(screen.getAllByText(SubscriptionKind)).toBeTruthy()

    // clear subscription filter
    await clickElement(screen.getByRole('button', { name: /close subscription/i }))

    // argo apps
    // Open filter
    await clickElement(screen.getByText('Filter'))
    expect(screen.getByRole('checkbox', { name: /argo cd/i })).toBeTruthy()
    await clickElement(screen.getByRole('checkbox', { name: /argo cd/i }))

    // Close filter
    await clickElement(screen.getByText('Filter'))
    await waitFor(() => expect(screen.queryByRole('checkbox')).toBeNull())
    expect(screen.queryByText(ApplicationKind)).toBeNull()
    expect(screen.queryByText(ApplicationSetKind)).toBeNull()
    expect(screen.getAllByText('Argo CD')).toBeTruthy()

    // clear argo filter
    await clickElement(screen.getByRole('button', { name: /close argo cd/i }))

    // appset
    // Open filter
    await clickElement(screen.getByText('Filter'))
    expect(screen.getByRole('checkbox', { name: /application set/i })).toBeTruthy()
    await clickElement(screen.getByRole('checkbox', { name: /application set/i }))

    // Close filter
    await clickElement(screen.getByText('Filter'))
    await waitFor(() => expect(screen.queryByRole('checkbox')).toBeNull())
    expect(screen.queryByText(ApplicationKind)).toBeNull()
    expect(screen.queryByText('Discovered')).toBeNull()
    expect(screen.getAllByText('Application set')).toBeTruthy()

    // clear appset filter
    await clickElement(screen.getByRole('button', { name: /close application set/i }))

    nockSearch(mockSearchQueryOCPApplicationsFiltered, mockSearchResponseOCPApplications)
    nockSearch(mockSearchQueryOCPApplicationsFilteredCount, mockSearchResponseOCPApplicationsCount)

    // OCP
    // Openshift filter possibly 2 (Openshift, Default Openshift)
    await clickElement(screen.getByText('Filter'))
    await waitForText('OpenShift', true)
    expect(screen.getAllByText(/openshift/i)).toBeTruthy()
    await clickElement(screen.getByRole('checkbox', { name: /openshift/i }))

    // Close filter
    await clickElement(screen.getByText('Filter'))
    expect(screen.queryByText(ApplicationKind)).toBeNull()
    expect(screen.queryByText('Discovered')).toBeNull()

    // clear openshift filter
    await clickElement(screen.getByRole('button', { name: /close openshift/i }))
  })

  test('should delete application', async () => {
    // wait for page to load
    await waitForText('feng-remote-argo8')

    // click delete
    await clickElement(screen.getAllByRole('button', { name: /actions/i })[1])
    await clickElement(screen.getByText(/delete application/i))
    expect(screen.getByText(/permanently delete applicationset applicationset-0\?/i)).toBeTruthy()
  })

  test.each([
    {
      name: 'view for subscription application',
      appName: 'application-0',
      action: 'View application',
      route: '/multicloud/applications/details/namespace-0/application-0/details?apiVersion=application.app.k8s.io',
    },
    {
      name: 'edit for subscription application',
      appName: 'application-0',
      action: 'Edit application',
      route: '/multicloud/applications/edit/subscription/namespace-0/application-0?context=applications',
    },
    {
      name: 'search for subscription application',
      appName: 'application-0',
      action: 'Search application',
      route: '/multicloud/search',
    },
    {
      name: 'view for application set',
      appName: 'applicationset-0',
      action: 'View application',
      route:
        '/multicloud/applications/details/openshift-gitops/applicationset-0/details?apiVersion=applicationset.argoproj.io',
    },
    {
      name: 'edit for application set',
      appName: 'applicationset-0',
      action: 'Edit application',
      route: '/multicloud/applications/edit/argo/openshift-gitops/applicationset-0?context=applicationsets',
    },
    {
      name: 'view for discovered argo application',
      appName: 'argoapplication-1',
      action: 'View application',
      route:
        '/multicloud/applications/details/openshift-gitops/argoapplication-1/details?apiVersion=application.argoproj.io',
    },
    {
      name: 'view for OCP application',
      appName: 'authentication-operator',
      action: 'View application',
      route:
        '/multicloud/applications/details/authentication-operator-ns/authentication-operator/details?apiVersion=ocp&cluster=test-cluster',
    },
  ])('row action navigates to $name', async ({ appName, action, route }) => {
    await waitForText('feng-remote-argo8')
    await openRowAction(appName, action)
    expect(screen.getByTestId('location-display')).toHaveTextContent(route)
  })

  test('create dropdown navigates to argo pull model (ManifestWork pull model when agent mode is off)', async () => {
    await waitForText('feng-remote-argo8')
    await clickElement(screen.getByRole('button', { name: /create application/i }))
    await clickElement(screen.getByText('Argo CD ManifestWork Pull model ApplicationSet'))
    expect(screen.getByTestId('location-display')).toHaveTextContent('/multicloud/applications/create/argopullmodel')
  })

  test('create dropdown navigates to argo push model', async () => {
    await waitForText('feng-remote-argo8')
    await clickElement(screen.getByRole('button', { name: /create application/i }))
    await clickElement(screen.getByText('Argo CD Push model ApplicationSet'))
    expect(screen.getByTestId('location-display').textContent).toBe('/multicloud/applications/create/argo')
  })

  test('create dropdown navigates to subscription', async () => {
    await waitForText('feng-remote-argo8')
    await clickElement(screen.getByRole('button', { name: /create application/i }))
    await clickElement(within(screen.getByRole('menu')).getByText('Subscription'))
    expect(screen.getByTestId('location-display')).toHaveTextContent('/multicloud/applications/create/subscription')
  })

  test('places Model between Type and Namespace', async () => {
    await waitForText('feng-remote-argo8')
    const headers = within(screen.getByRole('grid', { name: 'Applications table' }))
      .getAllByRole('columnheader')
      .map((header) => header.textContent)
    expect(headers.slice(0, 4)).toEqual(['Name', 'Type', 'Model', 'Namespace'])
  })

  test('export button should produce a file for download', async () => {
    nockAggegateRequest('applications', fetchAggregate.req, fetchAggregate.res)

    await waitForText('feng-remote-argo8')

    window.URL.createObjectURL = jest.fn()
    window.URL.revokeObjectURL = jest.fn()

    const { blobConstructorSpy, createElementSpy } = getCSVExportSpies()

    await clickElement(screen.getByTestId('export-search-result'))
    await clickElement(screen.getByText('Export all to CSV'))

    // The export path fetches every row before adding the toast, so give it the same timeout the rest
    // of this suite uses rather than the 1s testing-library default.
    await waitFor(
      () => {
        const toastElement = screen.getByText(/Export successful/i)
        expect(toastElement).toBeInTheDocument()
      },
      { timeout: waitTimeout }
    )

    expect(blobConstructorSpy).toHaveBeenCalledWith(
      [
        'Name,Type,Model,Namespace,Clusters,Sources,Labels,Health Status,Sync Status,Pod Status,Created\n' +
          `"application-0","Subscription","-","namespace-0","Local",-,-,"-","-","-","${getISOStringTimestamp(applicationAggregate.res.items[0].metadata?.creationTimestamp || '')}"\n` +
          '"applicationset-0","Application set","-","openshift-gitops","None","testapp",-,"-","-","-",-\n' +
          '"applicationset-1","Application set","-","openshift-gitops","None","testapp",-,"-","-","-",-\n' +
          '"argoapplication-1","Argo CD","-","argoapplication-1-ns","None","foo",-,"-","-","-",-\n' +
          '"feng-remote-argo8","Argo CD","-","argoapplication-1-ns","None","foo",-,"-","-","-",-\n' +
          '"authentication-operator","OpenShift","-","authentication-operator-ns","None",-,"app=authentication-operator","-","-","-",-\n' +
          '"authentication-operatorf","Flux","-","authentication-operator-ns","None",-,"kustomize.toolkit.fluxcd.io/name=test-app,kustomize.toolkit.fluxcd.io/namespace=test-app-ns","-","-","-",-',
      ],
      { type: 'text/csv' }
    )
    expect(getCSVDownloadLink(createElementSpy)?.value.download).toMatch(/^applicationsoverview-[\d]+\.csv$/)
  })
})

function renderOverviewWithGitOpsClusters(
  gitOpsClusters: GitOpsCluster[],
  argoCDs: IResource[] = [],
  items = applicationAggregate.res.items,
  onRender?: ProfilerOnRenderCallback
) {
  nockIgnoreRBAC()
  nockIgnoreApiPaths()
  nockAggegateRequest('applications', applicationAggregate.req, { ...applicationAggregate.res, items })
  nockAggegateRequest('statuses', statusAggregate.req, statusAggregate.res)
  let updateGitOpsClusters: ((value: GitOpsCluster[]) => void) | undefined
  const result = render(
    <StateProvider
      initializeStore={(store) => {
        store.set(subscriptionsState, mockSubscriptions)
        store.set(placementDecisionsState, mockPlacementsDecisions)
        store.set(managedClustersState, mockClusters)
        store.set(gitOpsClustersState, gitOpsClusters)
        store.set(argoCDsState, argoCDs)
        updateGitOpsClusters = (value) => store.set(gitOpsClustersState, value)
      }}
    >
      <AcmToastProvider>
        <AcmToastGroup />
        <MemoryRouter>
          <PluginContext.Provider
            value={{
              ...defaultPlugin,
              acmExtensions: acmExtension,
            }}
          >
            <LocationDisplay />
            {onRender ? (
              <Profiler id="applications-overview" onRender={onRender}>
                <Overview />
              </Profiler>
            ) : (
              <Overview />
            )}
          </PluginContext.Provider>
        </MemoryRouter>
      </AcmToastProvider>
    </StateProvider>
  )
  return { ...result, updateGitOpsClusters: (value: GitOpsCluster[]) => updateGitOpsClusters?.(value) }
}

describe('Applications saved column order', () => {
  const storageKeys = [
    'applicationTableSavedCols',
    'applicationTableSavedColOrder',
    'applicationTable.model-column-order-initialized',
  ]
  beforeEach(() => storageKeys.forEach((key) => localStorage.removeItem(key)))
  afterEach(() => storageKeys.forEach((key) => localStorage.removeItem(key)))

  test('renders page content on the first commit while migrating saved columns', async () => {
    const order = ['name', 'type', 'namespace', 'labels', 'model']
    localStorage.setItem('applicationTableSavedCols', JSON.stringify(order))
    localStorage.setItem('applicationTableSavedColOrder', JSON.stringify(order))
    const mountedWithContent: boolean[] = []

    renderOverviewWithGitOpsClusters([], [], applicationAggregate.res.items, (_id, phase) => {
      if (phase === 'mount') {
        const hasTable = screen.queryByRole('grid', { name: 'Applications table' }) !== null
        const hasLoadingState = screen.queryAllByRole('progressbar').length > 0
        const hasEmptyState = screen.queryByRole('heading', { name: "You don't have any applications yet" }) !== null
        mountedWithContent.push(hasTable || hasLoadingState || hasEmptyState)
      }
    })

    expect(mountedWithContent).toEqual([true])
    await waitForText('feng-remote-argo8')
    const headers = within(screen.getByRole('grid', { name: 'Applications table' }))
      .getAllByRole('columnheader')
      .map((header) => header.textContent)
    expect(headers.slice(0, 5)).toEqual(['Name', 'Type', 'Model', 'Namespace', 'Labels'])
  })

  test('renders Model third when it was previously saved at the end', async () => {
    const order = ['name', 'type', 'namespace', 'labels', 'model']
    localStorage.setItem('applicationTableSavedCols', JSON.stringify(order))
    localStorage.setItem('applicationTableSavedColOrder', JSON.stringify(order))

    renderOverviewWithGitOpsClusters([])

    await waitForText('feng-remote-argo8')
    const headers = within(screen.getByRole('grid', { name: 'Applications table' }))
      .getAllByRole('columnheader')
      .map((header) => header.textContent)
    expect(headers.slice(0, 5)).toEqual(['Name', 'Type', 'Model', 'Namespace', 'Labels'])
  })
})

describe('Create application dropdown - GitOps agent mode', () => {
  test('offers Agent pull, Push, and Subscription without setup when Agent and Push are enabled', async () => {
    const argoCD = {
      apiVersion: 'argoproj.io/v1beta1',
      kind: 'ArgoCD',
      metadata: { name: 'openshift-gitops', namespace: 'openshift-gitops' },
      spec: { controller: { enabled: true } },
    }
    renderOverviewWithGitOpsClusters([mockAgentEnabledGitOpsCluster], [argoCD])

    await waitForText('feng-remote-argo8')
    await clickElement(screen.getByRole('button', { name: /create application/i }))
    const menu = within(screen.getByRole('menu'))
    const pullOption = menu.getByRole('menuitem', { name: /Argo CD Agent Pull model ApplicationSet/ })
    expect(pullOption).not.toHaveAttribute('aria-disabled', 'true')
    expect(
      within(pullOption).getByText(
        'Deploy applications across managed clusters using pull mode with full status fidelity, resource trees, and live-state visibility.'
      )
    ).toBeInTheDocument()
    expect(menu.getByRole('menuitem', { name: /Argo CD Push model ApplicationSet/ })).toBeInTheDocument()
    expect(menu.getByText('Subscription')).toBeInTheDocument()
    expect(menu.queryByText('Set up GitOps configuration for Argo CD Agent Pull')).not.toBeInTheDocument()
    expect(menu.queryByText('Argo CD ManifestWork Pull model ApplicationSet')).not.toBeInTheDocument()
    await clickElement(pullOption)
    expect(screen.getByTestId('location-display')).toHaveTextContent('/multicloud/applications/create/argopullmodel')
  })

  test('disables ManifestWork creation with an explanation and keeps GitOps setup available when no GitOpsCluster exists', async () => {
    const user = userEvent.setup()
    renderOverviewWithGitOpsClusters([])

    await waitForText('feng-remote-argo8')
    await clickElement(screen.getByRole('button', { name: /create application/i }))
    const pullOption = screen.getByRole('menuitem', { name: /ManifestWork pull model/i })
    expect(pullOption).toHaveAttribute('aria-disabled', 'true')
    expect(
      within(pullOption).getByText(
        'Deploy applications across managed clusters using basic pull mode. Managed clusters pull directly from Git with thin hub status.'
      )
    ).toBeInTheDocument()
    const setupOption = screen.getByRole('menuitem', { name: 'Set up GitOps configuration for Argo CD Agent Pull' })
    expect(setupOption).not.toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('menuitem', { name: /Push model/i })).toBeInTheDocument()
    expect(within(screen.getByRole('menu')).getByText('Subscription')).toBeInTheDocument()
    await user.hover(pullOption)
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Create a GitOpsCluster to enable pull model ApplicationSet creation.'
    )
    await user.click(pullOption)
    expect(screen.getByTestId('location-display').textContent).toBe('/')
  })

  test.each(['Cancel', 'Close'])(
    'GitOps setup opens a modal with YAML off by default and closes using %s without navigation',
    async (closeButton) => {
      const previousYamlPreference = localStorage.getItem('yaml')
      localStorage.setItem('yaml', 'true')
      try {
        nockIgnorePlacementDebug()
        nockList({ apiVersion: 'apps.open-cluster-management.io/v1beta1', kind: 'GitOpsCluster' }, []).persist()
        nockGet(
          {
            apiVersion: 'cluster.open-cluster-management.io/v1beta1',
            kind: 'Placement',
            metadata: { name: 'gitopscluster-placement' },
          },
          undefined,
          404
        ).persist()
        renderOverviewWithGitOpsClusters([])

        await waitForText('feng-remote-argo8')
        await clickElement(screen.getByRole('button', { name: /create application/i }))

        const configureLink = screen.getByText('Set up GitOps configuration for Argo CD Agent Pull')
        expect(configureLink).toBeInTheDocument()

        await clickElement(configureLink)
        const dialog = screen.getByRole('dialog')
        const title = within(dialog).getByRole('heading', { name: 'Create GitOps configuration', level: 1 })
        expect(title).toBeInTheDocument()
        expect(dialog).toHaveAccessibleName('Create GitOps configuration')
        expect(dialog).toHaveAccessibleDescription(
          'Create a GitOpsCluster resource and placement rules to connect managed clusters to GitOps for Pull model ApplicationSets.'
        )
        expect(
          within(dialog).getByText(
            'Create a GitOpsCluster resource and placement rules to connect managed clusters to GitOps for Pull model ApplicationSets.'
          )
        ).toBeVisible()
        expect(within(dialog).getByRole('textbox', { name: /name/i })).toBeInTheDocument()
        const modalBody = Array.from(dialog.children).find((child) =>
          child.contains(within(dialog).getByRole('textbox', { name: /name/i }))
        )
        expect(modalBody).toBeDefined()
        expect(getComputedStyle(modalBody!).flexGrow).toBe('1')
        expect(within(dialog).getByRole('button', { name: 'Close' })).toBeInTheDocument()
        expect(within(dialog).queryByRole('textbox', { name: /monaco/i, hidden: true })).not.toBeInTheDocument()
        const yamlSwitch = within(dialog).getByRole('switch', { name: 'YAML' })
        expect(yamlSwitch).not.toBeChecked()
        expect(title.parentElement?.nextElementSibling).toContainElement(yamlSwitch)
        expect(title).not.toContainElement(yamlSwitch)
        expect(localStorage.getItem('yaml')).toBe('true')
        // Match the existing GitOps details checks for reused IDs in the shared wizard fields.
        expect(
          await axe(dialog, {
            rules: {
              'duplicate-id': { enabled: false },
              'duplicate-id-active': { enabled: false },
              'duplicate-id-aria': { enabled: false },
            },
          })
        ).toHaveNoViolations()
        await clickElement(within(dialog).getByRole('button', { name: closeButton }))
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        expect(screen.getByTestId('location-display').textContent).toBe('/')
      } finally {
        if (previousYamlPreference === null) localStorage.removeItem('yaml')
        else localStorage.setItem('yaml', previousYamlPreference)
      }
    }
  )

  test('ignores completion and cancellation callbacks from a closed GitOps wizard session', async () => {
    mockWizardCallbacks = []
    const user = userEvent.setup()
    try {
      renderOverviewWithGitOpsClusters([])
      await waitForText('feng-remote-argo8')
      await clickElement(screen.getByRole('button', { name: /create application/i }))
      await clickElement(screen.getByText('Set up GitOps configuration for Argo CD Agent Pull'))
      const previous = mockWizardCallbacks[mockWizardCallbacks.length - 1]
      await user.keyboard('{Escape}')
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      await clickElement(screen.getByRole('button', { name: /create application/i }))
      await clickElement(screen.getByText('Set up GitOps configuration for Argo CD Agent Pull'))
      await act(async () => {
        previous.onSubmitSuccess?.()
        previous.onCancel?.()
      })
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      await act(async () => {
        mockWizardCallbacks?.[mockWizardCallbacks.length - 1].onSubmitSuccess?.()
      })
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    } finally {
      mockWizardCallbacks = undefined
    }
  })

  test.each([true, false])(
    'shows the Push option only when the Agent ArgoCD controller is enabled: %s',
    async (enabled) => {
      const argoCD = {
        apiVersion: 'argoproj.io/v1beta1',
        kind: 'ArgoCD',
        metadata: { name: 'openshift-gitops', namespace: 'openshift-gitops' },
        spec: { controller: { enabled } },
      }
      renderOverviewWithGitOpsClusters([mockAgentEnabledGitOpsCluster], [argoCD])
      await waitForText('feng-remote-argo8')
      await clickElement(screen.getByRole('button', { name: /create application/i }))
      expect(screen.queryByRole('menuitem', { name: /Push model/i }) !== null).toBe(enabled)
      expect(screen.getByRole('menuitem', { name: /Agent pull model/i })).not.toHaveAttribute('aria-disabled', 'true')
      expect(within(screen.getByRole('menu')).getByText('Subscription')).toBeInTheDocument()
    }
  )

  test.each([{ gitOpsClusters: [] }, { gitOpsClusters: [mockAgentEnabledGitOpsCluster] }])(
    'renders each model from its ApplicationSet regardless of hub configuration: %j',
    async ({ gitOpsClusters }) => {
      const manifestWork = {
        ...mockApplicationSet0,
        metadata: { ...mockApplicationSet0.metadata, name: 'manifestwork-appset' },
        spec: {
          ...mockApplicationSet0.spec,
          template: {
            ...mockApplicationSet0.spec.template,
            metadata: { annotations: { 'apps.open-cluster-management.io/ocm-managed-cluster': '{{name}}' } },
          },
        },
      }
      const agent = {
        ...mockApplicationSet0,
        metadata: {
          ...mockApplicationSet0.metadata,
          name: 'agent-appset',
          annotations: { 'apps.open-cluster-management.io/gitops-model': 'agent' },
        },
        spec: {
          ...mockApplicationSet0.spec,
          template: {
            ...mockApplicationSet0.spec.template,
            spec: {
              ...mockApplicationSet0.spec.template?.spec,
              project: 'default',
              destination: { namespace: 'guestbook', name: '{{name}}' },
            },
          },
        },
      }
      renderOverviewWithGitOpsClusters(gitOpsClusters, [], [...applicationAggregate.res.items, manifestWork, agent])
      await waitForText('agent-appset')
      const agentRow = screen.getByText('agent-appset').closest('tr')!
      const manifestWorkRow = screen.getByText('manifestwork-appset').closest('tr')!
      expect(within(agentRow).getByText('Agent pull')).toBeInTheDocument()
      expect(within(manifestWorkRow).getByText('ManifestWork pull')).toBeInTheDocument()
      expect(within(screen.getByText('applicationset-0').closest('tr')!).getAllByRole('cell')[2]).toHaveTextContent('-')
      expect(await axe(screen.getByRole('grid', { name: 'Applications table' }))).toHaveNoViolations()
    }
  )

  test.each([
    { model: 'ManifestWork', resource: mockGitOpsCluster },
    { model: 'Agent', resource: mockAgentEnabledGitOpsCluster },
  ])('GitOps configuration link is hidden when a $model GitOpsCluster exists', async ({ resource }) => {
    renderOverviewWithGitOpsClusters([resource])

    await waitForText('feng-remote-argo8')
    await clickElement(screen.getByRole('button', { name: /create application/i }))

    expect(screen.queryByText('Set up GitOps configuration for Argo CD Agent Pull')).not.toBeInTheDocument()
  })
})

describe('Create application dropdown', () => {
  test('Create application button should be disabled when unauthorized', async () => {
    ;(useIsAnyNamespaceAuthorized as jest.Mock).mockImplementation(() => false)
    localStorage.removeItem('acm-table-filter.applicationTable')
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    nockAggegateRequest('applications', applicationAggregate.req, applicationAggregate.res)
    nockAggegateRequest('statuses', statusAggregate.req, statusAggregate.res)
    render(
      <StateProvider
        initializeStore={(store) => {
          store.set(subscriptionsState, mockSubscriptions)
          store.set(placementDecisionsState, mockPlacementsDecisions)
          store.set(managedClustersState, mockClusters)
        }}
      >
        <AcmToastProvider>
          <AcmToastGroup />
          <MemoryRouter>
            <PluginContext.Provider
              value={{
                ...defaultPlugin,
                acmExtensions: acmExtension,
              }}
            >
              <Routes>
                <Route path="*" element={<Overview />} />
              </Routes>
            </PluginContext.Provider>
          </MemoryRouter>
        </AcmToastProvider>
      </StateProvider>
    )

    await waitForText('feng-remote-argo8')
    const createButton = screen.getByRole('button', { name: /create application/i })
    expect(createButton).toBeDisabled()
  })

  test.each([
    { configuration: 'no GitOpsCluster', resources: [], argoCDs: [] },
    { configuration: 'ManifestWork', resources: [mockGitOpsCluster], argoCDs: [] },
    ...[true, false].map((enabled) => ({
      configuration: `Agent with Push ${enabled ? 'enabled' : 'disabled'}`,
      resources: [mockAgentEnabledGitOpsCluster],
      argoCDs: [
        {
          apiVersion: 'argoproj.io/v1beta1',
          kind: 'ArgoCD',
          metadata: { name: 'openshift-gitops', namespace: 'openshift-gitops' },
          spec: { controller: { enabled } },
        },
      ],
    })),
  ])('Compare application types shows all types with $configuration', async ({ resources, argoCDs }) => {
    renderOverviewWithGitOpsClusters(resources, argoCDs)

    await waitForText('feng-remote-argo8')
    await clickElement(screen.getByRole('button', { name: /Compare application types/i }))

    const popup = screen.getByRole('dialog')
    expect(within(popup).getByText('Argo CD Agent Pull model ApplicationSet')).toBeInTheDocument()
    expect(within(popup).getByText('Argo CD ManifestWork Pull model ApplicationSet')).toBeInTheDocument()
    expect(
      within(popup).getByText(
        'ApplicationSet application where Argo CD application resources are distributed from the hub cluster to the managed clusters using the Argo CD Agent. Each managed cluster independently reconciles and deploys the application by using the received application resource.'
      )
    ).toBeInTheDocument()
    expect(
      within(popup).getByText(
        'ApplicationSet application where Argo CD application resources are distributed from the hub cluster to the managed clusters. Each managed cluster independently reconciles and deploys the application by using the received application resource.'
      )
    ).toBeInTheDocument()
    expect(within(popup).getByText('Argo CD Push model ApplicationSet')).toBeInTheDocument()
    expect(within(popup).getByText('Subscription')).toBeInTheDocument()
    expect(await axe(popup)).toHaveNoViolations()
  })

  test('keeps all types visible in an open comparison popup when the configured pull model changes', async () => {
    const view = renderOverviewWithGitOpsClusters([mockGitOpsCluster])
    await waitForText('feng-remote-argo8')
    await clickElement(screen.getByRole('button', { name: /Compare application types/i }))
    const popup = within(screen.getByRole('dialog'))
    expect(popup.getByText('Argo CD Agent Pull model ApplicationSet')).toBeInTheDocument()
    expect(popup.getByText('Argo CD ManifestWork Pull model ApplicationSet')).toBeInTheDocument()
    await act(async () => view.updateGitOpsClusters([mockAgentEnabledGitOpsCluster]))
    expect(popup.getByText('Argo CD Agent Pull model ApplicationSet')).toBeInTheDocument()
    expect(popup.getByText('Argo CD ManifestWork Pull model ApplicationSet')).toBeInTheDocument()
    expect(popup.getByText('Argo CD Push model ApplicationSet')).toBeInTheDocument()
    expect(popup.getByText('Subscription')).toBeInTheDocument()
  })
})
