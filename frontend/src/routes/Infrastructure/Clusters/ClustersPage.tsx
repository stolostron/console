/* Copyright Contributors to the Open Cluster Management project */

import { createContext, ElementType, Fragment, ReactNode, Suspense, useContext, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../../lib/acm-i18next'
import { DOC_LINKS } from '../../../lib/doc-util'
import { NavigationPath } from '../../../NavigationPath'
import { AcmPage, AcmPageHeader, AcmSecondaryNav } from '../../../ui-components'
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
          <div>
            {CustomAction && <CustomAction />}
            <Component />
          </div>
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
            <AcmSecondaryNav
              navItems={[
                {
                  key: 'infra-cluster-list',
                  title: t('Cluster list'),
                  isActive: location.pathname.startsWith(NavigationPath.managedClusters),
                  to: NavigationPath.clusters,
                },
                {
                  key: 'infra-cluster-sets',
                  title: t('Cluster sets'),
                  isActive: location.pathname.startsWith(NavigationPath.clusterSets),
                  to: NavigationPath.clusterSets,
                },
                {
                  key: 'infra-cluster-pools',
                  title: t('Cluster pools'),
                  isActive: location.pathname.startsWith(NavigationPath.clusterPools),
                  to: NavigationPath.clusterPools,
                },
                {
                  key: 'infra-discovered-clusters',
                  title: t('Discovered clusters'),
                  isActive: location.pathname.startsWith(NavigationPath.discoveredClusters),
                  to: NavigationPath.discoveredClusters,
                },
              ]}
            />
          }
          actions={actions}
        />
      }
    >
      <PageContext.Provider value={{ actions, setActions }}>
        <Suspense fallback={<Fragment />}>
          <Outlet />
        </Suspense>
      </PageContext.Provider>
    </AcmPage>
  )
}
