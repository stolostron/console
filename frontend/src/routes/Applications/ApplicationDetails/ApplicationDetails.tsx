/* Copyright Contributors to the Open Cluster Management project */

import { ApolloError } from '@apollo/client'
import { Alert } from '@patternfly/react-core'
import { TFunction } from 'react-i18next'
import {
  createContext,
  ElementType,
  Fragment,
  ReactNode,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Link, useLocation, Routes, Route, useParams, Navigate, useNavigate } from 'react-router-dom-v5-compat'
import { RbacDropdown } from '../../../components/Rbac'
import { useTranslation } from '../../../lib/acm-i18next'
import { PluginContext } from '../../../lib/PluginContext'
import { canUser, rbacPatch } from '../../../lib/rbac-util'
import { NavigationPath } from '../../../NavigationPath'
import {
  Application,
  ApplicationDefinition,
  ApplicationKind,
  ApplicationSetDefinition,
  ApplicationSetKind,
} from '../../../resources'
import { useRecoilValueGetter, useSharedAtoms } from '../../../shared-recoil'
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

export default function ApplicationDetailsPage() {
  const location = useLocation()
  const { name = '', namespace = '' } = useParams()
  const match = { params: { name, namespace } }

  const { t } = useTranslation()
  const {
    ansibleJobState,
    applicationSetsState,
    applicationsState,
    argoApplicationsState,
    channelsState,
    placementRulesState,
    placementsState,
    placementDecisionsState,
    subscriptionReportsState,
    subscriptionsState,
    multiclusterApplicationSetReportState,
    THROTTLE_EVENTS_DELAY,
  } = useSharedAtoms()

  const [waitForApplication, setWaitForApplication] = useState<boolean>(true)
  const [applicationNotFound, setApplicationNotFound] = useState<boolean>(false)
  const [activeChannel, setActiveChannel] = useState<string>()
  const [allChannels, setAllChannels] = useState<string[]>([])
  const [applicationData, setApplicationData] = useState<ApplicationDataType>()
  const [modalProps, setModalProps] = useState<IDeleteResourceModalProps | { open: false }>({
    open: false,
  })
  const [canDeleteApplication, setCanDeleteApplication] = useState<boolean>(false)
  const [canDeleteApplicationSet, setCanDeleteApplicationSet] = useState<boolean>(false)
  const [pluginModal, setPluginModal] = useState<JSX.Element>()
  const { acmExtensions } = useContext(PluginContext)

  const lastRefreshRef = useRef<any>()
  const navigate = useNavigate()
  const isArgoApp = applicationData?.application?.isArgoApp
  const isAppSet = applicationData?.application?.isAppSet
  const isOCPApp = applicationData?.application?.isOCPApp
  const isFluxApp = applicationData?.application?.isFluxApp
  const clusters = useAllClusters(true)

  let modalWarnings: string

  const applicationsGetter = useRecoilValueGetter(applicationsState)
  const applicationSetsGetter = useRecoilValueGetter(applicationSetsState)
  const argoApplicationsGetter = useRecoilValueGetter(argoApplicationsState)
  const ansibleJobGetter = useRecoilValueGetter(ansibleJobState)
  const channelsGetter = useRecoilValueGetter(channelsState)
  const placementsGetter = useRecoilValueGetter(placementsState)
  const placementRulesGetter = useRecoilValueGetter(placementRulesState)
  const subscriptionsGetter = useRecoilValueGetter(subscriptionsState)
  const subscriptionReportsGetter = useRecoilValueGetter(subscriptionReportsState)
  const placementDecisionsGetter = useRecoilValueGetter(placementDecisionsState)
  const multiclusterApplicationSetReportsGetter = useRecoilValueGetter(multiclusterApplicationSetReportState)

  const getRecoilStates = useCallback(
    () => ({
      applications: applicationsGetter(),
      applicationSets: applicationSetsGetter(),
      argoApplications: argoApplicationsGetter(),
      ansibleJob: ansibleJobGetter(),
      channels: channelsGetter(),
      placements: placementsGetter(),
      placementRules: placementRulesGetter(),
      subscriptions: subscriptionsGetter(),
      subscriptionReports: subscriptionReportsGetter(),
      placementDecisions: placementDecisionsGetter(),
      multiclusterApplicationSetReports: multiclusterApplicationSetReportsGetter(),
    }),
    [
      ansibleJobGetter,
      applicationSetsGetter,
      applicationsGetter,
      argoApplicationsGetter,
      channelsGetter,
      placementDecisionsGetter,
      placementRulesGetter,
      placementsGetter,
      subscriptionReportsGetter,
      subscriptionsGetter,
      multiclusterApplicationSetReportsGetter,
    ]
  )

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
          navigate(searchLink)
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
          navigate(
            NavigationPath.editApplicationArgo
              .replace(namespaceString, selectedApp.metadata?.namespace)
              .replace(nameString, selectedApp.metadata?.name)
          )
        } else {
          navigate(
            NavigationPath.editApplicationSubscription
              .replace(namespaceString, selectedApp.metadata?.namespace)
              .replace(nameString, selectedApp.metadata?.name)
          )
        }
      },
      rbac: [
        selectedApp && rbacPatch(selectedApp, selectedApp?.metadata.namespace ?? '', selectedApp?.metadata.name ?? ''),
      ],
    })
    actions.push({
      id: 'delete-application',
      text: t('Delete application'),
      click: () => {
        const recoilStates = getRecoilStates()

        const appChildResources =
          selectedApp.kind === ApplicationKind
            ? getAppChildResources(
                selectedApp,
                recoilStates.applications,
                recoilStates.subscriptions,
                recoilStates.placementRules,
                recoilStates.placements,
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
  }, [applicationNotFound, THROTTLE_EVENTS_DELAY])

  // refresh application the first time and then every n seconds
  useEffect(() => {
    setApplicationData(undefined)
    lastRefreshRef.current = undefined
    const interval = setInterval(
      (function refresh() {
        ;(async () => {
          const recoilStates = getRecoilStates()

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
            const topology = await getTopology(application, clusters, lastRefreshRef?.current?.relatedResources, {
              cluster,
            })
            const appData = getApplicationData(topology?.nodes)

            // when first opened, refresh topology with wait statuses
            if (!lastRefreshRef?.current?.resourceStatuses) {
              setApplicationData({
                refreshTime: Date.now(),
                application,
                topology,
                appData,
              })
              setActiveChannel(application ? application.activeChannel : '')
              setAllChannels(application ? application.channels : [])
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
              application,
              topology: topologyWithRelated,
              appData: appDataWithStatuses,
              statuses: resourceStatuses,
            })
            setActiveChannel(application.activeChannel)
            setAllChannels(application.channels)
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
    match.params.name,
    match.params.namespace,
    getRecoilStates,
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
                    key={`${applicationData?.application.app?.metadata.name ?? 'app'}-actions`}
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
            <Routes>
              <Route path="/overview" element={<ApplicationOverviewPageContent applicationData={applicationData} />} />
              <Route
                path="/topology"
                element={
                  <ApplicationTopologyPageContent
                    applicationData={applicationData}
                    channelControl={{
                      allChannels,
                      activeChannel,
                      setActiveChannel,
                    }}
                  />
                }
              />
              <Route
                path="*"
                element={
                  <Navigate
                    to={
                      NavigationPath.applicationOverview
                        .replace(namespaceString, match.params.namespace)
                        .replace(nameString, match.params.name) + location.search
                    }
                    replace
                  />
                }
              />
            </Routes>
          </Suspense>
        </Fragment>
      )}
    </AcmPage>
  )
}
