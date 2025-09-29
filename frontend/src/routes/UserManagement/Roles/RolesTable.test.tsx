/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC, nockIgnoreApiPaths } from '../../../lib/nock-util'
import { RolesTable } from './RolesTable'
import { ClusterRole } from '../../../resources/rbac'

// Mock the context to control test data
jest.mock('./RolesPage', () => ({
  useRolesContext: jest.fn(),
}))

// Import the mocked function
import { useRolesContext } from './RolesPage'

// Get the mocked function using jest's mocked utility
const mockUseRolesContext = jest.mocked(useRolesContext)

// Mock the entire ui-components module with all necessary exports
jest.mock('../../../ui-components', () => ({
  AcmTable: ({ items, emptyState, keyFn, resultView }: any) => {
    if (resultView?.loading) {
      return (
        <div data-testid="acm-table-loading">
          {Array(10)
            .fill(null)
            .map((_, index) => (
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
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    jest.clearAllMocks()
    // Clean up any previous test state
    document.body.innerHTML = ''
  })

  describe('Loading States', () => {
    it('should show loading page when loading is true', () => {
      mockUseRolesContext.mockReturnValue({
        clusterRoles: [],
        loading: true,
      })

      render(<Component />)

      expect(screen.getAllByRole('progressbar')).toHaveLength(10)
    })

    it('should not show loading page when loading is false', () => {
      mockUseRolesContext.mockReturnValue({
        clusterRoles: [mockClusterRole],
        loading: false,
      })

      render(<Component />)

      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()

      // Should render the role when not loading
      expect(screen.getByText('test-admin-role')).toBeInTheDocument()
      expect(screen.getByText('apps, batch, networking.k8s.io')).toBeInTheDocument()
    })
  })

  describe('Empty States', () => {
    it('should show empty state when no roles', () => {
      mockUseRolesContext.mockReturnValue({
        clusterRoles: [],
        loading: false,
      })

      render(<Component />)

      expect(screen.getByText('No roles')).toBeInTheDocument()
      expect(screen.queryByTestId('acm-table')).not.toBeInTheDocument()
    })

    it('should handle undefined clusterRoles', () => {
      mockUseRolesContext.mockReturnValue({
        clusterRoles: undefined,
        loading: false,
      })

      render(<Component />)

      // Should handle gracefully by showing empty state
      expect(screen.getByText('No roles')).toBeInTheDocument()
      expect(screen.queryByTestId('acm-table')).not.toBeInTheDocument()
    })
  })

  describe('Context Integration', () => {
    it('should call useRolesContext hook', () => {
      mockUseRolesContext.mockReturnValue({
        clusterRoles: [],
        loading: false,
      })

      render(<Component />)

      expect(mockUseRolesContext).toHaveBeenCalledTimes(1)
    })

    it('should re-render when context changes', () => {
      const { rerender } = render(<Component />)

      // Initial state: no roles
      mockUseRolesContext.mockReturnValue({
        clusterRoles: [],
        loading: false,
      })

      rerender(<Component />)

      expect(screen.getByText('No roles')).toBeInTheDocument()

      // Change context: add roles
      mockUseRolesContext.mockReturnValue({
        clusterRoles: [mockClusterRole],
        loading: false,
      })

      rerender(<Component />)

      expect(screen.queryByText('No roles')).not.toBeInTheDocument()
      // Should now show the role that was added
      expect(screen.getByText('test-admin-role')).toBeInTheDocument()
    })
  })

  describe('Handling multiple roles', () => {
    it('should process multiple cluster roles correctly', () => {
      mockUseRolesContext.mockReturnValue({
        clusterRoles: [mockClusterRole, mockClusterRoleNoPermissions, mockClusterRoleNoAnnotations],
        loading: false,
      })

      render(<Component />)

      // Should handle multiple roles with different configurations
      expect(screen.getByText('test-admin-role')).toBeInTheDocument()
      expect(screen.getByText('test-viewer-role')).toBeInTheDocument()
      expect(screen.getByText('test-basic-role')).toBeInTheDocument()
    })
  })
})
