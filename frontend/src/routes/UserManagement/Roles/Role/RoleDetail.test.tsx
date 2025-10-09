/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { RoleDetail } from './RoleDetail'
import { ClusterRole } from '../../../../resources/rbac'
import { useCurrentRole } from '../RolesPage'

const mockRole: ClusterRole = {
  apiVersion: 'rbac.authorization.k8s.io/v1',
  kind: 'ClusterRole',
  metadata: {
    name: 'test-role',
    uid: 'test-role-uid',
    creationTimestamp: '2025-01-24T17:48:45Z',
  },
  rules: [],
}

jest.mock('../../../../lib/acm-i18next', () => ({
  useTranslation: jest.fn().mockReturnValue({
    t: (key: string) => key,
  }),
}))

jest.mock('../RolesPage', () => ({
  ...jest.requireActual('../RolesPage'),
  useCurrentRole: jest.fn(),
}))

const mockUseCurrentRole = useCurrentRole as jest.MockedFunction<typeof useCurrentRole>

function Component() {
  return (
    <RecoilRoot>
      <MemoryRouter>
        <RoleDetail />
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('RoleDetail', () => {
  beforeEach(() => {
    mockUseCurrentRole.mockClear()
  })

  it('should render role not found message', () => {
    mockUseCurrentRole.mockReturnValue(undefined)

    render(<Component />)

    expect(screen.getByText('Not found')).toBeInTheDocument()
  })

  it('should render role details with basic information', () => {
    mockUseCurrentRole.mockReturnValue(mockRole)

    render(<Component />)

    expect(screen.getByText('General information')).toBeInTheDocument()
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('test-role')).toBeInTheDocument()
  })

  it('should render role details with missing role name', () => {
    const roleWithoutName = {
      ...mockRole,
      metadata: {
        ...mockRole.metadata,
        name: undefined,
      },
    }
    mockUseCurrentRole.mockReturnValue(roleWithoutName)

    render(<Component />)

    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('-')).toBeInTheDocument()
  })

  it('should render role details with full information', () => {
    mockUseCurrentRole.mockReturnValue(mockRole)

    render(<Component />)

    expect(screen.getByText('General information')).toBeInTheDocument()
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('test-role')).toBeInTheDocument()
    expect(screen.getByText('Created At')).toBeInTheDocument()
  })

  it('should render role details with missing creation timestamp', () => {
    const roleWithoutTimestamp = {
      ...mockRole,
      metadata: {
        ...mockRole.metadata,
        creationTimestamp: undefined,
      },
    }
    mockUseCurrentRole.mockReturnValue(roleWithoutTimestamp)

    render(<Component />)

    expect(screen.getByText('Created At')).toBeInTheDocument()
    expect(screen.getAllByText('-')).toHaveLength(1)
  })

  it('should render back to roles button when role is not found', () => {
    mockUseCurrentRole.mockReturnValue(undefined)

    render(<Component />)

    expect(screen.getByText('button.backToRoles')).toBeInTheDocument()
  })

  it('should handle role with minimal metadata', () => {
    const minimalRole = {
      ...mockRole,
      metadata: {
        uid: 'minimal-uid',
      },
    }
    mockUseCurrentRole.mockReturnValue(minimalRole)

    render(<Component />)

    expect(screen.getByText('General information')).toBeInTheDocument()
    expect(screen.getAllByText('-')).toHaveLength(2) // Name and Created At should show '-'
  })
})
