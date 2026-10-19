/* Copyright Contributors to the Open Cluster Management project */
import { SortByDirection } from '@patternfly/react-table'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useFleetSearch, type SearchFilter, type SearchInput } from '@stolostron/multicluster-sdk'
import { useLocalHubName } from '../../../../hooks/use-local-hub'
import { IRequestListView, IResultListView } from '../../../../lib/useAggregates'
import { IResource } from '../../../../resources/resource'
import { Group, GroupKind, UserApiVersion } from '../../../../resources/rbac'
import { useSharedAtoms, useSharedValue } from '../../../../shared-atoms'
import { DEFAULT_ITEMS_PER_PAGE, DEFAULT_PAGE } from '../../../../ui-components/AcmTable/AcmTableStateProvider'
import { searchClient } from '../../../Search/search-sdk/search-client'
import { SearchResultItemsDocument, useSearchResultCountQuery } from '../../../Search/search-sdk/search-sdk'
import { groupsFromMulticlusterRoleAssignments } from '../useMergedIdentities'

export type GroupSortField = 'name' | 'created' | 'userCount'

type SortColumn = {
  sort?: string | ((a: Group, b: Group) => number)
  isHidden?: boolean
}

const SORT_FIELD_BY_COLUMN: Record<string, GroupSortField> = {
  'metadata.name': 'name',
  'users.length': 'userCount',
  'metadata.creationTimestamp': 'created',
}

export function hubGroupFilters(hubName: string): SearchFilter[] {
  return [
    { property: 'kind', values: ['Group'] },
    { property: 'apigroup', values: ['user.openshift.io'] },
    { property: 'cluster', values: [hubName] },
  ]
}

export function keywordsFromSearch(search?: string): string[] | undefined {
  const keywords = (search ?? '').trim().split(/\s+/).filter(Boolean)
  return keywords.length > 0 ? keywords : undefined
}

export function groupOrderBy(
  columns: SortColumn[],
  sortBy: { index?: number; direction?: string } | undefined
): { field: GroupSortField; descending: boolean; orderBy: string } {
  const visible = columns.filter((column) => !column.isHidden)
  const column = sortBy?.index !== undefined ? visible[sortBy.index] : undefined
  const sortKey = typeof column?.sort === 'string' ? column.sort : undefined
  const field = (sortKey && SORT_FIELD_BY_COLUMN[sortKey]) || 'name'
  const descending = sortBy?.direction === SortByDirection.desc
  return { field, descending, orderBy: `${field} ${descending ? 'desc' : 'asc'}` }
}

export function groupMatchesKeywords(group: Group, keywords: string[] | undefined): boolean {
  if (!keywords?.length) return true
  const name = (group.metadata.name ?? '').toLowerCase()
  return keywords.every((keyword) => name.includes(keyword.toLowerCase()))
}

function parseCount(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined
  const count = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(count) ? count : undefined
}

export function groupSortValue(group: Group, field: GroupSortField): string | number {
  switch (field) {
    case 'name':
      return group.metadata.name ?? ''
    case 'created':
      return group.metadata.creationTimestamp ?? ''
    case 'userCount':
      return group.userCount ?? group.users?.length ?? 0
  }
}

function compareGroups(a: Group, b: Group, field: GroupSortField, descending: boolean): number {
  const left = groupSortValue(a, field)
  const right = groupSortValue(b, field)
  const compared =
    typeof left === 'number' && typeof right === 'number' ? left - right : String(left).localeCompare(String(right))
  if (compared !== 0) return descending ? -compared : compared
  const nameCompared = (a.metadata.name ?? '').localeCompare(b.metadata.name ?? '')
  return descending ? -nameCompared : nameCompared
}

function uniqueGroups(groups: Group[]): Group[] {
  const seen = new Set<string>()
  const unique: Group[] = []
  for (const group of groups) {
    const name = group.metadata.name
    if (!name || seen.has(name)) continue
    seen.add(name)
    unique.push(group)
  }
  return unique
}

