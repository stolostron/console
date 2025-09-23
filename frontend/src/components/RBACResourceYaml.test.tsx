/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC, nockIgnoreApiPaths } from '../lib/nock-util'
import { RBACResourceYaml } from './RBACResourceYaml'
import { User, UserApiVersion, UserKind } from '../resources/rbac'

function Component({
  resource,
  loading,
  resourceType,
}: {
  resource: any
  loading: boolean
  resourceType: 'User' | 'Group'
}) {
  return (
    <RecoilRoot>
      <MemoryRouter>
        <RBACResourceYaml resource={resource} loading={loading} resourceType={resourceType} />
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('ResourceYaml', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })

  test('should render loading state', () => {
    render(<Component resource={undefined} loading={true} resourceType="User" />)

    expect(screen.getByText('Loading')).toBeInTheDocument()
  })

  test('should render user not found message', () => {
    render(<Component resource={undefined} loading={false} resourceType="User" />)

    expect(screen.getByText('User not found')).toBeInTheDocument()
  })

  test('should render group not found message', () => {
    render(<Component resource={undefined} loading={false} resourceType="Group" />)

    expect(screen.getByText('Group not found')).toBeInTheDocument()
  })

  test('should render YAML editor with user data', () => {
    const mockUser: User = {
      apiVersion: UserApiVersion,
      kind: UserKind,
      metadata: {
        name: 'test-user',
        uid: 'test-user-uid',
        creationTimestamp: '2025-01-24T17:48:45Z',
      },
      fullName: 'Test User',
      identities: ['htpasswd:test-user'],
    }

    render(<Component resource={mockUser} loading={false} resourceType="User" />)

    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  test('should render YAML editor with group data', () => {
    const mockGroup = {
      apiVersion: UserApiVersion,
      kind: 'Group',
      metadata: {
        name: 'test-group',
        uid: 'test-group-uid',
        creationTimestamp: '2025-01-24T17:48:45Z',
      },
      users: ['test-user'],
    }

    render(<Component resource={mockGroup} loading={false} resourceType="Group" />)

    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  test('should render role not found message', () => {
    render(<Component resource={undefined} loading={false} resourceType="Role" />)

    expect(screen.getByText('Role not found')).toBeInTheDocument()
  })

  test('should render YAML editor with role data', () => {
    const mockRole = {
      apiVersion: 'rbac.authorization.k8s.io/v1',
      kind: 'ClusterRole',
      metadata: {
        name: 'test-role',
        uid: 'test-role-uid',
        creationTimestamp: '2025-01-24T17:48:45Z',
      },
      rules: [],
    }

    render(<Component resource={mockRole} loading={false} resourceType="Role" />)

    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })
})
