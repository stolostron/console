/* Copyright Contributors to the Open Cluster Management project */

import { AcmPage, AcmPageHeader, AcmSecondaryNav, AcmSecondaryNavItem } from '../../../ui-components'
import { createContext, ElementType, Fragment, ReactNode, Suspense, useContext, useEffect, useState } from 'react'
import { Link, useLocation, Routes, Route } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../../lib/acm-i18next'
import { DOC_LINKS } from '../../../lib/doc-util'
import { NavigationPath } from '../../../NavigationPath'
import ClusterPoolsPage from './ClusterPools/ClusterPools'
import ClusterSetsPage from './ClusterSets/ClusterSets'
import DiscoveredClustersPage from './DiscoveredClusters/DiscoveredClusters'
import ManagedClusters from './ManagedClusters/ManagedClusters'
import { Flex, FlexItem } from '@patternfly/react-core'
export const PageContext = createContext<{
  readonly actions: null | ReactNode
  setActions: (actions: null | ReactNode) => void
}>({
  actions: null,
  setActions: () => {},
})

export const usePageContext = (showActions: boolean, Component: ElementType, CustomAction?: ElementType) => {
  const { setActions } = useContext(PageContext)

  useEffect(() => {
    if (showActions) {
      setActions(
        <Fragment>
          <Flex>
            {CustomAction && (
              <FlexItem>
                <CustomAction />
              </FlexItem>
            )}
            <FlexItem>
              <Component />
            </FlexItem>
          </Flex>
        </Fragment>
      )
    } else {
      setActions(CustomAction ? <CustomAction /> : null)
    }
    return () => setActions(null)
  }, [showActions, setActions, Component, CustomAction])

  return Component
}

export function ClustersPage() {
  const [actions, setActions] = useState<undefined | ReactNode>(undefined)
  const location = useLocation()
  const { t } = useTranslation()

  return (
    <AcmPage
      hasDrawer
      header={
        <AcmPageHeader
          title={t('page.header.cluster-management')}
          titleTooltip={
            <>
              {t('page.header.cluster-management.tooltip')}
              <a
                href={DOC_LINKS.CLUSTERS}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'block', marginTop: '4px' }}
              >
                {t('learn.more')}
              </a>
            </>
          }
          navigation={
            <AcmSecondaryNav>
              <AcmSecondaryNavItem isActive={location.pathname.startsWith(NavigationPath.managedClusters)}>
                <Link to={NavigationPath.clusters}>{t('Cluster list')}</Link>
              </AcmSecondaryNavItem>
              <AcmSecondaryNavItem isActive={location.pathname.startsWith(NavigationPath.clusterSets)}>
                <Link to={NavigationPath.clusterSets}>{t('Cluster sets')}</Link>
              </AcmSecondaryNavItem>
              <AcmSecondaryNavItem isActive={location.pathname.startsWith(NavigationPath.clusterPools)}>
                <Link to={NavigationPath.clusterPools}>{t('Cluster pools')}</Link>
              </AcmSecondaryNavItem>
              <AcmSecondaryNavItem isActive={location.pathname.startsWith(NavigationPath.discoveredClusters)}>
                <Link to={NavigationPath.discoveredClusters}>{t('Discovered clusters')}</Link>
              </AcmSecondaryNavItem>
            </AcmSecondaryNav>
          }
          actions={actions}
        />
      }
    >
      <PageContext.Provider value={{ actions, setActions }}>
        <Suspense fallback={<Fragment />}>
          <Routes>
            <Route path="/" element={<ManagedClusters />} />
            <Route path="/sets" element={<ClusterSetsPage />} />
            <Route path="/pools" element={<ClusterPoolsPage />} />
            <Route path="/discovered" element={<DiscoveredClustersPage />} />
          </Routes>
        </Suspense>
      </PageContext.Provider>
    </AcmPage>
  )
}
