/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { useParams } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../../../lib/acm-i18next'
import { AcmPage, AcmPageContent, AcmPageHeader } from '../../../../ui-components'

const ServiceAccountRoleAssignments = () => {
  const { t } = useTranslation()
  const { id = undefined } = useParams()

  return (
    <AcmPage
      header={<AcmPageHeader title={t('Service Account Role Assignments')} description={`Service Account: ${id}`} />}
    >
      <AcmPageContent id="service-account-role-assignments">
        <PageSection>Service Account role assignments page for ID: {id}</PageSection>
      </AcmPageContent>
    </AcmPage>
  )
}

export { ServiceAccountRoleAssignments }
