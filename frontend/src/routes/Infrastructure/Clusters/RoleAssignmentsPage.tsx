/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { Navigate, useParams, generatePath } from 'react-router'
import { useSharedAtoms, useSharedValue } from '../../../shared-atoms'
import { NavigationPath } from '../../../NavigationPath'
import { ClusterRoleAssignments } from './ClusterRoleAssignments'

export default function RoleAssignmentsPage() {
  const { name = '', namespace = '' } = useParams()
  const { isFineGrainedRbacEnabledState } = useSharedAtoms()
  const isFineGrainedRbacEnabled = useSharedValue(isFineGrainedRbacEnabledState)

  return isFineGrainedRbacEnabled ? (
    <PageSection hasBodyWrapper={false}>
      <ClusterRoleAssignments />
    </PageSection>
  ) : (
    <Navigate to={generatePath(NavigationPath.clusterOverview, { name, namespace })} replace />
  )
}
