/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { generatePath, Navigate, useParams } from 'react-router-dom-v5-compat'
import { NavigationPath } from '../../../../NavigationPath'
import { useRecoilValue, useSharedAtoms } from '../../../../shared-recoil'
import { ClusterSetRoleAssignments } from './ClusterSetDetails/ClusterSetRoleAssignments/ClusterSetRoleAssignments'

export default function ClusterSetRoleAssignmentsPage() {
  const { id = '' } = useParams()
  const { isFineGrainedRbacEnabledState } = useSharedAtoms()
  const isFineGrainedRbacEnabled = useRecoilValue(isFineGrainedRbacEnabledState)

  return isFineGrainedRbacEnabled ? (
    <PageSection hasBodyWrapper={false}>
      <ClusterSetRoleAssignments />
    </PageSection>
  ) : (
    <Navigate to={generatePath(NavigationPath.clusterSetDetails, { id })} replace />
  )
}
