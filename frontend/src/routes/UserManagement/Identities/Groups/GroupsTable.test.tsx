/* Copyright Contributors to the Open Cluster Management project */
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC, nockIgnoreApiPaths, nockList } from '../../../../lib/nock-util'
import { GroupDefinition } from '../../../../resources/rbac'
import { GroupsTable } from './GroupsTable'
import { Group } from '../../../../resources/rbac'

const mockGroups: Group[] = [
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'Group',
    metadata: {
      name: 'developers',
      uid: 'developers-uid',
      creationTimestamp: '2025-01-24T16:00:00Z',
    },
    users: ['user1', 'user2'],
  },
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'Group',
    metadata: {
      name: 'admins',
      uid: 'admins-uid',
      creationTimestamp: '2025-01-24T15:00:00Z',
    },
    users: ['admin1'],
  },
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'Group',
    metadata: {
      name: 'viewers',
      uid: 'viewers-uid',
      creationTimestamp: '2025-01-24T14:00:00Z',
    },
    users: [],
  },
]

function Component() {
  return (
    <RecoilRoot>
      <MemoryRouter>
        <GroupsTable />
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('Groups Page', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })

  test('should render groups table with all groups', async () => {
    nockList(GroupDefinition, mockGroups)

    render(<Component />)

    await waitFor(() => {
      expect(screen.getByText('developers')).toBeInTheDocument()
      expect(screen.getByText('admins')).toBeInTheDocument()
    })
  })

  test('should render component without errors', () => {
    render(<Component />)

    expect(document.body).toBeInTheDocument()
  })
})
