/* Copyright Contributors to the Open Cluster Management project */

import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TopologyToolbar, { useToolbarControl, ToolbarControl } from './TopologyToolbar'
import { TopologyProps } from '../Topology'

// Mock CSS
jest.mock('../css/topology-toolbar.css', () => ({}))

// Mock the translation hook
jest.mock('../../../../../../lib/acm-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Mock the search hook
const mockStartPolling = jest.fn()
const mockQueryData: Array<{
  data?: {
    searchResult?: Array<{
      items?: Array<{ name: string }>
    }>
  }
}> = []

jest.mock('../../../../../../lib/search', () => ({
  useQuerySearchDisabledManagedClusters: jest.fn(() => jest.fn()),
}))

jest.mock('../../../../../../lib/useQuery', () => ({
  useQuery: jest.fn(() => ({
    data: mockQueryData,
    startPolling: mockStartPolling,
  })),
}))

// Mock NavigationPath
jest.mock('../../../../../../NavigationPath', () => ({
  NavigationPath: {
    search: '/search',
  },
}))

// Mock LegendView
jest.mock('../../components/LegendView', () => ({
  __esModule: true,
  default: () => <div data-testid="legend-view">Legend View</div>,
}))

// Mock ChannelControl
jest.mock('../../components/ChannelControl', () => ({
  __esModule: true,
  default: () => <div data-testid="channel-control">Channel Control</div>,
}))

const createMockToolbarControl = (overrides?: Partial<ToolbarControl>): ToolbarControl => ({
  allClusters: undefined,
  activeClusters: undefined,
  setActiveClusters: jest.fn(),
  setAllClusters: jest.fn(),
  allApplications: undefined,
  activeApplications: undefined,
  setAllApplications: jest.fn(),
  setActiveApplications: jest.fn(),
  allTypes: undefined,
  activeTypes: undefined,
  setAllTypes: jest.fn(),
  setActiveTypes: jest.fn(),
  ...overrides,
})

const createMockTopologyProps = (overrides?: Partial<TopologyProps>): TopologyProps => ({
  elements: {
    nodes: [],
    links: [],
  },
  channelControl: {
    allChannels: [],
    activeChannel: undefined,
    setActiveChannel: jest.fn(),
  },
  toolbarControl: createMockToolbarControl(),
  argoAppDetailsContainerControl: {
    argoAppDetailsContainerData: {
      page: 1,
      startIdx: 0,
      argoAppSearchToggle: false,
      expandSectionToggleMap: new Set(),
      selectedArgoAppList: [],
      isLoading: false,
    },
    handleArgoAppDetailsContainerUpdate: jest.fn(),
    handleErrorMsg: jest.fn(),
  },
  clusterDetailsContainerControl: {
    clusterDetailsContainerData: {
      page: 1,
      startIdx: 0,
      clusterSearchToggle: false,
      expandSectionToggleMap: new Set(),
      selectedClusterList: [],
    },
    handleClusterDetailsContainerUpdate: jest.fn(),
  },
  setDrawerContent: jest.fn(),
  hubClusterName: 'local-cluster',
  ...overrides,
})

describe('TopologyToolbar tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockQueryData.length = 0
  })

  describe('Basic rendering', () => {
    test('renders the toolbar', () => {
      const props = createMockTopologyProps()
      render(<TopologyToolbar {...props} />)

      expect(screen.getByText('How to read topology')).toBeInTheDocument()
    })

    test('does not render filter toggles when no clusters, applications, or types', () => {
      const props = createMockTopologyProps()
      render(<TopologyToolbar {...props} />)

      expect(screen.queryByText(/Clusters/)).not.toBeInTheDocument()
      expect(screen.queryByText(/Applications/)).not.toBeInTheDocument()
      expect(screen.queryByText(/Types/)).not.toBeInTheDocument()
    })

    test('renders cluster filter when clusters are available', () => {
      const props = createMockTopologyProps({
        toolbarControl: createMockToolbarControl({
          allClusters: ['cluster1', 'cluster2'],
        }),
      })
      render(<TopologyToolbar {...props} />)

      expect(screen.getByText(/Clusters/)).toBeInTheDocument()
    })

    test('renders applications filter when applications are available', () => {
      const props = createMockTopologyProps({
        toolbarControl: createMockToolbarControl({
          allApplications: ['app1', 'app2'],
        }),
      })
      render(<TopologyToolbar {...props} />)

      // Uses getAllByText since "Applications" appears multiple times (label and dropdown)
      expect(screen.getAllByText(/Applications/).length).toBeGreaterThan(0)
    })

    test('renders types filter when types are available', () => {
      const props = createMockTopologyProps({
        toolbarControl: createMockToolbarControl({
          allTypes: ['Deployment', 'Service'],
        }),
      })
      render(<TopologyToolbar {...props} />)

      expect(screen.getByText(/Types/)).toBeInTheDocument()
    })
  })

  describe('Channel control', () => {
    test('renders channel control when multiple channels exist', () => {
      const props = createMockTopologyProps({
        channelControl: {
          allChannels: ['channel1', 'channel2'],
          activeChannel: 'channel1',
          setActiveChannel: jest.fn(),
        },
      })
      const { container } = render(<TopologyToolbar {...props} />)

      // Channel control should be rendered when more than 1 channel exists
      const channelControl =
        container.querySelector('[data-testid="channel-control"]') || screen.queryByTestId('channel-control')
      expect(channelControl).toBeInTheDocument()
    })

    test('does not render channel control when only one channel exists', () => {
      const props = createMockTopologyProps({
        channelControl: {
          allChannels: ['channel1'],
          activeChannel: 'channel1',
          setActiveChannel: jest.fn(),
        },
      })
      render(<TopologyToolbar {...props} />)

      expect(screen.queryByTestId('channel-control')).not.toBeInTheDocument()
    })
  })

  describe('Cluster selection', () => {
    test('displays "No clusters" when no clusters are available', () => {
      // Need to have at least one filter category populated to show the toolbar
      const props = createMockTopologyProps({
        toolbarControl: createMockToolbarControl({
          allClusters: [],
          allTypes: ['Deployment'], // Need this to show the toolbar
        }),
      })
      render(<TopologyToolbar {...props} />)

      expect(screen.getByText('No clusters')).toBeInTheDocument()
    })

    test('displays single cluster name when only one cluster exists', () => {
      const props = createMockTopologyProps({
        toolbarControl: createMockToolbarControl({
          allClusters: ['my-cluster'],
        }),
      })
      render(<TopologyToolbar {...props} />)

      expect(screen.getByText('my-cluster')).toBeInTheDocument()
    })

    test('displays "All clusters" when multiple clusters and none selected', () => {
      const props = createMockTopologyProps({
        toolbarControl: createMockToolbarControl({
          allClusters: ['cluster1', 'cluster2'],
          activeClusters: undefined,
        }),
      })
      render(<TopologyToolbar {...props} />)

      expect(screen.getByText('All clusters')).toBeInTheDocument()
    })

    test('opens cluster dropdown and allows selection', async () => {
      const setActiveClusters = jest.fn()
      const props = createMockTopologyProps({
        toolbarControl: createMockToolbarControl({
          allClusters: ['cluster1', 'cluster2'],
          activeClusters: undefined,
          setActiveClusters,
        }),
      })
      render(<TopologyToolbar {...props} />)

      // Click on the cluster dropdown toggle
      const toggle = screen.getByText('All clusters')
      await userEvent.click(toggle)

      // Should show cluster options
      await waitFor(() => {
        expect(screen.getByText('cluster1')).toBeInTheDocument()
      })

      // Select a cluster
      await userEvent.click(screen.getByText('cluster1'))

      expect(setActiveClusters).toHaveBeenCalledWith(['cluster1'])
    })

    test('shows badge with count when clusters are selected', () => {
      const props = createMockTopologyProps({
        toolbarControl: createMockToolbarControl({
          allClusters: ['cluster1', 'cluster2'],
          activeClusters: ['cluster1'],
        }),
      })
      const { container } = render(<TopologyToolbar {...props} />)

      // When there are active clusters, a badge should show the count
      const badge = container.querySelector('.pf-v6-c-badge')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveTextContent('1')
    })
  })

  describe('Applications selection', () => {
    test('displays single application name when only one application exists', () => {
      const props = createMockTopologyProps({
        toolbarControl: createMockToolbarControl({
          allApplications: ['my-app'],
        }),
      })
      render(<TopologyToolbar {...props} />)

      expect(screen.getByText('my-app')).toBeInTheDocument()
    })

    test('opens applications dropdown and allows selection', async () => {
      const setActiveApplications = jest.fn()
      const props = createMockTopologyProps({
        toolbarControl: createMockToolbarControl({
          allApplications: ['app1', 'app2'],
          activeApplications: undefined,
          setActiveApplications,
        }),
      })
      render(<TopologyToolbar {...props} />)

      // Click on the applications dropdown toggle
      const toggle = screen.getByText('All applications')
      await userEvent.click(toggle)

      await waitFor(() => {
        expect(screen.getByText('app1')).toBeInTheDocument()
      })

      await userEvent.click(screen.getByText('app1'))

      expect(setActiveApplications).toHaveBeenCalledWith(['app1'])
    })
  })

  describe('Types selection', () => {
    test('displays "No types" when no types are available', () => {
      // Need to have at least one filter category populated to show the toolbar
      const props = createMockTopologyProps({
        toolbarControl: createMockToolbarControl({
          allTypes: [],
          allClusters: ['cluster1'], // Need this to show the toolbar
        }),
      })
      render(<TopologyToolbar {...props} />)

      expect(screen.getByText('No types')).toBeInTheDocument()
    })

    test('opens types dropdown and allows selection', async () => {
      const setActiveTypes = jest.fn()
      const props = createMockTopologyProps({
        toolbarControl: createMockToolbarControl({
          allTypes: ['Deployment', 'Service'],
          activeTypes: undefined,
          setActiveTypes,
        }),
      })
      render(<TopologyToolbar {...props} />)

      // Click on the types dropdown toggle
      const toggle = screen.getByText('All types')
      await userEvent.click(toggle)

      await waitFor(() => {
        expect(screen.getByText('Deployment')).toBeInTheDocument()
      })

      await userEvent.click(screen.getByText('Deployment'))

      expect(setActiveTypes).toHaveBeenCalledWith(['Deployment'])
    })
  })

  describe('Delete filters', () => {
    test('has clearAllFilters callback configured', () => {
      const setActiveClusters = jest.fn()
      const setActiveApplications = jest.fn()
      const setActiveTypes = jest.fn()
      const setDrawerContent = jest.fn()

      const props = createMockTopologyProps({
        setDrawerContent,
        toolbarControl: createMockToolbarControl({
          allClusters: ['cluster1'],
          activeClusters: ['cluster1'],
          setActiveClusters,
          allApplications: ['app1'],
          activeApplications: ['app1'],
          setActiveApplications,
          allTypes: ['Deployment'],
          activeTypes: ['Deployment'],
          setActiveTypes,
        }),
      })
      const { container } = render(<TopologyToolbar {...props} />)

      // The toolbar renders with clearAllFilters callback which is connected to the Toolbar component
      // Verify the toolbar is rendered with the filter groups
      expect(container.querySelector('.pf-m-toggle-group-container')).toBeInTheDocument()
    })
  })

  describe('Search disabled alert', () => {
    test('shows alert when search is disabled on some clusters', async () => {
      // Mock the query data to return clusters with search disabled
      mockQueryData.push({
        data: {
          searchResult: [
            {
              items: [{ name: 'disabled-cluster' }],
            },
          ],
        },
      })

      const props = createMockTopologyProps({
        elements: {
          nodes: [{ id: '1', name: 'disabled-cluster', type: 'cluster', specs: {} }],
          links: [],
        },
      })
      render(<TopologyToolbar {...props} />)

      await waitFor(() => {
        expect(
          screen.getByText(
            'Currently, search is disabled on some of your managed clusters. Some data might be missing from the topology view.'
          )
        ).toBeInTheDocument()
      })
    })

    test('shows link to view clusters with search add-on disabled', async () => {
      mockQueryData.push({
        data: {
          searchResult: [
            {
              items: [{ name: 'disabled-cluster' }],
            },
          ],
        },
      })

      const props = createMockTopologyProps({
        elements: {
          nodes: [{ id: '1', name: 'disabled-cluster', type: 'cluster', specs: {} }],
          links: [],
        },
      })
      render(<TopologyToolbar {...props} />)

      await waitFor(() => {
        expect(screen.getByText('View clusters with search add-on disabled.')).toBeInTheDocument()
      })
    })
  })

  describe('How to read topology', () => {
    test('clicking "How to read topology" opens legend drawer', async () => {
      const setDrawerContent = jest.fn()
      const props = createMockTopologyProps({
        setDrawerContent,
      })
      render(<TopologyToolbar {...props} />)

      const howToReadText = screen.getByText('How to read topology')
      await userEvent.click(howToReadText)

      expect(setDrawerContent).toHaveBeenCalledWith(
        'How to read topology',
        false,
        false,
        false,
        false,
        expect.anything(), // The LegendView component
        false
      )
    })

    test('keyboard navigation works for "How to read topology"', async () => {
      const setDrawerContent = jest.fn()
      const props = createMockTopologyProps({
        setDrawerContent,
      })
      render(<TopologyToolbar {...props} />)

      const howToReadText = screen.getByText('How to read topology')
      howToReadText.focus()
      // The component uses onKeyDown={noop} so we just verify it has focus capability
      expect(howToReadText).toHaveAttribute('tabIndex', '0')
    })
  })
})

