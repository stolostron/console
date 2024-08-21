/* Copyright Contributors to the Open Cluster Management project */

import {
  PageSection,
  Popover,
  Stack,
  StackItem,
  Text,
  TextContent,
  TextVariants,
  ToolbarItem,
} from '@patternfly/react-core'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { cellWidth } from '@patternfly/react-table'
import { get } from 'lodash'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { TFunction } from 'react-i18next'
import { Link, generatePath, useNavigate } from 'react-router-dom-v5-compat'
import { GetOpenShiftAppResourceMaps } from '../../components/GetDiscoveredOCPApps'
import { Pages, usePageVisitMetricHandler } from '../../hooks/console-metrics'
import { Trans, useTranslation } from '../../lib/acm-i18next'
import { DOC_LINKS, ViewDocumentationLink } from '../../lib/doc-util'
import { PluginContext } from '../../lib/PluginContext'
import { checkPermission, rbacCreate, rbacDelete } from '../../lib/rbac-util'
import { NavigationPath } from '../../NavigationPath'
import {
  ApplicationApiVersion,
  ApplicationDefinition,
  ApplicationKind,
  ApplicationSet,
  ApplicationSetApiVersion,
  ApplicationSetDefinition,
  ApplicationSetKind,
  ArgoApplication,
  ArgoApplicationApiVersion,
  ArgoApplicationKind,
  Channel,
  Cluster,
  DiscoveredArgoApplicationDefinition,
  getApiVersionResourceGroup,
  HelmRelease,
  IResource,
  OCPAppResource,
  Subscription,
} from '../../resources'
import {
  AcmButton,
  AcmDropdown,
  AcmEmptyState,
  AcmTable,
  compareStrings,
  IAcmRowAction,
  IAcmTableColumn,
} from '../../ui-components'
import { useAllClusters } from '../Infrastructure/Clusters/ManagedClusters/components/useAllClusters'
import { getArgoDestinationCluster } from './ApplicationDetails/ApplicationTopology/model/topologyArgo'
import { DeleteResourceModal, IDeleteResourceModalProps } from './components/DeleteResourceModal'
import ResourceLabels from './components/ResourceLabels'
import { argoAppSetQueryString, subscriptionAppQueryString } from './CreateApplication/actions'
import {
  getAge,
  getAnnotation,
  getAppChildResources,
  getAppSetRelatedResources,
  getClusterCount,
  getClusterCountField,
  getClusterCountSearchLink,
  getClusterCountString,
  getClusterList,
  getSearchLink,
  getSubscriptionsFromAnnotation,
  hostingSubAnnotationStr,
  isArgoApp,
  isResourceTypeOf,
} from './helpers/resource-helper'
import { isLocalSubscription } from './helpers/subscriptions'
import { useRecoilValue, useSharedAtoms } from '../../shared-recoil'
import { IRequestListView, SupportedAggregate, useAggregate } from '../../lib/useAggregates'
import { HighlightSearchText } from '../../components/HighlightSearchText'

const gitBranchAnnotationStr = 'apps.open-cluster-management.io/git-branch'
const gitPathAnnotationStr = 'apps.open-cluster-management.io/git-path'
// support github annotations
const githubBranchAnnotationStr = 'apps.open-cluster-management.io/github-branch'
const githubPathAnnotationStr = 'apps.open-cluster-management.io/github-path'
export const localClusterStr = 'local-cluster'
export const partOfAnnotationStr = 'app.kubernetes.io/part-of'
const appAnnotationStr = 'app'

const fluxAnnotations = {
  helm: ['helm.toolkit.fluxcd.io/name', 'helm.toolkit.fluxcd.io/namespace'],
  git: ['kustomize.toolkit.fluxcd.io/name', 'kustomize.toolkit.fluxcd.io/namespace'],
}

const labelArr: string[] = [
  'kustomize.toolkit.fluxcd.io/name=',
  'helm.toolkit.fluxcd.io/name=',
  'app=',
  'app.kubernetes.io/part-of=',
]

const TABLE_ID = 'applicationTable'

const filterId = 'type'

type IApplicationResource = IResource | OCPAppResource

function isOCPAppResource(resource: IApplicationResource): resource is OCPAppResource {
  return 'label' in resource
}

function isFluxApplication(label: string) {
  let isFlux = false
  Object.entries(fluxAnnotations).forEach(([, values]) => {
    const [nameAnnotation, namespaceAnnotation] = values
    if (label.includes(nameAnnotation) && label.includes(namespaceAnnotation)) {
      isFlux = true
    }
  })
  return isFlux
}