function toGroup(group: Group): Group {
  return {
    ...group,
    apiVersion: group.apiVersion ?? UserApiVersion,
    kind: GroupKind,
    users: group.users ?? [],
  }
}

export function searchItemToGroup(item: Record<string, unknown>): Group {
  const uid = typeof item._uid === 'string' ? item._uid.split('/').pop() : undefined
  const userCount = parseCount(item.userCount)
  return {
    apiVersion: UserApiVersion,
    kind: GroupKind,
    metadata: {
      name: typeof item.name === 'string' ? item.name : undefined,
      uid,
      creationTimestamp: typeof item.created === 'string' ? item.created : undefined,
    },
    users: [],
    ...(userCount !== undefined ? { userCount } : {}),
  }
}

/** Search compares with an operator prefix on the value (`<name`, `>3`). */
function beforeFilter(field: GroupSortField, group: Group, descending: boolean): SearchFilter {
  const operator = descending ? '>' : '<'
  return { property: field, values: [`${operator}${groupSortValue(group, field)}`] }
}

export function stitchGroupPage(
  searchItems: Group[],
  extrasOnPage: { mergedIndex: number; group: Group }[],
  start: number,
  perPage: number
): Group[] {
  const extrasByIndex = new Map(extrasOnPage.map((extra) => [extra.mergedIndex, extra.group]))
  const page: Group[] = []
  let searchIndex = 0
  for (let index = start; index < start + perPage; index++) {
    const extra = extrasByIndex.get(index)
    if (extra) {
      page.push(extra)
      continue
    }
    if (searchIndex >= searchItems.length) break
    page.push(searchItems[searchIndex])
    searchIndex += 1
  }
  return page
}

function searchApolloClient() {
  return process.env.NODE_ENV === 'test' ? undefined : searchClient
}

function asError(error: unknown): Error | undefined {
  if (!error) return undefined
  if (error instanceof Error) return error
  if (typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return new Error(error.message)
  }
  return new Error('Search request failed')
}

function useMraGroupSubjects(): Group[] {
  const { multiclusterRoleAssignmentState } = useSharedAtoms()
  const mras = useSharedValue(multiclusterRoleAssignmentState)
  return useMemo(() => groupsFromMulticlusterRoleAssignments(mras ?? [], new Set()), [mras])
}

export type GroupsSearchResult = {
  groups: Group[]
  processedItemCount: number
  loading: boolean
  error?: Error
  refetch: () => void
  fetchExport: (requestedExport: IRequestListView) => Promise<IResultListView | undefined>
  emptyResult: boolean
}

