/* Copyright Contributors to the Open Cluster Management project */

import {
    AcmActionGroup,
    AcmPage,
    AcmPageHeader,
    AcmRoute,
    AcmSecondaryNav,
    AcmSecondaryNavItem,
} from '@stolostron/ui-components'
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
import { Link, Redirect, Route, RouteComponentProps, Switch, useHistory, useLocation } from 'react-router-dom'
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
import { RbacDropdown } from '../../../components/Rbac'
import { useTranslation } from '../../../lib/acm-i18next'
import { canUser, rbacPatch } from '../../../lib/rbac-util'
import { NavigationPath } from '../../../NavigationPath'
import {
    Application,
    ApplicationDefinition,
    ApplicationKind,
    ApplicationSetDefinition,
    ApplicationSetKind,
} from '../../../resources'
import { DeleteResourceModal, IDeleteResourceModalProps } from '../components/DeleteResourceModal'
import { getAppChildResources, getAppSetRelatedResources, getSearchLink } from '../helpers/resource-helper'
import { getAppSetApps } from '../Overview'
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

const namespaceString = ':namespace'
const nameString = ':name'

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
    const { t } = useTranslation()
    const [, setRoute] = useRecoilState(acmRouteState)
    const [applicationSets] = useRecoilState(applicationSetsState)
    const [applications] = useRecoilState(applicationsState)
    const [argoApplications] = useRecoilState(argoApplicationsState)
    const [subscriptions] = useRecoilState(subscriptionsState)
    const [channels] = useRecoilState(channelsState)
    const [placementRules] = useRecoilState(placementRulesState)
    const [activeChannel, setActiveChannel] = useState<string>()
    const [applicationData, setApplicationData] = useState<ApplicationDataType>()
    const [modalProps, setModalProps] = useState<IDeleteResourceModalProps | { open: false }>({
        open: false,
    })
    const [canDeleteApplication, setCanDeleteApplication] = useState<boolean>(false)
    const [canDeleteApplicationSet, setCanDeleteApplicationSet] = useState<boolean>(false)

    const lastRefreshRef = useRef<any>()
    const history = useHistory()
    const isArgoApp = applicationData?.application.isArgoApp
    const isAppSet = applicationData?.application.isAppSet

    let modalWarnings: string

    const actions: any = [
        {
            id: 'search-application',
            text: t('Search application'),
            click: () => {
                if (applicationData) {
                    const [apigroup, apiversion] = applicationData.application.app.apiVersion.split('/')
                    const searchLink = getSearchLink({
                        properties: {
                            name: applicationData?.application.app.metadata?.name,
                            namespace: applicationData?.application.app.metadata?.namespace,
                            kind: applicationData?.application.app.kind.toLowerCase(),
                            apigroup: apigroup as string,
                            apiversion: apiversion as string,
                        },
                    })
                    history.push(searchLink)
                }
            },
        },
    ]

    if (!isArgoApp) {
        const selectedApp = applicationData?.application.app
        actions.push({
            id: 'edit-application',
            text: t('Edit application'),
            click: () => {
                if (isAppSet) {
                    history.push(
                        NavigationPath.editApplicationArgo
                            .replace(namespaceString, selectedApp.metadata?.namespace)
                            .replace(nameString, selectedApp.metadata?.name)
                    )
                } else {
                    history.push(
                        NavigationPath.editApplicationSubscription
                            .replace(namespaceString, selectedApp.metadata?.namespace)
                            .replace(nameString, selectedApp.metadata?.name)
                    )
                }
            },
            rbac: [
                selectedApp &&
                    rbacPatch(selectedApp, selectedApp?.metadata.namespace ?? '', selectedApp?.metadata.name ?? ''),
            ],
        })
        actions.push({
            id: 'delete-application',
            text: t('Delete application'),
            click: () => {
                const appChildResources =
                    selectedApp.kind === ApplicationKind
                        ? getAppChildResources(selectedApp, applications, subscriptions, placementRules, channels)
                        : [[], []]
                const appSetRelatedResources =
                    selectedApp.kind === ApplicationSetKind
                        ? getAppSetRelatedResources(selectedApp, applicationSets)
                        : ['', []]
                setModalProps({
                    open: true,
                    canRemove: selectedApp.kind === ApplicationSetKind ? canDeleteApplicationSet : canDeleteApplication,
                    resource: selectedApp,
                    errors: undefined,
                    warnings: modalWarnings,
                    loading: false,
                    selected: appChildResources[0], // children
                    shared: appChildResources[1], // shared children
                    appSetPlacement: appSetRelatedResources[0],
                    appSetsSharingPlacement: appSetRelatedResources[1],
                    appKind: selectedApp.kind,
                    appSetApps: getAppSetApps(argoApplications, selectedApp.metadata?.name),
                    close: () => {
                        setModalProps({ open: false })
                    },
                    t,
                    redirect: NavigationPath.applications,
                })
            },
        })
    }

    useEffect(() => setRoute(AcmRoute.Applications), [setRoute])

    useEffect(() => {
        const canDeleteApplicationPromise = canUser('delete', ApplicationDefinition)
        canDeleteApplicationPromise.promise
            .then((result) => setCanDeleteApplication(result.status?.allowed!))
            .catch((err) => console.error(err))
        return () => canDeleteApplicationPromise.abort()
    }, [])
    useEffect(() => {
        const canDeleteApplicationSetPromise = canUser('delete', ApplicationSetDefinition)
        canDeleteApplicationSetPromise.promise
            .then((result) => setCanDeleteApplicationSet(result.status?.allowed!))
            .catch((err) => console.error(err))
        return () => canDeleteApplicationSetPromise.abort()
    }, [])

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
                                        .replace(namespaceString, match.params.namespace)
                                        .replace(nameString, match.params.name)
                                }
                            >
                                <Link
                                    to={
                                        NavigationPath.applicationOverview
                                            .replace(namespaceString, match.params.namespace)
                                            .replace(nameString, match.params.name) + location.search
                                    }
                                >
                                    {t('Overview')}
                                </Link>
                            </AcmSecondaryNavItem>
                            <AcmSecondaryNavItem
                                isActive={
                                    location.pathname ===
                                    NavigationPath.applicationTopology
                                        .replace(namespaceString, match.params.namespace)
                                        .replace(nameString, match.params.name)
                                }
                            >
                                <Link
                                    to={
                                        NavigationPath.applicationTopology
                                            .replace(namespaceString, match.params.namespace)
                                            .replace(nameString, match.params.name) + location.search
                                    }
                                >
                                    {t('Topology')}
                                </Link>
                            </AcmSecondaryNavItem>
                        </AcmSecondaryNav>
                    }
                    actions={
                        <AcmActionGroup>
                            {[
                                <RbacDropdown<Application>
                                    id={`${applicationData?.application.app?.metadata.name ?? 'app'}-actions`}
                                    item={applicationData?.application.app}
                                    isKebab={false}
                                    text={t('actions')}
                                    actions={actions}
                                />,
                            ]}
                        </AcmActionGroup>
                    }
                />
            }
        >
            <DeleteResourceModal {...modalProps} />
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
                                    .replace(namespaceString, match.params.namespace)
                                    .replace(nameString, match.params.name) + location.search
                            }
                        />
                    </Route>
                </Switch>
            </Suspense>
        </AcmPage>
    )
}
