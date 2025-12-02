/* Copyright Contributors to the Open Cluster Management project */
import { Badge, Radio } from '@patternfly/react-core'
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

const createColumnCells = ({
  t,
  onRadioSelect,
  selectedRole,
  areLinksAllowed,
}: {
  t: TFunction
  onRadioSelect?: (roleName: string) => void
  selectedRole?: string
  areLinksAllowed: boolean
}) => ({
  RADIO_SELECT: (role: Role) => (
    <Radio
      id={`radio-${role.uid}`}
      name="role-selection"
      isChecked={selectedRole === role.name}
      onChange={() => onRadioSelect?.(role.name)}
      aria-label={`Select role ${role.name}`}
    />
  ),
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
        {areLinksAllowed ? (
          <Link to={generatePath(NavigationPath.roleDetails, { id: role.uid })}>
            <HighlightSearchText text={role.name} searchText={search} useFuzzyHighlighting />
          </Link>
        ) : (
          <HighlightSearchText text={role.name} searchText={search} useFuzzyHighlighting />
        )}
      </span>
    </div>
  ),
  PERMISSIONS: (role: Role) => {
    const permissionsArray = role.permissions ? role.permissions.split(', ') : []

    if (permissionsArray.length === 0) {
      return (
        <span style={{ whiteSpace: 'nowrap' }}>
          {areLinksAllowed ? (
            <Link to={generatePath(NavigationPath.rolePermissions, { id: role.uid })}>{t('No permissions')}</Link>
          ) : (
            t('No permissions')
          )}
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
        {hasMore &&
          (areLinksAllowed ? (
            <Link to={generatePath(NavigationPath.rolePermissions, { id: role.uid })}>See All</Link>
          ) : (
            <Badge isRead>+{permissionsArray.length - 3}</Badge>
          ))}
      </div>
    )
  },
})

export const rolesTableColumns = ({
  t,
  columnsToDisplay = [],
  onRadioSelect,
  selectedRole,
  areLinksAllowed,
}: {
  t: TFunction
  columnsToDisplay?: string[]
  onRadioSelect?: (roleName: string) => void
  selectedRole?: string
  areLinksAllowed: boolean
}): IAcmTableColumn<Role>[] => {
  const COLUMN_CELLS = createColumnCells({ t, onRadioSelect, selectedRole, areLinksAllowed })

  const allColumns: Record<string, IAcmTableColumn<Role>> = {
    radioSelect: {
      header: ' ',
      cell: (role) => COLUMN_CELLS.RADIO_SELECT(role),
      transforms: [cellWidth(10)],
      disableExport: true,
    },
    name: {
      header: t('Role'),
      sort: 'name',
      search: 'name',
      transforms: [cellWidth(25)],
      cell: (role, search) => COLUMN_CELLS.NAME(role, search),
      exportContent: (role) => role.name,
    },
    permissions: {
      header: t('Permissions'),
      sort: 'permissions',
      transforms: [cellWidth(15)],
      cell: (role) => COLUMN_CELLS.PERMISSIONS(role),
      exportContent: (role) => role.permissions.toString(),
    },
  }

  return columnsToDisplay.map((columnKey) => allColumns[columnKey]).filter(Boolean)
}

export const useFilters = (roles: Role[] = []) =>
  useMemo(() => {
    const flattenedRoles = roles.reduce(
      (acc, role) => {
        const roleTitle = role.roleTitle && role.roleTitle !== role.name ? role.roleTitle : ''
        const apiGroups = role.permissions
          ?.split(', ')
          .map((e) => e.trim())
          .filter(Boolean)
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

          const roleApiGroups = new Set(role.permissions.split(', ').map((g) => g.trim()))

          // Check if any selected API group is in the role's permissions
          return selectedValues.some((selectedApiGroup) => roleApiGroups.has(selectedApiGroup))
        },
      },
    ]
  }, [roles])

export { EXPORT_FILE_PREFIX }
