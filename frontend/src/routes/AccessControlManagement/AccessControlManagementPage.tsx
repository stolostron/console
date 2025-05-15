/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { useTranslation } from '../../lib/acm-i18next'
import { AcmPage, AcmPageContent, AcmPageHeader } from '../../ui-components'
import { AccessControlManagementTable } from './AccessControlManagementTable'
import { useAccessControlFilter } from './AccessControlManagementTableHelper'

const AccessControlManagementPage = () => {
  const { t } = useTranslation()

  const accessControls = useAccessControlFilter()

  return (
    <AcmPage header={<AcmPageHeader title={t('Access Control Management')} />}>
      <AcmPageContent id="access-control-management">
        <PageSection>
          <AccessControlManagementTable accessControls={accessControls} />
        </PageSection>
      </AcmPageContent>
    </AcmPage>
  )
}

export { AccessControlManagementPage }
