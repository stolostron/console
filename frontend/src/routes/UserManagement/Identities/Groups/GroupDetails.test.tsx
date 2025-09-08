/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC, nockIgnoreApiPaths } from '../../../../lib/nock-util'
import { GroupDetails } from './GroupDetails'
import { Group } from '../../../../resources/rbac'

const mockGroup: Group = {
  apiVersion: 'user.openshift.io/v1',
  kind: 'Group',
  metadata: {
    name: 'test-group',
    uid: 'test-group-uid',
    creationTimestamp: '2025-01-24T17:48:45Z',
  },
  users: ['test-user', 'other-user'],
}

jest.mock('./GroupPage', () => ({
  ...jest.requireActual('./GroupPage'),
  useGroupDetailsContext: jest.fn(),
}))

import { useGroupDetailsContext } from './GroupPage'

const mockUseGroupDetailsContext = useGroupDetailsContext as jest.MockedFunction<typeof useGroupDetailsContext>

function Component() {
  return (
    <RecoilRoot>
      <MemoryRouter>
        <GroupDetails />
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('GroupDetails', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    mockUseGroupDetailsContext.mockClear()
  })

  test('should render loading state', () => {
    mockUseGroupDetailsContext.mockReturnValue({
      group: undefined,
      users: undefined,
      loading: true,
      usersLoading: false,
    })

    render(<Component />)

    expect(screen.getByText('Loading')).toBeInTheDocument()
  })

  test('should render group not found message', () => {
    mockUseGroupDetailsContext.mockReturnValue({
      group: undefined,
      users: undefined,
      loading: false,
      usersLoading: false,
    })

    render(<Component />)

    expect(screen.getByText('Not found')).toBeInTheDocument()
  })

  test('should render group details with basic information', () => {
    mockUseGroupDetailsContext.mockReturnValue({
      group: mockGroup,
      users: [],
      loading: false,
      usersLoading: false,
    })

    render(<Component />)

    expect(screen.getByText('General information')).toBeInTheDocument()
    expect(screen.getByText('Group name')).toBeInTheDocument()
    expect(screen.getByText('test-group')).toBeInTheDocument()
  })

  test('should render group details with missing group name', () => {
    const groupWithoutName = {
      ...mockGroup,
      metadata: {
        ...mockGroup.metadata,
        name: undefined,
      },
    }
    mockUseGroupDetailsContext.mockReturnValue({
      group: groupWithoutName,
      users: [],
      loading: false,
      usersLoading: false,
    })

    render(<Component />)

    expect(screen.getByText('Group name')).toBeInTheDocument()
    expect(screen.getByText('-')).toBeInTheDocument()
  })
})
