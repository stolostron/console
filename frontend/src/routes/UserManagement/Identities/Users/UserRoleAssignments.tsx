/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { useParams } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../../../lib/acm-i18next'
import { useQuery } from '../../../../lib/useQuery'
import { listUsers } from '../../../../resources/rbac'
import { AcmEmptyState, AcmLoadingPage, AcmButton } from '../../../../ui-components'
import { DOC_LINKS, ViewDocumentationLink } from '../../../../lib/doc-util'

const UserRoleAssignments = () => {
  const { t } = useTranslation()
  const { id = undefined } = useParams()
  const { data: users, loading: usersLoading } = useQuery(listUsers)

  const user = users?.find((user) => user.metadata.name === id || user.metadata.uid === id)

  // Show loading spinner only when users are loading, otherwise show partial data
  const isInitialLoading = usersLoading

  const isUserLoading = usersLoading && !user

  return (
    <PageSection>
      {isInitialLoading ? (
        <AcmLoadingPage />
      ) : isUserLoading ? (
        <AcmLoadingPage />
      ) : !user ? (
        <div>{t('User not found')}</div>
      ) : (
        <AcmEmptyState
          key="roleAssignmentsEmptyState"
          title={t('No role assignments')}
          message={t(
            'No role assignments have been created for this user yet. Create a role assignment to grant specific permissions.'
          )}
          action={
            <div>
              <AcmButton variant="primary" onClick={() => {}}>
                {t('Create role assignment')}
              </AcmButton>
              {/* TODO: add correct documentation link */}
              <ViewDocumentationLink doclink={DOC_LINKS.CLUSTERS} />
            </div>
          }
        />
      )}
    </PageSection>
  )
}

export { UserRoleAssignments }
