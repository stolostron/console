/* Copyright Contributors to the Open Cluster Management project */

import { ApolloError } from '@apollo/client'
import { Alert } from '@patternfly/react-core'
import { TFunction } from 'i18next'
import {
    createContext,
    ElementType,
    Fragment,
    ReactNode,
    Suspense,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { Link, Redirect, Route, RouteComponentProps, Switch, useHistory, useLocation } from 'react-router-dom'
import { useRecoilCallback } from 'recoil'
import {
    ansibleJobState,
    applicationSetsState,
    applicationsState,
    argoApplicationsState,
    channelsState,
    placementRulesState,
    placementsState,
    subscriptionReportsState,
    subscriptionsState,
    THROTTLE_EVENTS_DELAY,
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
import {
    AcmActionGroup,
    AcmAlert,
    AcmLoadingPage,
    AcmPage,
    AcmPageHeader,
    AcmSecondaryNav,
    AcmSecondaryNavItem,
} from '../../../ui-components'
import { searchClient } from '../../Home/Search/search-sdk/search-client'
import { useSearchCompleteQuery } from '../../Home/Search/search-sdk/search-sdk'
import { useAllClusters } from '../../Infrastructure/Clusters/ManagedClusters/components/useAllClusters'
import { DeleteResourceModal, IDeleteResourceModalProps } from '../components/DeleteResourceModal'
import {
    getAppChildResources,
    getAppSetRelatedResources,
    getSearchLink,
    isResourceTypeOf,
} from '../helpers/resource-helper'
import { getAppSetApps } from '../Overview'
import { PluginContext } from '../../../lib/PluginContext'
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

function searchError(completeError: ApolloError | undefined, t: TFunction) {
    if (completeError && completeError.message.includes('not enabled')) {
        return (
            <AcmAlert
                noClose
                variant="info"
                isInline
                title={t('Info')}
                subtitle={`${completeError?.message} ${t('Enable search to display application statuses properly.')}`}
            />
        )
    }
}

export default function ApplicationDetailsPage({ match }: RouteComponentProps<{ name: string; namespace: string }>) {
    const location = useLocation()
    const { t } = useTranslation()
    const [waitForApplication, setWaitForApplication] = useState<boolean>(true)
    const [applicationNotFound, setApplicationNotFound] = useState<boolean>(false)
    const [activeChannel, setActiveChannel] = useState<string>()
    const [applicationData, setApplicationData] = useState<ApplicationDataType>()
    const [modalProps, setModalProps] = useState<IDeleteResourceModalProps | { open: false }>({
        open: false,
    })
    const [canDeleteApplication, setCanDeleteApplication] = useState<boolean>(false)
    const [canDeleteApplicationSet, setCanDeleteApplicationSet] = useState<boolean>(false)
    const [pluginModal, setPluginModal] = useState<JSX.Element>()
    const { acmExtensions } = useContext(PluginContext)

    const lastRefreshRef = useRef<any>()
    const history = useHistory()
    const isArgoApp = applicationData?.application?.isArgoApp
    const isAppSet = applicationData?.application?.isAppSet
    const isOCPApp = applicationData?.application?.isOCPApp
    const isFluxApp = applicationData?.application?.isFluxApp
    let clusters = useAllClusters()
    clusters = clusters.filter((cluster) => {
        // don't show clusters in cluster pools in table
        if (cluster.hive.clusterPool) {
            return cluster.hive.clusterClaimName !== undefined
        } else {
            return true
        }
    })

    let modalWarnings: string

    const getSnapshot = useRecoilCallback(
        ({ snapshot }) =>
            () =>
                snapshot,
        []
    )
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
        }),
        []
    )

    const getRecoilStates = useCallback(async () => {
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
        return map
    }, [getSnapshot, stateMap])

    const actions: any = [
        {
            id: 'search-application',
            text: t('Search application'),
            click: () => {
                if (applicationData) {
                    const [apigroup, apiversion] = applicationData.application.app.apiVersion.split('/')
                    const isOCPorFluxApp = applicationData.application.isOCPApp || applicationData.application.isFluxApp
                    const searchLink = isOCPorFluxApp
                        ? getSearchLink({
                              properties: {
                                  namespace: applicationData?.application.app.metadata?.namespace,
                                  label: applicationData?.application.isOCPApp
                                      ? `app=${applicationData?.application.app.metadata?.name},app.kubernetes.io/part-of=${applicationData?.application.app.metadata?.name}`
                                      : `kustomize.toolkit.fluxcd.io/name=${applicationData?.application.app.metadata?.name},helm.toolkit.fluxcd.io/name=${applicationData?.application.app.metadata?.name}`,
                                  cluster: applicationData?.application.app.cluster.name,
                              },
                          })
                        : getSearchLink({
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

    if (!isArgoApp && !isOCPApp && !isFluxApp) {
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
            click: async () => {
                const recoilStates = await getRecoilStates()

                const appChildResources =
                    selectedApp.kind === ApplicationKind
                        ? getAppChildResources(
                              selectedApp,
                              recoilStates.applications,
                              recoilStates.subscriptions,
                              recoilStates.placementRules,
                              recoilStates.channels
                          )
                        : [[], []]
                const appSetRelatedResources =
                    selectedApp.kind === ApplicationSetKind
                        ? getAppSetRelatedResources(selectedApp, recoilStates.applicationSets)
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
                    appSetApps: getAppSetApps(recoilStates.argoApplications, selectedApp.metadata?.name),
                    close: () => {
                        setModalProps({ open: false })
                    },
                    t,
                    redirect: NavigationPath.applications,
                })
            },
        })
    }

    if (acmExtensions?.applicationAction?.length) {
        if (applicationData) {
            const selectedApp = applicationData.application.app
            acmExtensions.applicationAction.forEach((appAction) => {
                if (appAction?.model ? isResourceTypeOf(selectedApp, appAction?.model) : isOCPApp) {
                    const ModalComp = appAction.component
                    const close = () => setPluginModal(<></>)
                    actions.push({
                        id: appAction.id,
                        text: appAction.title,
                        click: async (item: any) => {
                            setPluginModal(<ModalComp isOpen={true} close={close} resource={item} />)
                        },
                    })
                }
            })
        }
    }

    const searchCompleteResults = useSearchCompleteQuery({
        skip: false,
        client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
        variables: {
            property: '',
            query: {
                filters: [],
                keywords: [],
                limit: 1000,
            },
        },
    })

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

    const urlParams = location.search ? decodeURIComponent(location.search).substring(1).split('&') : []
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

    useEffect(() => {
        // if application wasn't found wait and try again
        if (applicationNotFound) {
            setTimeout(() => {
                setWaitForApplication(false)
            }, THROTTLE_EVENTS_DELAY)
        }
    }, [applicationNotFound])

    // refresh application the first time and then every n seconds
    useEffect(() => {
        setApplicationData(undefined)
        lastRefreshRef.current = undefined
        const interval = setInterval(
            (function refresh() {
                ;(async () => {
                    const recoilStates = await getRecoilStates()

                    // get application object from recoil states
                    const application = await getApplication(
                        match.params.namespace,
                        match.params.name,
                        activeChannel,
                        recoilStates,
                        cluster,
                        apiVersion,
                        clusters
                    )
                    if (!application) {
                        setApplicationNotFound(true)
                    } else {
                        setApplicationNotFound(false)
                        const topology = await getTopology(
                            application,
                            clusters,
                            lastRefreshRef?.current?.relatedResources,
                            {
                                cluster,
                            }
                        )
                        const appData = getApplicationData(topology?.nodes)

                        // when first opened, refresh topology with wait statuses
                        if (!lastRefreshRef?.current?.resourceStatuses) {
                            setApplicationData({
                                refreshTime: Date.now(),
                                activeChannel: application ? application.activeChannel : '',
                                allChannels: application ? application.channels : [],
                                application,
                                topology,
                                appData,
                            })
                        }

                        // from then on, only refresh topology with new statuses
                        const { resourceStatuses, relatedResources, appDataWithStatuses } = await getResourceStatuses(
                            application,
                            appData,
                            topology
                        )
                        const topologyWithRelated = await getTopology(application, clusters, relatedResources, {
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
                    }
                })()
                return refresh
            })(),
            15000
        )
        return () => clearInterval(interval)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        waitForApplication,
        activeChannel,
        apiVersion,
        cluster,
        getSnapshot,
        match.params.name,
        match.params.namespace,
        stateMap,
    ])

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
                        applicationNotFound ? (
                            <Fragment />
                        ) : (
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
                        )
                    }
                />
            }
        >
            {applicationNotFound && waitForApplication ? (
                <AcmLoadingPage />
            ) : applicationNotFound ? (
                <Alert isInline variant="danger" title={t('Application not found!')} />
            ) : (
                <Fragment>
                    {searchError(searchCompleteResults.error, t)}
                    <DeleteResourceModal {...modalProps} />
                    {pluginModal}
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
                </Fragment>
            )}
        </AcmPage>
    )
}
