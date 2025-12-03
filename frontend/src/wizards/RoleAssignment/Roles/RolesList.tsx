/* Copyright Contributors to the Open Cluster Management project */

import { PageSection, Text, Title } from '@patternfly/react-core'
import { useTranslation } from '../../../lib/acm-i18next'
import { RolesTable } from '../../../routes/UserManagement/Roles/RolesTable'

interface RolesListProps {
  onRadioSelect: (roleName: string) => void
}

export function RolesList({ onRadioSelect }: RolesListProps) {
  const { t } = useTranslation()

  return (
    <PageSection>
      <Title headingLevel="h2" size="lg" style={{ marginBottom: '0.5rem' }}>
        {t('Roles')}
      </Title>
      <Text style={{ marginBottom: '1rem' }}>{t('Choose a role to assign.')}</Text>
      <RolesTable onRadioSelect={onRadioSelect} areLinksDisplayed={false} />
    </PageSection>
  )
}
