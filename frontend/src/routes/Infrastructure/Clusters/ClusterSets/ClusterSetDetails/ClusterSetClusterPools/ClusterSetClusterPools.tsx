/* Copyright Contributors to the Open Cluster Management project */

import { ManagedClusterSetDefinition, isGlobalClusterSet } from '../../../../../../resources'
import { AcmEmptyState, AcmPageContent } from '../../../../../../ui-components'
import { PageSection } from '@patternfly/react-core'
import { Trans, useTranslation } from '../../../../../../lib/acm-i18next'
import { Link } from 'react-router-dom-v5-compat'
import { RbacButton } from '../../../../../../components/Rbac'
import { rbacCreate } from '../../../../../../lib/rbac-util'
import { getBackCancelLocationLinkProps, NavigationPath, SubRoutesRedirect } from '../../../../../../NavigationPath'
import { ClusterPoolsTable } from '../../../ClusterPools/ClusterPools'
import { useClusterSetDetailsContext } from '../ClusterSetDetails'

export function ClusterSetClusterPoolsPageContent() {
  const { t } = useTranslation()
  const { clusters, clusterSet, clusterPools } = useClusterSetDetailsContext()

  if (isGlobalClusterSet(clusterSet)) {
    return (
      <SubRoutesRedirect matchPath={NavigationPath.clusterSetDetails} targetPath={NavigationPath.clusterSetOverview} />
    )
  }

  return (
    <AcmPageContent id="cluster-pools">
      <PageSection>
        <ClusterPoolsTable
          clusterPools={clusterPools}
          clusters={clusters}
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
                  {...getBackCancelLocationLinkProps({
                    pathname: NavigationPath.createClusterPool,
                    search: `?clusterSet=${clusterSet.metadata.name}`,
                  })}
                  variant="primary"
                  rbac={[rbacCreate(ManagedClusterSetDefinition, undefined, clusterSet.metadata.name, 'join')]}
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
