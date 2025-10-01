/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom-v5-compat'
import { ErrorPage } from '../../../../components/ErrorPage'
import { useTranslation } from '../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../NavigationPath'
import { User, UserKind } from '../../../../resources'
import { listUsers } from '../../../../resources/rbac'
import {
  roleAssignmentToFlattenedRoleAssignment,
  FlattenedRoleAssignment,
} from '../../../../resources/clients/multicluster-role-assignment-client'
import { useQuery } from '../../../../lib/useQuery'
import { useRecoilValue, useSharedAtoms } from '../../../../shared-recoil'
import { ResourceError, ResourceErrorCode } from '../../../../resources/utils'
import { AcmButton, AcmLoadingPage, compareStrings } from '../../../../ui-components'
import { RoleAssignments } from '../../RoleAssignment/RoleAssignments'

const UserRoleAssignments = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id = undefined } = useParams()
  const [user, setUser] = useState<User>()

  const { data: users, loading: isUsersLoading } = useQuery(listUsers)

  const { multiclusterRoleAssignmentState } = useSharedAtoms()
  const multiclusterRoleAssignments = useRecoilValue(multiclusterRoleAssignmentState)
  const isRoleAssignmentsLoading = multiclusterRoleAssignments === undefined
  // TODO: proper loading mechanism once API ready
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isNotFound, setIsNotFound] = useState<boolean>()

  useEffect(() => {
    const user = users?.find((user) => user.metadata.uid === id) as User
    setUser(user)
    setIsNotFound(user === undefined)
  }, [id, users])

  useEffect(() => {
    setIsLoading(
      [users, user, multiclusterRoleAssignments].includes(undefined) || isUsersLoading || isRoleAssignmentsLoading
    )
  }, [users, user, multiclusterRoleAssignments, isUsersLoading, isRoleAssignmentsLoading])

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
          hiddenColumns={['subject', 'name']}
          preselected={{ subject: { kind: UserKind, value: user?.metadata.name } }}
        />
      )
  }
}

export { UserRoleAssignments }
