/* Copyright Contributors to the Open Cluster Management project */

import { useContext, useMemo } from 'react'
import { generatePath, Outlet, useLocation, useParams } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { PluginContext } from '../../../../../lib/PluginContext'
import { NavigationPath } from '../../../../../NavigationPath'
import { isGlobalClusterSet } from '../../../../../resources'
import { AcmPage, AcmPageHeader, AcmSecondaryNav } from '../../../../../ui-components'
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

  const navItems = useMemo(() => {
    const items = [
      {
        key: 'clustersets-details-overview',
        title: t('tab.overview'),
        isActive: location.pathname === overviewPath,
        to: overviewPath,
      },
    ]

    if (isSubmarinerAvailable && !isGlobalClusterSet(clusterSet)) {
      items.push({
        key: 'clustersets-details-submariner',
        title: t('tab.submariner'),
        isActive: location.pathname === submarinerPath,
        to: submarinerPath,
      })
    }

    if (!isGlobalClusterSet(clusterSet)) {
      items.push(
        {
          key: 'clustersets-details-clusters',
          title: t('tab.clusters'),
          isActive: location.pathname === clustersPath,
          to: clustersPath,
        },
        {
          key: 'clustersets-details-cluster-pools',
          title: t('tab.clusterPools'),
          isActive: location.pathname === poolsPath,
          to: poolsPath,
        }
      )
    }
    items.push({
      key: 'clustersets-details-user-management',
      title: t('tab.userManagement'),
      isActive: location.pathname === accessPath,
      to: accessPath,
    })

    return items
  }, [
    accessPath,
    clusterSet,
    clustersPath,
    isSubmarinerAvailable,
    location.pathname,
    overviewPath,
    poolsPath,
    submarinerPath,
    t,
  ])

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
          navigation={<AcmSecondaryNav navItems={navItems} />}
        />
      }
    >
      <Outlet context={clusterSetDetailsContext} />
    </AcmPage>
  )
}