export function useGroupsSearch(options: {
  request: IRequestListView | undefined
  columns: SortColumn[]
  additionalGroups?: Group[]
}): GroupsSearchResult {
  const { request, columns, additionalGroups } = options
  const hubName = useLocalHubName()
  const mraGroups = useMraGroupSubjects()
  const page = request?.page ?? DEFAULT_PAGE
  const perPage = request?.perPage && request.perPage > 0 ? request.perPage : DEFAULT_ITEMS_PER_PAGE
  const keywords = useMemo(() => keywordsFromSearch(request?.search), [request?.search])
  const { field, descending, orderBy } = useMemo(
    () => groupOrderBy(columns, request?.sortBy),
    [columns, request?.sortBy]
  )
  const baseFilters = useMemo(() => hubGroupFilters(hubName), [hubName])

  const candidates = useMemo(
    () => uniqueGroups([...(additionalGroups ?? []), ...mraGroups]),
    [additionalGroups, mraGroups]
  )
  const lookupNames = useMemo(
    () => candidates.map((group) => group.metadata.name).filter((name): name is string => Boolean(name)),
    [candidates]
  )
  const lookupInput = useMemo<SearchInput | undefined>(() => {
    if (lookupNames.length === 0) return undefined
    return {
      filters: [...baseFilters, { property: 'name', values: lookupNames }],
      limit: lookupNames.length,
    }
  }, [baseFilters, lookupNames])
  const [lookupFleet, lookupLoaded, lookupError, refetchLookup] = useFleetSearch(lookupInput, false)
  const lookupGroups = lookupFleet as Group[] | undefined

  const indexedNames = useMemo(() => {
    const names = new Set<string>()
    for (const group of lookupGroups ?? []) {
      if (group.metadata?.name) names.add(group.metadata.name)
    }
    return names
  }, [lookupGroups])

  const extrasReady = lookupNames.length === 0 || lookupLoaded
  const extras = useMemo(() => {
    if (!extrasReady) return []
    return candidates.filter(
      (group) => !indexedNames.has(group.metadata.name ?? '') && groupMatchesKeywords(group, keywords)
    )
  }, [candidates, extrasReady, indexedNames, keywords])

  const rankInputs = useMemo<SearchInput[]>(
    () =>
      extras.map((group) => ({
        filters: [...baseFilters, beforeFilter(field, group, descending)],
        ...(keywords ? { keywords } : {}),
      })),
    [baseFilters, descending, extras, field, keywords]
  )
  const rankQuery = useSearchResultCountQuery({
    client: searchApolloClient(),
    skip: extras.length === 0,
    variables: { input: rankInputs.length > 0 ? rankInputs : [{ filters: baseFilters }] },
  })
  const rankCounts = useMemo(() => rankQuery.data?.searchResult ?? [], [rankQuery.data])
  const ranksReady = extras.length === 0 || (rankCounts.length === extras.length && !rankQuery.loading)

  const placedExtras = useMemo(() => {
    if (!ranksReady) return []
    return extras.map((group, index) => {
      const searchBefore = rankCounts[index]?.count ?? 0
      const extrasBefore = extras.filter(
        (other) => other !== group && compareGroups(other, group, field, descending) < 0
      ).length
      return { group, mergedIndex: searchBefore + extrasBefore }
    })
  }, [descending, extras, field, rankCounts, ranksReady])

  const start = Math.max(0, (page - 1) * perPage)
  const extrasOnPage = placedExtras.filter((extra) => extra.mergedIndex >= start && extra.mergedIndex < start + perPage)
  const extrasBeforePage = placedExtras.filter((extra) => extra.mergedIndex < start).length
  const searchOffset = Math.max(0, start - extrasBeforePage)
  const searchLimit = Math.max(0, perPage - extrasOnPage.length)
  const canQueryPage = extrasReady && ranksReady && searchLimit > 0

  const pageInput = useMemo<SearchInput | undefined>(() => {
    if (!canQueryPage) return undefined
    return {
      filters: baseFilters,
      ...(keywords ? { keywords } : {}),
      limit: searchLimit,
      offset: searchOffset,
      orderBy,
    }
  }, [baseFilters, canQueryPage, keywords, orderBy, searchLimit, searchOffset])
  const [pageFleet, pageLoaded, pageError, refetchPage] = useFleetSearch(pageInput, true)
  const pageGroups = pageFleet as Group[] | undefined

  const countInput = useMemo<SearchInput>(
    () => ({
      filters: baseFilters,
      ...(keywords ? { keywords } : {}),
    }),
    [baseFilters, keywords]
  )
  const countQuery = useSearchResultCountQuery({
    client: searchApolloClient(),
    variables: { input: [countInput] },
  })
  const searchCount = countQuery.data?.searchResult?.[0]?.count ?? 0
  const processedItemCount = searchCount + extras.length

  const pageReady = !canQueryPage || pageLoaded
  const ready = extrasReady && ranksReady && pageReady && !countQuery.loading
  const groups = useMemo(() => {
    if (!ready) return []
    return stitchGroupPage((pageGroups ?? []).map(toGroup), extrasOnPage, start, perPage)
  }, [extrasOnPage, pageGroups, perPage, ready, start])

  const refetchPageRef = useRef(refetchPage)
  const refetchLookupRef = useRef(refetchLookup)
  const refetchCountRef = useRef(countQuery.refetch)
  const refetchRanksRef = useRef(rankQuery.refetch)
  refetchPageRef.current = refetchPage
  refetchLookupRef.current = refetchLookup
  refetchCountRef.current = countQuery.refetch
  refetchRanksRef.current = rankQuery.refetch

  const refetch = useCallback(() => {
    void refetchLookupRef.current()
    void refetchPageRef.current()
    void refetchCountRef.current()
    void refetchRanksRef.current()
  }, [])

  const additionalKey = (additionalGroups ?? []).map((group) => group.metadata.name ?? '').join('\n')
  const skipAdditionalRefetch = useRef(true)
  useEffect(() => {
    if (skipAdditionalRefetch.current) {
      skipAdditionalRefetch.current = false
      return
    }
    refetch()
  }, [additionalKey, refetch])

  const fetchExport = useCallback(async (): Promise<IResultListView | undefined> => {
    const result = await searchClient.query({
      query: SearchResultItemsDocument,
      variables: {
        input: [{ filters: hubGroupFilters(hubName), limit: -1, orderBy: 'name asc' }],
      },
    })
    const items = ((result.data?.searchResult?.[0]?.items ?? []) as Array<Record<string, unknown> | null>)
      .filter((item): item is Record<string, unknown> => Boolean(item))
      .map(searchItemToGroup)
    const indexed = new Set(items.map((group) => group.metadata.name).filter((name): name is string => Boolean(name)))
    const extra = candidates.filter((group) => group.metadata.name && !indexed.has(group.metadata.name))
    const merged = [...items, ...extra].sort((a, b) => (a.metadata.name ?? '').localeCompare(b.metadata.name ?? ''))
    return {
      page: 1,
      loading: false,
      refresh: () => {},
      items: merged as IResource[],
      emptyResult: merged.length === 0,
      processedItemCount: merged.length,
      isPreProcessed: true,
    }
  }, [candidates, hubName])

  const searching = keywords !== undefined
  return {
    groups,
    processedItemCount,
    loading: !ready,
    error: asError(pageError) ?? asError(lookupError) ?? asError(countQuery.error) ?? asError(rankQuery.error),
    refetch,
    fetchExport,
    emptyResult: ready && searching && processedItemCount === 0,
  }
}

