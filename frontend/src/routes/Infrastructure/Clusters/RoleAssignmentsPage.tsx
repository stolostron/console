/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { Navigate, useParams, generatePath } from 'react-router-dom-v5-compat'
import { useSharedAtoms, useRecoilValue } from '../../../shared-recoil'
import { useTranslation } from '../../../lib/acm-i18next'
import { NavigationPath } from '../../../NavigationPath'

export default function RoleAssignmentsPage() {
  const { t } = useTranslation()
  const { name = '', namespace = '' } = useParams()
  const { isFineGrainedRbacEnabledState } = useSharedAtoms()
  const isFineGrainedRbacEnabled = useRecoilValue(isFineGrainedRbacEnabledState)

  if (!isFineGrainedRbacEnabled) {
    return <Navigate to={generatePath(NavigationPath.clusterOverview, { name, namespace })} replace />
  }

  return (
    <PageSection>
      <h1>{t('Role Assignments')}</h1>
      <p>{t('This is a test page for Role Assignments.')}</p>
      <p>Cluster: {name}</p>
      <p>Namespace: {namespace}</p>
    </PageSection>
  )
}
