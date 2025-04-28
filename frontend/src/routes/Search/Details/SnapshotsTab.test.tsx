/* Copyright Contributors to the Open Cluster Management project */
import { MockedProvider } from '@apollo/client/testing'
import { render, screen, waitFor } from '@testing-library/react'
import { GraphQLError } from 'graphql'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { Settings, settingsState } from '../../../atoms'
import { wait } from '../../../lib/test-util'
import { SearchResultItemsDocument } from '../search-sdk/search-sdk'
import SnapshotsTab from './SnapshotsTab'

const mockSettings: Settings = {
  SEARCH_RESULT_LIMIT: '1000',
}

describe('SnapshotsTab', () => {
  it('should render tab in loading state', async () => {
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(settingsState, mockSettings)
        }}
      >
        <MemoryRouter>
          <MockedProvider mocks={[]}>
            <SnapshotsTab />
          </MockedProvider>
        </MemoryRouter>
      </RecoilRoot>
    )
    // Test the loading state while apollo query finishes
    expect(screen.getByText('Loading')).toBeInTheDocument()
  })

  it('should render tab with errors', async () => {
    const mocks = [
      {
        request: {
          query: SearchResultItemsDocument,
          variables: {
            input: [
              {
                keywords: [],
                filters: [
                  {
                    property: 'kind',
                    values: ['VirtualMachineSnapshot'],
                  },
                ],
                limit: 1000,
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
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(settingsState, mockSettings)
        }}
      >
        <MemoryRouter>
          <MockedProvider mocks={mocks}>
            <SnapshotsTab />
          </MockedProvider>
        </MemoryRouter>
      </RecoilRoot>
    )
    // This wait pauses till apollo query is returning data
    await wait()
    // Test that the component has rendered errors correctly
    await waitFor(() => expect(screen.queryByText('An unexpected error occurred.')).toBeTruthy())
    await waitFor(() => expect(screen.queryByText('Error getting search data')).toBeTruthy())
  })

  it('should render tab with correct snapshot data from search', async () => {
    const mocks = [
      {
        request: {
          query: SearchResultItemsDocument,
          variables: {
            input: [
              {
                keywords: [],
                filters: [
                  {
                    property: 'kind',
                    values: ['VirtualMachineSnapshot'],
                  },
                ],
                limit: 1000,
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
                    _hubClusterResource: 'true',
                    _uid: 'local-cluster/5e719fee-24a1-44c7-b5bf-03f024d1dff3',
                    apigroup: 'snapshot.kubevirt.io',
                    apiversion: 'v1beta1',
                    cluster: 'local-cluster',
                    created: '2025-03-27T13:54:50Z',
                    indications: 'noguestagent; online',
                    kind: 'VirtualMachineSnapshot',
                    kind_plural: 'virtualmachinesnapshots',
                    name: 'fedora-aquamarine-capybara-96-snapshot-20250327135448211',
                    namespace: 'openshift-cnv',
                    ready: 'True',
                    sourceVM: 'fedora-aquamarine-capybara-96',
                    status: 'Operation complete',
                  },
                  {
                    _hubClusterResource: 'true',
                    _uid: 'local-cluster/ebd2b806-ed5c-4651-8375-1ee3c1bd2829',
                    apigroup: 'snapshot.kubevirt.io',
                    apiversion: 'v1beta1',
                    cluster: 'local-cluster',
                    created: '2025-03-25T21:11:09Z',
                    kind: 'VirtualMachineSnapshot',
                    kind_plural: 'virtualmachinesnapshots',
                    name: 'fedora-aquamarine-capybara-96-snapshot-20250325211107690',
                    namespace: 'openshift-cnv',
                    ready: 'True',
                    sourceVM: 'fedora-aquamarine-capybara-96',
                    status: 'Operation complete',
                  },
                ],
                __typename: 'SearchResult',
              },
            ],
          },
        },
      },
    ]
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(settingsState, mockSettings)
        }}
      >
        <MemoryRouter>
          <MockedProvider mocks={mocks}>
            <SnapshotsTab />
          </MockedProvider>
        </MemoryRouter>
      </RecoilRoot>
    )
    // This wait pauses till apollo query is returning data
    await wait()
    // Test that the component has rendered correctly with data
    await waitFor(() =>
      expect(screen.queryByText('fedora-aquamarine-capybara-96-snapshot-20250327135448211')).toBeTruthy()
    )
    await waitFor(() =>
      expect(screen.queryByText('fedora-aquamarine-capybara-96-snapshot-20250325211107690')).toBeTruthy()
    )
  })
})
