/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { useMemo } from 'react'
import { useTranslation } from '../../lib/acm-i18next'
import {
  unpackProviderConnection
} from '../../resources'
import { useRecoilValue, useSharedAtoms } from '../../shared-recoil'
import {
  AcmPage,
  AcmPageContent,
  AcmPageHeader
} from '../../ui-components'
import { AccessControlManagementTable } from './AccessControlManagementTable'

const AccessControlManagementPage = () => {
  const { secretsState, discoveryConfigState } = useSharedAtoms()
  const { t } = useTranslation()
  const secrets = useRecoilValue(secretsState)
  const credentialsSecrets = useMemo(
    () =>
      secrets.filter(
        (secret) => secret?.metadata?.labels?.['cluster.open-cluster-management.io/credentials'] !== undefined
      ),
    [secrets]
  )

  const providerConnections = secrets.map(unpackProviderConnection)
  const discoveryConfigs = useRecoilValue(discoveryConfigState)

  return (
    <AcmPage header={<AcmPageHeader title={t('Access Control Management')} />}>
      <AcmPageContent id="access-control-management">
        <PageSection>
          <AccessControlManagementTable
            providerConnections={providerConnections}
            discoveryConfigs={discoveryConfigs}
            secrets={credentialsSecrets}
          />
        </PageSection>
      </AcmPageContent>
    </AcmPage>
  )
}

export { AccessControlManagementPage }
