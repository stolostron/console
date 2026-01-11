/* Copyright Contributors to the Open Cluster Management project */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from '../../../lib/acm-i18next'
import { ClusterRole } from '../../../resources/rbac'
import { useRecoilValue, useSharedAtoms } from '../../../shared-recoil'
import { AcmEmptyState, AcmTable, compareStrings } from '../../../ui-components'
import { Role, rolesTableColumns, useFilters } from './RolesTableHelper'

interface RolesTableProps {
  hiddenColumns?: string[]
  onRadioSelect?: (roleName: string) => void
  areLinksDisplayed?: boolean
  initialSelectedRole?: string
}

const RolesTable = ({
  hiddenColumns,
  onRadioSelect,
  areLinksDisplayed = true,
  initialSelectedRole,
}: RolesTableProps) => {
  const { t } = useTranslation()
  const { vmClusterRolesState } = useSharedAtoms()
  const clusterRoles = useRecoilValue(vmClusterRolesState)
  const [selectedRole, setSelectedRole] = useState<string | undefined>(initialSelectedRole)

  useEffect(() => {
    setSelectedRole(initialSelectedRole)
  }, [initialSelectedRole])

  const roles = useMemo(
    () =>
      clusterRoles
        ? clusterRoles
            .map(
              (clusterRole: ClusterRole): Role => ({
                name: clusterRole.metadata.name || '',
                permissions: clusterRole.rules
                  ? [...new Set(clusterRole.rules.flatMap((rule) => rule.apiGroups || []))].join(', ')
                  : '',
                uid: clusterRole.metadata.uid || clusterRole.metadata.name || '',
              })
            )
            .sort((a, b) => compareStrings(a.name, b.name))
        : [],
    [clusterRoles]
  )

  const keyFn = useCallback((role: Role) => role.uid, [])

  const handleRadioSelect = (roleName: string) => {
    setSelectedRole(roleName)
    onRadioSelect?.(roleName)
  }

  const filters = useFilters(roles)
  const columns = rolesTableColumns({
    t,
    hiddenColumns,
    onRadioSelect: handleRadioSelect,
    selectedRole,
    areLinksDisplayed,
  })

  return (
    <AcmTable<Role>
      key="roles-table"
      filters={filters}
      columns={columns}
      keyFn={keyFn}
      items={roles}
      resultView={{
        page: 1,
        loading: false,
        refresh: () => {},
        items: [],
        emptyResult: false,
        processedItemCount: 0,
        isPreProcessed: false,
      }}
      emptyState={<AcmEmptyState key="rolesEmptyState" title={t('No roles')} />}
    />
  )
}

export { RolesTable }
