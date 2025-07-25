/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { MockedProvider } from '@apollo/client/testing'
import { UseK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GraphQLError } from 'graphql'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockPostRequest } from '../../../lib/nock-util'
import { defaultPlugin, PluginContext } from '../../../lib/PluginContext'
import { PluginDataContext } from '../../../lib/PluginDataContext'
import { wait, waitForNocks } from '../../../lib/test-util'
import { ActionExtensionProps, ListColumnExtensionProps } from '../../../plugin-extensions/properties'
import { AcmExtension } from '../../../plugin-extensions/types'
import { SearchResultItemsAndRelatedItemsDocument, SearchSchemaDocument } from '../../Search/search-sdk/search-sdk'
import VirtualMachinesPage from './VirtualMachinesPage'
jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  useResolvedExtensions: jest.fn(),
}))
import { useResolvedExtensions } from '@openshift-console/dynamic-plugin-sdk'
const mockUseResolvedExtensions = useResolvedExtensions as jest.MockedFunction<typeof useResolvedExtensions>

const vmActionProps: ActionExtensionProps[] = [
  {
    id: 'DR Action',
    title: 'Failover',
    model: [
      {
        apiVersion: 'kubevirt.io/v1',
        kind: 'VirtualMachine',
      },
    ],
    component: () => 'DR Action',
  },
]

const vmListPageColumnProps: ListColumnExtensionProps[] = [
  {
    header: 'DR Column',
    cell: () => 'DR Status',
  },
]

const acmExtension: AcmExtension = {
  virtualMachineAction: vmActionProps,
  virtualMachineListColumn: vmListPageColumnProps,
}

jest.mock('../../../hooks/use-can-migrate-vm', () => ({
  useCanMigrateVm: () => true,
}))

