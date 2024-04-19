/* Copyright Contributors to the Open Cluster Management project */

import { ManagedClusterSetDefinition } from '../../../../../../resources'
import { AcmEmptyState, AcmPageContent } from '../../../../../../ui-components'
import { PageSection } from '@patternfly/react-core'
import { useContext } from 'react'
import { Trans, useTranslation } from '../../../../../../lib/acm-i18next'
import { Link } from 'react-router-dom-v5-compat'
import { RbacButton } from '../../../../../../components/Rbac'
import { rbacCreate } from '../../../../../../lib/rbac-util'
import { NavigationPath } from '../../../../../../NavigationPath'
import { ClustersTable } from '../../../ManagedClusters/ManagedClusters'
import { ClusterSetContext } from '../ClusterSetDetails'

export function ClusterSetClustersPageContent() {
  const { t } = useTranslation()
  const { clusterSet, clusters } = useContext(ClusterSetContext)
  return (
    <AcmPageContent id="clusters">
      <PageSection>
        <ClustersTable
          clusters={clusters}
          emptyState={
            <AcmEmptyState
              key="mcEmptyState"
              title={t('managed.clusterSets.clusters.emptyStateHeader')}
              message={<Trans i18nKey="managed.clusterSets.clusters.emptyStateMsg" components={{ bold: <strong /> }} />}
              action={
                <RbacButton
                  component={Link}
                  to={NavigationPath.clusterSetManage.replace(':id', clusterSet!.metadata.name!)}
                  variant="primary"
                  rbac={[rbacCreate(ManagedClusterSetDefinition, undefined, clusterSet!.metadata.name, 'join')]}
                >
                  {t('managed.clusterSets.clusters.emptyStateButton')}
                </RbacButton>
              }
            />
          }
        />
      </PageSection>
    </AcmPageContent>
  )
}
