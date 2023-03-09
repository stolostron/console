/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { MockedProvider } from '@apollo/client/testing'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RecoilRoot } from 'recoil'
import { userPreferencesState } from '../../../../../atoms'
import { nockIgnoreApiPaths, nockPatch } from '../../../../../lib/nock-util'
import { wait, waitForNock } from '../../../../../lib/test-util'
import { UserPreference } from '../../../../../resources/userpreference'
import { DeleteSearchModal } from './DeleteSearchModal'

const mockUserPreferences: UserPreference[] = [
  {
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
  },
]

describe('DeleteSearchModal', () => {
  beforeEach(() => nockIgnoreApiPaths())
  it('should call the delete request with a successful response', async () => {
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(userPreferencesState, mockUserPreferences)
        }}
      >
        <MockedProvider addTypename={false}>
          <DeleteSearchModal
            searchToDelete={{
              id: '1609885947014',
              name: 'test2',
              description: 'test2',
              searchText: 'kind:cluster',
            }}
            userPreference={mockUserPreferences[0]}
            onClose={() => {}}
            setUserPreference={() => {}}
          />
        </MockedProvider>
      </RecoilRoot>
    )

    const patchNock = nockPatch(mockUserPreferences[0], [
      {
        op: 'remove',
        path: `/spec/savedSearches/1`,
        value: {
          id: '1609885947014',
          name: 'test2',
          description: 'test2',
          searchText: 'kind:cluster',
        },
      },
    ])

    // find the button and simulate a click
    const submitButton = screen.getByText('Delete')
    expect(submitButton).toBeTruthy()
    userEvent.click(submitButton)

    await waitForNock(patchNock)

    await wait() // Test that the component has rendered correctly without an error
    await waitFor(() => expect(screen.queryByTestId('delete-saved-search-error')).not.toBeInTheDocument())
  })
})
