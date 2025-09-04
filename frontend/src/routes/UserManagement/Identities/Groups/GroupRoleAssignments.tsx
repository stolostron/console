/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom-v5-compat'
import { ErrorPage } from '../../../../components/ErrorPage'
import { useTranslation } from '../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../NavigationPath'
import { Group } from '../../../../resources'
import multiclusterRoleAssignmentsMockDataJson from '../../../../resources/clients/mock-data/multicluster-role-assignments.json'
import { mockGroups } from '../../../../resources/clients/mock-data/users-and-groups'
import {
  FlattenedRoleAssignment,
  roleAssignmentToFlattenedRoleAssignment,
} from '../../../../resources/clients/multicluster-role-assignment-client'
import { MulticlusterRoleAssignment } from '../../../../resources/multicluster-role-assignment'
import { ResourceError, ResourceErrorCode } from '../../../../resources/utils'
import { AcmButton, AcmLoadingPage, compareStrings } from '../../../../ui-components'
import { RoleAssignments } from '../../RoleAssignment/RoleAssignments'

const GroupRoleAssignments = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id = undefined } = useParams()
  const [group, setGroup] = useState<Group>()

  const groups = mockGroups
  // TODO: proper loading mechanism once API ready
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isNotFound, setIsNotFound] = useState<boolean>()
  useEffect(() => setIsLoading([groups, group].includes(undefined)), [groups, group])
  useEffect(() => {
    const group = groups?.find((group) => group.metadata.name === id || group.metadata.uid === id) as Group
    setGroup(group)
    setIsNotFound(group === undefined)
    setIsLoading(false)
  }, [id, groups])

  const multiclusterRoleAssignments = multiclusterRoleAssignmentsMockDataJson as MulticlusterRoleAssignment[]

  // TODO: call useFindRoleAssignments instead ACM-23633
  const roleAssignments: FlattenedRoleAssignment[] = useMemo(
    () =>
      !group || !multiclusterRoleAssignments
        ? []
        : multiclusterRoleAssignments
            .filter(
              (multiclusterRoleAssignment) =>
                multiclusterRoleAssignment.spec.subject.kind === 'Group' &&
                multiclusterRoleAssignment.spec.subject.name === group.metadata.name
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
    [multiclusterRoleAssignments, group]
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
            <AcmButton role="link" onClick={() => navigate(NavigationPath.identitiesGroups)}>
              {t('button.backToGroups')}
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
          preselected={{ groups: [{ id: group?.metadata.uid ?? '', name: group?.metadata.name ?? '' }] }}
        />
      )
  }
}

export { GroupRoleAssignments }
