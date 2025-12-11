/* Copyright Contributors to the Open Cluster Management project */

// Mock CSS imports
jest.mock('../css/topology-toolbar.css', () => ({}))

// Mock translation
jest.mock('../../../../../../lib/acm-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Mock search hook
const mockStartPolling = jest.fn()
const mockUseQuery = jest.fn()
jest.mock('../../../../../../lib/search', () => ({
  useQuerySearchDisabledManagedClusters: jest.fn(() => jest.fn()),
}))

jest.mock('../../../../../../lib/useQuery', () => ({
  useQuery: () => mockUseQuery(),
}))

// Mock child components
jest.mock('../../components/LegendView', () => ({
  __esModule: true,
  default: () => <div data-testid="legend-view">LegendView</div>,
}))

jest.mock('../../components/ChannelControl', () => ({
  __esModule: true,
  default: ({ channelControl }: { channelControl: { allChannels: string[] } }) => (
    <div data-testid="channel-control">ChannelControl - {channelControl.allChannels.length} channels</div>
  ),
}))

import { render, screen, fireEvent } from '@testing-library/react'
import TopologyToolbar from './TopologyToolbar'
import { TopologyProps } from '../Topology'

const mockSetDrawerContent = jest.fn()

const createDefaultProps = (overrides: Partial<TopologyProps> = {}): TopologyProps => ({
  elements: {
    nodes: [],
    links: [],
  },
  channelControl: {
    allChannels: [],
    activeChannel: undefined,
    setActiveChannel: jest.fn(),
  },
  argoAppDetailsContainerControl: {
    argoAppDetailsContainerData: {
      page: 0,
      startIdx: 0,
      argoAppSearchToggle: false,
      expandSectionToggleMap: new Set<number>(),
      selectedArgoAppList: [],
      isLoading: false,
    },
    handleArgoAppDetailsContainerUpdate: jest.fn(),
    handleErrorMsg: jest.fn(),
  },
  clusterDetailsContainerControl: {
    clusterDetailsContainerData: {
      page: 0,
      startIdx: 0,
      clusterSearchToggle: false,
      expandSectionToggleMap: {},
      selectedClusterList: [],
    },
    handleClusterDetailsContainerUpdate: jest.fn(),
  },
  setDrawerContent: mockSetDrawerContent,
  hubClusterName: 'local-cluster',
  ...overrides,
})

describe('TopologyToolbar tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseQuery.mockReturnValue({
      data: [],
      startPolling: mockStartPolling,
    })
  })

  test('renders the toolbar', () => {
    const props = createDefaultProps()
    render(<TopologyToolbar {...props} />)

    expect(screen.getByText('How to read topology')).toBeInTheDocument()
  })

  test('renders How to read topology button', () => {
    const props = createDefaultProps()
    render(<TopologyToolbar {...props} />)

    const howToReadButton = screen.getByRole('button', { name: /how to read topology/i })
    expect(howToReadButton).toBeInTheDocument()
  })

  test('calls setDrawerContent when How to read topology is clicked', () => {
    const props = createDefaultProps()
    render(<TopologyToolbar {...props} />)

    const howToReadButton = screen.getByRole('button', { name: /how to read topology/i })
    fireEvent.click(howToReadButton)

    expect(mockSetDrawerContent).toHaveBeenCalledWith(
      'How to read topology',
      false,
      false,
      false,
      false,
      expect.anything(), // LegendView component
      false
    )
  })

  test('does not render ChannelControl when no channels', () => {
    const props = createDefaultProps()
    render(<TopologyToolbar {...props} />)

    expect(screen.queryByTestId('channel-control')).not.toBeInTheDocument()
  })

  test('does not render ChannelControl when only one channel', () => {
    const props = createDefaultProps({
      channelControl: {
        allChannels: ['channel1'],
        activeChannel: 'channel1',
        setActiveChannel: jest.fn(),
      },
    })
    render(<TopologyToolbar {...props} />)

    expect(screen.queryByTestId('channel-control')).not.toBeInTheDocument()
  })

  test('renders ChannelControl when multiple channels exist', () => {
    const props = createDefaultProps({
      channelControl: {
        allChannels: ['channel1', 'channel2'],
        activeChannel: 'channel1',
        setActiveChannel: jest.fn(),
      },
    })
    const { container } = render(<TopologyToolbar {...props} />)

    // ChannelControl should be rendered when there are more than 1 channel
    // Check that the component renders (mock renders a div with channel count)
    expect(container.querySelector('[data-testid="channel-control"]')).toBeInTheDocument()
  })

  test('does not render search disabled alert when no clusters have search disabled', () => {
    const props = createDefaultProps({
      elements: {
        nodes: [{ type: 'cluster', name: 'cluster1' }],
        links: [],
      },
    })
    render(<TopologyToolbar {...props} />)

    expect(
      screen.queryByText(
        'Currently, search is disabled on some of your managed clusters. Some data might be missing from the topology view.'
      )
    ).not.toBeInTheDocument()
  })

  test('renders search disabled alert when cluster has search disabled', async () => {
    mockUseQuery.mockReturnValue({
      data: [
        {
          data: {
            searchResult: [
              {
                items: [{ name: 'disabled-cluster' }],
              },
            ],
          },
        },
      ],
      startPolling: mockStartPolling,
    })

    const props = createDefaultProps({
      elements: {
        nodes: [
          { type: 'cluster', name: 'disabled-cluster' },
          { type: 'application', name: 'my-app' },
        ],
        links: [],
      },
    })
    render(<TopologyToolbar {...props} />)

    expect(
      await screen.findByText(
        'Currently, search is disabled on some of your managed clusters. Some data might be missing from the topology view.'
      )
    ).toBeInTheDocument()
  })

  test('renders view clusters link in search disabled alert', async () => {
    mockUseQuery.mockReturnValue({
      data: [
        {
          data: {
            searchResult: [
              {
                items: [{ name: 'disabled-cluster' }],
              },
            ],
          },
        },
      ],
      startPolling: mockStartPolling,
    })

    const props = createDefaultProps({
      elements: {
        nodes: [{ type: 'cluster', name: 'disabled-cluster' }],
        links: [],
      },
    })
    render(<TopologyToolbar {...props} />)

    expect(await screen.findByText('View clusters with search add-on disabled.')).toBeInTheDocument()
  })

  test('opens search page in new window when view clusters link is clicked', async () => {
    const mockWindowOpen = jest.spyOn(window, 'open').mockImplementation()

    mockUseQuery.mockReturnValue({
      data: [
        {
          data: {
            searchResult: [
              {
                items: [{ name: 'disabled-cluster' }],
              },
            ],
          },
        },
      ],
      startPolling: mockStartPolling,
    })

    const props = createDefaultProps({
      elements: {
        nodes: [{ type: 'cluster', name: 'disabled-cluster' }],
        links: [],
      },
      hubClusterName: 'local-cluster',
    })
    render(<TopologyToolbar {...props} />)

    const viewClustersLink = await screen.findByText('View clusters with search add-on disabled.')
    fireEvent.click(viewClustersLink)

    expect(mockWindowOpen).toHaveBeenCalledWith(
      '/multicloud/search?filters={"textsearch":"kind%3ACluster%20addon%3Asearch-collector%3Dfalse%20name%3A!local-cluster"}',
      '_blank'
    )

    mockWindowOpen.mockRestore()
  })

  test('starts polling on mount', () => {
    const props = createDefaultProps()
    render(<TopologyToolbar {...props} />)

    expect(mockStartPolling).toHaveBeenCalled()
  })

  test('does not call setDrawerContent if it is not a function', () => {
    const props = createDefaultProps({
      setDrawerContent: undefined as unknown as TopologyProps['setDrawerContent'],
    })
    render(<TopologyToolbar {...props} />)

    const howToReadButton = screen.getByRole('button', { name: /how to read topology/i })
    fireEvent.click(howToReadButton)

    // Should not throw an error
    expect(mockSetDrawerContent).not.toHaveBeenCalled()
  })

  test('filters only cluster type nodes when checking for disabled search', async () => {
    mockUseQuery.mockReturnValue({
      data: [
        {
          data: {
            searchResult: [
              {
                items: [{ name: 'disabled-cluster' }],
              },
            ],
          },
        },
      ],
      startPolling: mockStartPolling,
    })

    // Include nodes of different types, but only 'cluster' type with matching name
    const props = createDefaultProps({
      elements: {
        nodes: [
          { type: 'application', name: 'disabled-cluster' }, // Same name but wrong type
          { type: 'subscription', name: 'some-sub' },
        ],
        links: [],
      },
    })
    render(<TopologyToolbar {...props} />)

    // Alert should NOT appear because there's no cluster node with that name
    expect(
      screen.queryByText(
        'Currently, search is disabled on some of your managed clusters. Some data might be missing from the topology view.'
      )
    ).not.toBeInTheDocument()
  })
})
