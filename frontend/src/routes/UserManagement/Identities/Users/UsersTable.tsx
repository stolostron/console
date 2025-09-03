/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { useCallback, useMemo } from 'react'
import { Trans, useTranslation } from '../../../../lib/acm-i18next'
import { User as RbacUser } from '../../../../resources/rbac'
import { Link } from 'react-router-dom-v5-compat'
import { DOC_LINKS, ViewDocumentationLink } from '../../../../lib/doc-util'
import { AcmButton, AcmEmptyState, AcmLoadingPage, AcmTable, compareStrings } from '../../../../ui-components'
import { useFilters, usersTableColumns } from './UsersTableHelper'

const UsersTable = () => {
  const { t } = useTranslation()

  // TODO: Replace the mockdata when backend is implemented
  // const { data: rbacUsers, loading } = useQuery(listUsers)
  // const users = useMemo(() => rbacUsers?.sort((a, b) => compareStrings(a.metadata.name ?? '', b.metadata.name ?? '')) ?? [], [rbacUsers])
  const loading = false

  // Mock users data to match the role assignments
  const users = useMemo(() => {
    const mockUsers: RbacUser[] = [
      {
        apiVersion: 'user.openshift.io/v1',
        kind: 'User',
        metadata: {
          name: 'alice.trask',
          uid: 'mock-user-alice-trask',
          creationTimestamp: '2024-01-15T10:30:00Z',
        },
        fullName: 'Alice Trask',
        identities: ['ldap:alice.trask', 'htpasswd_provider:alice.trask'],
      },
      {
        apiVersion: 'user.openshift.io/v1',
        kind: 'User',
        metadata: {
          name: 'bob.levy',
          uid: 'mock-user-bob-levy',
          creationTimestamp: '2024-01-16T14:20:00Z',
        },
        fullName: 'Bob Levy',
        identities: ['oauth:github:bob.levy'],
      },
      {
        apiVersion: 'user.openshift.io/v1',
        kind: 'User',
        metadata: {
          name: 'charlie.cranston',
          uid: 'mock-user-charlie-cranston',
          creationTimestamp: '2024-01-17T12:00:00Z',
        },
        fullName: 'Charlie Cranston',
        identities: ['oauth:google:charlie.cranston@company.com'],
      },
      {
        apiVersion: 'user.openshift.io/v1',
        kind: 'User',
        metadata: {
          name: 'sarah.jones',
          uid: 'mock-user-sarah-jones',
          creationTimestamp: '2024-01-18T14:20:00Z',
        },
        fullName: 'Sarah Jones',
        identities: ['ldap:sarah.jones', 'oauth:saml:sarah.jones@enterprise.corp'],
      },
      {
        apiVersion: 'user.openshift.io/v1',
        kind: 'User',
        metadata: {
          name: 'david.brown',
          uid: 'mock-user-david-brown',
          creationTimestamp: '2024-01-19T16:30:00Z',
        },
        fullName: 'David Brown',
        identities: ['htpasswd_provider:david.brown'],
      },
    ]
    return mockUsers.sort((a, b) => compareStrings(a.metadata.name ?? '', b.metadata.name ?? ''))
  }, [])

  const keyFn = useCallback((user: RbacUser) => user.metadata.name ?? '', [])

  // TODO: rbacCreate for IDP
  const canAddAccessControl = true

  const filters = useFilters()
  const columns = usersTableColumns({ t })
  // TODO: Uncomment when actions are implemented
  // const rowActions = useRowActions({ t, navigate })
  // TODO: to remove
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
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
      {/* // TODO: to remove */}
      <AcmButton variant="primary" onClick={() => setIsModalOpen(true)}>
        {t('Create role assignment')}
      </AcmButton>
      <RoleAssignmentModal
        close={() => setIsModalOpen(false)}
        onSave={() => setIsModalOpen(false)}
        isOpen={isModalOpen}
        preselected={{
          // groups: [
          //   {
          //     id: 'a1a50feb-f41d-4529-8fb4-fd0bec6b3ac7',
          //     name: 'e2e-cluster-group',
          //   },
          // ],
          roles: [
            {
              name: 'default-broker/submariner-k8s-broker-cluster',
              id: 'd8a7a57f-bd6d-4271-8ff1-98a5b04d5c75',
            },
          ],
        }}
      />
    </>
  )
}

export { UsersTable }