export function useHasHubGroups(): { hasGroups: boolean; loaded: boolean } {
  const hubName = useLocalHubName()
  const mraGroups = useMraGroupSubjects()
  const filters = useMemo(() => hubGroupFilters(hubName), [hubName])
  const { data, loading } = useSearchResultCountQuery({
    client: searchApolloClient(),
    variables: { input: [{ filters }] },
  })
  const count = data?.searchResult?.[0]?.count ?? 0
  return { hasGroups: count > 0 || mraGroups.length > 0, loaded: !loading }
}

export function useGroupIdentity(name: string | undefined): Group | undefined {
  const hubName = useLocalHubName()
  const mraGroups = useMraGroupSubjects()
  const input = useMemo<SearchInput | undefined>(() => {
    if (!name) return undefined
    return {
      filters: [...hubGroupFilters(hubName), { property: 'name', values: [name] }],
      limit: 1,
    }
  }, [hubName, name])
  const [foundFleet, loaded] = useFleetSearch(input, false)
  const found = foundFleet as Group[] | undefined
  return useMemo(() => {
    if (!name) return undefined
    const indexed = found?.[0]
    if (indexed?.metadata?.name) return toGroup(indexed)
    if (!loaded) return undefined
    return mraGroups.find((group) => group.metadata.name === name)
  }, [found, loaded, mraGroups, name])
}

export async function findIndexedGroupName(id: string, hubName: string): Promise<string | undefined> {
  const byName = await queryGroupName(hubName, { property: 'name', values: [id] })
  if (byName) return byName
  return queryGroupName(hubName, { property: '_uid', values: [`${hubName}/${id}`] })
}

async function queryGroupName(
  hubName: string,
  filter: { property: string; values: string[] }
): Promise<string | undefined> {
  const result = await searchClient.query({
    query: SearchResultItemsDocument,
    variables: {
      input: [{ filters: [...hubGroupFilters(hubName), filter], limit: 1 }],
    },
  })
  const name = result.data?.searchResult?.[0]?.items?.[0]?.name
  return typeof name === 'string' ? name : undefined
}
