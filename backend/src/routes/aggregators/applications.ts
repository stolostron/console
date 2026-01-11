/* Copyright Contributors to the Open Cluster Management project */
import { getKubeResources } from '../events'
import { addOCPQueryInputs, addSystemQueryInputs, cacheOCPApplications } from './applicationsOCP'
import { ApplicationSetKind, IApplicationSet, IResource, SearchResult } from '../../resources/resource'
import { FilterSelections, ISortBy } from '../../lib/pagination'
import { logger } from '../../lib/logger'
import {
  discoverSystemAppNamespacePrefixes,
  getApplicationsHelper,
  logApplicationCountChanges,
  transform,
} from './utils'
import { getSearchResults, ISearchResult, pingSearchAPI } from '../../lib/search'
import {
  addArgoQueryInputs,
  cacheArgoApplications,
  getAppSetRelatedResources,
  polledArgoApplicationAggregation,
  getPushedAppSetMap,
} from './applicationsArgo'
import { getGiganticApps } from '../../lib/gigantic'
import { createDictionary, inflateApps } from '../../lib/compression'
import { IWatchOptions } from '../../resources/watch-options'

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

export enum TransformColumns {
  'name' = 0,
  'type',
  'namespace',
  'clusters',
  'statuses',
  'scores',
  'created',
}
export interface IArgoApplication extends IResource {
  cluster?: string
  spec: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [x: string]: any
    destination: {
      name?: string
      namespace: string
      server?: string
    }
  }
  status?: {
    cluster?: string
    decisions?: [{ clusterName: string }]
  }
}
export interface IOCPApplication extends IResource {
  label?: string
  status?: {
    cluster?: string
  }
}
export interface IDecision extends IResource {
  status?: {
    decisions?: [{ clusterName: string }]
  }
}
export interface ISubscription extends IResource {
  spec?: {
    placement?: {
      placementRef?: {
        name: string
      }
    }
  }
  status?: {
    decisions?: [{ clusterName: string }]
  }
}

export enum StatusColumn {
  counts = 0,
  messages = 1,
}

export enum ScoreColumn {
  healthy = 0,
  progress = 1,
  warning = 2,
  danger = 3,
  unknown = 4,
}
export const ScoreColumnSize = Object.keys(ScoreColumn).length / 2

export type ApplicationStatusEntry = [number[], Record<string, string>[]]

export type ApplicationStatuses = {
  health: ApplicationStatusEntry
  synced: ApplicationStatusEntry
  deployed: ApplicationStatusEntry
}

// each app has distinct statuses for each cluster it's on
// string is appid (type/ns/name)
export type ApplicationClusterStatusMap = Record<string, ApplicationStatusMap>
// string is cluster name
export type ApplicationStatusMap = Record<string, ApplicationStatuses>
// string is AppColumns
export type ApplicationScoresMap = Record<string, number>

// transform is either a string (for app name) or a map of the statuses of that app on each cluster
export type Transform = (string | ApplicationScoresMap | ApplicationStatusMap)[][]
export interface ITransformedResource extends IResource {
  transform?: Transform
  remoteClusters?: string[]
}
export interface ICompressedResource {
  compressed: Buffer
  transform?: Transform
  remoteClusters?: string[]
}
export interface IUIData {
  clusterList: string[]
  appClusterStatuses?: ApplicationStatusMap[]
  appSetRelatedResources: unknown
  appSetApps: IResource[]
  appStatusByNameMap: Record<string, { health: { status: string }; sync: { status: string } }>
}

export type ApplicationCache = {
  resources?: ICompressedResource[]
  resourceMap?: { [key: string]: ICompressedResource[] }
  resourceUidMap?: { [key: string]: ICompressedResource }
}

const appDict = createDictionary()
export function getAppDict() {
  return appDict
}

export type ApplicationCacheType = {
  [type: string]: ApplicationCache
}
export const applicationCache: ApplicationCacheType = {}
const appKeys = [
  'subscription',
  'appset',
  'localArgoApps',
  'remoteArgoApps',
  'localOCPApps',
  'remoteOCPApps',
  'localSysApps',
  'remoteSysApps',
]
export const resetApplicationCache = () => {
  appKeys.forEach((key) => {
    applicationCache[key] = { resources: [] }
  })
}
resetApplicationCache()

export const SEARCH_TIMEOUT = 5 * 60 * 1000

