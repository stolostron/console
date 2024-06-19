/* Copyright Contributors to the Open Cluster Management project */

import { AcmPage, AcmPageHeader, AcmSecondaryNav, AcmSecondaryNavItem } from '../../../../../ui-components'
import { useContext } from 'react'
import { Link, useLocation, useParams, Outlet, generatePath } from 'react-router-dom-v5-compat'
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
  const { isSubmarinerAvailable } = useContext(PluginContext)

  const clusterSetDetailsContext = useClusterSetDetailsContext()
  const { clusterSet } = clusterSetDetailsContext

  const overviewPath = generatePath(NavigationPath.clusterSetOverview, { id })
  const submarinerPath = generatePath(NavigationPath.clusterSetSubmariner, { id })
  const clustersPath = generatePath(NavigationPath.clusterSetClusters, { id })
  const poolsPath = generatePath(NavigationPath.clusterSetClusterPools, { id })
  const accessPath = generatePath(NavigationPath.clusterSetAccess, { id })

  return (
    <AcmPage
      hasDrawer
      header={
        <AcmPageHeader
          breadcrumb={[
            { text: t('clusterSets'), to: NavigationPath.clusterSets },
            { text: id, to: '' },
          ]}
          title={id}
          actions={<ClusterSetActionDropdown managedClusterSet={clusterSet} isKebab={false} />}
          navigation={
            <AcmSecondaryNav>
              <AcmSecondaryNavItem isActive={location.pathname === overviewPath}>
                <Link to={overviewPath}>{t('tab.overview')}</Link>
              </AcmSecondaryNavItem>
              {isSubmarinerAvailable && !isGlobalClusterSet(clusterSet) && (
                <AcmSecondaryNavItem isActive={location.pathname === submarinerPath}>
                  <Link to={submarinerPath}>{t('tab.submariner')}</Link>
                </AcmSecondaryNavItem>
              )}
              {!isGlobalClusterSet(clusterSet) && (
                <AcmSecondaryNavItem isActive={location.pathname === clustersPath}>
                  <Link to={clustersPath}>{t('tab.clusters')}</Link>
                </AcmSecondaryNavItem>
              )}
              {!isGlobalClusterSet(clusterSet) && (
                <AcmSecondaryNavItem isActive={location.pathname === poolsPath}>
                  <Link to={poolsPath}>{t('tab.clusterPools')}</Link>
                </AcmSecondaryNavItem>
              )}
              <AcmSecondaryNavItem isActive={location.pathname === accessPath}>
                <Link to={accessPath}>{t('tab.userManagement')}</Link>
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