// Map resource kind to type column
function getApplicationType(resource: IApplicationResource, t: TFunction) {
  if (resource.apiVersion === ApplicationApiVersion) {
    if (resource.kind === ApplicationKind) {
      return t('Subscription')
    }
  } else if (resource.apiVersion === ArgoApplicationApiVersion) {
    if (resource.kind === ArgoApplicationKind) {
      return t('Argo CD')
    } else if (resource.kind === ApplicationSetKind) {
      return t('Application set')
    }
  } else if (isOCPAppResource(resource)) {
    const isFlux = isFluxApplication(resource.label)
    if (isFlux) {
      return t('Flux')
    } else if (isSystemApp(resource.metadata?.namespace)) {
      return 'System'
    }
    return 'OpenShift'
  }
  return '-'
}

function isSystemApp(namespace?: string) {
  return (
    namespace &&
    (namespace.startsWith('openshift') ||
      namespace.startsWith('open-cluster-management') ||
      namespace.startsWith('hive') ||
      namespace.startsWith('multicluster-engine'))
  )
}

export function getAppSetApps(argoApps: IResource[], appSetName: string) {
  const appSetApps: string[] = []

  argoApps.forEach((app) => {
    if (app.metadata?.ownerReferences && app.metadata.ownerReferences[0].name === appSetName) {
      appSetApps.push(app.metadata.name!)
    }
  })

  return appSetApps
}

export function getAppNamespace(resource: IResource) {
  let castType
  if (resource.apiVersion === ArgoApplicationApiVersion && resource.kind === ArgoApplicationKind) {
    castType = resource as ArgoApplication
    return castType.spec.destination.namespace
  }

  return resource.metadata?.namespace
}

export const getApplicationRepos = (resource: IResource, subscriptions: Subscription[], channels: Channel[]) => {
  let castType
  if (resource.apiVersion === ApplicationApiVersion) {
    if (resource.kind === ApplicationKind) {
      const subAnnotations = getSubscriptionsFromAnnotation(resource)
      const appRepos: any[] = []

      for (let i = 0; i < subAnnotations.length; i++) {
        if (isLocalSubscription(subAnnotations[i], subAnnotations)) {
          // skip local sub
          continue
        }
        const subDetails = subAnnotations[i].split('/')

        subscriptions.forEach((sub) => {
          if (sub.metadata.name === subDetails[1] && sub.metadata.namespace === subDetails[0]) {
            const channelStr = sub.spec.channel

            if (channelStr) {
              const chnDetails = channelStr?.split('/')
              const channel = channels.find(
                (chn) => chn.metadata.name === chnDetails[1] && chn.metadata.namespace === chnDetails[0]
              )

              appRepos.push({
                type: channel?.spec.type,
                pathName: channel?.spec.pathname,
                gitBranch: getAnnotation(sub, gitBranchAnnotationStr) || getAnnotation(sub, githubBranchAnnotationStr),
                gitPath: getAnnotation(sub, gitPathAnnotationStr) || getAnnotation(sub, githubPathAnnotationStr),
                package: sub.spec.name,
                packageFilterVersion: sub.spec.packageFilter?.version,
              })
            }
          }
        })
      }
      return appRepos
    }
  } else if (resource.apiVersion === ArgoApplicationApiVersion) {
    if (resource.kind === ArgoApplicationKind) {
      castType = resource as ArgoApplication
      if (!castType.spec.source) {
        return []
      }
      return [
        {
          type: castType.spec.source.path ? 'git' : 'helmrepo',
          pathName: castType.spec.source.repoURL,
          gitPath: castType.spec.source.path,
          chart: castType.spec.source.chart,
          targetRevision: castType.spec.source.targetRevision,
        },
      ]
    } else if (resource.kind === ApplicationSetKind) {
      castType = resource as ApplicationSet
      const appRepos: any[] = []
      if (!castType.spec.template?.spec?.sources && castType.spec.template?.spec?.source) {
        return [
          {
            type: castType.spec.template?.spec?.source.path ? 'git' : 'helmrepo',
            pathName: castType.spec.template?.spec?.source.repoURL,
            gitPath: castType.spec.template?.spec?.source.path,
            chart: castType.spec.template?.spec?.source.chart,
            targetRevision: castType.spec.template?.spec?.source.targetRevision,
          },
        ]
      } else if (castType.spec.template?.spec?.sources) {
        castType.spec.template?.spec?.sources.forEach((source) => {
          appRepos.push({
            type: source.path ? 'git' : source.chart ? 'helmrepo' : 'git',
            pathName: source.repoURL,
            gitPath: source.path,
            chart: source.chart,
            targetRevision: source.targetRevision,
          })
        })
      }
      return appRepos
    }
  }
}

