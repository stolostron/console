/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom-v5-compat'
import { ErrorPage } from '../../../../components/ErrorPage'
import { useTranslation } from '../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../NavigationPath'
import { ClusterRole } from '../../../../resources'
import { useFindRoleAssignments } from '../../../../resources/clients/multicluster-role-assignment-client'
import { ResourceError, ResourceErrorCode } from '../../../../resources/utils'
import { AcmButton, AcmLoadingPage, compareStrings } from '../../../../ui-components'
import { RoleAssignments } from '../../RoleAssignment/RoleAssignments'
import { useRolesContext } from '../RolesPage'
import { Role } from '../RolesTableHelper'

const RoleRoleAssignments = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id = undefined } = useParams()
  const { clusterRoles, loading } = useRolesContext()
  const [role, setRole] = useState<Role>()

  const roles = useMemo(
    () =>
      !clusterRoles
        ? []
        : clusterRoles
            .map(
              (clusterRole: ClusterRole): Role => ({
                name: clusterRole.metadata.name || '',
                permissions: clusterRole.rules
                  ? [...new Set(clusterRole.rules.flatMap((rule) => rule.apiGroups || []))].join(', ')
                  : '',
                uid: clusterRole.metadata.uid || clusterRole.metadata.name || '',
              })
            )
            .sort((a, b) => compareStrings(a.name, b.name)),
    [clusterRoles]
  )

  useEffect(() => setRole(roles?.find((role) => role.uid === id) as Role), [id, roles])

  // TODO: conditionally get role assignments
  const roleAssignments = useFindRoleAssignments({ roles: [role?.name ?? ''] })

  switch (true) {
    case loading:
      return (
        <PageSection>
          <AcmLoadingPage />
        </PageSection>
      )
    case !role:
      return (
        <ErrorPage
          error={new ResourceError(ResourceErrorCode.NotFound)}
          actions={
            <AcmButton role="link" onClick={() => navigate(NavigationPath.identitiesUsers)}>
              {t('button.backToRoles')}
            </AcmButton>
          }
        />
      )
    default:
      return (
        <RoleAssignments
          roleAssignments={roleAssignments}
          hiddenColumns={['subject']}
          preselected={{ roles: [role?.name ?? ''] }}
        />
      )
  }
}

export { RoleRoleAssignments }
