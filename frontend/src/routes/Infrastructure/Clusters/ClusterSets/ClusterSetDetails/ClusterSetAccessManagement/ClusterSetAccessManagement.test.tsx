/* Copyright Contributors to the Open Cluster Management project */

import { render, waitFor } from '@testing-library/react'
import { screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, generatePath } from 'react-router'
import { StateProvider } from '~/lib/state-provider'
import { NavigationPath } from '../../../../../../NavigationPath'
import { clickByText, waitForNocks, waitForTestId, waitForText, clickElement } from '~/lib/test-util'

import { mockGlobalManagedClusterSet, mockManagedClusterSet } from '../../../../../../lib/test-metadata'
import { ClusterRoleBinding, ClusterRoleBindingKind, Group, RbacApiVersion, User } from '../../../../../../resources'
import Clusters from '../../../Clusters'
import { managedClusterSetsState } from '../../../../../../atoms'
import { nockClusterList, nockIgnoreApiPaths, nockIgnoreRBAC } from '../../../../../../lib/nock-util'
import {
  useHasHubUsers,
  useUserIdentity,
  useUsersSearch,
} from '../../../../../UserManagement/Identities/Users/useUsersSearch'
import {
  useGroupIdentity,
  useGroupsSearch,
  useHasHubGroups,
} from '../../../../../UserManagement/Identities/Groups/useGroupsSearch'

jest.mock('../../../../../UserManagement/Identities/Users/useUsersSearch', () => ({
  useHasHubUsers: jest.fn(() => {
    throw new Error('Cluster Set Add Access must not call useHasHubUsers (Search)')
  }),
  useUserIdentity: jest.fn(() => {
    throw new Error('Cluster Set Add Access must not call useUserIdentity (Search)')
  }),
  useUsersSearch: jest.fn(() => {
    throw new Error('Cluster Set Add Access must not call useUsersSearch (Search)')
  }),
  useMraUserSubjects: jest.fn(() => []),
  preferSearchBackedUsers: jest.requireActual('../../../../../UserManagement/Identities/Users/useUsersSearch')
    .preferSearchBackedUsers,
  isSearchBackedUser: jest.requireActual('../../../../../UserManagement/Identities/Users/useUsersSearch')
    .isSearchBackedUser,
}))

jest.mock('../../../../../UserManagement/Identities/Groups/useGroupsSearch', () => ({
  useHasHubGroups: jest.fn(() => {
    throw new Error('Cluster Set Add Access must not call useHasHubGroups (Search)')
  }),
  useGroupIdentity: jest.fn(() => {
    throw new Error('Cluster Set Add Access must not call useGroupIdentity (Search)')
  }),
  useGroupsSearch: jest.fn(() => {
    throw new Error('Cluster Set Add Access must not call useGroupsSearch (Search)')
  }),
  useMraGroupSubjects: jest.fn(() => []),
  preferSearchBackedGroups: (groups: Group[]) => groups,
  isSearchBackedGroup: jest.requireActual('../../../../../UserManagement/Identities/Groups/useGroupsSearch')
    .isSearchBackedGroup,
}))

const mockUser1: User = {
  kind: 'User',
  apiVersion: 'user.openshift.io/v1',
  metadata: {
    name: 'mock-user1',
    uid: 'e3d73187-dcf4-49a2-b0fb-d2805c5dd584',
  },
  identities: ['myuser:mock-user1'],
  groups: [],
}

const mockUser2: User = {
  kind: 'User',
  apiVersion: 'user.openshift.io/v1',
  metadata: {
    name: '',
    uid: '',
  },
  identities: [],
  groups: [],
}

const mockGroup1: Group = {
  kind: 'Group',
  apiVersion: 'user.openshift.io/v1',
  metadata: {
    name: 'mock-group1',
    uid: '98d01b86-7721-4b98-b145-58df2bff2f6e',
  },
  users: [],
}
const mockGroup2: Group = {
  kind: 'Group',
  apiVersion: 'user.openshift.io/v1',
  metadata: {
    name: 'mock-group2',
    uid: '98d01b86-7721-4b98-b145-58df2bff2f6e',
  },
  users: [],
}
const mockGroupWithUsers = {
  ...mockGroup1,
  users: [mockUser1.metadata.name],
}

const mockGroupWithNoUsers = {
  ...mockGroup2,
  users: null,
}

const mockClusterRoleBinding1: ClusterRoleBinding = {
  apiVersion: RbacApiVersion,
  kind: ClusterRoleBindingKind,
  metadata: {
    generateName: `${mockManagedClusterSet?.metadata.name}-`,
  },
  subjects: [
    {
      kind: 'Group',
      apiGroup: 'rbac.authorization.k8s.io',
      name: mockGroup1!.metadata.name!,
    },
  ],
  roleRef: {
    apiGroup: 'rbac.authorization.k8s.io',
    kind: 'ClusterRole',
    name: `open-cluster-management:managedclusterset:view:${mockManagedClusterSet!.metadata.name!}`,
  },
}

