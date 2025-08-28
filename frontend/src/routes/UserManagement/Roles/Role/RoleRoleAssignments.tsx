/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom-v5-compat'
import { ErrorPage } from '../../../../components/ErrorPage'
import { useTranslation } from '../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../NavigationPath'
import { useCurrentRole } from '../RolesPage'
import multiclusterRoleAssignmentsMockDataJson from '../../../../resources/clients/mock-data/multicluster-role-assignments.json'
import { ResourceError, ResourceErrorCode } from '../../../../resources/utils'
import { MulticlusterRoleAssignment } from '../../../../resources/multicluster-role-assignment'
import { compareStrings, AcmLoadingPage, AcmButton } from '../../../../ui-components'
import { RoleAssignments } from '../../../../routes/UserManagement/RoleAssignment/RoleAssignments'

const RoleRoleAssignments = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const role = useCurrentRole()

  // Use multicluster role assignments mock data
  const multiclusterRoleAssignments = multiclusterRoleAssignmentsMockDataJson as MulticlusterRoleAssignment[]

  // Filter multicluster role assignments for the current role
  const roleMulticlusterRoleAssignments = useMemo(
    () =>
      !role || !multiclusterRoleAssignments
        ? []
        : multiclusterRoleAssignments
            .filter((multiclusterRoleAssignment) =>
              multiclusterRoleAssignment.spec.roleAssignments.some(
                (roleAssignment) => roleAssignment.clusterRole === role.metadata.name
              )
            )
            .sort((a, b) => compareStrings(a.metadata?.name ?? '', b.metadata?.name ?? '')),
    [role, multiclusterRoleAssignments]
  )

  // TODO: proper loading mechanism once API ready
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isNotFound, setIsNotFound] = useState<boolean>()

  useEffect(() => setIsLoading(role === undefined), [role])
  useEffect(() => {
    setIsNotFound(role === undefined)
    setIsLoading(false)
  }, [role])

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
            <AcmButton role="link" onClick={() => navigate(NavigationPath.roles)}>
              {t('button.backToRoles')}
            </AcmButton>
          }
        />
      )
    default:
      return (
        <RoleAssignments
          multiclusterRoleAssignments={roleMulticlusterRoleAssignments}
          isLoading={isLoading}
          hiddenColumns={['role']}
        />
      )
  }
}

export { RoleRoleAssignments }
