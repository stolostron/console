/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { useParams } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../lib/acm-i18next'
import { AcmPage, AcmPageContent, AcmPageHeader } from '../../ui-components'

const ServiceAccountGroups = () => {
  const { t } = useTranslation()
  const { id = undefined } = useParams()

  return (
    <AcmPage header={<AcmPageHeader title={t('ServiceAccount Groups')} description={`ServiceAccount: ${id}`} />}>
      <AcmPageContent id="sa-groups">
        <PageSection>ServiceAccount groups page for ID: {id}</PageSection>
      </AcmPageContent>
    </AcmPage>
  )
}

export { ServiceAccountGroups }
