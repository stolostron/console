/* Copyright Contributors to the Open Cluster Management project */

import { AcmPage, AcmPageHeader, AcmRoute, AcmSecondaryNav, AcmSecondaryNavItem } from '@stolostron/ui-components'
import { Fragment, ReactNode, Suspense, useEffect, useState } from 'react'
import { Link, Route, Switch, useLocation } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { acmRouteState } from '../../atoms'
import { useTranslation } from '../../lib/acm-i18next'
import { NavigationPath } from '../../NavigationPath'
import { PageContext } from '../Infrastructure/Clusters/ClustersPage'
import GovernanceOverview from './overview/Overview'
import PoliciesPage from './policies/Policies'
import PolicySetsPage from './policy-sets/PolicySets'

export default function GovernancePage() {
    const [actions, setActions] = useState<undefined | ReactNode>(undefined)
    const location = useLocation()
    const { t } = useTranslation()

    const [, setRoute] = useRecoilState(acmRouteState)
    useEffect(() => setRoute(AcmRoute.Governance), [setRoute])

    const isOverview = location.pathname == NavigationPath.governance

    return (
        <AcmPage
            hasDrawer
            header={
                <AcmPageHeader
                    title={t('Governance')}
                    titleTooltip={t(
                        'Governance provides an extensible policy framework for enterprises to harden security for software engineering, secure engineering, and resiliency. Enhance your security to meet internal standards by using policies to verify which clusters are at risk'
                    )}
                    popoverAutoWidth={false}
                    popoverPosition="bottom"
                    navigation={
                        <AcmSecondaryNav>
                            <AcmSecondaryNavItem isActive={isOverview}>
                                <Link to={NavigationPath.governance}>{t('Overview')}</Link>
                            </AcmSecondaryNavItem>
                            <AcmSecondaryNavItem
                                isActive={!isOverview && location.pathname.startsWith(NavigationPath.policySets)}
                            >
                                <Link to={NavigationPath.policySets}>{t('Policy sets')}</Link>
                            </AcmSecondaryNavItem>
                            <AcmSecondaryNavItem
                                isActive={!isOverview && location.pathname.startsWith(NavigationPath.policies)}
                            >
                                <Link to={NavigationPath.policies}>{t('Policies')}</Link>
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
                        <Route exact path={NavigationPath.governance} render={() => <GovernanceOverview />} />
                        <Route exact path={NavigationPath.policySets} render={() => <PolicySetsPage />} />
                        <Route exact path={NavigationPath.policies} render={() => <PoliciesPage />} />
                    </Switch>
                </Suspense>
            </PageContext.Provider>
        </AcmPage>
    )
}
