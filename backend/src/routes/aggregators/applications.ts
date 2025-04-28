/* Copyright Contributors to the Open Cluster Management project */
import { getKubeResources, IWatchOptions } from '../events'
import { addOCPQueryInputs, addSystemQueryInputs, cacheOCPApplications } from './applicationsOCP'
import { ApplicationSetKind, IApplicationSet, IResource } from '../../resources/resource'
import { FilterSelections, ITransformedResource } from '../../lib/pagination'
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
  getAppSetAppsMap,
  cacheArgoApplications,
  getAppSetRelatedResources,
  polledArgoApplicationAggregation,
} from './applicationsArgo'
import { getGiganticApps } from '../../lib/gigantic'

export enum AppColumns {
  'name' = 0,
  'type',
  'namespace',
  'clusters',
  'repo',
  'health',
  'sync',
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

export type ApplicationCache = {
  resources?: ITransformedResource[]
  resourceMap?: { [key: string]: ITransformedResource[] }
  resourceUidMap?: { [key: string]: ITransformedResource }
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
appKeys.forEach((key) => {
  applicationCache[key] = { resources: [] }
})

export const SEARCH_TIMEOUT = 5 * 60 * 1000

// will divide queries into application prefixes (a*, b*) not to execeed this value: process.env.APP_SEARCH_LIMIT
// however if a single letter prefix (ex: a*) returns more then this amount, we need to have a higher max
export const SEARCH_QUERY_LIMIT = 20000

export interface IQuery {
  operationName: string
  variables: { input: { filters: { property: string; values: string[] }[]; limit: number }[] }
  query: string
}
const queryTemplate: IQuery = {
  operationName: 'searchResult',
  variables: {
    input: [],
  },
  query: 'query searchResult($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    items\n  }\n}',
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

export function polledApplicationAggregation(
  options: IWatchOptions,
  items: IResource[],
  shouldPostProcess: boolean
): void {
  polledArgoApplicationAggregation(options, items, shouldPostProcess)
}

export function getApplications() {
  aggregateLocalApplications()
  let items = getApplicationsHelper(applicationCache, Object.keys(applicationCache))
  // mock a large environment
  if (process.env.MOCK_CLUSTERS) {
    items = items.concat(transform(getGiganticApps()).resources)
  }
  return items
}

// not going to be many, will grab on each query from client
export function aggregateLocalApplications() {
  // ACM Apps
  try {
    applicationCache['subscription'] = transform(structuredClone(getKubeResources('Application', 'app.k8s.io/v1beta1')))
  } catch (e) {
    logger.error(`aggregateLocalApplications subscription exception ${e}`)
  }
}

export function filterApplications(filters: FilterSelections, items: ITransformedResource[]) {
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
      }
      if (!isMatch) {
        isFilterMatch = false
      }
    })
    return isFilterMatch
  })
  return items
}

// add data to the apps that can be used by the ui but
// w/o downloading all the appsets, apps, etc
export function addUIData(items: ITransformedResource[]) {
  const argoAppSets = getApplicationsHelper(applicationCache, ['appset'])
  const appSetAppsMap = getAppSetAppsMap()
  items = items.map((item) => {
    return {
      ...item,
      uidata: {
        clusterList: item?.transform?.[AppColumns.clusters] || [],
        appSetRelatedResources:
          item.kind === ApplicationSetKind
            ? getAppSetRelatedResources(item, argoAppSets as IApplicationSet[])
            : ['', []],
        appSetApps:
          item.kind === ApplicationSetKind
            ? appSetAppsMap[item.metadata.name]?.map((app) => app.metadata.name) || []
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
        logger.error(`startSearchLoop exception ${e}`)
      )
    } catch (e) {
      logger.error(`startSearchLoop exception ${e}`)
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
    addSystemQueryInputs(applicationCache, query)
  }

  //////////// MAKE QUERY //////////////////////////
  let results: ISearchResult
  try {
    results = await getSearchResults(query)
  } catch (e) {
    logger.error(`getSearchResults ${e}`)
    return
  }
  // //////////// SAVE RESULTS ///////////////////
  const argoAppSet = cacheArgoApplications(
    applicationCache,
    (results.data?.searchResult?.[0]?.items ?? []) as IResource[]
  )
  cacheOCPApplications(applicationCache, (results.data?.searchResult?.[1]?.items || []) as IResource[], argoAppSet)
  if (querySystemApps) {
    cacheOCPApplications(
      applicationCache,
      (results.data?.searchResult?.[2]?.items ?? []) as IResource[],
      argoAppSet,
      true
    )
  }
}
