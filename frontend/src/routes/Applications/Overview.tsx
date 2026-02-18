/* Copyright Contributors to the Open Cluster Management project */

import {
  Content,
  ContentVariants,
  Label,
  PageSection,
  Popover,
  PopoverPosition,
  Stack,
  StackItem,
  ToolbarItem,
} from '@patternfly/react-core'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { cellWidth } from '@patternfly/react-table'
import { get } from 'lodash'
import { useCallback, useContext, useMemo, useState } from 'react'
import { TFunction } from 'react-i18next'
import { generatePath, useNavigate } from 'react-router-dom-v5-compat'
import { HighlightSearchText } from '../../components/HighlightSearchText'
import { Pages, usePageVisitMetricHandler } from '../../hooks/console-metrics'
import { useLocalHubName } from '../../hooks/use-local-hub'
import { useTranslation } from '../../lib/acm-i18next'
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
  ApplicationStatuses,
  ApplicationStatusMap,
  ArgoApplication,
  ArgoApplicationApiVersion,
  ArgoApplicationKind,
  Channel,
  DiscoveredArgoApplicationDefinition,
  getApiVersionResourceGroup,
  IResource,
  IUIResource,
  OCPAppResource,
  StatusColumn,
  Subscription,
} from '../../resources'
import { filterLabelFn, getISOStringTimestamp } from '../../resources/utils'
import { useRecoilValue, useSharedAtoms } from '../../shared-recoil'
import {
  AcmButton,
  AcmDropdown,
  AcmEmptyState,
  AcmInlineStatusGroup,
  AcmLabels,
  AcmTable,
  AcmTableStateProvider,
  AcmVisitedLink,
  compareStrings,
  IAcmRowAction,
  IAcmTableColumn
} from '../../ui-components'
import { useAllClusters } from '../Infrastructure/Clusters/ManagedClusters/components/useAllClusters'
import { DeleteResourceModal, IDeleteResourceModalProps } from './components/DeleteResourceModal'
import { DeprecatedTitle } from './components/DeprecatedTitle'
import { argoAppSetQueryString } from './CreateArgoApplication/actions'
import { subscriptionAppQueryString } from './CreateSubscriptionApplication/actions'
import {
  getAnnotation,
  getAppChildResources,
  getClusterCount,
  getClusterCountField,
  getClusterCountSearchLink,
  getClusterCountString,
  getResourceTimestamp,
  getSearchLink,
  getSubscriptionsFromAnnotation,
  hostingSubAnnotationStr,
  isResourceTypeOf,
} from './helpers/resource-helper'
import { isLocalSubscription } from './helpers/subscriptions'
import { IApplicationResource } from './model/application-resource'
import { ApplicationStatus } from './model/application-status'
import { useFetchApplicationLabels } from './useFetchApplicationLabels'
import { getApplicationId, getLabels, isOCPAppResource } from './utils'

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

export enum AppColumns {
  'name' = 0,
  'type',
  'namespace',
  'clusters',
  'health',
  'synced',
  'deployed',
  'created',
}

enum ScoreColumn {
  healthy = 0,
  progress = 1,
  warning = 2,
  danger = 3,
  unknown = 4,
}
const ScoreColumnSize = Object.keys(ScoreColumn).length / 2

const LabelCell = ({ labels }: { labels: string[] | Record<string, string> }) => (
  <AcmLabels labels={labels} isCompact={true} />
)

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
    const cluster = application.status?.cluster
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
      <AcmVisitedLink
        to={{
          pathname: generatePath(NavigationPath.applicationDetails, {
            namespace: application.metadata?.namespace!,
            name: application.metadata?.name!,
          }),
          search: `?apiVersion=${apiVersion}${clusterQuery}`,
        }}
      >
        <HighlightSearchText text={application.metadata?.name} searchText={search} isLink useFuzzyHighlighting />
      </AcmVisitedLink>
    </span>
  )
}

