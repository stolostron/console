/* Copyright Contributors to the Open Cluster Management project */

import { ManagedClusterSetDefinition, isGlobalClusterSet } from '../../../../../../resources'
import { AcmEmptyState, AcmPageContent } from '../../../../../../ui-components'
import { PageSection } from '@patternfly/react-core'
import { Trans, useTranslation } from '../../../../../../lib/acm-i18next'
import { Link, generatePath } from 'react-router-dom-v5-compat'
import { RbacButton } from '../../../../../../components/Rbac'
import { rbacCreate } from '../../../../../../lib/rbac-util'
import { NavigationPath, SubRoutesRedirect } from '../../../../../../NavigationPath'
import { ClustersTable } from '../../../ManagedClusters/ManagedClusters'
import { useClusterSetDetailsContext } from '../ClusterSetDetails'

export function ClusterSetClustersPageContent() {
  const { t } = useTranslation()
  const { clusterSet, clusters } = useClusterSetDetailsContext()

  if (isGlobalClusterSet(clusterSet)) {
    return (
      <SubRoutesRedirect matchPath={NavigationPath.clusterSetDetails} targetPath={NavigationPath.clusterSetOverview} />
    )
  }

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
                  to={generatePath(NavigationPath.clusterSetManage, { id: clusterSet.metadata.name! })}
                  variant="primary"
                  rbac={[rbacCreate(ManagedClusterSetDefinition, undefined, clusterSet.metadata.name, 'join')]}
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
