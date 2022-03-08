/* Copyright Contributors to the Open Cluster Management project */

import { AcmPageHeader, AcmRoute, AcmSecondaryNav, AcmSecondaryNavItem } from '@stolostron/ui-components'

import { AcmPage } from '@stolostron/ui-components'
import {
    applicationsState,
    applicationSetsState,
    argoApplicationsState,
    ansibleJobState,
    subscriptionsState,
    channelsState,
    placementsState,
    placementRulesState,
    subscriptionReportsState,
    managedClustersState,
} from '../../../atoms'

import {
    createContext,
    Fragment,
    Suspense,
    useEffect,
    useContext,
    ElementType,
    ReactNode,
    useState,
    useRef,
} from 'react'
import { useTranslation } from '../../../lib/acm-i18next'
import { Link, Route, RouteComponentProps, Switch, Redirect, useLocation } from 'react-router-dom'
import { useRecoilState, useRecoilCallback } from 'recoil'
import { acmRouteState } from '../../../atoms'

import { NavigationPath } from '../../../NavigationPath'
import { ApplicationTopologyPageContent } from './ApplicationTopology/ApplicationTopology'
import { ApplicationOverviewPageContent } from './ApplicationOverview/ApplicationOverview'

import { getApplication } from './ApplicationTopology/model/application'
import { getTopology } from './ApplicationTopology/model/topology'
import { getApplicationData } from './ApplicationTopology/model/utils'
import { getResourceStatuses } from './ApplicationTopology/model/resourceStatuses'

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

export type ApplicationDataType = {
    activeChannel: string | undefined
    allChannels: [string] | undefined
    application: any
    appData: any
    topology: any
    statuses?: any
}

export default function ApplicationDetailsPage({ match }: RouteComponentProps<{ name: string; namespace: string }>) {
    const location = useLocation()
    const [actions, setActions] = useState<undefined | ReactNode>(undefined)
    const { t } = useTranslation()
    const [, setRoute] = useRecoilState(acmRouteState)
    const [applications] = useRecoilState(applicationsState)
    const [applicationSets] = useRecoilState(applicationSetsState)
    const [argoApplications] = useRecoilState(argoApplicationsState)
    const [ansibleJob] = useRecoilState(ansibleJobState)
    const [channels] = useRecoilState(channelsState)
    const [placements] = useRecoilState(placementsState)
    const [placementRules] = useRecoilState(placementRulesState)
    const [subscriptionReports] = useRecoilState(subscriptionReportsState)
    const [managedClusters] = useRecoilState(managedClustersState)
    const [activeChannel, setActiveChannel] = useState<string>()
    const [applicationData, setApplicationData] = useState<ApplicationDataType>()
    const lastRefreshRef = useRef<any>()

    useEffect(() => setRoute(AcmRoute.Applications), [setRoute])

    // any recoil resources that constantly update because of a time stamp
    const getSubscriptions = useRecoilCallback(
        ({ snapshot }) =>
            () =>
                snapshot.getPromise(subscriptionsState),
        []
    )

    const urlParams = location.search ? location.search.substring(1).split('&') : []
    let apiVersion: string
    let cluster: string
    urlParams.forEach((param) => {
        if (param.startsWith('apiVersion')) {
            apiVersion = param.split('=')[1]
        }
        if (param.startsWith('cluster')) {
            cluster = param.split('=')[1]
        }
    })

    // refresh application the first time and then every n seconds
    useEffect(() => {
        setApplicationData(undefined)
        lastRefreshRef.current = undefined
        const interval = setInterval(
            (function refresh() {
                ;(async () => {
                    const subscriptions = await getSubscriptions()
                    // get application object from recoil states
                    const application = getApplication(
                        match.params.namespace,
                        match.params.name,
                        activeChannel,
                        {
                            applications,
                            applicationSets,
                            argoApplications,
                            ansibleJob,
                            subscriptions,
                            channels,
                            subscriptionReports,
                            placements,
                            placementRules,
                            managedClusters,
                        },
                        cluster,
                        apiVersion
                    )
                    const topology = getTopology(
                        application,
                        managedClusters,
                        lastRefreshRef?.current?.relatedResources,
                        { cluster }
                    )
                    const appData = getApplicationData(topology.nodes)

                    // when first opened, refresh topology with wait statuses
                    if (!lastRefreshRef?.current?.resourceStatuses) {
                        setApplicationData({
                            activeChannel: application.activeChannel,
                            allChannels: application.channels,
                            application,
                            topology,
                            appData,
                        })
                    }

                    // from then on, only refresh topology with new statuses
                    ;(async () => {
                        const { resourceStatuses, relatedResources, appDataWithStatuses } = await getResourceStatuses(
                            application,
                            appData,
                            topology,
                            lastRefreshRef.current
                        )
                        const topologyWithRelated = getTopology(application, managedClusters, relatedResources, {
                            topology,
                            cluster,
                        })
                        setApplicationData({
                            activeChannel: application.activeChannel,
                            allChannels: application.channels,
                            application,
                            topology: topologyWithRelated,
                            appData: appDataWithStatuses,
                            statuses: resourceStatuses,
                        })
                        lastRefreshRef.current = { application, resourceStatuses, relatedResources }
                    })()
                })()
                return refresh
            })(),
            10000
        )
        return () => clearInterval(interval)
    }, [activeChannel])

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
                                    to={
                                        NavigationPath.applicationOverview
                                            .replace(':namespace', match.params.namespace as string)
                                            .replace(':name', match.params.name as string) + location.search
                                    }
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
                                    to={
                                        NavigationPath.applicationTopology
                                            .replace(':namespace', match.params.namespace as string)
                                            .replace(':name', match.params.name as string) + location.search
                                    }
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
                            <ApplicationOverviewPageContent applicationData={applicationData} />
                        </Route>
                        <Route exact path={NavigationPath.applicationTopology}>
                            <ApplicationTopologyPageContent
                                applicationData={applicationData}
                                setActiveChannel={setActiveChannel}
                            />
                        </Route>
                        <Route exact path={NavigationPath.applicationDetails}>
                            <Redirect
                                to={
                                    NavigationPath.applicationOverview
                                        .replace(':namespace', match.params.namespace as string)
                                        .replace(':name', match.params.name as string) + location.search
                                }
                            />
                        </Route>
                    </Switch>
                </Suspense>
            </ApplicationContext.Provider>
        </AcmPage>
    )
}
