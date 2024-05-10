/* Copyright Contributors to the Open Cluster Management project */

import { AcmPage, AcmPageHeader, AcmSecondaryNav, AcmSecondaryNavItem } from '../../../../../ui-components'
import { useContext } from 'react'
import { Link, useLocation, useParams, Outlet } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { PluginContext } from '../../../../../lib/PluginContext'
import { NavigationPath } from '../../../../../NavigationPath'
import { isGlobalClusterSet } from '../../../../../resources'
import { ClusterSetActionDropdown } from '../components/ClusterSetActionDropdown'
import { useClusterSetDetailsContext } from './ClusterSetDetails'

export default function ClusterSetDetailsPage() {
  const location = useLocation()
  const { t } = useTranslation()
  const { id = '' } = useParams()
  const match = { params: { id } }
  const { isSubmarinerAvailable } = useContext(PluginContext)

  const clusterSetDetailsContext = useClusterSetDetailsContext()
  const { clusterSet } = clusterSetDetailsContext

  return (
    <AcmPage
      hasDrawer
      header={
        <AcmPageHeader
          breadcrumb={[
            { text: t('clusterSets'), to: NavigationPath.clusterSets },
            { text: match.params.id, to: '' },
          ]}
          title={match.params.id}
          actions={<ClusterSetActionDropdown managedClusterSet={clusterSet} isKebab={false} />}
          navigation={
            <AcmSecondaryNav>
              <AcmSecondaryNavItem
                isActive={location.pathname === NavigationPath.clusterSetOverview.replace(':id', match.params.id)}
              >
                <Link to={NavigationPath.clusterSetOverview.replace(':id', match.params.id)}>{t('tab.overview')}</Link>
              </AcmSecondaryNavItem>
              {isSubmarinerAvailable && !isGlobalClusterSet(clusterSet) && (
                <AcmSecondaryNavItem
                  isActive={location.pathname === NavigationPath.clusterSetSubmariner.replace(':id', match.params.id)}
                >
                  <Link to={NavigationPath.clusterSetSubmariner.replace(':id', match.params.id)}>
                    {t('tab.submariner')}
                  </Link>
                </AcmSecondaryNavItem>
              )}
              {!isGlobalClusterSet(clusterSet) && (
                <AcmSecondaryNavItem
                  isActive={location.pathname === NavigationPath.clusterSetClusters.replace(':id', match.params.id)}
                >
                  <Link to={NavigationPath.clusterSetClusters.replace(':id', match.params.id)}>
                    {t('tab.clusters')}
                  </Link>
                </AcmSecondaryNavItem>
              )}
              {!isGlobalClusterSet(clusterSet) && (
                <AcmSecondaryNavItem
                  isActive={location.pathname === NavigationPath.clusterSetClusterPools.replace(':id', match.params.id)}
                >
                  <Link to={NavigationPath.clusterSetClusterPools.replace(':id', match.params.id)}>
                    {t('tab.clusterPools')}
                  </Link>
                </AcmSecondaryNavItem>
              )}
              <AcmSecondaryNavItem
                isActive={location.pathname === NavigationPath.clusterSetAccess.replace(':id', match.params.id)}
              >
                <Link to={NavigationPath.clusterSetAccess.replace(':id', match.params.id)}>
                  {t('tab.userManagement')}
                </Link>
              </AcmSecondaryNavItem>
            </AcmSecondaryNav>
          }
        />
      }
    >
      <Outlet context={clusterSetDetailsContext} />
    </AcmPage>
  )
}