// will divide queries into application prefixes (a*, b*) not to execeed this value: process.env.APP_SEARCH_LIMIT
// however if a single letter prefix (ex: a*) returns more then this amount, we need to have a higher max
export const SEARCH_QUERY_LIMIT = 20000

export interface IQuery {
  operationName: string
  variables: { input: { filters: { property: string; values: string[] }[]; relatedKinds: string[]; limit: number }[] }
  query: string
}
const queryTemplate: IQuery = {
  operationName: 'searchResult',
  variables: {
    input: [],
  },
  query:
    'query searchResult($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    items\n  related {\n    kind\n    items\n  }}\n}',
}

export const promiseTimeout = <T>(promise: Promise<T>, delay: number) => {
  let timeoutID: string | number | NodeJS.Timeout
  const promises = [
    new Promise<void>((_resolve, reject) => {
      timeoutID = setTimeout(() => reject(new Error(`timeout of ${delay} exceeded`)), delay)
    }),
    promise.then((data) => {
      clearTimeout(timeoutID)
      return data
    }),
  ]
  return Promise.race(promises)
}

// //////////////////////////////////////////////////////////////////////////////////
// //////////////////////////////////////////////////////////////////////////////////
// //////////////////////////////////////////////////////////////////////////////////
export async function startAggregatingApplications() {
  await discoverSystemAppNamespacePrefixes()
  void searchLoop()
}

let stopping = false
export function stopAggregatingApplications(): void {
  stopping = true
}

export async function polledApplicationAggregation(
  options: IWatchOptions,
  items: IResource[],
  shouldPostProcess: boolean
): Promise<void> {
  return polledArgoApplicationAggregation(options, items, shouldPostProcess)
}

export async function getApplications() {
  await aggregateLocalApplications()
  let items = getApplicationsHelper(applicationCache, Object.keys(applicationCache))
  // mock a large environment
  if (process.env.MOCK_CLUSTERS) {
    items = items.concat((await transform(getGiganticApps(), {})).resources)
  }
  return items
}

// not going to be many, will grab on each query from client
export async function aggregateLocalApplications() {
  // ACM Apps
  try {
    applicationCache['subscription'] = await transform(
      structuredClone(await getKubeResources('Application', 'app.k8s.io/v1beta1')),
      {}
    )
  } catch (e) {
    logger.error(`aggregateLocalApplications subscription exception ${e}`)
  }
}

export function filterApplications(filters: FilterSelections, items: ICompressedResource[]) {
  const filterCategories = Object.keys(filters)
  items = items.filter((item) => {
    let isFilterMatch = true
    // Item must match 1 filter of each category
    filterCategories.forEach((filter: string) => {
      let isMatch = true
      switch (filter) {
        case 'type':
          isMatch = filters['type'].some((value: string) => value === item.transform[AppColumns.type][0])
          break
        case 'cluster':
          isMatch = filters['cluster'].some(
            (value: string) => item.transform[AppColumns.clusters].indexOf(value) !== -1
          )
          break
        case 'podStatuses':
          isMatch = filters['podStatuses'].some(
            (value: string) => value === getStatusFilterKey(item, AppColumns.deployed)
          )
          break
        case 'healthStatus':
          isMatch = filters['healthStatus'].some(
            (value: string) => value === getStatusFilterKey(item, AppColumns.health)
          )
          break
        case 'syncStatus':
          isMatch = filters['syncStatus'].some((value: string) => value === getStatusFilterKey(item, AppColumns.synced))
          break
        default:
          isMatch = false
          break
      }
      if (!isMatch) {
        isFilterMatch = false
      }
    })
    return isFilterMatch
  })
  return items
}

export function getStatusFilterKey(item: ICompressedResource, index: AppColumns) {
  const score = (item.transform[TransformColumns.scores] as ApplicationScoresMap[])[0][index]
  switch (index) {
    case AppColumns.health:
      return score < 1000 ? 'Healthy' : 'Unhealthy'
    case AppColumns.synced:
      return score < 1000 ? 'Synced' : 'OutOfSync'
    case AppColumns.deployed:
      return score < 1000 ? 'Deployed' : 'Not Deployed'
    default:
      return ''
  }
}

