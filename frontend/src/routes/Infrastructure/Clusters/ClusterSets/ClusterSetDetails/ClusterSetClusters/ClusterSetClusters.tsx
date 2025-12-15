/* Copyright Contributors to the Open Cluster Management project */

import { ManagedClusterSetDefinition, isGlobalClusterSet } from '../../../../../../resources'
import { AcmEmptyState, AcmPageContent } from '../../../../../../ui-components'
import { PageSection } from '@patternfly/react-core'
import { useTranslation } from '../../../../../../lib/acm-i18next'
import { Link, generatePath } from 'react-router-dom-v5-compat'
import { RbacButton } from '../../../../../../components/Rbac'
import { rbacCreate } from '../../../../../../lib/rbac-util'
import { NavigationPath, SubRoutesRedirect } from '../../../../../../NavigationPath'
import { useClusterSetDetailsContext } from '../ClusterSetDetails'
import { ClustersTable } from '../../../../../../components/Clusters'

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
      <PageSection hasBodyWrapper={false}>
        <ClustersTable
          clusters={clusters}
          tableKey="clusterSetClusters"
          emptyState={
            <AcmEmptyState
              key="mcEmptyState"
              title={t("You don't have any clusters assigned to this cluster set yet")}
              message={t('To get started, manage your resource assignments to add a cluster.')}
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
