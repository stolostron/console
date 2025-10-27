/* Copyright Contributors to the Open Cluster Management project */
import { cellWidth } from '@patternfly/react-table'
import { useMemo } from 'react'
import { TFunction } from 'react-i18next'
import { generatePath, Link } from 'react-router-dom-v5-compat'
import { HighlightSearchText } from '../../../components/HighlightSearchText'
import { NavigationPath } from '../../../NavigationPath'
import { IAcmTableColumn } from '../../../ui-components/AcmTable/AcmTableTypes'

const EXPORT_FILE_PREFIX = 'roles-table'

export interface Role {
  name: string
  permissions: string
  uid: string
  roleTitle?: string
}
// TODO: trigger sonar issue
type RolesTableHelperProps = {
  t: TFunction
}

const createColumnCells = () => ({
  NAME: (role: Role, search: string) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <span
        style={{
          fontWeight: 'normal',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '200px',
        }}
      >
        <Link to={generatePath(NavigationPath.roleDetails, { id: role.uid })}>
          <HighlightSearchText text={role.name} searchText={search} useFuzzyHighlighting />
        </Link>
      </span>
    </div>
  ),
  PERMISSIONS: (role: Role) => {
    const permissionsArray = role.permissions ? role.permissions.split(', ') : []

    if (permissionsArray.length === 0) {
      return (
        <span style={{ whiteSpace: 'nowrap' }}>
          No permissions <Link to={generatePath(NavigationPath.rolePermissions, { id: role.uid })}>No Permissions</Link>
        </span>
      )
    }

    const firstThree = permissionsArray.slice(0, 3)
    const hasMore = permissionsArray.length > 3

    return (
      <div style={{ whiteSpace: 'nowrap' }}>
        {firstThree.map((permission) => (
          <span key={permission} style={{ fontSize: '14px', marginRight: '4px' }}>
            {permission}
          </span>
        ))}
        {hasMore && <Link to={generatePath(NavigationPath.rolePermissions, { id: role.uid })}>See All</Link>}
      </div>
    )
  },
})

export const rolesTableColumns = ({ t }: Pick<RolesTableHelperProps, 't'>): IAcmTableColumn<Role>[] => {
  const COLUMN_CELLS = createColumnCells()

  return [
    {
      header: t('Role'),
      sort: 'name',
      search: 'name',
      transforms: [cellWidth(25)],
      cell: (role, search) => COLUMN_CELLS.NAME(role, search),
      exportContent: (role) => role.name,
    },
    {
      header: t('Permissions'),
      sort: 'permissions',
      transforms: [cellWidth(15)],
      cell: (role) => COLUMN_CELLS.PERMISSIONS(role),
      exportContent: (role) => role.permissions.toString(),
    },
  ]
}

export const useFilters = (roles: Role[] = []) =>
  useMemo(() => {
    const flattenedRoles = roles.reduce(
      (acc, role) => {
        const roleTitle = role.roleTitle && role.roleTitle !== role.name ? role.roleTitle : ''
        const apiGroups = role.permissions
          ?.split(', ')
          .map((e) => e.trim())
          .filter((e) => e)
        return {
          allRoleNames: new Set([...acc.allRoleNames, role.name]),
          allRoleTitles: new Set([...acc.allRoleTitles, roleTitle]),
          allApiGroups: new Set([...acc.allApiGroups, ...apiGroups]),
        }
      },
      {
        allRoleNames: new Set<string>(),
        allRoleTitles: new Set<string>(),
        allApiGroups: new Set<string>(),
      }
    )

    // Combine names and titles, removing duplicates
    const allUniqueNames = new Set([...flattenedRoles.allRoleNames, ...flattenedRoles.allRoleTitles])

    // Convert to sorted arrays for options
    const nameOptions = Array.from(allUniqueNames)
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ label: name, value: name }))

    const permissionsOptions = Array.from(flattenedRoles.allApiGroups)
      .sort((a, b) => a.localeCompare(b))
      .map((apiGroup) => ({ label: apiGroup, value: apiGroup }))

    return [
      {
        id: 'name',
        label: 'Role Name',
        options: nameOptions,
        tableFilterFn: (selectedValues: string[], role: Role) => {
          if (selectedValues.length === 0) return true

          const roleDisplayName = role.roleTitle || role.name
          const roleName = role.name

          // Check if any selected value matches either the display name or actual name
          return selectedValues.some(
            (selectedValue) =>
              roleDisplayName.toLowerCase().includes(selectedValue.toLowerCase()) ||
              roleName.toLowerCase().includes(selectedValue.toLowerCase())
          )
        },
      },
      {
        id: 'permissions',
        label: 'Permissions',
        options: permissionsOptions,
        tableFilterFn: (selectedValues: string[], role: Role) => {
          if (selectedValues.length === 0) return true
          if (!role.permissions) return false

          const roleApiGroups = role.permissions.split(', ').map((g) => g.trim())

          // Check if any selected API group is in the role's permissions
          return selectedValues.some((selectedApiGroup) => roleApiGroups.includes(selectedApiGroup))
        },
      },
    ]
  }, [roles])

export { EXPORT_FILE_PREFIX }
