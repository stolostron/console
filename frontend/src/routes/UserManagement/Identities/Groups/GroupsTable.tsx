/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom-v5-compat'
import { Trans, useTranslation } from '../../../../lib/acm-i18next'
import { DOC_LINKS, ViewDocumentationLink } from '../../../../lib/doc-util'
import { useQuery } from '../../../../lib/useQuery'
import { listGroups, Group as RbacGroup } from '../../../../resources/rbac'
import { AcmButton, AcmEmptyState, AcmLoadingPage, AcmTable, compareStrings } from '../../../../ui-components'
import { groupsTableColumns, useFilters } from './GroupsTableHelper'

const GroupsTable = () => {
  const { t } = useTranslation()

  const { data: rbacGroups, loading } = useQuery(listGroups)

  const groups = useMemo(
    () => rbacGroups?.sort((a, b) => compareStrings(a.metadata.name ?? '', b.metadata.name ?? '')) ?? [],
    [rbacGroups]
  )

  const keyFn = useCallback((group: RbacGroup) => group.metadata.name ?? '', [])

  // TODO: rbacCreate for IDP
  const canAddAccessControl = true

  const filters = useFilters()
  const columns = groupsTableColumns({ t })
  // TODO: Uncomment when actions are implemented
  // const rowActions = useRowActions({ t, navigate })

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
