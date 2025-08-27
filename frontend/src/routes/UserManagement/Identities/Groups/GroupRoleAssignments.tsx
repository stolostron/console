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
import { Group } from '../../../../resources'
import { mockGroups } from '../../../../resources/clients/mock-data/users-and-groups'

const GroupRoleAssignments = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id = undefined } = useParams()
  const [group, setGroup] = useState<Group>()

  const groups = mockGroups
  console.log(groups, 'groups')
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

  const groupMulticlusterRoleAssignments = useMemo(
    () =>
      !group || !multiclusterRoleAssignments
        ? []
        : multiclusterRoleAssignments
            .filter(
              (multiclusterRoleAssignment) =>
                multiclusterRoleAssignment.spec.subject.kind === 'Group' &&
                multiclusterRoleAssignment.spec.subject.name === group.metadata.name
            )
            .sort((a, b) => compareStrings(a.metadata?.name ?? '', b.metadata?.name ?? '')),
    [group, multiclusterRoleAssignments]
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
          multiclusterRoleAssignments={groupMulticlusterRoleAssignments}
          isLoading={isLoading}
          hiddenColumns={['subject']}
        />
      )
  }
}

export { GroupRoleAssignments }
