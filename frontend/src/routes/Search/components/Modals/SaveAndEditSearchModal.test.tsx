/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { MockedProvider } from '@apollo/client/testing'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RecoilRoot } from 'recoil'
import {
  nockIgnoreApiPaths,
  nockIgnoreOperatorCheck,
  nockPatchRequest,
  nockPostRequest,
} from '../../../../lib/nock-util'
import { wait, waitForNocks } from '../../../../lib/test-util'
import { UserPreference } from '../../../../resources/userpreference'
import { SaveAndEditSearchModal } from './SaveAndEditSearchModal'

const mockUserPreference: UserPreference = {
  apiVersion: 'console.open-cluster-management.io/v1',
  kind: 'UserPreference',
  metadata: {
    name: 'kube-admin',
  },
  spec: {
    savedSearches: [
      {
        id: '1609885947015',
        name: 'testSearch1',
        description: 'testSearch1Desc',
        searchText: 'kind:Pod',
      },
    ],
  },
}

const mockUserPreferencePatch: UserPreference = {
  apiVersion: 'console.open-cluster-management.io/v1',
  kind: 'UserPreference',
  metadata: {
    name: 'kube-admin',
  },
  spec: {
    savedSearches: [
      {
        id: '1609885947015',
        name: 'testSearch1-edit',
        description: 'testSearch1Desc-edit',
        searchText: 'kind:Pod',
      },
    ],
  },
}

describe('SaveAndEditSearchModal', () => {
  beforeEach(() => {
    nockIgnoreApiPaths()
    nockIgnoreOperatorCheck()
  })
  it('should create UserPreference with a successful response', async () => {
    Date.now = jest.fn(() => 1609885947015)
    const createUserPreferenceNock = nockPostRequest('/userpreference', [
      {
        id: '1609885947015',
        name: 'testSearch1',
        description: 'testSearch1Desc',
        searchText: 'kind:Pod',
      },
    ])
    render(
      <RecoilRoot>
        <MockedProvider addTypename={false}>
          <SaveAndEditSearchModal
            savedSearch={{
              id: '',
              name: '',
              description: '',
              searchText: 'kind:Pod',
            }}
            onClose={() => {}}
            setSelectedSearch={() => {}}
            savedSearchQueries={[]}
            userPreference={undefined}
            setUserPreference={() => {}}
          />
        </MockedProvider>
      </RecoilRoot>
    )

    // Enter saved search information
    const searchNameField = screen.getByTestId('add-query-name')
    userEvent.type(searchNameField, 'testSearch1')
    const searchDescField = screen.getByTestId('add-query-desc')
    userEvent.type(searchDescField, 'testSearch1Desc')

    // find the button and simulate a click
    const saveButton = screen.getByText('Save')
    expect(saveButton).toBeTruthy()
    userEvent.click(saveButton)

    // Wait for UserPreference GET mock
    await waitForNocks([createUserPreferenceNock])

    await wait() // Test that the component has rendered correctly without an error
    await waitFor(() => expect(screen.queryByTestId('edit-saved-search-error')).not.toBeInTheDocument())
  })

  it('should Update UserPreference with a successful response', async () => {
    const patchUserPreferenceNock = nockPatchRequest('/userpreference', mockUserPreferencePatch)
    render(
      <RecoilRoot>
        <MockedProvider addTypename={false}>
          <SaveAndEditSearchModal
            savedSearch={{
              id: '1609885947015',
              name: 'testSearch1',
              description: 'testSearch1Desc',
              searchText: 'kind:Pod',
            }}
            onClose={() => {}}
            setSelectedSearch={() => {}}
            savedSearchQueries={[
              {
                id: '1609885947015',
                name: 'testSearch1',
                description: 'testSearch1Desc',
                searchText: 'kind:Pod',
              },
            ]}
            userPreference={mockUserPreference}
            setUserPreference={() => {}}
          />
        </MockedProvider>
      </RecoilRoot>
    )

    // Enter saved search information
    const searchNameField = screen.getByTestId('add-query-name')
    userEvent.type(searchNameField, '-edit')
    const searchDescField = screen.getByTestId('add-query-desc')
    userEvent.type(searchDescField, '-edit')

    // find the button and simulate a click
    const saveButton = screen.getByText('Save')
    expect(saveButton).toBeTruthy()
    userEvent.click(saveButton)

    // Wait for UserPreference GET mock
    await waitForNocks([patchUserPreferenceNock])

    await wait() // Test that the component has rendered correctly without an error
    await waitFor(() => expect(screen.queryByTestId('edit-saved-search-error')).not.toBeInTheDocument())
  })
})
