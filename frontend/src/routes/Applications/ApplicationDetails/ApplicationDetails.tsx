/* Copyright Contributors to the Open Cluster Management project */

import { AcmPage, AcmPageHeader, AcmRoute, AcmSecondaryNav, AcmSecondaryNavItem } from '@stolostron/ui-components'
import {
    createContext,
    ElementType,
    Fragment,
    ReactNode,
    Suspense,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { Link, Redirect, Route, RouteComponentProps, Switch, useLocation } from 'react-router-dom'
import { useRecoilCallback, useRecoilState } from 'recoil'
import {
    acmRouteState,
    ansibleJobState,
    applicationSetsState,
    applicationsState,
    argoApplicationsState,
    channelsState,
    managedClustersState,
    placementRulesState,
    placementsState,
    subscriptionReportsState,
    subscriptionsState,
} from '../../../atoms'
import { useTranslation } from '../../../lib/acm-i18next'
import { NavigationPath } from '../../../NavigationPath'
import { ApplicationOverviewPageContent } from './ApplicationOverview/ApplicationOverview'
import { ApplicationTopologyPageContent } from './ApplicationTopology/ApplicationTopology'
import { getApplication } from './ApplicationTopology/model/application'
import { getResourceStatuses } from './ApplicationTopology/model/resourceStatuses'
import { getTopology } from './ApplicationTopology/model/topology'
import { getApplicationData } from './ApplicationTopology/model/utils'

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
    }, [ActionList, setActions])

    return ActionList
}

export type ApplicationDataType = {
    refreshTime: number
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
    const [activeChannel, setActiveChannel] = useState<string>()
    const [applicationData, setApplicationData] = useState<ApplicationDataType>()
    const lastRefreshRef = useRef<any>()

    useEffect(() => setRoute(AcmRoute.Applications), [setRoute])

    const getSnapshot = useRecoilCallback(
        ({ snapshot }) =>
            () =>
                snapshot,
        []
    )

    const urlParams = location.search ? location.search.substring(1).split('&') : []
    let apiVersion: string | undefined
    let cluster: string | undefined
    urlParams.forEach((param) => {
        if (param.startsWith('apiVersion')) {
            apiVersion = param.split('=')[1]
        }
        if (param.startsWith('cluster')) {
            cluster = param.split('=')[1]
        }
    })
    const stateMap = useMemo(
        () => ({
            applications: applicationsState,
            applicationSets: applicationSetsState,
            argoApplications: argoApplicationsState,
            ansibleJob: ansibleJobState,
            channels: channelsState,
            placements: placementsState,
            placementRules: placementRulesState,
            subscriptions: subscriptionsState,
            subscriptionReports: subscriptionReportsState,
            managedClusters: managedClustersState,
        }),
        []
    )

    // refresh application the first time and then every n seconds
    useEffect(() => {
        setApplicationData(undefined)
        lastRefreshRef.current = undefined
        const interval = setInterval(
            (function refresh() {
                ;(async () => {
                    // fetch states from recoil
                    const map: Record<string, any> = {}
                    const snapshot = getSnapshot()
                    const promises = Object.entries(stateMap).map(([key, state]) => {
                        const promise = snapshot.getPromise(state as any)
                        promise.then((data) => {
                            map[key] = data
                        })
                        return promise
                    })
                    await Promise.allSettled(promises)
                    const managedClusters = map['managedClusters']

                    // get application object from recoil states
                    const application = await getApplication(
                        match.params.namespace,
                        match.params.name,
                        activeChannel,
                        map,
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
                            refreshTime: Date.now(),
                            activeChannel: application.activeChannel,
                            allChannels: application.channels,
                            application,
                            topology,
                            appData,
                        })
                    }

                    // from then on, only refresh topology with new statuses
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
                        refreshTime: Date.now(),
                        activeChannel: application.activeChannel,
                        allChannels: application.channels,
                        application,
                        topology: topologyWithRelated,
                        appData: appDataWithStatuses,
                        statuses: resourceStatuses,
                    })
                    lastRefreshRef.current = { application, resourceStatuses, relatedResources }
                })()
                return refresh
            })(),
            10000
        )
        return () => clearInterval(interval)
    }, [activeChannel, apiVersion, cluster, getSnapshot, match.params.name, match.params.namespace, stateMap])

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