const mockClusterRoleBinding2: ClusterRoleBinding = {
  apiVersion: RbacApiVersion,
  kind: ClusterRoleBindingKind,
  metadata: {
    generateName: `${mockManagedClusterSet?.metadata.name}-`,
  },
  subjects: [
    {
      kind: 'Group',
      apiGroup: 'rbac.authorization.k8s.io',
      name: mockGroup2!.metadata.name!,
    },
  ],
  roleRef: {
    apiGroup: 'rbac.authorization.k8s.io',
    kind: 'ClusterRole',
    name: `open-cluster-management:managedclusterset:view:${mockManagedClusterSet!.metadata.name!}`,
  },
}

const Component = (props: { isGlobal?: boolean }) => (
  <StateProvider
    initializeStore={(store) => {
      store.set(managedClusterSetsState, [props.isGlobal ? mockGlobalManagedClusterSet : mockManagedClusterSet])
    }}
  >
    <MemoryRouter
      initialEntries={[
        generatePath(NavigationPath.clusterSetDetails, {
          id: props.isGlobal ? mockGlobalManagedClusterSet.metadata.name! : mockManagedClusterSet.metadata.name!,
        }),
      ]}
    >
      <Routes>
        <Route path={`${NavigationPath.clusters}/*`} element={<Clusters />} />
      </Routes>
    </MemoryRouter>
  </StateProvider>
)

describe('Cluster Sets User management', () => {
  const renderComponent = async (mockUser: User, mockGroup: Group, mockClusterRoleBinding: ClusterRoleBinding) => {
    const getNocks = [
      nockClusterList(mockUser, [mockUser]),
      nockClusterList(mockGroup, [mockGroup]),
      nockClusterList(mockClusterRoleBinding, [mockClusterRoleBinding]),
    ]
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    render(<Component />)
    await waitForNocks(getNocks)
    await waitForText(mockManagedClusterSet.metadata.name!, true)
    await waitForText('Details')
    await waitForText('User management', true)
    await clickByText('User management', 0)
    await waitForTestId('addUserGroup')
    await waitForText(mockGroup.metadata.name!)
  }

  const verifyModalContent = async (expectedText: string) => {
    const button = screen.getByRole('button', { name: 'View users in group' })
    await clickElement(button)
    const modal = await waitFor(() => screen.getByRole('dialog'))

    expect(screen.getByLabelText('Close')).toBeInTheDocument()
    expect(screen.getByText('Users in group')).toBeInTheDocument()
    expect(within(modal).getByText(expectedText)).toBeInTheDocument()
  }

  test('displays user name in the AcmLabel when users are available in the group', async () => {
    const mockUser = mockUser1
    const mockGroup = {
      ...mockGroupWithUsers,
      users: mockGroupWithUsers.users.filter((user): user is string => user !== undefined),
    }
    const mockClusterRoleBinding = mockClusterRoleBinding1
    const expectedText = mockUser1.metadata.name ?? 'default-name'

    await renderComponent(mockUser, mockGroup, mockClusterRoleBinding)
    await verifyModalContent(expectedText)
  })

  test('displays "No users in group" in the AcmLabel when no users are available in the group', async () => {
    const mockUser = mockUser2
    const mockGroup = {
      ...mockGroupWithNoUsers,
      users: [],
    }
    const mockClusterRoleBinding = mockClusterRoleBinding2
    const expectedText = 'No users in group'

    await renderComponent(mockUser, mockGroup, mockClusterRoleBinding)
    await verifyModalContent(expectedText)
  })

  test('Add Access Users tab uses listUsers and does not call Search hooks', async () => {
    const mockUser = mockUser1
    const mockGroup = {
      ...mockGroupWithUsers,
      users: mockGroupWithUsers.users.filter((user): user is string => user !== undefined),
    }
    const mockClusterRoleBinding = mockClusterRoleBinding1

    await renderComponent(mockUser, mockGroup, mockClusterRoleBinding)
    await clickByText('Add user or group')
    await waitForText('Identities')

    await waitFor(() => {
      expect(screen.getByRole('radio', { name: `Select ${mockUser.metadata.name}` })).toBeInTheDocument()
    })

    expect(useHasHubUsers).not.toHaveBeenCalled()
    expect(useUserIdentity).not.toHaveBeenCalled()
    expect(useUsersSearch).not.toHaveBeenCalled()
  })

  test('Add Access Groups tab uses listGroups and does not call Search hooks', async () => {
    const mockUser = mockUser1
    const mockGroup = {
      ...mockGroupWithUsers,
      users: mockGroupWithUsers.users.filter((user): user is string => user !== undefined),
    }
    const mockClusterRoleBinding = mockClusterRoleBinding1

    await renderComponent(mockUser, mockGroup, mockClusterRoleBinding)
    await clickByText('Add user or group')
    await waitForText('Identities')
    await clickByText('Groups')

    await waitFor(() => {
      expect(screen.getByRole('radio', { name: `Select ${mockGroup.metadata.name}` })).toBeInTheDocument()
    })

    expect(useHasHubGroups).not.toHaveBeenCalled()
    expect(useGroupIdentity).not.toHaveBeenCalled()
    expect(useGroupsSearch).not.toHaveBeenCalled()
  })
})
