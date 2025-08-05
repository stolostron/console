import { PageSection } from '@patternfly/react-core'
import { AcmEmptyState, AcmTable, IAcmTableColumn } from '../../../ui-components'
import { useTranslation } from '../../../lib/acm-i18next'

// Mock type
type UserRoleAssignment = {
  metadata: {
    name: string
  }
  role: string
  namespace: string
}
const RoleAssignments = () => {
  const { t } = useTranslation()

  const columns: IAcmTableColumn<UserRoleAssignment>[] = [
    {
      header: t('Role assignment name'),
      cell: (item) => item.metadata?.name ?? '-',
    },
  ]

  const keyFn = (userRoleAssignment: UserRoleAssignment) => userRoleAssignment.metadata.name ?? ''

  return (
    <PageSection>
      <AcmTable<UserRoleAssignment>
        key="user-role-assignments-table"
        columns={columns}
        keyFn={keyFn}
        items={[]}
        emptyState={
          <AcmEmptyState
            key="RoleAssignmentsEmptyState"
            title={t('No role assignments')}
            message={t('This user does not have any role assignments.')}
          />
        }
      />
    </PageSection>
  )
}

export { RoleAssignments }
