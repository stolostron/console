/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import React from 'react'
import { Role, rolesTableColumns } from './RolesTableHelper'

// Mock the translation hook
jest.mock('../../../lib/acm-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Mock react-router-dom-v5-compat
jest.mock('react-router-dom-v5-compat', () => ({
  generatePath: jest.fn((_path, params) => `/mock-path/${params.id}`),
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}))

// Mock HighlightSearchText
jest.mock('../../../components/HighlightSearchText', () => ({
  HighlightSearchText: ({ text }: any) => <span>{text}</span>,
}))

// Mock NavigationPath
jest.mock('../../../NavigationPath', () => ({
  NavigationPath: {
    roleDetails: '/role-details/:id',
    rolePermissions: '/role-permissions/:id',
  },
}))

describe('RolesTableHelper', () => {
  const mockRole: Role = {
    name: 'test-role',
    permissions: 'api1, api2, api3, api4, api5',
    uid: 'test-uid',
  }

  const mockT = (key: string) => key

  describe('rolesTableColumns', () => {
    it('creates columns with links when areLinksAllowed is true (default)', () => {
      const columns = rolesTableColumns({
        t: mockT,
        columnsToDisplay: ['name', 'permissions'],
        areLinksAllowed: true,
      })

      expect(columns).toHaveLength(2)

      // Test NAME column with links
      const nameCell = columns[0].cell as (role: Role, search?: string) => React.ReactNode
      const nameElement = nameCell(mockRole, '')
      render(<div>{nameElement}</div>)
      expect(screen.getByRole('link')).toBeInTheDocument()

      // Test PERMISSIONS column with "See All" link
      const permissionsCell = columns[1].cell as (role: Role) => React.ReactNode
      const permissionsElement = permissionsCell(mockRole)
      render(<div>{permissionsElement}</div>)
      expect(screen.getByText('See All')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'See All' })).toBeInTheDocument()
    })

    it('creates columns without links when areLinksAllowed is false', () => {
      const columns = rolesTableColumns({
        t: mockT,
        columnsToDisplay: ['name', 'permissions'],
        areLinksAllowed: false,
      })

      expect(columns).toHaveLength(2)

      // Test NAME column without links
      const nameCell = columns[0].cell as (role: Role, search?: string) => React.ReactNode
      const nameElement = nameCell(mockRole, '')
      render(<div>{nameElement}</div>)
      expect(screen.queryByRole('link')).not.toBeInTheDocument()
      expect(screen.getByText('test-role')).toBeInTheDocument()

      // Test PERMISSIONS column with Badge instead of "See All" link
      const permissionsCell = columns[1].cell as (role: Role) => React.ReactNode
      const permissionsElement = permissionsCell(mockRole)
      render(<div>{permissionsElement}</div>)
      expect(screen.queryByText('See All')).not.toBeInTheDocument()
      expect(screen.getByText('+2')).toBeInTheDocument() // 5 permissions - 3 shown = +2
    })

    it('handles role with no permissions when areLinksAllowed is false', () => {
      const roleWithNoPermissions: Role = {
        name: 'empty-role',
        permissions: '',
        uid: 'empty-uid',
      }

      const columns = rolesTableColumns({
        t: mockT,
        columnsToDisplay: ['permissions'],
        areLinksAllowed: false,
      })

      const permissionsCell = columns[0].cell as (role: Role) => React.ReactNode
      const permissionsElement = permissionsCell(roleWithNoPermissions)
      render(<div>{permissionsElement}</div>)

      // Check that "No permissions" text is present (may be split across elements)
      expect(screen.getByText(/No permissions/)).toBeInTheDocument()
      // Check that there are no links when areLinksAllowed is false
      expect(screen.queryByRole('link')).not.toBeInTheDocument()
    })

    it('handles role with 3 or fewer permissions (no badge/link needed)', () => {
      const roleWithFewPermissions: Role = {
        name: 'few-perms-role',
        permissions: 'api1, api2, api3',
        uid: 'few-perms-uid',
      }

      const columns = rolesTableColumns({
        t: mockT,
        columnsToDisplay: ['permissions'],
        areLinksAllowed: false,
      })

      const permissionsCell = columns[0].cell as (role: Role) => React.ReactNode
      const permissionsElement = permissionsCell(roleWithFewPermissions)
      render(<div>{permissionsElement}</div>)

      expect(screen.getByText('api1')).toBeInTheDocument()
      expect(screen.getByText('api2')).toBeInTheDocument()
      expect(screen.getByText('api3')).toBeInTheDocument()
      expect(screen.queryByText('See All')).not.toBeInTheDocument()
      expect(screen.queryByText('+0')).not.toBeInTheDocument()
    })

    it('includes radio column when specified', () => {
      const columns = rolesTableColumns({
        t: mockT,
        columnsToDisplay: ['radioSelect'],
        onRadioSelect: jest.fn(),
        areLinksAllowed: true,
      })

      expect(columns).toHaveLength(1)
      expect(columns[0].header).toBe(' ') // Space header for radio column

      const radioCell = columns[0].cell as (role: Role) => React.ReactNode
      const radioElement = radioCell(mockRole)
      render(<div>{radioElement}</div>)
      expect(screen.getByRole('radio')).toBeInTheDocument()
    })
  })
})
