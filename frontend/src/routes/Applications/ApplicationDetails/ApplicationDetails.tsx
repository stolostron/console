/* Copyright Contributors to the Open Cluster Management project */

import { AcmPageHeader, AcmRoute, AcmSecondaryNav, AcmSecondaryNavItem } from '@stolostron/ui-components'

import { AcmPage } from './AcmPage'

import { createContext, Fragment, Suspense, useEffect, useContext, ElementType, ReactNode, useState } from 'react'
import { useTranslation } from '../../../lib/acm-i18next'
import { Link, Route, RouteComponentProps, Switch, Redirect, useLocation } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { acmRouteState } from '../../../atoms'

import { NavigationPath } from '../../../NavigationPath'
import { ApplicationTopologyPageContent } from './ApplicationTopology/ApplicationTopology'
import { ApplicationOverviewPageContent } from './ApplicationOverview/ApplicationOverview'

export const ApplicationContext = createContext<{
    readonly actions: null | ReactNode
    setActions: (actions: null | ReactNode) => void
}>({
    actions: null,
    setActions: () => {},
})

export const useApplicationPageContext = (ActionList: ElementType) => {
    const { setActions } = useContext(ApplicationContext)

    useEffect(() => {
        setActions(<ActionList />)
        return () => setActions(null)
    }, [setActions])

    return ActionList
}

export default function ApplicationDetailsPage({ match }: RouteComponentProps<{ name: string; namespace: string }>) {
    const location = useLocation()
    const [actions, setActions] = useState<undefined | ReactNode>(undefined)
    const { t } = useTranslation()
    const [, setRoute] = useRecoilState(acmRouteState)
    useEffect(() => setRoute(AcmRoute.Applications), [setRoute])

    return (
        <AcmPage
            hasDrawer
            header={
                <AcmPageHeader
                    breadcrumb={[
                        { text: t('Applications'), to: NavigationPath.applications },
                        { text: match.params.name, to: '' },
                    ]}
                    title={match.params.name}
                    navigation={
                        <AcmSecondaryNav>
                            <AcmSecondaryNavItem
                                isActive={
                                    location.pathname ===
                                    NavigationPath.applicationOverview
                                        .replace(':namespace', match.params.namespace as string)
                                        .replace(':name', match.params.name as string)
                                }
                            >
                                <Link
                                    to={NavigationPath.applicationOverview
                                        .replace(':namespace', match.params.namespace as string)
                                        .replace(':name', match.params.name as string)}
                                >
                                    {t('Overview')}
                                </Link>
                            </AcmSecondaryNavItem>
                            <AcmSecondaryNavItem
                                isActive={
                                    location.pathname ===
                                    NavigationPath.applicationTopology
                                        .replace(':namespace', match.params.namespace as string)
                                        .replace(':name', match.params.name as string)
                                }
                            >
                                <Link
                                    to={NavigationPath.applicationTopology
                                        .replace(':namespace', match.params.namespace as string)
                                        .replace(':name', match.params.name as string)}
                                >
                                    {t('Topology')}
                                </Link>
                            </AcmSecondaryNavItem>
                        </AcmSecondaryNav>
                    }
                    actions={actions}
                />
            }
        >
            <ApplicationContext.Provider value={{ actions, setActions }}>
                <Suspense fallback={<Fragment />}>
                    <Switch>
                        <Route exact path={NavigationPath.applicationOverview}>
                            <ApplicationOverviewPageContent />
                        </Route>
                        <Route exact path={NavigationPath.applicationTopology}>
                            <ApplicationTopologyPageContent
                                name={match.params.name}
                                namespace={match.params.namespace}
                            />
                        </Route>
                        <Route exact path={NavigationPath.applicationDetails}>
                            <Redirect
                                to={NavigationPath.applicationTopology
                                    .replace(':namespace', match.params.namespace as string)
                                    .replace(':name', match.params.name as string)}
                            />
                        </Route>
                    </Switch>
                </Suspense>
            </ApplicationContext.Provider>
        </AcmPage>
    )
}