export function parseArgoApplications(
  argoApplications: ArgoApplication[],
  setArgoApplicationsHashSet: (value: React.SetStateAction<Set<string>>) => void,
  managedClusters: Cluster[]
) {
  return argoApplications.filter((argoApp) => {
    const resources = argoApp.status ? argoApp.status.resources : undefined
    const definedNamespace = get(resources, '[0].namespace')

    // cache Argo app signature for filtering OCP apps later
    setArgoApplicationsHashSet(
      (prev) =>
        new Set(
          prev.add(
            `${argoApp.metadata.name}-${
              definedNamespace ? definedNamespace : argoApp.spec.destination.namespace
            }-${getArgoDestinationCluster(argoApp.spec.destination, managedClusters, 'local-cluster')}`
          )
        )
    )
    const isChildOfAppset =
      argoApp.metadata.ownerReferences && argoApp.metadata.ownerReferences[0].kind === ApplicationSetKind
    if (!argoApp.metadata.ownerReferences || !isChildOfAppset) {
      return true
    }
    return false
  })
}

export function parseDiscoveredApplications(
  discoveredApplications: ArgoApplication[],
  setArgoApplicationsHashSet: (value: React.SetStateAction<Set<string>>) => void
) {
  const resultingTableItems: ArgoApplication[] = []

  discoveredApplications.forEach((remoteArgoApp: any) => {
    setArgoApplicationsHashSet(
      (prev) =>
        new Set(prev.add(`${remoteArgoApp.name}-${remoteArgoApp.destinationNamespace}-${remoteArgoApp.cluster}`))
    )
    if (!remoteArgoApp._hostingResource) {
      // Skip apps created by Argo pull model
      resultingTableItems.push({
        apiVersion: ArgoApplicationApiVersion,
        kind: ArgoApplicationKind,
        metadata: {
          name: remoteArgoApp.name,
          namespace: remoteArgoApp.namespace,
          creationTimestamp: remoteArgoApp.created,
        },
        spec: {
          destination: {
            namespace: remoteArgoApp.destinationNamespace,
            name: remoteArgoApp.destinationName,
            server: remoteArgoApp.destinationCluster || remoteArgoApp.destinationServer,
          },
          source: {
            path: remoteArgoApp.path,
            repoURL: remoteArgoApp.repoURL,
            targetRevision: remoteArgoApp.targetRevision,
            chart: remoteArgoApp.chart,
          },
        },
        status: {
          cluster: remoteArgoApp.cluster,
        },
      } as ArgoApplication)
    }
  })

  return resultingTableItems
}

export function parseOcpAppResources(
  discoveredOCPAppResources: OCPAppResource[],
  helmReleases: HelmRelease[],
  argoApplicationsHashSet: Set<string>
) {
  const openShiftAppResourceMaps = GetOpenShiftAppResourceMaps(
    discoveredOCPAppResources,
    helmReleases,
    argoApplicationsHashSet
  )
  const transformedData: any[] = []

  Object.entries(openShiftAppResourceMaps).forEach(([, value]) => {
    let labelIdx
    let i
    for (i = 0; i < labelArr.length; i++) {
      labelIdx = value.label?.indexOf(labelArr[i])
      if (labelIdx > -1) {
        break
      }
    }
    labelIdx += labelArr[i].length

    const semicolon = value.label?.indexOf(';', labelIdx)
    const appLabel = value.label?.substring(labelIdx, semicolon > -1 ? semicolon : value.label?.length)
    const resourceName = value.name
    transformedData.push({
      apiVersion: value.apigroup ? `${value.apigroup}/${value.apiversion}` : value.apiversion,
      kind: value.kind,
      label: value.label,
      metadata: {
        name: appLabel,
        namespace: value.namespace,
        creationTimestamp: value.created,
      },
      status: {
        cluster: value.cluster,
        resourceName,
      },
    } as OCPAppResource)
  })
  return transformedData
}

