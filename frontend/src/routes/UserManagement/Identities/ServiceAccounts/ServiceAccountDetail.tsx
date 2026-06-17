/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { useParams } from 'react-router'
import { useTranslation } from '../../../../lib/acm-i18next'
import { AcmPage, AcmPageContent, AcmPageHeader } from '../../../../ui-components'

const ServiceAccountDetail = () => {
  const { t } = useTranslation()
  const { id = undefined } = useParams()

  return (
    <AcmPage header={<AcmPageHeader title={t('Service Account Details')} description={`Service Account: ${id}`} />}>
      <AcmPageContent id="service-account-details">
        <PageSection hasBodyWrapper={false}>{t('Service Account detail page for ID: {{id}}', { id })}</PageSection>
      </AcmPageContent>
    </AcmPage>
  )
}

export { ServiceAccountDetail }
