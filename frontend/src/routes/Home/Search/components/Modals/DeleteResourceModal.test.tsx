/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RecoilRoot } from 'recoil'
import { Settings, settingsState } from '../../../../../atoms'
import { nockGet, nockIgnoreApiPaths, nockIgnoreRBAC, nockSearch } from '../../../../../lib/nock-util'
import { wait, waitForNocks } from '../../../../../lib/test-util'
import { DeleteResourceModal } from './DeleteResourceModal'

const mockSettings: Settings = {
  SEARCH_RESULT_LIMIT: '1000',
}

const getMCAResponse = {
  apiVersion: 'action.open-cluster-management.io/v1beta1',
  kind: 'ManagedClusterAction',
  metadata: {
    name: 'ba8c21e9e9628448d5d3bbf50ea9703f4ef16500',
    namespace: 'local-cluster',
  },
  spec: {
    cluster: {
      name: 'local-cluster',
    },
    type: 'Action',
    scope: {
      resourceType: 'pod',
      namespace: 'testNamespace',
    },
    actionType: 'Delete',
    kube: {
      resource: 'pod',
      name: 'testPod',
      namespace: 'testNamespace',
    },
  },
  status: {
    conditions: [
      {
        message: 'Action is done.',
        reason: 'ActionDone',
        status: 'done',
        type: 'Completed',
      },
    ],
  },
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
            values: ['pod'],
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
            kind: 'pod',
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
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })

  it('should call the delete resource mutation with a successful response', async () => {
    const getSuccessfulActionNock = nockGet(getMCAResponse)
    const search = nockSearch(mockSearchQuery, mockSearchResponse)

    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(settingsState, mockSettings)
        }}
      >
        <DeleteResourceModal
          open={true}
          currentQuery={'kind:pod'}
          resource={{
            name: 'testPod',
            namespace: 'testNamespace',
            kind: 'pod',
            apiversion: 'v1',
            cluster: 'local-cluster',
            _hubClusterResource: 'true',
          }}
          close={() => {}}
        />
      </RecoilRoot>
    )

    await act(async () => {
      // find the button and simulate a click
      const submitButton = screen.getByText('Delete')
      expect(submitButton).toBeTruthy()
      expect(submitButton).not.toBeDisabled()
      userEvent.click(submitButton)

      // // Wait for delete resource requesets to finish, Mimic the polling requests
      // await waitForNocks([getSuccessfulActionNock, nockCreateMcaDeleteAction, nockDeleteReq])

      // update the apollo cache
      await waitFor(() => expect(search.isDone()).toBeTruthy())

      await wait() // Test that the component has rendered correctly

      await waitFor(() => expect(screen.queryByTestId('delete-resource-error')).not.toBeInTheDocument())
    })
    // Wait for delete resource requesets to finish, Mimic the polling requests
    await waitForNocks([getSuccessfulActionNock])
  })
})
