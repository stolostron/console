/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { useTranslation } from '../../lib/acm-i18next'
import { useRecoilValue, useSharedAtoms } from '../../shared-recoil'
import {
  AcmPage,
  AcmPageContent,
  AcmPageHeader
} from '../../ui-components'
import { AccessControlManagementTable } from './AccessControlManagementTable'
import { filteredAccessControlState } from '../../filtered-atoms/AccessControlManagement'

const AccessControlManagementPage = () => {
  const { accessControlState, discoveryConfigState } = useSharedAtoms()
  const { t } = useTranslation()
  const accessControls = useRecoilValue(filteredAccessControlState)

  const discoveryConfigs = useRecoilValue(discoveryConfigState)

  return (
    <AcmPage header={<AcmPageHeader title={t('Access Control Management')} />}>
      <AcmPageContent id="access-control-management">
        <PageSection>
          <AccessControlManagementTable
            discoveryConfigs={discoveryConfigs}
            accessControls={accessControls}
          />
        </PageSection>
      </AcmPageContent>
    </AcmPage>
  )
}

export { AccessControlManagementPage }
