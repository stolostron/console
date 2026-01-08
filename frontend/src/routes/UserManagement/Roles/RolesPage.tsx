/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { useMemo } from 'react'
import { useParams } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../../lib/acm-i18next'
import { useRecoilValue, useSharedAtoms } from '../../../shared-recoil'
import { AcmPage, AcmPageContent, AcmPageHeader } from '../../../ui-components'
import { RolesTable } from './RolesTable'

export const useCurrentRole = () => {
  const { id } = useParams()
  const { vmClusterRolesState } = useSharedAtoms()
  const clusterRoles = useRecoilValue(vmClusterRolesState)

  return useMemo(
    () =>
      !clusterRoles || !id ? undefined : clusterRoles.find((r) => r.metadata.uid === id || r.metadata.name === id),
    [clusterRoles, id]
  )
}

const RolesPage = () => {
  const { t } = useTranslation()

  return (
    <AcmPage
      header={
        <AcmPageHeader
          title={t('Roles')}
          description={t('Manage roles and permissions')}
          breadcrumb={[{ text: t('User Management') }, { text: t('Roles') }]}
        />
      }
    >
      <AcmPageContent id="roles">
        <PageSection hasBodyWrapper={false}>
          <RolesTable hiddenColumns={['radio']} />
        </PageSection>
      </AcmPageContent>
    </AcmPage>
  )
}

export { RolesPage }
