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
import { useCallback, useContext, useMemo, useState } from 'react'
import { TFunction } from 'react-i18next'
import { generatePath, Link, useNavigate } from 'react-router-dom-v5-compat'
import { HighlightSearchText } from '../../components/HighlightSearchText'
import { Pages, usePageVisitMetricHandler } from '../../hooks/console-metrics'
import { Trans, useTranslation } from '../../lib/acm-i18next'
import { DOC_LINKS, ViewDocumentationLink } from '../../lib/doc-util'
import { PluginContext } from '../../lib/PluginContext'
import { rbacCreate, rbacDelete, useIsAnyNamespaceAuthorized } from '../../lib/rbac-util'
import { fetchAggregate, IRequestListView, SupportedAggregate, useAggregate } from '../../lib/useAggregates'
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
  DiscoveredArgoApplicationDefinition,
  getApiVersionResourceGroup,
  IResource,
  OCPAppResource,
  Subscription,
} from '../../resources'
import { useRecoilValue, useSharedAtoms } from '../../shared-recoil'
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
import { getMoment } from '../../resources/utils'

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

// Get app name with link and search highlighting
export function getApplicationName(application: IApplicationResource, search: string) {
  let clusterQuery = ''
  let apiVersion = `${application.kind.toLowerCase()}.${application.apiVersion?.split('/')[0]}`
  if (
    (application.apiVersion === ArgoApplicationApiVersion && application.kind === ArgoApplicationKind) ||
    (application.kind !== ApplicationKind && application.kind !== ApplicationSetKind)
  ) {
    const cluster = application?.status?.cluster
    clusterQuery = cluster ? `&cluster=${cluster}` : ''
  }
  if (application.apiVersion !== ApplicationApiVersion && application.apiVersion !== ArgoApplicationApiVersion) {
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
}

export function getApplicationNamespace(resource: IApplicationResource, search: string) {
  return <HighlightSearchText text={getAppNamespace(resource)} searchText={search} />
}

// Map resource kind to type column
export function getApplicationType(resource: IApplicationResource, systemAppNSPrefixes: string[], t: TFunction) {
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
    } else if (isSystemApp(systemAppNSPrefixes, resource.metadata?.namespace)) {
      return 'System'
    }
    return 'OpenShift'
  }
  return '-'
}

