/* Copyright Contributors to the Open Cluster Management project */

import {
    AcmAlertGroup,
    AcmAlertProvider,
    AcmErrorBoundary,
    AcmPage,
    AcmPageHeader,
    AcmScrollable,
    AcmSecondaryNav,
    AcmSecondaryNavItem,
} from '@open-cluster-management/ui-components'
import { PageSection } from '@patternfly/react-core'
import { createContext, ElementType, Fragment, lazy, ReactNode, Suspense, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Redirect, Route, Switch, useLocation } from 'react-router-dom'
import { AppContext } from '../../components/AppContext'
import { DOC_LINKS } from '../../lib/doc-util'
import { NavigationPath } from '../../NavigationPath'

const ClustersPage = lazy(() => import('./Clusters/Clusters'))
const DiscoveredClustersPage = lazy(() => import('./DiscoveredClusters/DiscoveredClusters'))
const BareMetalAssetsPage = lazy(() => import('../BareMetalAssets/BareMetalAssetsPage'))

export const PageContext = createContext<{
    readonly actions: null | ReactNode
    setActions: (actions: null | ReactNode) => void
}>({
    actions: null,
    setActions: () => {},
})

export const usePageContext = (showActions: boolean, Component: ElementType) => {
    const { setActions } = useContext(PageContext)

    useEffect(() => {
        if (showActions) {
            setActions(<Component />)
        } else {
            setActions(null)
        }
        return () => setActions(null)
    }, [showActions, setActions, Component])

    return Component
}

export default function ClusterManagementPage() {
    const [actions, setActions] = useState<undefined | ReactNode>(undefined)
    const location = useLocation()
    const { t } = useTranslation(['cluster', 'bma'])
    const { featureGates } = useContext(AppContext)

    return (
        <AcmAlertProvider>
            <AcmPage hasDrawer>
                <PageContext.Provider value={{ actions, setActions }}>
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
                                    {t('common:learn.more')}
                                </a>
                            </>
                        }
                        navigation={
                            <AcmSecondaryNav>
                                <AcmSecondaryNavItem isActive={location.pathname.startsWith(NavigationPath.clusters)}>
                                    <Link to={NavigationPath.clusters}>{t('cluster:clusters')}</Link>
                                </AcmSecondaryNavItem>
                                {featureGates['open-cluster-management-discovery'] && (
                                    <AcmSecondaryNavItem
                                        isActive={location.pathname.startsWith(NavigationPath.discoveredClusters)}
                                    >
                                        <Link to={NavigationPath.discoveredClusters}>
                                            {t('cluster:clusters.discovered')}
                                        </Link>
                                    </AcmSecondaryNavItem>
                                )}
                                <AcmSecondaryNavItem
                                    isActive={location.pathname.startsWith(NavigationPath.bareMetalAssets)}
                                >
                                    <Link to={NavigationPath.bareMetalAssets}>{t('bma:bmas')}</Link>
                                </AcmSecondaryNavItem>
                            </AcmSecondaryNav>
                        }
                        actions={actions}
                    />
                    <AcmErrorBoundary>
                        <AcmScrollable borderTop>
                            <PageSection variant="light" padding={{ default: 'noPadding' }}>
                                <AcmAlertGroup isInline canClose alertMargin="0px 0px 8px 0px" />
                            </PageSection>
                            <Suspense fallback={<Fragment />}>
                                <Switch>
                                    <Route exact path={NavigationPath.clusters} component={ClustersPage} />
                                    {featureGates['open-cluster-management-discovery'] && (
                                        <Route
                                            exact
                                            path={NavigationPath.discoveredClusters}
                                            component={DiscoveredClustersPage}
                                        />
                                    )}
                                    <Route
                                        exact
                                        path={NavigationPath.bareMetalAssets}
                                        component={BareMetalAssetsPage}
                                    />
                                    <Route exact path={NavigationPath.console}>
                                        <Redirect to={NavigationPath.clusters} />
                                    </Route>
                                </Switch>
                            </Suspense>
                        </AcmScrollable>
                    </AcmErrorBoundary>
                </PageContext.Provider>
            </AcmPage>
        </AcmAlertProvider>
    )
}
