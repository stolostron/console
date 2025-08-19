/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { useMemo, useCallback } from 'react'
import { Trans, useTranslation } from '../../../../lib/acm-i18next'
import { listUsers, User as RbacUser } from '../../../../resources/rbac'
import { useQuery } from '../../../../lib/useQuery'
import { AcmEmptyState, AcmTable, compareStrings, AcmLoadingPage, AcmButton } from '../../../../ui-components'
import { usersTableColumns, useFilters } from './UsersTableHelper'
import { Link } from 'react-router-dom-v5-compat'
import { ViewDocumentationLink, DOC_LINKS } from '../../../../lib/doc-util'
import { rbacCreate, useIsAnyNamespaceAuthorized } from '../../../../lib/rbac-util'
import { AccessControlDefinition } from '../../../../resources/access-control'

const UsersTable = () => {
  const { t } = useTranslation()

  const { data: rbacUsers, loading } = useQuery(listUsers)

  const users = useMemo(
    () => rbacUsers?.sort((a, b) => compareStrings(a.metadata.name ?? '', b.metadata.name ?? '')) ?? [],
    [rbacUsers]
  )

  const keyFn = useCallback((user: RbacUser) => user.metadata.name ?? '', [])

  const canAddAccessControl = useIsAnyNamespaceAuthorized(rbacCreate(AccessControlDefinition))

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
          emptyState={
            <AcmEmptyState
              title={t(`In order to view Users, add Identity provider`)}
              message={
                <Trans
                  i18nKey="Once Identity provider is added, Users will appear in the list after they log in."
                  components={{ bold: <strong /> }}
                />
              }
              action={
                <div>
                  <AcmButton
                    isDisabled={!canAddAccessControl}
                    tooltip={!canAddAccessControl ? t('rbac.unauthorized') : ''}
                    component={Link}
                  >
                    {t('Add Identity provider')}
                  </AcmButton>
                  <ViewDocumentationLink doclink={DOC_LINKS.CREATE_CONNECTION} />
                </div>
              }
            />
          }
          // TODO: Uncomment when actions are implemented
          // rowActions={rowActions}
        />
      )}
    </PageSection>
  )
}

export { UsersTable }
