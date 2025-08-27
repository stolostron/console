/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom-v5-compat'
import { Trans, useTranslation } from '../../../../lib/acm-i18next'
import { DOC_LINKS, ViewDocumentationLink } from '../../../../lib/doc-util'
import { Group as RbacGroup, UserApiVersion, GroupKind } from '../../../../resources/rbac'
import { AcmButton, AcmEmptyState, AcmLoadingPage, AcmTable, compareStrings } from '../../../../ui-components'
import { groupsTableColumns, useFilters } from './GroupsTableHelper'

const GroupsTable = () => {
  const { t } = useTranslation()

  // TODO: Replace the mockdata when backend is implemented
  const groups = useMemo(() => {
    const mockGroups: RbacGroup[] = [
      {
        apiVersion: UserApiVersion,
        kind: GroupKind,
        metadata: {
          name: 'kubevirt-admins',
          uid: 'mock-group-kubevirt-admins',
          creationTimestamp: '2024-01-10T09:00:00Z',
        },
        users: ['alice.trask', 'sarah.jones'],
      },
      {
        apiVersion: UserApiVersion,
        kind: GroupKind,
        metadata: {
          name: 'developers',
          uid: 'mock-group-developers',
          creationTimestamp: '2024-01-11T10:30:00Z',
        },
        users: ['bob.levy', 'charlie.cranston'],
      },
      {
        apiVersion: UserApiVersion,
        kind: GroupKind,
        metadata: {
          name: 'sre-team',
          uid: 'mock-group-sre-team',
          creationTimestamp: '2024-01-12T14:15:00Z',
        },
        users: ['alice.trask'],
      },
      {
        apiVersion: UserApiVersion,
        kind: GroupKind,
        metadata: {
          name: 'security-auditors',
          uid: 'mock-group-security-auditors',
          creationTimestamp: '2024-01-13T11:45:00Z',
        },
        users: ['charlie.cranston'],
      },
      {
        apiVersion: UserApiVersion,
        kind: GroupKind,
        metadata: {
          name: 'storage-team',
          uid: 'mock-group-storage-team',
          creationTimestamp: '2024-01-14T12:00:00Z',
        },
        users: ['sarah.jones'],
      },
    ]
    return mockGroups.sort((a, b) => compareStrings(a.metadata.name ?? '', b.metadata.name ?? ''))
  }, [])

  const loading = false as boolean

  const keyFn = useCallback((group: RbacGroup) => group.metadata.name ?? '', [])

  // TODO: rbacCreate for IDP
  const canAddAccessControl = true

  const filters = useFilters()
  const columns = groupsTableColumns({ t })
  // TODO: Uncomment when actions are implemented

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
              title={t(`In order to view Groups, add Identity provider`)}
              message={
                <Trans
                  i18nKey="Once Identity provider is added, Groups will appear in the list after they log in."
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
