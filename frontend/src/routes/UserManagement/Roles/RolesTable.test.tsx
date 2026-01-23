/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { RolesTable } from './RolesTable'
import { ClusterRole } from '../../../resources/rbac'
import { useRecoilValue, useSharedAtoms } from '../../../shared-recoil'

jest.mock('../../../shared-recoil', () => ({
  useRecoilValue: jest.fn(),
  useSharedAtoms: jest.fn(),
}))

const mockUseRecoilValue = jest.mocked(useRecoilValue)
const mockUseSharedAtoms = jest.mocked(useSharedAtoms)

// Mock the entire ui-components module with all necessary exports
jest.mock('../../../ui-components', () => ({
  AcmTable: ({ items, emptyState, keyFn, resultView }: any) => {
    if (resultView?.loading) {
      return (
        <div data-testid="acm-table-loading">
          {new Array(10).fill(null).map((_, index) => (
            <div key={index} role="progressbar" data-testid={`skeleton-${index}`}>
              Loading skeleton {index + 1}
            </div>
          ))}
        </div>
      )
    }
    if (!items || items.length === 0) {
      return emptyState
    }

    return (
      <div data-testid="acm-table">
        {items.map((item: any, index: number) => (
          <div key={keyFn ? keyFn(item) : index} data-testid="table-row">
            {/* Render role name */}
            <div data-testid="role-name">{item.name}</div>

            {/* Render permissions */}
            <div data-testid="role-permissions">
              {item.permissions ? item.permissions.split(', ').slice(0, 3).join(', ') : 'No permissions'}
              {item.permissions && item.permissions.split(', ').length > 3 && (
                <span> (and {item.permissions.split(', ').length - 3} more)</span>
              )}
            </div>

            {/* Render uid for key validation */}
            <div data-testid="role-uid" style={{ display: 'none' }}>
              {item.uid}
            </div>
          </div>
        ))}
      </div>
    )
  },
  AcmEmptyState: ({ title }: any) => <div data-testid="empty-state">{title}</div>,
  AcmLoadingPage: () => (
    <div data-testid="loading-page">
      <span>Loading...</span>
    </div>
  ),
  compareStrings: (a: string, b: string) => a.localeCompare(b),
}))

function Component() {
  return (
    <RecoilRoot>
      <MemoryRouter>
        <RolesTable />
      </MemoryRouter>
    </RecoilRoot>
  )
}

// Mock data
const mockClusterRole: ClusterRole = {
  apiVersion: 'rbac.authorization.k8s.io/v1',
  kind: 'ClusterRole',
  metadata: {
    name: 'test-admin-role',
    uid: 'test-uid-123',
  },
  rules: [
    {
      verbs: ['get', 'list', 'watch', 'create', 'update', 'delete'],
      apiGroups: ['apps', 'batch', 'networking.k8s.io'],
      resources: ['deployments', 'jobs', 'ingresses'],
    },
  ],
}

const mockClusterRoleNoPermissions: ClusterRole = {
  apiVersion: 'rbac.authorization.k8s.io/v1',
  kind: 'ClusterRole',
  metadata: {
    name: 'test-viewer-role',
    uid: 'test-uid-456',
  },
  rules: [],
}

const mockClusterRoleNoAnnotations: ClusterRole = {
  apiVersion: 'rbac.authorization.k8s.io/v1',
  kind: 'ClusterRole',
  metadata: {
    name: 'test-basic-role',
    uid: 'test-uid-789',
  },
  rules: [
    {
      verbs: ['get'],
      apiGroups: [''],
      resources: ['pods'],
    },
  ],
}

describe('RolesTable', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    document.body.innerHTML = ''

    mockUseSharedAtoms.mockReturnValue({
      vmClusterRolesState: {} as any,
    } as any)
  })

  it('should render roles when data is available', () => {
    mockUseRecoilValue.mockReturnValue([mockClusterRole])

    render(<Component />)

    expect(screen.getByText('test-admin-role')).toBeInTheDocument()
    expect(screen.getByText('apps, batch, networking.k8s.io')).toBeInTheDocument()
  })

  it('should show empty state when no roles', () => {
    mockUseRecoilValue.mockReturnValue([])

    render(<Component />)

    expect(screen.getByText('No roles')).toBeInTheDocument()
    expect(screen.queryByTestId('acm-table')).not.toBeInTheDocument()
  })

  it('should handle undefined clusterRoles', () => {
    mockUseRecoilValue.mockReturnValue(undefined)

    render(<Component />)

    expect(screen.getByText('No roles')).toBeInTheDocument()
    expect(screen.queryByTestId('acm-table')).not.toBeInTheDocument()
  })

  it('should process multiple cluster roles correctly', () => {
    mockUseRecoilValue.mockReturnValue([mockClusterRole, mockClusterRoleNoPermissions, mockClusterRoleNoAnnotations])

    render(<Component />)

    expect(screen.getByText('test-admin-role')).toBeInTheDocument()
    expect(screen.getByText('test-viewer-role')).toBeInTheDocument()
    expect(screen.getByText('test-basic-role')).toBeInTheDocument()
  })
})
