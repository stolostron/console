/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { useMemo, useCallback } from 'react'
import { Trans, useTranslation } from '../../../../lib/acm-i18next'
import { listGroups, Group as RbacGroup } from '../../../../resources/rbac'
import { useQuery } from '../../../../lib/useQuery'
import { AcmEmptyState, AcmTable, compareStrings, AcmLoadingPage, AcmButton } from '../../../../ui-components'
import { groupsTableColumns, useFilters } from './GroupsTableHelper'
import { Link } from 'react-router-dom-v5-compat'
import { ViewDocumentationLink, DOC_LINKS } from '../../../../lib/doc-util'
import { rbacCreate, useIsAnyNamespaceAuthorized } from '../../../../lib/rbac-util'
import { AccessControlDefinition } from '../../../../resources/access-control'

const GroupsTable = () => {
  const { t } = useTranslation()

  const { data: rbacGroups, loading } = useQuery(listGroups)

  const groups = useMemo(
    () => rbacGroups?.sort((a, b) => compareStrings(a.metadata.name ?? '', b.metadata.name ?? '')) ?? [],
    [rbacGroups]
  )

  const keyFn = useCallback((group: RbacGroup) => group.metadata.name ?? '', [])

  const canAddAccessControl = useIsAnyNamespaceAuthorized(rbacCreate(AccessControlDefinition))

  const filters = useFilters()
  const columns = groupsTableColumns({ t })
  // TODO: Uncomment when actions are implemented
  // const rowActions = useRowActions({ t, navigate })
  console.log(groups, 'groups')
  return (
    <PageSection>
      {loading ? (
        <AcmLoadingPage />
      ) : (
        <AcmTable<RbacGroup>
          key="groups-table"
          filters={filters}
          columns={columns}
          keyFn={keyFn}
          items={groups}
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

export { GroupsTable }
