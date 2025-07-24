/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { useTranslation } from '../../lib/acm-i18next'
import { AcmPage, AcmPageContent, AcmPageHeader } from '../../ui-components'

const Roles = () => {
  const { t } = useTranslation()

  return (
    <AcmPage header={<AcmPageHeader title={t('Roles')} description={t('Manage roles and permissions')} />}>
      <AcmPageContent id="roles">
        <PageSection>Roles list</PageSection>
      </AcmPageContent>
    </AcmPage>
  )
}

export { Roles }
