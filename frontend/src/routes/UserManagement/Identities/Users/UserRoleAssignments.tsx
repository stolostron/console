/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom-v5-compat'
import { ErrorPage } from '../../../../components/ErrorPage'
import { useTranslation } from '../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../NavigationPath'
import multiclusterRoleAssignmentsMockDataJson from '../../../../resources/clients/mock-data/multicluster-role-assignments.json'
import { ResourceError, ResourceErrorCode } from '../../../../resources/utils'
import { MulticlusterRoleAssignment } from '../../../../resources/multicluster-role-assignment'
import { compareStrings, AcmLoadingPage, AcmButton } from '../../../../ui-components'
import { RoleAssignments } from '../../RoleAssignment/RoleAssignments'
import { User } from '../../../../resources'

// TODO: to remove once API ready
// Mock users data to match the role assignments
const mockUsers = [
  { metadata: { name: 'alice.trask', uid: 'mock-user-alice-trask' } },
  { metadata: { name: 'bob.levy', uid: 'mock-user-bob-levy' } },
  { metadata: { name: 'charlie.cranston', uid: 'mock-user-charlie-cranston' } },
  { metadata: { name: 'sarah.jones', uid: 'mock-user-sarah-jones' } },
  { metadata: { name: 'david.brown', uid: 'mock-user-david-brown' } },
]

const UserRoleAssignments = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id = undefined } = useParams()
  const [user, setUser] = useState<User>()

  // Use mock data only
  const users = mockUsers

  // TODO: proper loading mechanism once API ready
  const [isLoading, setIsLoading] = useState<boolean>()
  useEffect(() => setIsLoading(users === undefined), [users])
  useEffect(() => setUser(users?.find((user) => user.metadata.uid === id) as User), [id, users])

  // Use multicluster role assignments mock data
  const multiclusterRoleAssignments = multiclusterRoleAssignmentsMockDataJson as MulticlusterRoleAssignment[]

  // Filter multicluster role assignments for the current user
  const userMulticlusterRoleAssignments = useMemo(
    () =>
      !user || !multiclusterRoleAssignments
        ? []
        : multiclusterRoleAssignments
            .filter(
              (multiclusterRoleAssignment) =>
                multiclusterRoleAssignment.spec.subject.kind === 'User' &&
                multiclusterRoleAssignment.spec.subject.name === user.metadata.name
            )
            .sort((a, b) => compareStrings(a.metadata?.name ?? '', b.metadata?.name ?? '')),
    [user, multiclusterRoleAssignments]
  )

  switch (true) {
    case isLoading:
      return (
        <PageSection>
          <AcmLoadingPage />
        </PageSection>
      )
    case !user:
      return (
        <ErrorPage
          error={new ResourceError(ResourceErrorCode.NotFound)}
          actions={
            <AcmButton role="link" onClick={() => navigate(NavigationPath.identitiesUsers)}>
              {t('button.backToUsers')}
            </AcmButton>
          }
        />
      )
    default:
      return (
        <RoleAssignments
          multiclusterRoleAssignments={userMulticlusterRoleAssignments}
          isLoading={isLoading}
          hiddenColumns={['subject']}
        />
      )
  }
}

export { UserRoleAssignments }
