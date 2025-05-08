/* Copyright Contributors to the Open Cluster Management project */
import { MockedProvider } from '@apollo/client/testing'
import { render, screen, waitFor } from '@testing-library/react'
import { GraphQLError } from 'graphql'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { Settings, settingsState } from '../../../atoms'
import { nockGet, nockIgnoreApiPaths } from '../../../lib/nock-util'
import { wait, waitForNocks } from '../../../lib/test-util'
import { SearchResultItemsDocument } from '../search-sdk/search-sdk'
import SnapshotsTab from './SnapshotsTab'

const mockSettings: Settings = {
  SEARCH_RESULT_LIMIT: '1000',
}

const getMCVRequest = {
  apiVersion: 'view.open-cluster-management.io/v1beta1',
  kind: 'ManagedClusterView',
  metadata: {
    name: '9bce2a87c0003e05b2a6467c990176d75c1d65d8',
    namespace: 'local-cluster',
    labels: {
      viewName: '9bce2a87c0003e05b2a6467c990176d75c1d65d8',
    },
  },
  spec: {
    scope: {
      name: 'centos-stream9',
      resource: 'virtualmachine.kubevirt.io/v1',
      namespace: 'openshift-cnv',
    },
  },
}

const getMCVResponse = {
  apiVersion: 'view.open-cluster-management.io/v1beta1',
  kind: 'ManagedClusterView',
  metadata: {
    name: '9bce2a87c0003e05b2a6467c990176d75c1d65d8',
    namespace: 'local-cluster',
    labels: {
      viewName: '9bce2a87c0003e05b2a6467c990176d75c1d65d8',
    },
  },
  spec: {
    scope: {
      name: 'centos-stream9',
      resource: 'virtualmachine.kubevirt.io/v1',
      namespace: 'openshift-cnv',
    },
  },
  status: {
    conditions: [
      {
        message: 'Watching resources successfully',
        reason: 'GetResourceProcessing',
        status: 'True',
        type: 'Processing',
      },
    ],
    result: {
      result: {
        apiVersion: 'kubevirt.io/v1',
        kind: 'VirtualMachine',
        metadata: {
          creationTimestamp: '2024-10-02T20:02:14Z',
          finalizers: ['kubevirt.io/virtualMachineControllerFinalize'],
          name: 'centos-stream9',
          namespace: 'openshift-cnv',
          resourceVersion: '112564972',
          uid: '4d2cd231-0794-4a4b-89a3-90bb8b6ea89b',
        },
        status: {
          printableStatus: 'Running',
          ready: true,
        },
      },
    },
  },
}

describe('SnapshotsTab', () => {
  beforeEach(() => {
    nockIgnoreApiPaths()
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/multicloud/search/resources',
        search:
          '?cluster=local-cluster&kind=VirtualMachine&apiversion=kubevirt.io/v1&namespace=openshift-cnv&name=centos-stream9&_hubClusterResource=true',
      },
    })
  })
  it('should render tab in loading state', async () => {
    const getVMManagedClusterViewNock = nockGet(getMCVRequest, getMCVResponse)
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
    // Wait for managed cluster view requests to finish
    await waitForNocks([getVMManagedClusterViewNock])
    await wait()

    // Test the loading state while apollo query finishes
    expect(screen.getByText('Loading')).toBeInTheDocument()
  })

  it('should render tab with errors', async () => {
    const getVMManagedClusterViewNock = nockGet(getMCVRequest, getMCVResponse)
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
                  { property: 'sourceName', values: ['centos-stream9'] },
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
    // Wait for managed cluster view requests to finish
    await waitForNocks([getVMManagedClusterViewNock])
    await wait()
    // Test that the component has rendered errors correctly
    await waitFor(() => expect(screen.queryByText('An unexpected error occurred.')).toBeTruthy())
    await waitFor(() => expect(screen.queryByText('Error getting search data')).toBeTruthy())
  })

  it('should render tab with correct snapshot data from search', async () => {
    const getVMManagedClusterViewNock = nockGet(getMCVRequest, getMCVResponse)
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
                  { property: 'sourceName', values: ['centos-stream9'] },
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
                    name: 'centos-stream9-snapshot-20250327135448211',
                    namespace: 'openshift-cnv',
                    ready: 'True',
                    sourceName: 'centos-stream9',
                    _conditionReadyReason: 'Operation complete',
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
                    name: 'centos-stream9-snapshot-20250325211107690',
                    namespace: 'openshift-cnv',
                    ready: 'True',
                    sourceName: 'centos-stream9',
                    _conditionReadyReason: 'Operation complete',
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
    // Wait for managed cluster view requests to finish
    await waitForNocks([getVMManagedClusterViewNock])
    await wait()
    // Test that the component has rendered correctly with data
    await waitFor(() => expect(screen.queryByText('centos-stream9-snapshot-20250327135448211')).toBeTruthy())
    await waitFor(() => expect(screen.queryByText('centos-stream9-snapshot-20250325211107690')).toBeTruthy())
  })
})
