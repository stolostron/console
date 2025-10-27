/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { Navigate, useParams, generatePath } from 'react-router-dom-v5-compat'
import { useSharedAtoms, useRecoilValue } from '../../../shared-recoil'
import { NavigationPath } from '../../../NavigationPath'
import { ClusterRoleAssignments } from './ClusterRoleAssignments'
// TODO: trigger sonar issue
export default function RoleAssignmentsPage() {
  const { name = '', namespace = '' } = useParams()
  const { isFineGrainedRbacEnabledState } = useSharedAtoms()
  const isFineGrainedRbacEnabled = useRecoilValue(isFineGrainedRbacEnabledState)

  return isFineGrainedRbacEnabled ? (
    <PageSection>
      <ClusterRoleAssignments />
    </PageSection>
  ) : (
    <Navigate to={generatePath(NavigationPath.clusterOverview, { name, namespace })} replace />
  )
}
