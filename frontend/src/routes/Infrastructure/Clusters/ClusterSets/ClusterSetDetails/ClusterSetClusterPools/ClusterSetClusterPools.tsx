/* Copyright Contributors to the Open Cluster Management project */

import { ManagedClusterSetDefinition } from '../../../../../../resources'
import { AcmEmptyState, AcmPageContent } from '../../../../../../ui-components'
import { PageSection } from '@patternfly/react-core'
import { useContext } from 'react'
import { Trans, useTranslation } from '../../../../../../lib/acm-i18next'
import { Link } from 'react-router-dom-v5-compat'
import { RbacButton } from '../../../../../../components/Rbac'
import { rbacCreate } from '../../../../../../lib/rbac-util'
import { createBackCancelLocation, NavigationPath } from '../../../../../../NavigationPath'
import { ClusterPoolsTable } from '../../../ClusterPools/ClusterPools'
import { ClusterSetContext } from '../ClusterSetDetails'

export function ClusterSetClusterPoolsPageContent() {
  const { t } = useTranslation()
  const { clusters, clusterSet, clusterPools } = useContext(ClusterSetContext)
  return (
    <AcmPageContent id="cluster-pools">
      <PageSection>
        <ClusterPoolsTable
          clusterPools={clusterPools!}
          clusters={clusters!}
          emptyState={
            <AcmEmptyState
              key="mcEmptyState"
              title={t('managed.clusterSets.clusterPools.emptyStateHeader')}
              message={
                <Trans i18nKey="managed.clusterSets.clusterPools.emptyStateMsg" components={{ bold: <strong /> }} />
              }
              action={
                <RbacButton
                  component={Link}
                  to={createBackCancelLocation({
                    pathname: NavigationPath.createClusterPool,
                    search: `?clusterSet=${clusterSet!.metadata.name}`,
                  })}
                  variant="primary"
                  rbac={[rbacCreate(ManagedClusterSetDefinition, undefined, clusterSet!.metadata.name, 'join')]}
                >
                  {t('managed.clusterSets.clusterPools.emptyStateButton')}
                </RbacButton>
              }
            />
          }
        />
      </PageSection>
    </AcmPageContent>
  )
}
