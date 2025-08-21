/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { useParams } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../../../lib/acm-i18next'
import { useQuery } from '../../../../lib/useQuery'
import { listGroups } from '../../../../resources/rbac'
import { AcmEmptyState, AcmLoadingPage, AcmButton } from '../../../../ui-components'
import { DOC_LINKS, ViewDocumentationLink } from '../../../../lib/doc-util'

const GroupRoleAssignments = () => {
  const { t } = useTranslation()
  const { id = undefined } = useParams()
  const { data: groups, loading: groupsLoading } = useQuery(listGroups)

  const group = groups?.find((group) => group.metadata.name === id || group.metadata.uid === id)

  // Show loading spinner only when users are loading, otherwise show partial data
  const isInitialLoading = groupsLoading

  const isGroupLoading = groupsLoading && !group

  return (
    <PageSection>
      {isInitialLoading ? (
        <AcmLoadingPage />
      ) : isGroupLoading ? (
        <AcmLoadingPage />
      ) : !group ? (
        <div>{t('Group not found')}</div>
      ) : (
        <AcmEmptyState
          key="roleAssignmentsEmptyState"
          title={t('No role assignments')}
          message={t(
            'No role assignments have been created for this group yet. Create a role assignment to grant specific permissions.'
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

export { GroupRoleAssignments }