describe('VirtualMachinesPage Page', () => {
  beforeEach(() => {
    mockUseResolvedExtensions.mockReturnValue([[], true, []]) // default to no extensions, resolved
  })
  it('should render page and run namespace search', async () => {
    const metricNock = nockPostRequest('/metrics?virtual-machines', {})
    const mocks = [
      {
        request: {
          query: SearchSchemaDocument,
          variables: {
            query: {
              filters: [{ property: 'kind', values: ['VirtualMachine', 'VirtualMachineInstance'] }],
              keywords: [],
              limit: 10000,
            },
          },
        },
        result: {
          data: {
            searchSchema: {
              allProperties: ['cluster', 'kind', 'label', 'name', 'namespace'],
            },
          },
        },
      },
      {
        request: {
          query: SearchResultItemsAndRelatedItemsDocument,
          variables: {
            input: [
              {
                keywords: [],
                filters: [
                  {
                    property: 'kind',
                    values: ['VirtualMachine', 'VirtualMachineInstance'],
                  },
                ],
                limit: -1,
                relatedKinds: ['VirtualMachine', 'VirtualMachineInstance'],
              },
            ],
          },
        },
        result: {
          data: {
            searchResult: [
              {
                items: [
                  {
                    apigroup: 'kubevirt.io',
                    apiversion: 'v1',
                    cluster: 'managed-cluster-1',
                    created: '2021-01-04T14:53:52Z',
                    kind: 'VirtualMachine',
                    kind_plural: 'virtualmachines',
                    name: 'testVM1',
                    namespace: 'openshift-cnv',
                    _uid: 'testCluster/1234-abcd',
                    ready: 'True',
                    status: 'Running',
                  },
                  {
                    apigroup: 'kubevirt.io',
                    apiversion: 'v1',
                    cluster: 'managed-cluster-1',
                    created: '2021-01-04T14:53:52Z',
                    kind: 'VirtualMachineInstance',
                    kind_plural: 'virtualmachineinstances',
                    name: 'testVM1',
                    namespace: 'openshift-cnv',
                    _uid: 'testCluster/1234-abcd',
                    node: 'vmi-node-1',
                    ipaddress: '1.1.1.1',
                  },
                  {
                    apigroup: 'kubevirt.io',
                    apiversion: 'v1',
                    cluster: 'managed-cluster-2',
                    created: '2021-01-04T14:53:52Z',
                    kind: 'VirtualMachine',
                    kind_plural: 'virtualmachines',
                    name: 'testVM2',
                    namespace: 'openshift-cnv',
                    _uid: 'testCluster/5678-efgh',
                    ready: 'False',
                    status: 'Stopped',
                  },
                ],
                related: [],
                __typename: 'SearchResult',
              },
            ],
          },
        },
      },
    ]
    render(
      <RecoilRoot>
        <MemoryRouter>
          <MockedProvider mocks={mocks}>
            <PluginContext.Provider
              value={{
                ...defaultPlugin,
                acmExtensions: acmExtension,
              }}
            >
              <VirtualMachinesPage />
            </PluginContext.Provider>
          </MockedProvider>
        </MemoryRouter>
      </RecoilRoot>
    )
    await waitForNocks([metricNock])
    // This wait pauses till apollo query is returning data
    await wait()
    // Test that the table has rendered with virtual machine 1 data
    await waitFor(() => expect(screen.queryByText('testVM1')).toBeTruthy()) // name
    await waitFor(() => expect(screen.queryByText('Running')).toBeTruthy()) // status
    await waitFor(() => expect(screen.queryByText('managed-cluster-1')).toBeTruthy()) // cluster
    await waitFor(() => expect(screen.queryByText('vmi-node-1')).toBeTruthy()) // node
    await waitFor(() => expect(screen.queryByText('1.1.1.1')).toBeTruthy()) // ip address

    // Test that the table has rendered with virtual machine 2 data
    await waitFor(() => expect(screen.queryByText('testVM2')).toBeTruthy()) // name
    await waitFor(() => expect(screen.queryByText('Stopped')).toBeTruthy()) // status
    await waitFor(() => expect(screen.queryByText('managed-cluster-2')).toBeTruthy()) // cluster

    // Click on the row actions dropdown for testVM1 and verify that plugin actions exist
    await waitFor(() => {
      userEvent.click(screen.getAllByRole('button', { name: 'Actions' })[0])
    })
    await waitFor(() => expect(screen.getByText('Failover')).toBeInTheDocument())

    // Click on the row actions dropdown for testVM2 and verify that plugin actions exist
    await waitFor(() => {
      userEvent.click(screen.getAllByRole('button', { name: 'Actions' })[1])
    })
    await waitFor(() => expect(screen.getByText('Failover')).toBeInTheDocument())

    // Plugin Column Header
    await waitFor(() => expect(screen.queryByText('DR Column')).toBeTruthy())

    // should run a search and verify output.
    const searchbar = screen.getByPlaceholderText('Filter VirtualMachines')
    expect(searchbar).toBeTruthy()
    userEvent.click(searchbar)
    userEvent.type(searchbar, 'namespace ')
    expect(screen.queryByText('namespace:')).toBeTruthy()
    expect(screen.getByLabelText('Search input')).toBeTruthy()
    userEvent.type(searchbar, 'openshift-cnv ')

    // check searchbar updated properly
    await waitFor(() => expect(screen.queryByText('namespace:openshift-cnv')).toBeTruthy())
  })

  it('should render page with search unavailable empty state', async () => {
    const mockUseK8sWatchResource: UseK8sWatchResource = jest.fn()
    const mockPluginContextValue = {
      ocpApi: {
        useK8sWatchResource: mockUseK8sWatchResource,
      },
      isACMAvailable: true,
      isOverviewAvailable: true,
      isSubmarinerAvailable: true,
      isApplicationsAvailable: true,
      isGovernanceAvailable: true,
      isSearchAvailable: false,
      dataContext: PluginDataContext,
      acmExtensions: {},
    }
    const metricNock = nockPostRequest('/metrics?virtual-machines', {})
    const mocks = [
      {
        request: {
          query: SearchResultItemsAndRelatedItemsDocument,
          variables: {
            input: [
              {
                keywords: [],
                filters: [
                  {
                    property: 'kind',
                    values: ['VirtualMachine', 'VirtualMachineInstance'],
                  },
                ],
                limit: -1,
                relatedKinds: ['VirtualMachine', 'VirtualMachineInstance'],
              },
            ],
          },
        },
        result: {
          data: {},
          errors: [new GraphQLError('Error getting search data')],
        },
      },
    ]
    render(
      <PluginContext.Provider value={mockPluginContextValue}>
        <RecoilRoot>
          <MemoryRouter>
            <MockedProvider mocks={mocks}>
              <VirtualMachinesPage />
            </MockedProvider>
          </MemoryRouter>
        </RecoilRoot>
      </PluginContext.Provider>
    )
    await waitForNocks([metricNock])
    // This wait pauses till apollo query is returning data
    await wait()
    // Test that the component has rendered errors correctly
    await waitFor(() => expect(screen.queryByText('Unable to display virtual machines')).toBeTruthy())
    await waitFor(() =>
      expect(
        screen.queryByText(
          'To view managed virtual machines, you must enable Search for Red Hat Advanced Cluster Management.'
        )
      ).toBeTruthy()
    )
  })

  it('should render page with errors', async () => {
    const metricNock = nockPostRequest('/metrics?virtual-machines', {})
    const mocks = [
      {
        request: {
          query: SearchSchemaDocument,
          variables: {
            query: {
              filters: [{ property: 'kind', values: ['VirtualMachine', 'VirtualMachineInstance'] }],
              keywords: [],
              limit: 10000,
            },
          },
        },
        result: {
          data: {
            searchSchema: {
              allProperties: ['cluster', 'kind', 'label', 'name', 'namespace'],
            },
          },
        },
      },
      {
        request: {
          query: SearchResultItemsAndRelatedItemsDocument,
          variables: {
            input: [
              {
                keywords: [],
                filters: [
                  {
                    property: 'kind',
                    values: ['VirtualMachine', 'VirtualMachineInstance'],
                  },
                ],
                limit: -1,
                relatedKinds: ['VirtualMachine', 'VirtualMachineInstance'],
              },
            ],
          },
        },
        result: {
          data: {},
          errors: [new GraphQLError('Error getting search data')],
        },
      },
    ]
    render(
      <RecoilRoot>
        <MemoryRouter>
          <MockedProvider mocks={mocks}>
            <VirtualMachinesPage />
          </MockedProvider>
        </MemoryRouter>
      </RecoilRoot>
    )
    await waitForNocks([metricNock])
    // This wait pauses till apollo query is returning data
    await wait()
    // Test that the component has rendered errors correctly
    await waitFor(() => expect(screen.queryByText('Error querying for VirtualMachines')).toBeTruthy())
    await waitFor(() => expect(screen.queryByText('Error occurred while contacting the search service.')).toBeTruthy())
    await waitFor(() => expect(screen.queryByText('Error getting search data')).toBeTruthy())
  })
})
