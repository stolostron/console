/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { useMemo } from 'react'
import { useParams } from 'react-router'
import { useTranslation } from '../../../lib/acm-i18next'
import { useSharedValue, useSharedAtoms } from '../../../shared-atoms'
import { AcmPage, AcmPageContent, AcmPageHeader, AcmTableStateProvider } from '../../../ui-components'
import { RolesTable } from './RolesTable'

export const useCurrentRole = () => {
  const { id } = useParams()
  const { vmClusterRolesState } = useSharedAtoms()
  const clusterRoles = useSharedValue(vmClusterRolesState)

  return useMemo(
    () =>
      !clusterRoles || !id ? undefined : clusterRoles.find((r) => r.metadata.uid === id || r.metadata.name === id),
    [clusterRoles, id]
  )
}

const RolesPage = () => {
  const { t } = useTranslation()

  return (
    <AcmPage header={<AcmPageHeader title={t('Roles')} description={t('Manage roles and permissions')} />}>
      <AcmPageContent id="roles">
        <PageSection hasBodyWrapper={false}>
          <AcmTableStateProvider localStorageKey={'user-mgmt-roles-table-state'}>
            <RolesTable hiddenColumns={['radio']} />
          </AcmTableStateProvider>
        </PageSection>
      </AcmPageContent>
    </AcmPage>
  )
}

export { RolesPage }
