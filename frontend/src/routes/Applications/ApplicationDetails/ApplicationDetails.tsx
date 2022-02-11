/* Copyright Contributors to the Open Cluster Management project */

import { AcmPageHeader, AcmRoute, AcmSecondaryNav, AcmSecondaryNavItem } from '@stolostron/ui-components'

import { AcmPage } from './AcmPage'

import { createContext, Fragment, Suspense, useEffect, useContext, ElementType, ReactNode, useState } from 'react'
import { useTranslation } from '../../../lib/acm-i18next'
import { Link, Route, RouteComponentProps, Switch, Redirect, useLocation } from 'react-router-dom'
import { atom,  useRecoilState } from 'recoil'
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

export const applicationState = atom<any>({ key: 'application', default: '' as any })

export default function ApplicationDetailsPage({ match }: RouteComponentProps<{ name: string; namespace: string }>) {
    const location = useLocation()
    const [actions, setActions] = useState<undefined | ReactNode>(undefined)
    const { t } = useTranslation()
    const [, setRoute] = useRecoilState(acmRouteState)
    const [, setApplication] = useRecoilState(applicationState)

    useEffect(() => setRoute(AcmRoute.Applications), [setRoute])

    // refresh application the first time and then every n seconds
    useEffect(() => {
        const interval = setInterval(
            (function refresh() {
                // application is refreshed with recoil states and old statues (if any from last pass)
                // if no old statuses, nodes are shown with waiting statuses
                const { application, appData, topology } =
                    refreshApplication(lastRefreshRef.current?.resourceStatuses) || {}
                if (application && appData && topology) {
                    // then application is refreshed with new statuses
                    ;(async () => {
                        const resourceStatuses = await getResourceStatuses(
                            application,
                            appData,
                            topology,
                            lastRefreshRef.current
                        )
                        refreshApplication(resourceStatuses)
                        lastRefreshRef.current = { application, resourceStatuses }
                        setCanUpdateStatuses(true)
                    })()
                }
                return refresh
            })(),
            10000
        )
        return () => clearInterval(interval)
    }, [])
    
    const refreshApplication = (resourceStatuses: any) => {
        // use recoil states to get application
        const application = getApplication(props.namespace, props.name, activeChannel, {
            applications,
            applicationSets,
            argoApplications,
            ansibleJob,
            subscriptions,
            channels,
            subscriptionReports,
            placements,
            placementRules,
        })
        if (application) {
            setActiveChannel(application.activeChannel)
            setAllChannels(application.channels)
            const topology = getTopology(application, managedClusters, resourceStatuses?.relatedResources)
            const appData = getApplicationData(topology.nodes)

            // create topology elements with statuses provided by searches
            setElements(
                getDiagramElements(appData, topology, resourceStatuses?.resourceStatuses, !!resourceStatuses, t)
            )
            return { application, appData, topology }
        }
    }




    useEffect(() => {
        const interval = setInterval(
            (function refresh() {

                const today = new Date();
                const date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
                const time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
                const dateTime = date+' '+time;
                setApplication(dateTime)

                // // application is refreshed with recoil states and old statues (if any from last pass)
                // // if no old statuses, nodes are shown with waiting statuses
                // const { application, appData, topology } =
                //     refreshApplication(lastRefreshRef.current?.resourceStatuses) || {}
                // if (application && appData && topology) {
                //     // then application is refreshed with new statuses
                //     ;(async () => {
                //         const resourceStatuses = await getResourceStatuses(
                //             application,
                //             appData,
                //             topology,
                //             lastRefreshRef.current
                //         )
                //         refreshApplication(resourceStatuses)
                //         lastRefreshRef.current = { application, resourceStatuses }
                //         setCanUpdateStatuses(true)
                //     })()
                // }
                return refresh
            })(),
            10000
        )
        return () => clearInterval(interval)
    }, [])



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
                            <ApplicationOverviewPageContent
                                name={match.params.name}
                                namespace={match.params.namespace}
                            />
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
