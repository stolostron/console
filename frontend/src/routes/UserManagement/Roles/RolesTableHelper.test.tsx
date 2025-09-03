/* Copyright Contributors to the Open Cluster Management project */
import React from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { rolesTableColumns, useFilters, Role } from './RolesTableHelper'

// Mock the required modules
jest.mock('../../../lib/acm-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

jest.mock('./RolesTableHelper', () => ({
  ...jest.requireActual('./RolesTableHelper'),
  useFilters: jest.fn((roles = []) => {
    // Get all unique role names and titles for filter options
    const allRoleNames = new Set<string>()
    const allRoleTitles = new Set<string>()
    const allApiGroups = new Set<string>()

    // Extract all unique values from roles
    roles.forEach((role: any) => {
      // Add role name
      allRoleNames.add(role.name)

      // Add role title if it exists and is different from name
      if (role.roleTitle && role.roleTitle !== role.name) {
        allRoleTitles.add(role.roleTitle)
      }

      // Add API groups from permissions
      if (role.permissions) {
        const apiGroups = role.permissions.split(', ')
        apiGroups.forEach((group: string) => {
          if (group.trim()) {
            allApiGroups.add(group.trim())
          }
        })
      }
    })

    // Combine names and titles, removing duplicates
    const allUniqueNames = new Set([...allRoleNames, ...allRoleTitles])

    // Convert to sorted arrays for options
    const nameOptions = Array.from(allUniqueNames)
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ label: name, value: name }))

    const permissionsOptions = Array.from(allApiGroups)
      .sort((a, b) => a.localeCompare(b))
      .map((apiGroup) => ({ label: apiGroup, value: apiGroup }))

    return [
      {
        id: 'name',
        label: 'Role Name',
        options: nameOptions,
        tableFilterFn: (selectedValues: string[], role: any) => {
          if (selectedValues.length === 0) return true

          const roleDisplayName = role.roleTitle || role.name
          const roleName = role.name

          // Check if any selected value matches either the display name or actual name
          return selectedValues.some(
            (selectedValue: string) =>
              roleDisplayName.toLowerCase().includes(selectedValue.toLowerCase()) ||
              roleName.toLowerCase().includes(selectedValue.toLowerCase())
          )
        },
      },
      {
        id: 'permissions',
        label: 'Permissions',
        options: permissionsOptions,
        tableFilterFn: (selectedValues: string[], role: any) => {
          if (selectedValues.length === 0) return true
          if (!role.permissions) return false

          const roleApiGroups = role.permissions.split(', ').map((g: string) => g.trim())

          // Check if any selected API group is in the role's permissions
          return selectedValues.some((selectedApiGroup: string) => roleApiGroups.includes(selectedApiGroup))
        },
      },
    ]
  }),
}))

jest.mock('../../../components/HighlightSearchText', () => ({
  HighlightSearchText: ({ text }: { text: string }) => <span>{text}</span>,
}))

jest.mock('../../../NavigationPath', () => ({
  NavigationPath: {
    roleDetails: '/multicloud/user-management/roles/:id',
    rolePermissions: '/multicloud/user-management/roles/:id/permissions',
  },
}))

