/* Copyright Contributors to the Open Cluster Management project */

import {
    AcmPage,
    AcmPageHeader,
    AcmRoute,
    AcmSecondaryNav,
    AcmSecondaryNavItem,
} from '@open-cluster-management/ui-components'
import { Fragment, ReactNode, Suspense, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Route, Switch, useLocation } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { acmRouteState, placementBindingsState, policiesState } from '../../atoms'
import { NavigationPath } from '../../NavigationPath'
import { PageContext } from '../Infrastructure/Clusters/ClustersPage'
import GovernanceOverview from './overview/Overview'
import PoliciesPage from './policies/Policies'
import PolicySetsPage from './policy-sets/PolicySets'
import { useGovernanceData } from './useGovernanceData'

export default function GovernancePage() {
    const [actions, setActions] = useState<undefined | ReactNode>(undefined)
    const location = useLocation()
    const { t } = useTranslation(['governance'])

    const [, setRoute] = useRecoilState(acmRouteState)
    useEffect(() => setRoute(AcmRoute.Governance), [setRoute])

    const [policies] = useRecoilState(policiesState)
    const [placementBindings] = useRecoilState(placementBindingsState)
    // const [placementRules] = useRecoilState(placementRulesState)
    const governanceData = useGovernanceData(
        policies.filter(
            (policy) => policy.metadata.labels?.['policy.open-cluster-management.io/root-policy'] === undefined
        ),
        placementBindings
    )

    const isOverview = location.pathname == NavigationPath.governance
    return (
        <AcmPage
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
                            render={() => <GovernanceOverview governanceData={governanceData} />}
                        />
                        <Route
                            exact
                            path={NavigationPath.policies}
                            render={() => <PoliciesPage governanceData={governanceData} />}
                        />
                        <Route exact path={NavigationPath.policySets} render={() => <PolicySetsPage />} />
                    </Switch>
                </Suspense>
            </PageContext.Provider>
        </AcmPage>
    )
}
