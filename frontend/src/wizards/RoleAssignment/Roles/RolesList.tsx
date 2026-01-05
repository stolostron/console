/* Copyright Contributors to the Open Cluster Management project */

import { PageSection } from '@patternfly/react-core'
import { useTranslation } from '../../../lib/acm-i18next'
import { RolesTable } from '../../../routes/UserManagement/Roles/RolesTable'
import { GranularityStepContent } from '../GranularityStepContent'

interface RolesListProps {
  onRadioSelect: (roleName: string) => void
}

export function RolesList({ onRadioSelect }: RolesListProps) {
  const { t } = useTranslation()

  return (
    <PageSection hasBodyWrapper={false}>
      <GranularityStepContent title={t('Roles')} description={t('Choose a role to assign.')} titleSize="lg" />
      <RolesTable onRadioSelect={onRadioSelect} areLinksDisplayed={false} />
    </PageSection>
  )
}