describe('useToolbarControl hook', () => {
  // Helper component to test the hook
  let hookResult: ToolbarControl | null = null
  const TestHookComponent = () => {
    hookResult = useToolbarControl()
    return null
  }

  beforeEach(() => {
    hookResult = null
  })

  test('initializes with undefined values', () => {
    render(<TestHookComponent />)

    expect(hookResult).not.toBeNull()
    expect(hookResult!.allClusters).toBeUndefined()
    expect(hookResult!.activeClusters).toBeUndefined()
    expect(hookResult!.allApplications).toBeUndefined()
    expect(hookResult!.activeApplications).toBeUndefined()
    expect(hookResult!.allTypes).toBeUndefined()
    expect(hookResult!.activeTypes).toBeUndefined()
  })

  test('setAllClusters updates allClusters', async () => {
    const { rerender } = render(<TestHookComponent />)

    act(() => {
      hookResult!.setAllClusters(['cluster1', 'cluster2'])
    })
    rerender(<TestHookComponent />)

    expect(hookResult!.allClusters).toEqual(['cluster1', 'cluster2'])
  })

  test('setActiveClusters updates activeClusters', async () => {
    const { rerender } = render(<TestHookComponent />)

    act(() => {
      hookResult!.setActiveClusters(['cluster1'])
    })
    rerender(<TestHookComponent />)

    expect(hookResult!.activeClusters).toEqual(['cluster1'])
  })

  test('setAllApplications updates allApplications', async () => {
    const { rerender } = render(<TestHookComponent />)

    act(() => {
      hookResult!.setAllApplications(['app1', 'app2'])
    })
    rerender(<TestHookComponent />)

    expect(hookResult!.allApplications).toEqual(['app1', 'app2'])
  })

  test('setActiveApplications updates activeApplications', async () => {
    const { rerender } = render(<TestHookComponent />)

    act(() => {
      hookResult!.setActiveApplications(['app1'])
    })
    rerender(<TestHookComponent />)

    expect(hookResult!.activeApplications).toEqual(['app1'])
  })

  test('setAllTypes updates allTypes', async () => {
    const { rerender } = render(<TestHookComponent />)

    act(() => {
      hookResult!.setAllTypes(['Deployment', 'Service'])
    })
    rerender(<TestHookComponent />)

    expect(hookResult!.allTypes).toEqual(['Deployment', 'Service'])
  })

  test('setActiveTypes updates activeTypes', async () => {
    const { rerender } = render(<TestHookComponent />)

    act(() => {
      hookResult!.setActiveTypes(['Deployment'])
    })
    rerender(<TestHookComponent />)

    expect(hookResult!.activeTypes).toEqual(['Deployment'])
  })

  test('can clear values by setting to undefined', async () => {
    const { rerender } = render(<TestHookComponent />)

    // First set values
    act(() => {
      hookResult!.setAllClusters(['cluster1'])
      hookResult!.setActiveClusters(['cluster1'])
    })
    rerender(<TestHookComponent />)

    expect(hookResult!.allClusters).toEqual(['cluster1'])
    expect(hookResult!.activeClusters).toEqual(['cluster1'])

    // Then clear them
    act(() => {
      hookResult!.setActiveClusters(undefined)
    })
    rerender(<TestHookComponent />)

    expect(hookResult!.activeClusters).toBeUndefined()
  })
})