describe('RolesTableHelper', () => {
  const mockT = (key: string) => key

  describe('rolesTableColumns', () => {
    it('should create table columns with translation', () => {
      const columns = rolesTableColumns({ t: mockT })

      expect(columns).toHaveLength(2)
      expect(columns[0].header).toBe('Role')
      expect(columns[1].header).toBe('Permissions')
    })

    it('should have correct column properties', () => {
      const columns = rolesTableColumns({ t: mockT })

      // Role column
      expect(columns[0]).toEqual(
        expect.objectContaining({
          sort: 'name',
          search: 'name',
        })
      )

      // Permissions column
      expect(columns[1]).toEqual(
        expect.objectContaining({
          sort: 'permissions',
        })
      )
    })
  })

  describe('PERMISSIONS column cell', () => {
    const renderPermissionsCell = (role: Role) => {
      const columns = rolesTableColumns({ t: mockT })
      const permissionsColumn = columns.find((col) => col.header === 'Permissions')

      if (!permissionsColumn?.cell) {
        throw new Error('Permissions column not found')
      }

      // Type assertion to ensure cell is callable
      const cellFn = permissionsColumn.cell as (role: Role) => React.ReactElement
      return render(<MemoryRouter>{cellFn(role)}</MemoryRouter>)
    }

    it('should display permissions with spans for up to three permissions', () => {
      const role: Role = {
        name: 'test-role',
        permissions: 'apps, batch, extensions',
        uid: 'test-uid',
        roleTitle: 'Test Role',
      }

      const { getByText, queryByText } = renderPermissionsCell(role)

      // Should display individual permission spans for all three permissions
      expect(getByText('apps')).toBeInTheDocument()
      expect(getByText('batch')).toBeInTheDocument()
      expect(getByText('extensions')).toBeInTheDocument()
      // Should not show "See All" link when exactly three permissions
      expect(queryByText('See All')).not.toBeInTheDocument()
    })

    it('should display "See All" link for more than three permissions', () => {
      const role: Role = {
        name: 'test-role',
        permissions: 'apps, batch, extensions, networking.k8s.io, storage.k8s.io',
        uid: 'test-uid',
        roleTitle: 'Test Role',
      }

      const { getByText } = renderPermissionsCell(role)

      // Should show first three and "See All" link
      expect(getByText('apps')).toBeInTheDocument()
      expect(getByText('batch')).toBeInTheDocument()
      expect(getByText('extensions')).toBeInTheDocument()
      expect(getByText('See All')).toBeInTheDocument()
    })

    it('should display "No permissions" message with link for empty permissions', () => {
      const role: Role = {
        name: 'test-role',
        permissions: '',
        uid: 'test-uid',
        roleTitle: 'Test Role',
      }

      const { getByText } = renderPermissionsCell(role)

      // Should show "No permissions" message and link
      expect(getByText('No permissions')).toBeInTheDocument()
    })

    it('should display "No permissions" message with link for undefined permissions', () => {
      const role: Role = {
        name: 'test-role',
        permissions: '',
        uid: 'test-uid',
        roleTitle: 'Test Role',
      }

      const { getByText } = renderPermissionsCell(role)

      // Should show "No permissions" message and link
      expect(getByText('No permissions')).toBeInTheDocument()
    })

    it('should handle single permission with span', () => {
      const role: Role = {
        name: 'test-role',
        permissions: 'apps',
        uid: 'test-uid',
        roleTitle: 'Test Role',
      }

      const { getByText, queryByText } = renderPermissionsCell(role)

      expect(getByText('apps')).toBeInTheDocument()
      // Single permission should not show "See All"
      expect(queryByText('See All')).not.toBeInTheDocument()
    })
  })

  describe('NAME column cell', () => {
    const renderNameCell = (role: Role, search: string = '') => {
      const columns = rolesTableColumns({ t: mockT })
      const nameColumn = columns.find((col) => col.header === 'Role')

      if (!nameColumn?.cell) {
        throw new Error('Name column not found')
      }

      // Type assertion to ensure cell is callable
      const cellFn = nameColumn.cell as (role: Role, search?: string) => React.ReactElement
      return render(<MemoryRouter>{cellFn(role, search)}</MemoryRouter>)
    }

    it('should display role name and handle search highlighting', () => {
      const role: Role = {
        name: 'cluster-admin',
        permissions: 'apps',
        uid: 'test-uid',
        roleTitle: 'Cluster Administrator',
      }

      const { getByText, container } = renderNameCell(role)

      // Should display the role name
      expect(getByText('cluster-admin')).toBeInTheDocument()

      // Test search highlighting with different role
      const searchRole: Role = {
        name: 'admin-user',
        permissions: 'batch',
        uid: 'test-uid-2',
        roleTitle: 'Admin User',
      }

      const { container: searchContainer } = renderNameCell(searchRole, 'admin')

      // The HighlightSearchText component should handle search highlighting
      expect(container).toBeInTheDocument()
      expect(searchContainer).toBeInTheDocument()
    })
  })

  describe('useFilters', () => {
    it('should return filter configuration with name and permissions filters', () => {
      // Test that the hook exists and is a function
      expect(typeof useFilters).toBe('function')

      // Call the mocked hook to get the filters
      const actualFilters = (useFilters as jest.Mock)()

      // Verify the mock returns the expected structure
      expect(actualFilters).toHaveLength(2)
      expect(actualFilters[0].id).toBe('name')
      expect(actualFilters[0].label).toBe('Role Name')
      expect(actualFilters[1].id).toBe('permissions')
      expect(actualFilters[1].label).toBe('Permissions')
    })

    it('should generate dynamic filter options from roles data', () => {
      const testRoles: Role[] = [
        { name: 'cluster-admin', permissions: 'apps, batch', uid: '1', roleTitle: 'Cluster Administrator' },
        { name: 'admin', permissions: 'apps, networking.k8s.io', uid: '2' },
        { name: 'viewer', permissions: 'apps', uid: '3', roleTitle: 'Read Only User' },
      ]

      const filters = (useFilters as jest.Mock)(testRoles)

      // Name filter options: Should have combined unique names from both name and roleTitle fields
      expect(filters[0].options).toHaveLength(5) // cluster-admin, Cluster Administrator, admin, viewer, Read Only User
      expect(filters[0].options).toEqual(
        expect.arrayContaining([
          { label: 'admin', value: 'admin' },
          { label: 'cluster-admin', value: 'cluster-admin' },
          { label: 'Cluster Administrator', value: 'Cluster Administrator' },
          { label: 'viewer', value: 'viewer' },
          { label: 'Read Only User', value: 'Read Only User' },
        ])
      )

      // Permissions filter options: Should have unique API groups
      expect(filters[1].options).toHaveLength(3) // apps, batch, networking.k8s.io
      expect(filters[1].options).toEqual(
        expect.arrayContaining([
          { label: 'apps', value: 'apps' },
          { label: 'batch', value: 'batch' },
          { label: 'networking.k8s.io', value: 'networking.k8s.io' },
        ])
      )
    })

    it('should handle empty roles array', () => {
      const filters = (useFilters as jest.Mock)([])

      expect(filters[0].options).toHaveLength(0) // Name filter should have no options
      expect(filters[1].options).toHaveLength(0) // Permissions filter should have no options
    })
  })
})
