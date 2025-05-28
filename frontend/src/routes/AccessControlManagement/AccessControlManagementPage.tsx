/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { useTranslation } from '../../lib/acm-i18next'
import { AcmPage, AcmPageContent, AcmPageHeader } from '../../ui-components'
import { AccessControlManagementTable } from './AccessControlManagementTable'
import { useRecoilValue, useSharedAtoms } from '../../shared-recoil'

const AccessControlManagementPage = () => {
  const { t } = useTranslation()
  const { accessControlState } = useSharedAtoms()
  const accessControls = useRecoilValue(accessControlState)

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