export function getApplicationNamespace(resource: IApplicationResource, search: string) {
  return (
    <span style={{ whiteSpace: 'nowrap' }}>
      <HighlightSearchText text={getAppNamespace(resource)} searchText={search} useFuzzyHighlighting />
    </span>
  )
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

export function getAppNamespace(resource: IResource) {
  let castType
  if (resource.apiVersion === ArgoApplicationApiVersion && resource.kind === ArgoApplicationKind) {
    castType = resource as ArgoApplication
    return castType.spec.destination.namespace
  }

  return resource.metadata?.namespace
}

export const getApplicationStatuses = (resource: IResource, type: 'health' | 'synced' | 'deployed') => {
  const uidata = (resource as IUIResource).uidata
  const allCounts = new Array(ScoreColumnSize).fill(0) as number[]
  if (
    Array.isArray(uidata?.appClusterStatuses) &&
    uidata.appClusterStatuses.length > 0 &&
    Object.keys(uidata.appClusterStatuses[0]).length > 0
  ) {
    const messages: Record<string, string>[] = []
    uidata.clusterList.forEach((cluster: string) => {
      const clusterStatuses = uidata.appClusterStatuses[0][cluster] as ApplicationStatuses
      if (clusterStatuses) {
        const counts = clusterStatuses[type][StatusColumn.counts] ?? []
        for (let i = 0; i < ScoreColumnSize; i++) {
          allCounts[i] += counts[i] ?? 0
        }
        if (clusterStatuses[type][StatusColumn.messages]) {
          clusterStatuses[type][StatusColumn.messages].forEach((message) => {
            messages.push(message)
          })
        }
      }
    })
    return { counts: allCounts, messages }
  }
  return { counts: allCounts, messages: undefined }
}

const renderPopoverContent = (
  resource: IResource,
  counts: number[],
  type: 'health' | 'synced' | 'deployed',
  messages?: Record<string, string>[]
) => {
  return (
    <div style={{ width: '26.75rem' }}>
      {messages && messages.length > 0 ? (
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {messages.map((message) => {
            // Remove leading underscore and "condition" from the key
            let cleanedKey = message.key.replace(/^_/, '').replace(/^condition/i, '')
            // Add space before each capitalized letter
            cleanedKey = cleanedKey.replaceAll(/([A-Z])/g, ' $1')
            // Capitalize the first letter and trim any leading space
            cleanedKey = cleanedKey.charAt(0).toUpperCase() + cleanedKey.slice(1)
            cleanedKey = cleanedKey.trim()
            return (
              <div key={message.key} style={{ marginBottom: '0.5rem' }}>
                <strong>{cleanedKey}:</strong> {message.value}
              </div>
            )
          })}
        </div>
      ) : (
        <div key={`${resource.metadata?.name}-${type}-status`} style={{ marginBottom: '0.5rem' }}>
          <strong>Status</strong> {counts[0] > 0 && counts.slice(1).every((count) => count === 0) ? 'OK' : 'Error'}
        </div>
      )}
    </div>
  )
}

export function renderApplicationStatusGroup(resource: IResource, type: 'health' | 'synced' | 'deployed') {
  const { counts, messages } = getApplicationStatuses(resource, type)
  if (counts.some((count) => count > 0)) {
    return (
      <Popover
        id={'labels-popover'}
        bodyContent={renderPopoverContent(resource, counts, type, messages)}
        position={PopoverPosition.bottom}
        flipBehavior={['bottom', 'top-end', 'top-end']}
        hasAutoWidth
      >
        <Label style={{ width: 'fit-content' }} variant="overflow">
          {
            <AcmInlineStatusGroup
              healthy={counts[ScoreColumn.healthy]}
              progress={counts[ScoreColumn.progress]}
              warning={counts[ScoreColumn.warning]}
              danger={counts[ScoreColumn.danger]}
              unknown={counts[ScoreColumn.unknown]}
            />
          }
        </Label>
      </Popover>
    )
  }
  return '-'
}

export function exportApplicationStatusGroup(resource: IResource, type: 'health' | 'synced' | 'deployed') {
  const { counts, messages } = getApplicationStatuses(resource, type)
  if (counts.some((count) => count > 0)) {
    const statuses: string[] = []
    if (counts[0] > 0) {
      let label = ''
      if (type === 'health') {
        label = 'Healthy'
      } else if (type === 'synced') {
        label = 'Synced'
      } else if (type === 'deployed') {
        label = 'Deployed'
      }
      statuses.push(`${counts[0]} ${label}`)
    }
    if (
      Array.isArray(messages) &&
      messages?.length &&
      (counts[1] > 0 || counts[2] > 0 || counts[3] > 0 || counts[4] > 0)
    ) {
      statuses.push(`${messages[0].value}`)
    }
    return statuses.join(', ')
  }
  return '-'
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
      const appRepos: any[] = []

      // single source handling
      if (castType.spec.source) {
        // if the source data is incomplete (missing repoURL), return empty to show no information
        // rather than incomplete information
        if (!castType.spec.source.repoURL) {
          return []
        }
        return [createRepoFromArgoSource(castType.spec.source)]
      }

      // multiple sources handling(fallback for details page when search data is incomplete)
      if (castType.spec.sources) {
        for (const source of castType.spec.sources) {
          if (source.repoURL) {
            appRepos.push(createRepoFromArgoSource(source))
          }
        }
      }
      return appRepos
    } else if (resource.kind === ApplicationSetKind) {
      castType = resource as ApplicationSet
      const appRepos: any[] = []

      // single source handling
      if (!castType.spec.template?.spec?.sources && castType.spec.template?.spec?.source) {
        return [createRepoFromArgoSource(castType.spec.template.spec.source)]
      }

      // multiple sources handling
      if (castType.spec.template?.spec?.sources) {
        for (const source of castType.spec.template.spec.sources) {
          appRepos.push(createRepoFromArgoSource(source))
        }
      }
      return appRepos
    }
  }
}

