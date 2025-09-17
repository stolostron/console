/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom-v5-compat'
import { ErrorPage } from '../../../../components/ErrorPage'
import { useTranslation } from '../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../NavigationPath'
import { User, UserKind } from '../../../../resources'
import multiclusterRoleAssignmentsMockDataJson from '../../../../resources/clients/mock-data/multicluster-role-assignments.json'
import {
  roleAssignmentToFlattenedRoleAssignment,
  FlattenedRoleAssignment,
} from '../../../../resources/clients/multicluster-role-assignment-client'
import { MulticlusterRoleAssignment } from '../../../../resources/multicluster-role-assignment'
import { ResourceError, ResourceErrorCode } from '../../../../resources/utils'
import { AcmButton, AcmLoadingPage, compareStrings } from '../../../../ui-components'
import { RoleAssignments } from '../../RoleAssignment/RoleAssignments'

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
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isNotFound, setIsNotFound] = useState<boolean>()
  useEffect(() => setIsLoading([users, user].includes(undefined)), [users, user])
  useEffect(() => {
    const user = users?.find((user) => user.metadata.uid === id) as User
    setUser(user)
    setIsNotFound(user === undefined)
    setIsLoading(false)
  }, [id, users])

  // Use multicluster role assignments mock data
  const multiclusterRoleAssignments = multiclusterRoleAssignmentsMockDataJson as MulticlusterRoleAssignment[]

  // TODO: call useFindRoleAssignments instead ACM-23633
  const roleAssignments: FlattenedRoleAssignment[] = useMemo(
    () =>
      !user || !multiclusterRoleAssignments
        ? []
        : multiclusterRoleAssignments
            .filter(
              (multiclusterRoleAssignment) =>
                multiclusterRoleAssignment.spec.subject.kind === 'User' &&
                multiclusterRoleAssignment.spec.subject.name === user.metadata.name
            )
            .reduce(
              (roleAssignmentsAcc: FlattenedRoleAssignment[], multiclusterRoleAssignmentCurr) => [
                ...roleAssignmentsAcc,
                ...multiclusterRoleAssignmentCurr.spec.roleAssignments.map((roleAssignment) =>
                  roleAssignmentToFlattenedRoleAssignment(multiclusterRoleAssignmentCurr, roleAssignment)
                ),
              ],
              []
            )
            .sort((a, b) => compareStrings(a.subject.name ?? '', b.subject.name ?? '')),
    [multiclusterRoleAssignments, user]
  )

  switch (true) {
    case isLoading:
      return (
        <PageSection>
          <AcmLoadingPage />
        </PageSection>
      )
    case isNotFound:
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
          roleAssignments={roleAssignments}
          isLoading={isLoading}
          hiddenColumns={['subject']}
          preselected={{ subject: { kind: UserKind, value: user?.metadata.name } }}
        />
      )
  }
}

export { UserRoleAssignments }
