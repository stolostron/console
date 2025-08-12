/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { useMemo, useCallback } from 'react'
import { useTranslation } from '../../../../lib/acm-i18next'
import { listUsers, User as RbacUser } from '../../../../resources/rbac'
import { useQuery } from '../../../../lib/useQuery'
import { AcmEmptyState, AcmTable, compareStrings, AcmLoadingPage } from '../../../../ui-components'
import { usersTableColumns, useFilters } from './UsersTableHelper'

const UsersTable = () => {
  const { t } = useTranslation()

  const { data: rbacUsers, loading } = useQuery(listUsers)

  const users = useMemo(
    () => rbacUsers?.sort((a, b) => compareStrings(a.metadata.name ?? '', b.metadata.name ?? '')) ?? [],
    [rbacUsers]
  )

  const keyFn = useCallback((user: RbacUser) => user.metadata.name ?? '', [])

  const filters = useFilters()
  const columns = usersTableColumns({ t })
  // TODO: Uncomment when actions are implemented
  // const rowActions = useRowActions({ t, navigate })

  return (
    <PageSection>
      {loading ? (
        <AcmLoadingPage />
      ) : (
        <AcmTable<RbacUser>
          key="users-table"
          filters={filters}
          columns={columns}
          keyFn={keyFn}
          items={users}
          emptyState={<AcmEmptyState key="usersEmptyState" title={t('No users')} />}
          // TODO: Uncomment when actions are implemented
          // rowActions={rowActions}
        />
      )}
    </PageSection>
  )
}

export { UsersTable }
