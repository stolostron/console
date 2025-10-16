/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { UserKind } from '../../../../resources'
import { useFindRoleAssignments } from '../../../../resources/clients/multicluster-role-assignment-client'
import { RoleAssignments } from '../../RoleAssignment/RoleAssignments'
import { useCurrentUser } from './UserPage'

const UserRoleAssignments = () => {
  const user = useCurrentUser()

  const roleAssignments = useFindRoleAssignments({
    subjectNames: user?.metadata.name ? [user.metadata.name] : [],
    subjectKinds: ['User'],
  })

  return (
    <PageSection>
      <RoleAssignments
        roleAssignments={roleAssignments}
        isLoading={false}
        hiddenColumns={['subject', 'name']}
        preselected={{ subject: { kind: UserKind, value: user?.metadata.name } }}
      />
    </PageSection>
  )
}

export { UserRoleAssignments }
