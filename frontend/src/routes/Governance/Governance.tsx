/* Copyright Contributors to the Open Cluster Management project */

import {
    AcmPage,
    AcmPageHeader,
    AcmRoute,
    AcmSecondaryNav,
    AcmSecondaryNavItem,
} from '@open-cluster-management/ui-components'
import { Fragment, lazy, ReactNode, Suspense, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Route, Switch, useLocation } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { acmRouteState, placementBindingsState, placementRulesState, policiesState } from '../../atoms'
import { NavigationPath } from '../../NavigationPath'
import { PageContext } from '../Infrastructure/Clusters/Clusters'
import { useGovernanceData } from './useGovernanceData'

const OverviewPage = lazy(() => import('./overview/Overview'))
const PoliciesPage = lazy(() => import('./policies/Policies'))
const PolicySetsPage = lazy(() => import('./policy-sets/PolicySets'))

export default function GovernancePage() {
    const [actions, setActions] = useState<undefined | ReactNode>(undefined)
    const location = useLocation()
    const { t } = useTranslation(['governance'])

    const [, setRoute] = useRecoilState(acmRouteState)
    useEffect(() => setRoute(AcmRoute.Governance), [setRoute])

    const [policies] = useRecoilState(policiesState)
    const [placementBindings] = useRecoilState(placementBindingsState)
    const [placementRules] = useRecoilState(placementRulesState)
    const governanceData = useGovernanceData(
        policies.filter(
            (policy) => policy.metadata.labels?.['policy.open-cluster-management.io/root-policy'] === undefined
        ),
        placementBindings,
        placementRules
    )

    const isOverview = location.pathname == NavigationPath.governance
    return (
        <AcmPage
            hasDrawer
            header={
                <AcmPageHeader
                    title={t('Governance')}
                    navigation={
                        <AcmSecondaryNav>
                            <AcmSecondaryNavItem isActive={isOverview}>
                                <Link to={NavigationPath.governance}>{t('Overview')}</Link>
                            </AcmSecondaryNavItem>
                            <AcmSecondaryNavItem
                                isActive={!isOverview && location.pathname.startsWith(NavigationPath.policies)}
                            >
                                <Link to={NavigationPath.policies}>{t('Policies')}</Link>
                            </AcmSecondaryNavItem>
                            <AcmSecondaryNavItem
                                isActive={!isOverview && location.pathname.startsWith(NavigationPath.policySets)}
                            >
                                <Link to={NavigationPath.policySets}>{t('Policy Sets')}</Link>
                            </AcmSecondaryNavItem>
                        </AcmSecondaryNav>
                    }
                    actions={actions}
                />
            }
        >
            <PageContext.Provider value={{ actions, setActions }}>
                <Suspense fallback={<Fragment />}>
                    <Switch>
                        <Route
                            exact
                            path={NavigationPath.governance}
                            render={() => <OverviewPage governanceData={governanceData} />}
                        />
                        <Route
                            exact
                            path={NavigationPath.policies}
                            render={() => <PoliciesPage governanceData={governanceData} />}
                        />
                        <Route
                            exact
                            path={NavigationPath.policySets}
                            render={() => <PolicySetsPage governanceData={governanceData} />}
                        />
                    </Switch>
                </Suspense>
            </PageContext.Provider>
        </AcmPage>
    )
}
