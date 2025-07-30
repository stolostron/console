/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { useParams } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../../lib/acm-i18next'
import { AcmPage, AcmPageContent, AcmPageHeader } from '../../../ui-components'

const GroupRoleAssignments = () => {
  const { t } = useTranslation()
  const { id = undefined } = useParams()

  return (
    <AcmPage header={<AcmPageHeader title={t('Group Role Assignments')} description={`Group: ${id}`} />}>
      <AcmPageContent id="group-role-assignments">
        <PageSection>Group role assignments page for ID: {id}</PageSection>
      </AcmPageContent>
    </AcmPage>
  )
}

export { GroupRoleAssignments }