// repository object creation from an Argo source
function createRepoFromArgoSource(source: any) {
  return {
    type: source.chart ? 'helmrepo' : 'git',
    pathName: source.repoURL,
    gitPath: source.path,
    chart: source.chart,
    targetRevision: source.targetRevision,
  }
}

export default function ApplicationsOverview() {
  usePageVisitMetricHandler(Pages.application)
  const { t } = useTranslation()
  const { applicationsState, channelsState, placementRulesState, placementsState, subscriptionsState } =
    useSharedAtoms()

  const applications = useRecoilValue(applicationsState)
  const subscriptions = useRecoilValue(subscriptionsState)
  const channels = useRecoilValue(channelsState)
  const placementRules = useRecoilValue(placementRulesState)
  const placements = useRecoilValue(placementsState)
  const { acmExtensions } = useContext(PluginContext)
  const { dataContext } = useContext(PluginContext)
  const { backendUrl } = useContext(dataContext)

  const managedClusters = useAllClusters(true)
  const localCluster = useLocalHubName()
  const [modalProps, setModalProps] = useState<IDeleteResourceModalProps | { open: false }>({
    open: false,
  })

  const [requestedView, setRequestedView] = useState<IRequestListView>()
  const [deletedApps, setDeletedApps] = useState<IResource[]>([])

  const [pluginModal, setPluginModal] = useState<JSX.Element>()

  // Cache cell text for sorting and searching
  const generateTransformData = useCallback(
    (tableItem: IResource) => {
      // Cluster column
      const clusterList = (tableItem as IUIResource)?.uidata?.clusterList ?? []
      const clusterCount = getClusterCount(clusterList, localCluster)
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

      const transformedNamespace = getAppNamespace(tableItem)

      const getApplicationStatusScore = (
        statuses: ApplicationStatusMap[],
        index: number,
        clusters: string[]
      ): number => {
        let score = 0
        clusters.forEach((cluster) => {
          const stats = statuses[0]?.[cluster] ?? undefined
          if (stats) {
            let column: number[] | undefined = undefined
            if (index === AppColumns.health) column = stats.health[StatusColumn.counts]
            if (index === AppColumns.synced) column = stats.synced[StatusColumn.counts]
            if (index === AppColumns.deployed) column = stats.deployed[StatusColumn.counts]
            if (column) {
              score =
                column[ScoreColumn.danger] * 1000000 +
                column[ScoreColumn.warning] * 100000 +
                column[ScoreColumn.progress] * 10000 +
                column[ScoreColumn.unknown] * 1000 +
                column[ScoreColumn.healthy]
            }
          }
        })
        return score
      }

      const uidata = (
        tableItem as IApplicationResource & {
          uidata: { clusterList: string[]; appClusterStatuses: ApplicationStatusMap[] }
        }
      )?.uidata
      const clusters = uidata?.clusterList ?? []
      const healthScore = getApplicationStatusScore(uidata?.appClusterStatuses ?? [], AppColumns.health, clusters)
      const syncedScore = getApplicationStatusScore(uidata?.appClusterStatuses ?? [], AppColumns.synced, clusters)
      const deployedScore = getApplicationStatusScore(uidata?.appClusterStatuses ?? [], AppColumns.deployed, clusters)

      const transformedObject = {
        transformed: {
          clusterCount: clusterTransformData,
          clusterList: clusterList,
          resourceText: resourceText,
          createdText: getResourceTimestamp(tableItem, 'metadata.creationTimestamp'),
          namespace: transformedNamespace,
          healthScore: healthScore,
          syncedScore: syncedScore,
          deployedScore: deployedScore,
          healthStatus: healthScore < 1000 ? 'Healthy' : 'Unhealthy',
          syncedStatus: syncedScore < 1000 ? 'Synced' : 'OutOfSync',
          deployedStatus: deployedScore < 1000 ? 'Deployed' : 'Not Deployed',
        },
      }

      // Cannot add properties directly to objects in typescript
      return {
        id: getApplicationId(tableItem, clusters),
        ...tableItem,
        ...transformedObject,
      }
    },
    [channels, localCluster, subscriptions, t]
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

  const { labelOptions, labelMap } = useFetchApplicationLabels(tableItems)

  const keyFn = useCallback(
    (resource: IResource<ApplicationStatus>) =>
      resource.metadata!.uid ??
      `${resource.status?.cluster ?? 'local-cluster'}/${resource.metadata!.namespace}/${resource.metadata!.name}`,
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
            <Content>
              <Content
                component={ContentVariants.a}
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
              </Content>
            </Content>
          </span>
        ),
        transforms: [cellWidth(10)],
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
          const clusterList = (resource as any as IUIResource)?.uidata?.clusterList ?? []
          const clusterCount = getClusterCount(clusterList, localCluster)
          const clusterCountString = getClusterCountString(t, clusterCount, clusterList, resource)
          const clusterCountSearchLink = getClusterCountSearchLink(resource, clusterCount, clusterList)
          return getClusterCountField(clusterCount, clusterCountString, clusterCountSearchLink)
        },
        tooltip: t(
          'For Subscription applications, displays the number of remote and local clusters where resources for the application are deployed. For Argo applications, this is the name of the destination cluster. For OpenShift applications, this is the cluster where the application is deployed.'
        ),
        sort: 'transformed.clusterCount',
        search: 'transformed.clusterCount',
        exportContent: (resource: IApplicationResource) => {
          const clusterList = (resource as any as IUIResource)?.uidata?.clusterList ?? []
          const clusterCount = getClusterCount(clusterList, localCluster)
          return getClusterCountString(t, clusterCount, clusterList, resource)
        },
      },
      {
        header: t('table.labels'),
        cell: (resource) => <LabelCell labels={getLabels(resource as OCPAppResource<ApplicationStatus>)} />,
        exportContent: (resource) =>
          Object.entries(getLabels(resource as OCPAppResource<ApplicationStatus>))
            .map(([key, value]) => `${key}=${value}`)
            .join(','),
      },
      {
        header: t('Health Status'),
        cell: (resource) => {
          return renderApplicationStatusGroup(resource, 'health')
        },
        tooltip: t('Health status for ArgoCD applications.'),
        sort: (itemA, itemB) => {
          return get(itemB, 'transformed.healthScore') - get(itemA, 'transformed.healthScore')
        },
        exportContent: (resource) => {
          return exportApplicationStatusGroup(resource, 'health')
        },
      },
      {
        header: t('Sync Status'),
        cell: (resource) => {
          return renderApplicationStatusGroup(resource, 'synced')
        },
        tooltip: t('Sync status for ArgoCD applications.'),
        sort: (itemA, itemB) => {
          return get(itemB, 'transformed.syncedScore') - get(itemA, 'transformed.syncedScore')
        },
        exportContent: (resource) => {
          return exportApplicationStatusGroup(resource, 'synced')
        },
      },
      {
        header: t('Pod Status'),
        cell: (resource) => {
          return renderApplicationStatusGroup(resource, 'deployed')
        },
        tooltip: t('Status of pods deployed by the application.'),
        sort: (itemA, itemB) => {
          return get(itemB, 'transformed.deployedScore') - get(itemA, 'transformed.deployedScore')
        },
        exportContent: (resource) => {
          return exportApplicationStatusGroup(resource, 'deployed')
        },
      },
      ...extensionColumns,
      {
        header: t('Created'),
        cell: (resource) => {
          return (
            <span style={{ whiteSpace: 'nowrap' }}>{getResourceTimestamp(resource, 'metadata.creationTimestamp')}</span>
          )
        },
        transforms: [cellWidth(10)],
        sort: 'metadata.creationTimestamp',
        search: 'transformed.createdText',
        exportContent: (resource) => {
          if (resource.metadata?.creationTimestamp) {
            return getISOStringTimestamp(resource.metadata?.creationTimestamp)
          }
        },
      },
    ],
    [t, extensionColumns, systemAppNSPrefixes, localCluster]
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
        id: 'healthStatus',
        label: t('Health Status'),
        options: [
          {
            label: t('Unhealthy'),
            value: 'Unhealthy',
          },
          {
            label: t('Healthy'),
            value: 'Healthy',
          },
        ],
        tableFilterFn: (selectedValues: string[], item: IApplicationResource) => {
          return (
            selectedValues.includes(get(item, 'transformed.healthStatus')) &&
            (item.apiVersion === ApplicationSetApiVersion || item.apiVersion === ArgoApplicationApiVersion)
          )
        },
      },
      {
        id: 'syncStatus',
        label: t('Sync Status'),
        options: [
          {
            label: t('OutOfSync'),
            value: 'OutOfSync',
          },
          {
            label: t('Synced'),
            value: 'Synced',
          },
        ],
        tableFilterFn: (selectedValues: string[], item: IApplicationResource) => {
          return (
            selectedValues.includes(get(item, 'transformed.syncedStatus')) &&
            (item.apiVersion === ApplicationSetApiVersion || item.apiVersion === ArgoApplicationApiVersion)
          )
        },
      },
      {
        id: 'podStatuses',
        label: t('Pod Status'),
        options: [
          {
            label: t('Not Deployed'),
            value: 'Not Deployed',
          },
          {
            label: t('Deployed'),
            value: 'Deployed',
          },
        ],
        tableFilterFn: (selectedValues: string[], item: IApplicationResource) => {
          return selectedValues.includes(get(item, 'transformed.deployedStatus'))
        },
      },
      {
        id: 'label',
        label: t('Label'),
        options: labelOptions || [],
        supportsInequality: true, // table will allow user to convert filtered values to a=b or a!=b
        tableFilterFn: (selectedValues: string[], item: IApplicationResource) =>
          filterLabelFn(selectedValues, item as any, labelMap || {}),
      },
    ],
    [t, managedClusters, labelOptions, systemAppNSPrefixes, labelMap]
  )

  const navigate = useNavigate()
  const canCreateApplication = useIsAnyNamespaceAuthorized(rbacCreate(ApplicationDefinition))
  const canDeleteApplication = useIsAnyNamespaceAuthorized(rbacDelete(ApplicationDefinition))
  const canCreateApplicationSet = useIsAnyNamespaceAuthorized(rbacCreate(ApplicationSetDefinition))
  const canDeleteApplicationSet = useIsAnyNamespaceAuthorized(rbacDelete(ApplicationSetDefinition))

  const rowActionResolver = useCallback(
    (resource: IResource<ApplicationStatus>) => {
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
                  cluster: resource.status?.cluster,
                },
              })
            : getSearchLink({
                properties: {
                  name: resourceName ? resourceName : resource.metadata?.name,
                  namespace: resource.metadata?.namespace,
                  kind: resource.kind.toLowerCase(),
                  apigroup,
                  apiversion,
                  cluster: resource.status?.cluster ? resource.status?.cluster : localCluster,
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
              search: `?apiVersion=${resourceType}&cluster=${resource.status?.cluster}`,
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
                    localCluster
                  )
                : [[], []]
            /* istanbul ignore else */
            const appSetRelatedResources = (resource as IUIResource)?.uidata?.appSetRelatedResources ?? ['', []]
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
              appSetPlacement: appSetRelatedResources[0] as string,
              appSetsSharingPlacement: appSetRelatedResources[1] as string[],
              appKind: resource.kind,
              appSetApps: (resource as IUIResource)?.uidata?.appSetApps ?? [],
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
      canCreateApplication,
      localCluster,
    ]
  )

  const appCreationButton = useMemo(
    () => (
      <AcmDropdown
        isDisabled={!canCreateApplication && !canCreateApplicationSet}
        tooltip={!canCreateApplication && !canCreateApplicationSet ? t('rbac.unauthorized') : ''}
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
            description: t(
              'Considered the better choice for security although you cannot deploy to hub cluster. Managed clusters pull application resources directly from Git repositories.'
            ),
            isDisabled: !canCreateApplicationSet,
            tooltip: !canCreateApplicationSet ? t('rbac.unauthorized') : '',
          },
          {
            id: 'create-argo',
            text: t('Argo CD ApplicationSet - Push model'),
            description: t(
              'Hub cluster pushes application resources to managed clusters requiring credentials for each cluster.'
            ),
            isDisabled: !canCreateApplicationSet,
            tooltip: !canCreateApplicationSet ? t('rbac.unauthorized') : '',
          },
          {
            id: 'create-subscription',
            text: <DeprecatedTitle title={t('Subscription')} />,
            isDisabled: !canCreateApplication,
            tooltip: !canCreateApplication ? t('rbac.unauthorized') : '',
          },
        ]}
        isKebab={false}
        isPlain={false}
        isPrimary={true}
      />
    ),
    [canCreateApplication, canCreateApplicationSet, navigate, t]
  )

  const compareAppTypesLink = useMemo(
    () => (
      <Popover
        headerContent={t('Compare application types')}
        bodyContent={
          <>
            <div>
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
                <Content component="p">{t('Argo CD ApplicationSet - Pull model')}</Content>
              </span>
              <span>
                <Content component="p">
                  {t(
                    'ApplicationSet application where Argo CD application resources are distributed from the hub cluster to the managed clusters. Each managed cluster independently reconciles and deploys the application by using the received application resource.'
                  )}
                </Content>
              </span>
            </div>
            <div style={{ paddingTop: '10px' }}>
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
                <Content component="p">{t('Argo CD ApplicationSet - Push model')}</Content>
              </span>
              <span>
                <Content component="p">
                  {t(
                    'ApplicationSet application where Argo CD application resources are created on the hub cluster. The hub cluster is responsible for reconciling and pushing the deployed application to the managed clusters.'
                  )}
                </Content>
              </span>
            </div>
            <div style={{ paddingTop: '10px' }}>
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
                <Content component="p">
                  <DeprecatedTitle title={t('Subscription')} />
                </Content>
              </span>
              <span>
                <Content component="p">
                  {t(
                    'Subscription application where subscription resources are distributed from the hub cluster to the managed clusters. Each managed cluster independently reconciles and deploys the application using the received subscription resource.'
                  )}
                </Content>
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
    () => (
      <ToolbarItem alignSelf="center" key="compare-app-types">
        {compareAppTypesLink}
      </ToolbarItem>
    ),
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
    <PageSection hasBodyWrapper={false}>
      <DeleteResourceModal {...modalProps} />
      {pluginModal}
      <AcmTableStateProvider localStorageKey={'applications-overview-table-state'}>
        <AcmTable<IApplicationResource>
          id={TABLE_ID}
          key="data-table"
          columns={columns}
          keyFn={keyFn}
          items={tableItems as IApplicationResource[]}
          filters={filters}
          secondaryFilterIds={['label']}
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
              title={t("You don't have any applications yet")}
              message={t('To get started, create an application.')}
              action={emptyStateActions}
            />
          }
          rowActionResolver={rowActionResolver}
        />
      </AcmTableStateProvider>
    </PageSection>
  )
}