export function sortApplications(sortBy: ISortBy, items: ICompressedResource[]) {
  const index = sortBy.index as AppColumns
  items = items.sort((a, b) => {
    switch (sortBy.index as AppColumns) {
      case AppColumns.name:
      case AppColumns.namespace:
      case AppColumns.clusters:
      case AppColumns.created: {
        const aValue = a.transform[sortBy.index]
        const bValue = b.transform[sortBy.index]
        if (!aValue || !bValue) return 0
        return (aValue[0] as string).localeCompare(bValue[0] as string)
      }
      case AppColumns.health:
      case AppColumns.synced:
      case AppColumns.deployed: {
        const aScore = (a.transform[TransformColumns.scores] as ApplicationScoresMap[])[0][index]
        const bScore = (b.transform[TransformColumns.scores] as ApplicationScoresMap[])[0][index]
        return bScore - aScore
      }
      default:
        return 0
    }
  })
  if (sortBy.direction === 'desc') {
    items = items.reverse()
  }
  return items
}

// add data to the apps that can be used by the ui but
// w/o downloading all the appsets, apps, etc
export async function addUIData(items: ITransformedResource[]) {
  const argoAppSets = await inflateApps(getApplicationsHelper(applicationCache, ['appset']))
  const pushedAppSetMap = getPushedAppSetMap()
  items = items.map((item) => {
    return {
      ...item,
      uidata: {
        clusterList: item?.transform?.[AppColumns.clusters] || [],
        appClusterStatuses: item?.transform?.[TransformColumns.statuses] || [],
        appSetRelatedResources:
          item.kind === ApplicationSetKind
            ? getAppSetRelatedResources(item, argoAppSets as IApplicationSet[])
            : ['', []],
        appSetApps:
          item.kind === ApplicationSetKind
            ? pushedAppSetMap[item.metadata.name]?.map((app) => app.metadata.name) || []
            : [],
      },
    }
  })
  return items
}

export async function searchLoop() {
  let pass = 1
  let searchAPIMissing = false
  while (!stopping) {
    // make sure there's an active search api
    // otherwise there's no point
    let exists
    do {
      // see if search api is running
      try {
        exists = await pingSearchAPI()
      } catch (e) {
        logger.error(`pingSearchAPI ${e}`)
        exists = false
      }
      /* istanbul ignore if */ if (!exists) {
        if (!searchAPIMissing) {
          logger.error('search API missing')
          searchAPIMissing = true
        }
        await new Promise((r) => setTimeout(r, 5 * 60 * 1000))
      }
    } while (!exists)
    /* istanbul ignore if */
    if (searchAPIMissing) {
      logger.info('search API found')
      searchAPIMissing = false
    }

    // query and save the remote applications
    try {
      await promiseTimeout(aggregateRemoteApplications(pass), SEARCH_TIMEOUT * 2).catch((e) =>
        logger.error(`aggregateRemoteApplications exception ${e}`)
      )
    } catch (e) {
      logger.error(`aggregateRemoteApplications exception ${e}`)
    }
    pass++
    logApplicationCountChanges(applicationCache, pass)

    // process every APP_SEARCH_INTERVAL seconds
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'test') {
      await new Promise((r) => setTimeout(r, pass <= 3 ? 15000 : Number(process.env.APP_SEARCH_INTERVAL) || 60000))
    } else {
      stopping = true
    }
  }
}

export async function aggregateRemoteApplications(pass: number) {
  //////////// BUILD QUERY INPUTS //////////////////
  const querySystemApps = pass < 60 || pass % 5 === 0
  const query = structuredClone(queryTemplate)
  addArgoQueryInputs(applicationCache, query)
  addOCPQueryInputs(applicationCache, query)
  if (querySystemApps) {
    await addSystemQueryInputs(applicationCache, query)
  }

  //////////// MAKE QUERY //////////////////////////
  let results: ISearchResult
  try {
    results = await getSearchResults(query)
  } catch (e) {
    logger.error(`getSearchResults ${e}`)
    return
  }
  const searchResult = results.data?.searchResult
  // //////////// SAVE RESULTS ///////////////////
  const ocpArgoAppFilter = await cacheArgoApplications(applicationCache, searchResult?.[0] as SearchResult)
  await cacheOCPApplications(applicationCache, searchResult?.[1] as SearchResult, ocpArgoAppFilter)
  if (querySystemApps) {
    await cacheOCPApplications(applicationCache, searchResult?.[2] as SearchResult, ocpArgoAppFilter, true)
  }
}