export default function ApplicationsOverview() {
  usePageVisitMetricHandler(Pages.application)
  const { t } = useTranslation()
  const {
    applicationSetsState,
    applicationsState,
    argoApplicationsState,
    channelsState,
    namespacesState,
    placementRulesState,
    placementsState,
    placementDecisionsState,
    subscriptionsState,
  } = useSharedAtoms()

  const applications = useRecoilValue(applicationsState)
  const applicationSets = useRecoilValue(applicationSetsState)
  const argoApplications = useRecoilValue(argoApplicationsState)
  const subscriptions = useRecoilValue(subscriptionsState)
  const channels = useRecoilValue(channelsState)
  const placementRules = useRecoilValue(placementRulesState)
  const placements = useRecoilValue(placementsState)
  const placementDecisions = useRecoilValue(placementDecisionsState)
  const namespaces = useRecoilValue(namespacesState)
  const { acmExtensions } = useContext(PluginContext)

  const managedClusters = useAllClusters(true, true)
  const localCluster = useMemo(() => managedClusters.find((cls) => cls.name === localClusterStr), [managedClusters])
  const [modalProps, setModalProps] = useState<IDeleteResourceModalProps | { open: false }>({
    open: false,
  })

  const [requestedView, setRequesedtView] = useState<IRequestListView>()

  const [pluginModal, setPluginModal] = useState<JSX.Element>()

  const getTimeWindow = useCallback(
    (app: IResource) => {
      if (!(app.apiVersion === ApplicationApiVersion && app.kind === ApplicationKind)) {
        return ''
      }

      const subAnnotations = getSubscriptionsFromAnnotation(app)
      let hasTimeWindow = false

      for (let i = 0; i < subAnnotations.length; i++) {
        if (isLocalSubscription(subAnnotations[i], subAnnotations)) {
          // skip local sub
          continue
        }
        const subDetails = subAnnotations[i].split('/')

        for (let j = 0; j < subscriptions.length; j++) {
          if (
            subscriptions[j].metadata.name === subDetails[1] &&
            subscriptions[j].metadata.namespace === subDetails[0]
          ) {
            if (subscriptions[j].spec.timewindow) {
              hasTimeWindow = true
              break
            }
          }
        }
      }

      return hasTimeWindow ? t('Yes') : ''
    },
    [subscriptions, t]
  )

  // Cache cell text for sorting and searching
  const generateTransformData = useCallback(
    (tableItem: IResource) => {
      // Cluster column
      const clusterList = getClusterList(
        tableItem,
        argoApplications,
        placementDecisions,
        subscriptions,
        localCluster,
        managedClusters
      )
      const clusterCount = getClusterCount(clusterList)
      const clusterTransformData = getClusterCountString(t, clusterCount, clusterList, tableItem)

      // Resource column
      const resourceMap: { [key: string]: string } = {}
      const appRepos = getApplicationRepos(tableItem, subscriptions, channels)
      let resourceText = ''
      appRepos?.forEach((repo) => {
        if (!resourceMap[repo.type]) {
          resourceText = resourceText + repo.type
        }
        resourceMap[repo.type] = repo.type
      })

      const timeWindow = getTimeWindow(tableItem)
      const transformedNamespace = getAppNamespace(tableItem)
      const transformedObject = {
        transformed: {
          clusterCount: clusterTransformData,
          clusterList: clusterList,
          resourceText: resourceText,
          createdText: getAge(tableItem, '', 'metadata.creationTimestamp'),
          timeWindow: timeWindow,
          namespace: transformedNamespace,
        },
      }

      // Cannot add properties directly to objects in typescript
      return { ...tableItem, ...transformedObject }
    },
    [argoApplications, channels, getTimeWindow, localCluster, managedClusters, placementDecisions, subscriptions, t]
  )

  const resultView = useAggregate(SupportedAggregate.applications, requestedView)
  const allApplications = resultView.items

  const tableItems: IResource[] = useMemo(
    () => [...allApplications.map((app) => generateTransformData(app))],
    [allApplications, generateTransformData]
  )

  const keyFn = useCallback(
    (resource: IResource) => resource.metadata!.uid ?? `${resource.metadata!.namespace}/${resource.metadata!.name}`,
    []
  )
  const extensionColumns: IAcmTableColumn<IApplicationResource>[] = useMemo(
    () =>
      acmExtensions?.applicationListColumn?.length
        ? acmExtensions.applicationListColumn.map((appListColumn) => {
            const CellComp = appListColumn.cell
            return {
              header: appListColumn.header,
              transforms: appListColumn?.transforms,
              cellTransforms: appListColumn?.cellTransforms,
              tooltip: appListColumn?.tooltip,
              cell: (application) => {
                return <CellComp resource={application} />
              },
            }
          })
        : [],
    [acmExtensions]
  )

  const columns = useMemo<IAcmTableColumn<IApplicationResource>[]>(
    () => [
      {
        header: t('Name'),
        sort: 'metadata.name',
        search: 'metadata.name',
        transforms: [cellWidth(20)],
        cell: (application, search) => {
          let clusterQuery = ''
          let apiVersion = `${application.kind.toLowerCase()}.${application.apiVersion?.split('/')[0]}`
          if (
            (application.apiVersion === ArgoApplicationApiVersion && application.kind === ArgoApplicationKind) ||
            (application.kind !== ApplicationKind && application.kind !== ApplicationSetKind)
          ) {
            const cluster = application?.status?.cluster
            clusterQuery = cluster ? `&cluster=${cluster}` : ''
          }
          if (
            application.apiVersion !== ApplicationApiVersion &&
            application.apiVersion !== ArgoApplicationApiVersion
          ) {
            const labels = (application as OCPAppResource).label
            if (
              labels.includes(`${fluxAnnotations.git[0]}=`) ||
              labels.includes(`${fluxAnnotations.git[1]}=`) ||
              labels.includes(`${fluxAnnotations.helm[0]}=`) ||
              labels.includes(`${fluxAnnotations.helm[1]}=`)
            ) {
              apiVersion = 'flux'
            } else if (labels.includes(`${appAnnotationStr}=`) || labels.includes(partOfAnnotationStr)) {
              apiVersion = 'ocp'
            }
          }
          return (
            <span style={{ whiteSpace: 'nowrap' }}>
              <Link
                to={{
                  pathname: generatePath(NavigationPath.applicationDetails, {
                    namespace: application.metadata?.namespace!,
                    name: application.metadata?.name!,
                  }),
                  search: `?apiVersion=${apiVersion}${clusterQuery}`,
                }}
              >
                <HighlightSearchText text={application.metadata?.name} searchText={search} />
              </Link>
            </span>
          )
        },
        exportContent: (application) => {
          return application.metadata?.name
        },
      },
      {
        header: t('Type'),
        cell: (resource) => <span>{getApplicationType(resource, t)}</span>,
        sort: 'kind',
        tooltip: (
          <span>
            {t('Displays the type of the application. ')}
            <TextContent>
              <Text
                component={TextVariants.a}
                isVisitedLink
                href={DOC_LINKS.MANAGE_APPLICATIONS}
                target="_blank"
                style={{
                  cursor: 'pointer',
                  display: 'inline-block',
                  padding: '0px',
                  fontSize: '14px',
                  color: '#0066cc',
                }}
              >
                {t('View documentation')} <ExternalLinkAltIcon />
              </Text>
            </TextContent>
          </span>
        ),
        transforms: [cellWidth(15)],
        // probably don't need search if we have a type filter
        exportContent: (resource) => {
          return getApplicationType(resource, t)
        },
      },
      {
        header: t('Namespace'),
        cell: (resource, search) => {
          return <HighlightSearchText text={getAppNamespace(resource)} searchText={search} />
        },
        sort: 'transformed.namespace',
        search: 'transformed.namespace',
        tooltip: t(
          'Displays the namespace of the application resource, which by default is where the application deploys other resources. For Argo applications, this is the destination namespace.'
        ),
        transforms: [cellWidth(20)],
        exportContent: (resource) => {
          return getAppNamespace(resource)
        },
      },
      {
        header: t('Clusters'),
        cell: (resource) => {
          const clusterList = getClusterList(
            resource,
            argoApplications,
            placementDecisions,
            subscriptions,
            localCluster,
            managedClusters
          )
          const clusterCount = getClusterCount(clusterList)
          const clusterCountString = getClusterCountString(t, clusterCount, clusterList, resource)
          const clusterCountSearchLink = getClusterCountSearchLink(resource, clusterCount, clusterList)
          return getClusterCountField(clusterCount, clusterCountString, clusterCountSearchLink)
        },
        tooltip: t(
          'For Subscription applications, displays the number of remote and local clusters where resources for the application are deployed. For Argo applications, this is the name of the destination cluster. For OpenShift applications, this is the cluster where the application is deployed.'
        ),
        sort: 'transformed.clusterCount',
        search: 'transformed.clusterCount',
        exportContent: (resource) => {
          const clusterList = getClusterList(
            resource,
            argoApplications,
            placementDecisions,
            subscriptions,
            localCluster,
            managedClusters
          )
          const clusterCount = getClusterCount(clusterList)
          return getClusterCountString(t, clusterCount, clusterList, resource)
        },
      },
      {
        header: t('Repository'),
        cell: (resource) => {
          const appRepos = getApplicationRepos(resource, subscriptions, channels)
          return (
            <ResourceLabels
              appRepos={appRepos!}
              showSubscriptionAttributes={true}
              isArgoApp={isArgoApp(resource) || isResourceTypeOf(resource, ApplicationSetDefinition)}
              translation={t}
            />
          )
        },
        tooltip: t('Provides links to each of the resource repositories used by the application.'),
        sort: 'transformed.resourceText',
        search: 'transformed.resourceText',
        exportContent: (resource) => {
          const appRepos = getApplicationRepos(resource, subscriptions, channels)
          if (appRepos) {
            return appRepos.map((repo) => repo.type).toString()
          }
        },
      },
      {
        header: t('Time window'),
        cell: (resource) => {
          return getTimeWindow(resource)
        },
        tooltip: t('Indicates if updates to any of the application resources are subject to a deployment time window.'),
        sort: 'transformed.timeWindow',
        search: 'transformed.timeWindow',
        exportContent: (resource) => {
          return getTimeWindow(resource)
        },
      },
      ...extensionColumns,
      {
        header: t('Created'),
        cell: (resource) => {
          return <span>{getAge(resource, '', 'metadata.creationTimestamp')}</span>
        },
        sort: 'metadata.creationTimestamp',
        search: 'transformed.createdText',
        exportContent: (resource) => {
          return getAge(resource, '', 'metadata.creationTimestamp')
        },
      },
    ],
    [
      t,
      extensionColumns,
      argoApplications,
      placementDecisions,
      subscriptions,
      localCluster,
      managedClusters,
      channels,
      getTimeWindow,
    ]
  )
  const filters = useMemo(
    () => [
      {
        label: t('Type'),
        id: filterId,
        options: [
          {
            label: t('System'),
            value: 'openshift-default',
          },
          {
            label: t('Application set'),
            value: 'appset',
          },
          {
            label: t('Argo CD'),
            value: 'argo',
          },
          {
            label: t('Flux'),
            value: 'flux',
          },
          {
            label: 'OpenShift',
            value: 'openshift',
          },
          {
            label: t('Subscription'),
            value: 'subscription',
          },
        ],
        tableFilterFn: (selectedValues: string[], item: IApplicationResource) => {
          return selectedValues.some((value) => {
            if (isOCPAppResource(item)) {
              const isFlux = isFluxApplication(item.label)
              const isSystem = isSystemApp(item.metadata?.namespace)
              switch (value) {
                case 'openshift':
                  return !isFlux && !isSystem
                case 'openshift-default':
                  return !isFlux && isSystem
                case 'flux':
                  return isFlux
              }
            } else {
              switch (`${getApiVersionResourceGroup(item.apiVersion)}/${item.kind}`) {
                case `${getApiVersionResourceGroup(ApplicationSetApiVersion)}/${ApplicationSetKind}`:
                  return selectedValues.includes('appset')
                case `${getApiVersionResourceGroup(ArgoApplicationApiVersion)}/${ArgoApplicationKind}`:
                  return selectedValues.includes('argo')
                case `${getApiVersionResourceGroup(ApplicationApiVersion)}/${ApplicationKind}`:
                  return selectedValues.includes('subscription')
              }
              return false
            }
          })
        },
      },
      {
        id: 'cluster',
        label: t('Cluster'),
        options: Object.values(managedClusters)
          .map((cluster) => ({
            label: cluster.name,
            value: cluster.name,
          }))
          .sort((lhs, rhs) => compareStrings(lhs.label, rhs.label)),
        tableFilterFn: (selectedValues: string[], item: IApplicationResource) => {
          const clusterList = get(item, 'transformed.clusterList')
          return selectedValues.some((value) => {
            return clusterList.includes(value)
          })
        },
      },
    ],
    [t, managedClusters]
  )

  const navigate = useNavigate()
  const [canCreateApplication, setCanCreateApplication] = useState<boolean>(false)
  const [canDeleteApplication, setCanDeleteApplication] = useState<boolean>(false)
  const [canDeleteApplicationSet, setCanDeleteApplicationSet] = useState<boolean>(false)

  const rowActionResolver = useCallback(
    (resource: IResource) => {
      const actions: IAcmRowAction<any>[] = []
      const { metadata = {} } = resource
      const { name = '', namespace = '' } = metadata

      if (isResourceTypeOf(resource, ApplicationDefinition)) {
        actions.push({
          id: 'viewApplication',
          title: t('View application'),
          click: () => {
            navigate({
              pathname: generatePath(NavigationPath.applicationOverview, { name, namespace }),
              search: subscriptionAppQueryString,
            })
          },
        })
        actions.push({
          id: 'editApplication',
          title: t('Edit application'),
          click: () => {
            navigate({
              pathname: generatePath(NavigationPath.editApplicationSubscription, { name, namespace }),
              search: '?context=applications',
            })
          },
        })
      }

      if (isResourceTypeOf(resource, ApplicationSetDefinition)) {
        actions.push({
          id: 'viewApplication',
          title: t('View application'),
          click: () => {
            navigate({
              pathname: generatePath(NavigationPath.applicationOverview, { name, namespace }),
              search: argoAppSetQueryString,
            })
          },
        })
        actions.push({
          id: 'editApplication',
          title: t('Edit application'),
          click: () => {
            navigate({
              pathname: generatePath(NavigationPath.editApplicationArgo, { name, namespace }),
              search: '?context=applicationsets',
            })
          },
        })
      }

      if (isResourceTypeOf(resource, DiscoveredArgoApplicationDefinition)) {
        const argoAppType = resource as ArgoApplication
        if (!argoAppType.spec?.sources) {
          actions.push({
            id: 'viewApplication',
            title: t('View application'),
            click: () => {
              navigate({
                pathname: generatePath(NavigationPath.applicationOverview, { name, namespace }),
                search: '?apiVersion=application.argoproj.io',
              })
            },
          })
        }
      }

      actions.push({
        id: 'searchApplication',
        title: t('Search application'),
        click: () => {
          const [apigroup, apiversion] = resource.apiVersion.split('/')
          const isOCPorFluxApp = isOCPAppResource(resource)
          const label = isOCPorFluxApp ? resource.label : ''
          const isFlux = isFluxApplication(label)
          const resourceName = resource.status?.resourceName
          const searchLink = isOCPorFluxApp
            ? getSearchLink({
                properties: {
                  namespace: resource.metadata?.namespace,
                  label: !isFlux
                    ? `app=${resource.metadata?.name},app.kubernetes.io/part-of=${resource.metadata?.name}`
                    : `kustomize.toolkit.fluxcd.io/name=${resource.metadata?.name},helm.toolkit.fluxcd.io/name=${resource.metadata?.name}`,
                  cluster: resource.status.cluster,
                },
              })
            : getSearchLink({
                properties: {
                  name: resourceName ? resourceName : resource.metadata?.name,
                  namespace: resource.metadata?.namespace,
                  kind: resource.kind.toLowerCase(),
                  apigroup,
                  apiversion,
                  cluster: resource.status?.cluster ? resource.status?.cluster : 'local-cluster',
                },
              })
          navigate(searchLink)
        },
      })

      if (isOCPAppResource(resource)) {
        actions.push({
          id: 'viewApplication',
          title: t('View application'),
          click: () => {
            const isFlux = isFluxApplication(resource.label)
            const resourceType = isFlux ? 'flux' : 'ocp'
            navigate({
              pathname: generatePath(NavigationPath.applicationOverview, { name, namespace }),
              search: `?apiVersion=${resourceType}&cluster=${resource.status.cluster}`,
            })
          },
        })
      }

      if (isResourceTypeOf(resource, ApplicationDefinition) || isResourceTypeOf(resource, ApplicationSetDefinition)) {
        actions.push({
          id: 'deleteApplication',
          title: t('Delete application'),
          click: () => {
            const appChildResources =
              resource.kind === ApplicationKind
                ? getAppChildResources(resource, applications, subscriptions, placementRules, placements, channels)
                : [[], []]
            const appSetRelatedResources =
              resource.kind === ApplicationSetKind ? getAppSetRelatedResources(resource, applicationSets) : ['', []]
            const hostingSubAnnotation = getAnnotation(resource, hostingSubAnnotationStr)
            let modalWarnings: string | undefined
            if (hostingSubAnnotation) {
              const subName = hostingSubAnnotation.split('/')[1]
              modalWarnings = t(
                'This application is deployed by the subscription {{subName}}. The delete action might be reverted when resources are reconciled with the resource repository.',
                { subName }
              )
            }
            setModalProps({
              open: true,
              canRemove: resource.kind === ApplicationSetKind ? canDeleteApplicationSet : canDeleteApplication,
              resource: resource,
              errors: undefined,
              warnings: modalWarnings,
              loading: false,
              selected: appChildResources[0], // children
              shared: appChildResources[1], // shared children
              appSetPlacement: appSetRelatedResources[0],
              appSetsSharingPlacement: appSetRelatedResources[1],
              appKind: resource.kind,
              appSetApps: getAppSetApps(argoApplications, resource.metadata?.name!),
              close: () => {
                setModalProps({ open: false })
              },
              t,
            })
          },
          isDisabled: resource.kind === ApplicationSetKind ? !canDeleteApplicationSet : !canDeleteApplication,
        })
      }

      if (acmExtensions?.applicationAction?.length) {
        acmExtensions.applicationAction.forEach((appAction) => {
          if (appAction?.model ? isResourceTypeOf(resource, appAction?.model) : isOCPAppResource(resource)) {
            const ModalComp = appAction.component
            const close = () => setPluginModal(<></>)
            actions.push({
              id: appAction.id,
              tooltip: appAction?.tooltip,
              tooltipProps: appAction?.tooltipProps,
              addSeparator: appAction?.addSeparator,
              isAriaDisabled: appAction?.isAriaDisabled,
              isDisabled: !canCreateApplication || (appAction?.isDisabled ? appAction?.isDisabled(resource) : false),
              title: appAction.title,
              click: (item) => {
                setPluginModal(<ModalComp isOpen={true} close={close} resource={item} />)
              },
            })
          }
        })
      }

      return actions
    },
    [
      applicationSets,
      applications,
      argoApplications,
      canDeleteApplication,
      canDeleteApplicationSet,
      canCreateApplication,
      channels,
      navigate,
      placements,
      placementRules,
      subscriptions,
      acmExtensions,
      t,
    ]
  )

  useEffect(() => {
    checkPermission(rbacCreate(ApplicationDefinition), setCanCreateApplication, namespaces)
  }, [namespaces])
  useEffect(() => {
    checkPermission(rbacDelete(ApplicationDefinition), setCanDeleteApplication, namespaces)
  }, [namespaces])
  useEffect(() => {
    checkPermission(rbacDelete(ApplicationSetDefinition), setCanDeleteApplicationSet, namespaces)
  }, [namespaces])

  const appCreationButton = useMemo(
    () => (
      <AcmDropdown
        isDisabled={!canCreateApplication}
        tooltip={!canCreateApplication ? t('rbac.unauthorized') : ''}
        id={'application-create'}
        onSelect={(id) => {
          if (id === 'create-argo') {
            navigate(NavigationPath.createApplicationArgo)
          } else if (id === 'create-argo-pull-model') {
            navigate(NavigationPath.createApplicationArgoPullModel)
          } else {
            navigate(NavigationPath.createApplicationSubscription)
          }
        }}
        text={t('Create application')}
        dropdownItems={[
          {
            id: 'psuedo.group.label',
            isAriaDisabled: true,
            text: <span style={{ fontSize: '14px' }}>{t('Choose a type')}</span>,
          },
          {
            id: 'create-argo-pull-model',
            text: t('Argo CD ApplicationSet - Pull model'),
          },
          {
            id: 'create-argo',
            text: t('Argo CD ApplicationSet - Push model'),
          },
          {
            id: 'create-subscription',
            text: t('Subscription'),
          },
        ]}
        isKebab={false}
        isPlain={false}
        isPrimary={true}
      />
    ),
    [canCreateApplication, navigate, t]
  )

  const compareAppTypesLink = useMemo(
    () => (
      <Popover
        headerContent={t('Compare application types')}
        bodyContent={
          <>
            <div>
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
                <Text>{t('Argo CD ApplicationSet - Pull model')}</Text>
              </span>
              <span>
                <Text>
                  {t(
                    'ApplicationSet application where Argo CD application resources are distributed from the hub cluster to the managed clusters. Each managed cluster independently reconciles and deploys the application by using the received application resource.'
                  )}
                </Text>
              </span>
            </div>
            <div style={{ paddingTop: '10px' }}>
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
                <Text>{t('Argo CD ApplicationSet - Push model')}</Text>
              </span>
              <span>
                <Text>
                  {t(
                    'ApplicationSet application where Argo CD application resources are created on the hub cluster. The hub cluster is responsible for reconciling and pushing the deployed application to the managed clusters.'
                  )}
                </Text>
              </span>
            </div>
            <div style={{ paddingTop: '10px' }}>
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
                <Text>{t('Subscription')}</Text>
              </span>
              <span>
                <Text>
                  {t(
                    'Subscription application where subscription resources are distributed from the hub cluster to the managed clusters. Each managed cluster independently reconciles and deploys the application using the received subscription resource.'
                  )}
                </Text>
              </span>
            </div>
          </>
        }
        position="bottom"
        maxWidth="850px"
      >
        <AcmButton variant="link" isInline>
          {t('Compare application types')}
        </AcmButton>
      </Popover>
    ),
    [t]
  )

  const additionalToolbarItems = useMemo(
    () => <ToolbarItem key="compare-app-types">{compareAppTypesLink}</ToolbarItem>,
    [compareAppTypesLink]
  )
  const emptyStateActions = useMemo(
    () => (
      <Stack hasGutter>
        <StackItem>{appCreationButton}</StackItem>
        <StackItem>{compareAppTypesLink}</StackItem>
        <StackItem>
          <ViewDocumentationLink doclink={DOC_LINKS.MANAGE_APPLICATIONS} />
        </StackItem>
      </Stack>
    ),
    [appCreationButton, compareAppTypesLink]
  )

  return (
    <PageSection>
      <DeleteResourceModal {...modalProps} />
      {pluginModal}
      <AcmTable<IResource>
        id={TABLE_ID}
        key="data-table"
        columns={columns}
        keyFn={keyFn}
        items={tableItems}
        filters={filters}
        setRequestView={setRequesedtView}
        resultView={resultView}
        customTableAction={appCreationButton}
        additionalToolbarItems={additionalToolbarItems}
        showExportButton
        exportFilePrefix="applicationsoverview"
        emptyState={
          <AcmEmptyState
            key="appOverviewEmptyState"
            title={t("You don't have any applications")}
            message={
              <Text>
                <Trans
                  i18nKey="Click <bold>Create application</bold> to create your resource."
                  components={{ bold: <strong /> }}
                />
              </Text>
            }
            action={emptyStateActions}
          />
        }
        rowActionResolver={rowActionResolver}
      />
    </PageSection>
  )
}
