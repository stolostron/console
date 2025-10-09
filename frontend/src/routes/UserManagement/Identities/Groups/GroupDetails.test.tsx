/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { GroupDetails } from './GroupDetails'
import { Group } from '../../../../resources/rbac'
import { useGroupDetailsContext } from './GroupPage'

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
    mockUseGroupDetailsContext.mockClear()
  })

  test('should render group not found message', () => {
    mockUseGroupDetailsContext.mockReturnValue({
      group: undefined,
      users: undefined,
    })

    render(<Component />)

    expect(screen.getByText('Not found')).toBeInTheDocument()
  })

  test('should render group details with basic information', () => {
    mockUseGroupDetailsContext.mockReturnValue({
      group: mockGroup,
      users: [],
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
    })

    render(<Component />)

    expect(screen.getByText('Group name')).toBeInTheDocument()
    expect(screen.getByText('-')).toBeInTheDocument()
  })
})
