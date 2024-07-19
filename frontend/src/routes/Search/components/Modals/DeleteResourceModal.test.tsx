/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { act, render, screen, waitFor } from '@testing-library/react'
import { RecoilRoot } from 'recoil'
import { Settings, settingsState } from '../../../../atoms'
import { nockIgnoreApiPaths, nockIgnoreRBAC, nockSearch } from '../../../../lib/nock-util'
import { wait, waitForNocks } from '../../../../lib/test-util'
import { fireManagedClusterAction } from '../../../../resources/managedclusteraction'
import { deleteResource } from '../../../../resources/utils/resource-request'
import { deleteResourceFn, DeleteResourceModal } from './DeleteResourceModal'

jest.mock('../../../../../lib/rbac-util', () => ({
  canUser: jest.fn(() => ({
    promise: Promise.resolve({ status: { allowed: true } }),
    abort: jest.fn(),
  })),
}))

jest.mock('../../../../../resources/utils/resource-request', () => ({
  getBackendUrl: jest.fn(() => ''),
  getResource: jest.fn(() => ({ promise: Promise.resolve() })),
  createResource: jest.fn(() => ({ promise: Promise.resolve() })),
  deleteResource: jest.fn(() => ({ promise: Promise.resolve() })),
}))

jest.mock('../../../../../resources/managedclusteraction', () => ({
  fireManagedClusterAction: jest.fn(() => Promise.resolve({ actionDone: 'ActionDone' })),
}))

const mockSettings: Settings = {
  SEARCH_RESULT_LIMIT: '1000',
}

const mockSearchQuery = {
  operationName: 'searchResultItems',
  variables: {
    input: [
      {
        keywords: [],
        filters: [
          {
            property: 'kind',
            values: ['Pod'],
          },
        ],
        limit: 1000,
      },
    ],
  },
  query:
    'query searchResultItems($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    items\n    __typename\n  }\n}',
}

const mockSearchResponse = {
  data: {
    searchResult: [
      {
        items: [
          {
            apiversion: 'v1',
            cluster: 'local-cluster',
            container: 'installer',
            created: '2021-01-04T14:53:52Z',
            hostIP: '10.0.128.203',
            kind: 'Pod',
            name: 'testPod',
            namespace: 'testNamespace',
            podIP: '10.129.0.40',
            restarts: 0,
            startedAt: '2021-01-04T14:53:52Z',
            status: 'Completed',
            _uid: 'testing-search-results-pod',
          },
        ],
        __typename: 'SearchResult',
      },
    ],
  },
}

describe('DeleteResourceModal', () => {
  it('should render component with props', async () => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()

    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(settingsState, mockSettings)
        }}
      >
        <DeleteResourceModal
          open={true}
          currentQuery={'kind:Pod'}
          resource={{
            name: 'testPod',
            namespace: 'testNamespace',
            kind: 'Pod',
            apiversion: 'v1',
            cluster: 'local-cluster',
            _hubClusterResource: 'true',
          }}
          close={() => {}}
        />
      </RecoilRoot>
    )

    await act(async () => {
      await wait() // Test that the component has rendered correctly
      await waitFor(() => expect(screen.queryByTestId('delete-resource-error')).not.toBeInTheDocument())
    })
  })

  it('should call the delete resource mutation with a successful response for local-cluster resource', async () => {
    const search = nockSearch(mockSearchQuery, mockSearchResponse)
    const mockSetDeleteResourceError = jest.fn()
    const mockOnCloseModal = jest.fn()
    deleteResourceFn(
      {
        name: 'testPod',
        namespace: 'testNamespace',
        kind: 'Pod',
        apiversion: 'v1',
        cluster: 'local-cluster',
        _hubClusterResource: 'true',
      },
      'v1',
      false,
      'kind:Pod',
      1000,
      mockSetDeleteResourceError,
      mockOnCloseModal
    )

    // Assert that deleteResource is called with the correct parameters
    expect(deleteResource).toHaveBeenCalledWith({
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: {
        name: 'testPod',
        namespace: 'testNamespace',
      },
    })

    // Simulate the promise resolution of deleteResource
    await Promise.resolve()

    await waitForNocks([search])

    expect(mockOnCloseModal).toHaveBeenCalled()
  })

  it('should call the delete resource mutation with a successful response for managed cluster resource', async () => {
    const search = nockSearch(mockSearchQuery, mockSearchResponse)
    const mockSetDeleteResourceError = jest.fn()
    const mockOnCloseModal = jest.fn()
    deleteResourceFn(
      {
        name: 'testPod',
        namespace: 'testNamespace',
        kind: 'Pod',
        apiversion: 'v1',
        cluster: 'test-cluster',
        _hubClusterResource: 'true',
      },
      'v1',
      false,
      'kind:Pod',
      1000,
      mockSetDeleteResourceError,
      mockOnCloseModal
    )

    // Assert that deleteResource is called with the correct parameters
    expect(fireManagedClusterAction).toHaveBeenCalledWith(
      'Delete',
      'test-cluster',
      'Pod',
      'v1',
      'testPod',
      'testNamespace'
    )

    // Simulate the promise resolution of fireManagedClusterAction
    await Promise.resolve({ actionDone: 'ActionDone' })

    await waitForNocks([search])

    // Assert that updateSearchResults and onCloseModal are called
    // expect(updateSearchResults).toHaveBeenCalledWith(
    //   mockResource,
    //   mockRelatedResource,
    //   mockCurrentQuery,
    //   mockSearchResultLimit
    // )
    expect(mockOnCloseModal).toHaveBeenCalled()
  })
})
