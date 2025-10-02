/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { useMemo, useCallback } from 'react'
import { useTranslation } from '../../../lib/acm-i18next'
import { ClusterRole } from '../../../resources/rbac'
import { AcmEmptyState, AcmTable, compareStrings } from '../../../ui-components'
import { rolesTableColumns, useFilters, Role } from './RolesTableHelper'
import { useRolesContext } from './RolesPage'

const RolesTable = () => {
  const { t } = useTranslation()
  const { clusterRoles, loading } = useRolesContext()

  const roles = useMemo(
    () =>
      !clusterRoles
        ? []
        : clusterRoles
            .map(
              (clusterRole: ClusterRole): Role => ({
                name: clusterRole.metadata.name || '',
                permissions: clusterRole.rules
                  ? [...new Set(clusterRole.rules.flatMap((rule) => rule.apiGroups || []))].join(', ')
                  : '',
                uid: clusterRole.metadata.uid || clusterRole.metadata.name || '',
              })
            )
            .sort((a, b) => compareStrings(a.name, b.name)),
    [clusterRoles]
  )

  const keyFn = useCallback((role: Role) => role.uid, [])

  const filters = useFilters(roles)
  const columns = rolesTableColumns({ t })

  return (
    <PageSection>
      <AcmTable<Role>
        key="roles-table"
        filters={filters}
        columns={columns}
        keyFn={keyFn}
        items={roles}
        resultView={{
          page: 1,
          loading,
          refresh: () => {},
          items: [],
          emptyResult: false,
          processedItemCount: 0,
          isPreProcessed: true,
        }}
        emptyState={<AcmEmptyState key="rolesEmptyState" title={t('No roles')} />}
      />
    </PageSection>
  )
}

export { RolesTable }
