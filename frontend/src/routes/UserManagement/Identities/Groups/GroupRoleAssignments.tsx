/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { GroupKind } from '../../../../resources'
import { useFindRoleAssignments } from '../../../../resources/clients/multicluster-role-assignment-client'
import { RoleAssignments } from '../../RoleAssignment/RoleAssignments'
import { useCurrentGroup } from './GroupPage'

const GroupRoleAssignments = () => {
  const group = useCurrentGroup()

  const roleAssignments = useFindRoleAssignments({
    subjectNames: group?.metadata.name ? [group.metadata.name] : [],
    subjectKinds: ['Group'],
  })

  return (
    <PageSection hasBodyWrapper={false}>
      <RoleAssignments
        roleAssignments={roleAssignments}
        isLoading={false}
        hiddenColumns={['subject', 'name']}
        hiddenFilters={['identity']}
        preselected={{ subject: { kind: GroupKind, value: group?.metadata.name }, context: 'identity' }}
      />
    </PageSection>
  )
}

export { GroupRoleAssignments }
