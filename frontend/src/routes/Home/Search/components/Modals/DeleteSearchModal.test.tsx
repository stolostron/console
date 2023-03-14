/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { MockedProvider } from '@apollo/client/testing'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RecoilRoot } from 'recoil'
import { nockIgnoreApiPaths, nockPatchRequest } from '../../../../../lib/nock-util'
import { wait, waitForNocks } from '../../../../../lib/test-util'
import { UserPreference } from '../../../../../resources/userpreference'
import { DeleteSearchModal } from './DeleteSearchModal'

const mockUserPreference: UserPreference = {
  apiVersion: 'console.open-cluster-management.io/v1',
  kind: 'UserPreference',
  metadata: {
    name: 'kube-admin',
  },
  spec: {
    savedSearches: [
      {
        id: '1609811592984',
        name: 'test',
        description: 'test',
        searchText: 'kind:pod',
      },
      {
        id: '1609885947014',
        name: 'test2',
        description: 'test2',
        searchText: 'kind:cluster',
      },
    ],
  },
}

describe('DeleteSearchModal', () => {
  beforeEach(() => nockIgnoreApiPaths())
  it('should call the delete request with a successful response', async () => {
    const getUserPreferenceNock = nockPatchRequest('/userpreference', mockUserPreference)
    render(
      <RecoilRoot>
        <MockedProvider addTypename={false}>
          <DeleteSearchModal
            searchToDelete={{
              id: '1609885947014',
              name: 'test2',
              description: 'test2',
              searchText: 'kind:cluster',
            }}
            userPreference={mockUserPreference}
            onClose={() => {}}
            setUserPreference={() => {}}
          />
        </MockedProvider>
      </RecoilRoot>
    )

    // find the button and simulate a click
    const submitButton = screen.getByText('Delete')
    expect(submitButton).toBeTruthy()
    userEvent.click(submitButton)

    // Wait for UserPreference GET mock
    await waitForNocks([getUserPreferenceNock])

    await wait() // Test that the component has rendered correctly without an error
    await waitFor(() => expect(screen.queryByTestId('delete-saved-search-error')).not.toBeInTheDocument())
  })
})
