/* Copyright Contributors to the Open Cluster Management project */
import { MockedProvider } from '@apollo/client/testing'
import { render, screen, waitFor } from '@testing-library/react'
import { GraphQLError } from 'graphql'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { v4 as uuidv4 } from 'uuid'
import { isFineGrainedRbacEnabledState, Settings, settingsState } from '../../../atoms'
import { nockCreate, nockGet, nockIgnoreApiPaths, nockRequest } from '../../../lib/nock-util'
import { wait, waitForNocks } from '../../../lib/test-util'
import { SearchResultItemsDocument } from '../search-sdk/search-sdk'
import SnapshotsTab from './SnapshotsTab'

// Mock UUID v4 to return predictable values during testing
jest.mock('uuid', () => ({
  v4: jest.fn(),
}))

const mockUuidV4 = jest.mocked(uuidv4)
const MOCKED_UUID = 'MOCKED_UUID'

const mockSettings: Settings = {
  SEARCH_RESULT_LIMIT: '1000',
}

const getCanUserCreateMCVReq = {
  apiVersion: 'authorization.k8s.io/v1',
  kind: 'SelfSubjectAccessReview',
  metadata: {},
  spec: {
    resourceAttributes: {
      resource: 'managedclusterviews',
      verb: 'create',
      group: 'view.open-cluster-management.io',
    },
  },
}

const getCanUserCreateMCVRes = {
  kind: 'SelfSubjectAccessReview',
  apiVersion: 'authorization.k8s.io/v1',
  spec: {
    resourceAttributes: {
      verb: 'create',
      group: 'view.open-cluster-management.io',
      resource: 'managedclusterviews',
    },
  },
  status: {
    allowed: true,
    reason:
      'RBAC: allowed by ClusterRoleBinding "cluster-admins" of ClusterRole "cluster-admin" to Group "system:cluster-admins"',
  },
}

const getMCVRequest = {
  apiVersion: 'view.open-cluster-management.io/v1beta1',
  kind: 'ManagedClusterView',
  metadata: {
    name: MOCKED_UUID,
    namespace: 'local-cluster',
    labels: {
      viewName: MOCKED_UUID,
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
    name: MOCKED_UUID,
    namespace: 'local-cluster',
    labels: {
      viewName: MOCKED_UUID,
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
    // Reset the mock before each test
    mockUuidV4.mockReset()
    mockUuidV4.mockReturnValue(MOCKED_UUID)

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
    // create the nocks but do not wait for them below to trigger the loading state.
    nockCreate(getCanUserCreateMCVReq, getCanUserCreateMCVRes)
    nockGet(getMCVRequest, getMCVResponse)
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
          loading: true,
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
    // Test the loading state while  queries finish
    expect(screen.getByText('Loading')).toBeInTheDocument()
  })

  it('should render tab with errors', async () => {
    const getCanCreateMCVNock = nockCreate(getCanUserCreateMCVReq, getCanUserCreateMCVRes)
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
    await waitForNocks([getCanCreateMCVNock, getVMManagedClusterViewNock])
    await wait()
    // Test that the component has rendered errors correctly
    await waitFor(() => expect(screen.queryByText('An unexpected error occurred.')).toBeTruthy())
    await waitFor(() => expect(screen.queryByText('Error getting search data')).toBeTruthy())
  })

  it('should render tab with correct snapshot data from search', async () => {
    const getCanCreateMCVNock = nockCreate(getCanUserCreateMCVReq, getCanUserCreateMCVRes)
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
    await waitForNocks([getCanCreateMCVNock, getVMManagedClusterViewNock])
    await wait()
    // Test that the component has rendered correctly with data
    await waitFor(() => expect(screen.queryByText('centos-stream9-snapshot-20250327135448211')).toBeTruthy())
    await waitFor(() => expect(screen.queryByText('centos-stream9-snapshot-20250325211107690')).toBeTruthy())
  })

  it('should render tab with correct snapshot data using fine-grained RBAC', async () => {
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
    const getVMNock = nockRequest('/virtualmachines/get/local-cluster/centos-stream9/openshift-cnv', {
      apiVersion: 'kubevirt.io/v1',
      kind: 'VirtualMachine',
      metadata: {
        name: 'centos-stream9',
        namespace: 'openshift-cnv',
      },
    })
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(settingsState, mockSettings)
          snapshot.set(isFineGrainedRbacEnabledState, true)
        }}
      >
        <MemoryRouter>
          <MockedProvider mocks={mocks}>
            <SnapshotsTab />
          </MockedProvider>
        </MemoryRouter>
      </RecoilRoot>
    )
    // Wait for vm requests to finish
    await waitForNocks([getVMNock])
    await wait()
    // Test that the component has rendered correctly with data
    await waitFor(() => expect(screen.queryByText('centos-stream9-snapshot-20250327135448211')).toBeTruthy())
    await waitFor(() => expect(screen.queryByText('centos-stream9-snapshot-20250325211107690')).toBeTruthy())
  })
})
