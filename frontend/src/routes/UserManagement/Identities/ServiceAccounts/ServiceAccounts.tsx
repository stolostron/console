/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { useTranslation } from '../../../../lib/acm-i18next'

const ServiceAccounts = () => {
  const { t } = useTranslation()
  return (
    <PageSection hasBodyWrapper={false}>
      <div>{t('Service Accounts list')}</div>
    </PageSection>
  )
}

export { ServiceAccounts }