function isSystemApp(systemAppNSPrefixes: string[], namespace?: string) {
  return namespace && systemAppNSPrefixes.some((prefix) => namespace.startsWith(prefix))
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

export function getAppHealthStatus(resource: IResource) {
  let castType
  if (resource.apiVersion === ArgoApplicationApiVersion && resource.kind === ArgoApplicationKind) {
    castType = resource as ArgoApplication
    return get(castType, 'status.health.status', '')
  }

  return ''
}

export function getAppSyncStatus(resource: IResource) {
  let castType
  if (resource.apiVersion === ArgoApplicationApiVersion && resource.kind === ArgoApplicationKind) {
    castType = resource as ArgoApplication
    return get(castType, 'status.sync.status', '')
  }

  return ''
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

export default function ApplicationsOverview() {
  usePageVisitMetricHandler(Pages.application)
  const { t } = useTranslation()
  const {
    applicationSetsState,
    applicationsState,
    argoApplicationsState,
    channelsState,
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
  const { acmExtensions } = useContext(PluginContext)
  const { dataContext } = useContext(PluginContext)
  const { backendUrl } = useContext(dataContext)

  const managedClusters = useAllClusters(true)
  const localCluster = useMemo(
    () => managedClusters.find((cls) => cls.labels && cls.labels[localClusterStr] === 'true'),
    [managedClusters]
  )
  const [modalProps, setModalProps] = useState<IDeleteResourceModalProps | { open: false }>({
    open: false,
  })

  const [requestedView, setRequestedView] = useState<IRequestListView>()
  const [deletedApps, setDeletedApps] = useState<IResource[]>([])

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
      const clusterCount = getClusterCount(clusterList, localCluster?.name ?? '')
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
          healthStatus: getAppHealthStatus(tableItem),
          syncStatus: getAppSyncStatus(tableItem),
        },
      }

      // Cannot add properties directly to objects in typescript
      return { ...tableItem, ...transformedObject }
    },
    [argoApplications, channels, getTimeWindow, localCluster, managedClusters, placementDecisions, subscriptions, t]
  )

  const resultView = useAggregate(SupportedAggregate.applications, requestedView)
  const resultCounts = useAggregate(SupportedAggregate.statuses, {})
  resultCounts.itemCount = resultView.processedItemCount
  const { systemAppNSPrefixes } = resultCounts
  const allApplications = resultView.items

  const fetchAggregateForExport = async (requestedExport: IRequestListView) => {
    return fetchAggregate(SupportedAggregate.applications, backendUrl, requestedExport)
  }

  const tableItems: IResource[] = useMemo(() => {
    const items = allApplications
    /* istanbul ignore next */
    deletedApps.forEach((dapp) => {
      const inx = items.findIndex((app) => dapp.metadata?.uid === app.metadata?.uid)
      if (inx !== -1) {
        items.splice(inx, 1)
        resultCounts.itemCount -= 1
      }
    })
    return items.map((app) => generateTransformData(app))
  }, [allApplications, deletedApps, generateTransformData, resultCounts])

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
              isActionCol: appListColumn?.isActionCol ?? true,
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
        cell: (resource, search) => getApplicationName(resource, search),
        exportContent: (application) => {
          return application.metadata?.name
        },
      },
      {
        header: t('Type'),
        cell: (resource) => <span>{getApplicationType(resource, systemAppNSPrefixes, t)}</span>,
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
          return getApplicationType(resource, systemAppNSPrefixes, t)
        },
      },
      {
        header: t('Namespace'),
        cell: (resource, search) => getApplicationNamespace(resource, search),
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
          const clusterCount = getClusterCount(clusterList, localCluster?.name ?? '')
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
          const clusterCount = getClusterCount(clusterList, localCluster?.name ?? '')
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
        header: t('Health Status'),
        cell: (resource) => {
          return <span>{get(resource, 'status.health.status', '')}</span>
        },
        tooltip: t('Health status for ArgoCD applications.'),
        sort: 'transformed.healthStatus',
        search: 'transformed.healthStatus',
        exportContent: (resource) => {
          return get(resource, 'status.health.status', '')
        },
      },
      {
        header: t('Sync Status'),
        cell: (resource) => {
          return <span>{get(resource, 'status.sync.status', '')}</span>
        },
        tooltip: t('Sync status for ArgoCD applications.'),
        sort: 'transformed.syncStatus',
        search: 'transformed.syncStatus',
        exportContent: (resource) => {
          return get(resource, 'status.sync.status', '')
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
          if (resource.metadata?.creationTimestamp) {
            return getMoment(resource.metadata?.creationTimestamp).toString()
          }
        },
      },
    ],
    [
      t,
      extensionColumns,
      systemAppNSPrefixes,
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
              const isSystem = isSystemApp(systemAppNSPrefixes, item.metadata?.namespace)
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
      {
        id: 'syncStatus',
        label: t('Sync Status'),
        options: [
          {
            label: t('Synced'),
            value: 'Synced',
          },
          {
            label: t('OutOfSync'),
            value: 'OutOfSync',
          },
          {
            label: t('Unknown'),
            value: 'Unknown',
          },
        ],
        tableFilterFn: (selectedValues: string[], item: IApplicationResource) => {
          return selectedValues.includes(get(item, 'transformed.syncStatus'))
        },
      },
      {
        id: 'healthStatus',
        label: t('Health Status'),
        options: [
          {
            label: t('Unknown'),
            value: 'Unknown',
          },
          {
            label: t('Progressing'),
            value: 'Progressing',
          },
          {
            label: t('Suspended'),
            value: 'Suspended',
          },
          {
            label: t('Healthy'),
            value: 'Healthy',
          },
          {
            label: t('Degraded'),
            value: 'Degraded',
          },
          {
            label: t('Missing'),
            value: 'Missing',
          },
        ],
        tableFilterFn: (selectedValues: string[], item: IApplicationResource) => {
          return selectedValues.includes(get(item, 'transformed.healthStatus'))
        },
      },
    ],
    [t, managedClusters, systemAppNSPrefixes]
  )

  const navigate = useNavigate()
  const canCreateApplication = useIsAnyNamespaceAuthorized(rbacCreate(ApplicationDefinition))
  const canDeleteApplication = useIsAnyNamespaceAuthorized(rbacDelete(ApplicationDefinition))
  const canDeleteApplicationSet = useIsAnyNamespaceAuthorized(rbacDelete(ApplicationSetDefinition))

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
                  cluster: resource.status?.cluster ? resource.status?.cluster : localCluster?.name,
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
                ? getAppChildResources(
                    resource,
                    applications,
                    subscriptions,
                    placementRules,
                    placements,
                    channels,
                    localCluster?.name ?? ''
                  )
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
              deleted: /* istanbul ignore next */ (app: IResource) => {
                setDeletedApps((arr) => {
                  arr = [app, ...arr].slice(0, 10)
                  return arr
                })
              },
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
      t,
      acmExtensions,
      navigate,
      canDeleteApplicationSet,
      canDeleteApplication,
      applications,
      subscriptions,
      placementRules,
      placements,
      channels,
      applicationSets,
      argoApplications,
      canCreateApplication,
      localCluster?.name,
    ]
  )

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
        setRequestView={setRequestedView}
        resultView={resultView}
        resultCounts={resultCounts}
        fetchExport={fetchAggregateForExport}
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
