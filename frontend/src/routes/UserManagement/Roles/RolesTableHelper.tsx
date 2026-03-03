/* Copyright Contributors to the Open Cluster Management project */
import { Radio } from '@patternfly/react-core'
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
  areLinksDisplayed,
}: {
  t: TFunction
  onRadioSelect?: (roleName: string) => void
  selectedRole?: string
  areLinksDisplayed: boolean
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
        }}
      >
        {areLinksDisplayed ? (
          <Link to={generatePath(NavigationPath.roleDetails, { id: role.uid })}>
            <HighlightSearchText text={role.name} searchText={search} useFuzzyHighlighting />
          </Link>
        ) : (
          <HighlightSearchText text={role.name} searchText={search} useFuzzyHighlighting />
        )}
      </span>
    </div>
  ),
  PERMISSIONS: (role: Role, search: string) => {
    const permissionsArray = role.permissions ? role.permissions.split(', ').filter((e) => e.trim()) : []

    return permissionsArray.length === 0 ? (
      <span style={{ whiteSpace: 'nowrap' }}>
        {areLinksDisplayed ? (
          <Link to={generatePath(NavigationPath.rolePermissions, { id: role.uid })}>{t('No permissions')}</Link>
        ) : (
          t('No permissions')
        )}
      </span>
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span style={{ fontWeight: 'normal', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          <HighlightSearchText text={permissionsArray.join(', ')} searchText={search} useFuzzyHighlighting />
        </span>
      </div>
    )
  },
})

export const rolesTableColumns = ({
  t,
  hiddenColumns,
  onRadioSelect,
  selectedRole,
  areLinksDisplayed,
}: {
  t: TFunction
  hiddenColumns?: string[]
  onRadioSelect?: (roleName: string) => void
  selectedRole?: string
  areLinksDisplayed: boolean
}): IAcmTableColumn<Role>[] => {
  const COLUMN_CELLS = createColumnCells({ t, onRadioSelect, selectedRole, areLinksDisplayed })

  const columns: IAcmTableColumn<Role>[] = []

  columns.push({
    header: ' ',
    search: 'uid',
    cell: (role) => COLUMN_CELLS.RADIO_SELECT(role),
    transforms: [cellWidth(10)],
    disableExport: true,
    isHidden: hiddenColumns?.includes('radio'),
  })

  columns.push({
    header: t('Role'),
    sort: 'name',
    search: 'name',
    transforms: [cellWidth(45)],
    cell: (role, search) => COLUMN_CELLS.NAME(role, search),
    exportContent: (role) => role.name,
    isHidden: hiddenColumns?.includes('name'),
  })

  columns.push({
    header: t('Permissions'),
    sort: 'permissions',
    search: 'permissions',
    transforms: [cellWidth(45)],
    cell: (role, search) => COLUMN_CELLS.PERMISSIONS(role, search),
    exportContent: (role) => role.permissions?.toString(),
    isHidden: hiddenColumns?.includes('permissions'),
  })

  return columns
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
          allRoleTitles: roleTitle ? new Set([...acc.allRoleTitles, roleTitle]) : acc.allRoleTitles,
          allApiGroups: new Set([...acc.allApiGroups, ...apiGroups]),
        }
      },
      {
        allRoleNames: new Set<string>(),
        allRoleTitles: new Set<string>(),
        allApiGroups: new Set<string>(),
      }
    )

    // Combine names and titles, removing duplicates and filtering out empty strings
    const allUniqueNames = new Set([...flattenedRoles.allRoleNames, ...flattenedRoles.allRoleTitles].filter(Boolean))

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
