/* Copyright Contributors to the Open Cluster Management project */

import { ISortBy, SortByDirection } from '@patternfly/react-table'
import { createContext, ReactNode, useCallback, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom-v5-compat'

export const DEFAULT_PAGE = 1
export const DEFAULT_ITEMS_PER_PAGE = 10

export const DEFAULT_SORT: ISortBy = {
  index: 0,
  direction: SortByDirection.asc,
}

const STORAGE_EXPIRATION_MS = 30 * 60 * 1000 // 30 minutes in milliseconds

// Helper functions for localStorage with expiration
interface StorageItem {
  value: string
  timestamp: number
}

export function setItemWithExpiration(key: string, value?: string): void {
  if (value === undefined) {
    localStorage.removeItem(key)
  } else {
    const item: StorageItem = {
      value,
      timestamp: Date.now(),
    }
    localStorage.setItem(key, JSON.stringify(item))
  }
}

export function getItemWithExpiration(key: string): string | null {
  const itemStr = localStorage.getItem(key)
  if (!itemStr) return null

  try {
    const item: StorageItem = JSON.parse(itemStr)
    const now = Date.now()

    // Check if item has expired (older than 30 minutes)
    if (now - item.timestamp > STORAGE_EXPIRATION_MS) {
      localStorage.removeItem(key)
      return null
    }

    return item.value
  } catch {
    // If parsing fails, it might be an old format without expiration
    // Remove it and return null
    localStorage.removeItem(key)
    return null
  }
}

export const AcmTableStateContext: React.Context<{
  search?: string
  setSearch?: (search: string) => void
  sort?: ISortBy
  setSort?: (sort: ISortBy) => void
  preFilterSort?: ISortBy
  setPreFilterSort?: (preFilterSort?: ISortBy) => void
  page?: number
  setPage?: (page: number) => void
  perPage?: number
  setPerPage?: (perPage: number) => void
}> = createContext({})

function parseSortBy(raw: string | null): ISortBy | undefined {
  if (!raw) return undefined
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return undefined
    const obj = parsed as Record<string, unknown>
    if (obj.index !== undefined && typeof obj.index !== 'number') return undefined
    if (obj.direction !== undefined && obj.direction !== 'asc' && obj.direction !== 'desc') return undefined
    if (obj.defaultDirection !== undefined && obj.defaultDirection !== 'asc' && obj.defaultDirection !== 'desc')
      return undefined
    return parsed as ISortBy
  } catch {
    return undefined
  }
}

export function AcmTableStateProvider(props: { children: ReactNode; localStorageKey?: string }) {
  const location = useLocation()
  const { localStorageKey = `${location.pathname.split('/').pop() || 'default'}-table-state` } = props
  const { initialSearch, initialPage, initialPreFilterSort, initialPerPage, initialSort } = useMemo(() => {
    const initialSort = parseSortBy(getItemWithExpiration(`${localStorageKey}-sort`)) ?? DEFAULT_SORT
    const initialPreFilterSort = parseSortBy(getItemWithExpiration(`${localStorageKey}-preFilterSort`)) ?? DEFAULT_SORT
    return {
      initialSearch: getItemWithExpiration(`${localStorageKey}-search`) || '',
      // NaN on parseInt failure is falsy - will use default instead (DO NOT change || to ?? here!)
      initialPage: Number.parseInt(getItemWithExpiration(`${localStorageKey}-page`) || '0', 10) || DEFAULT_PAGE,
      initialPerPage:
        Number.parseInt(localStorage.getItem(`${localStorageKey}-perPage`) || '0', 10) || DEFAULT_ITEMS_PER_PAGE,
      initialSort,
      initialPreFilterSort,
    }
  }, [localStorageKey])
  const [search, setSearch] = useState<string>(initialSearch)
  const [page, setPage] = useState(initialPage)
  const [perPage, setPerPage] = useState(initialPerPage)
  const [sort, setSort] = useState<ISortBy>(initialSort)
  const [preFilterSort, setPreFilterSort] = useState<ISortBy | undefined>(initialPreFilterSort)

  const wrappedSetSearch = useCallback(
    (search: string) => {
      setItemWithExpiration(`${localStorageKey}-search`, search)
      setSearch(search)
    },
    [localStorageKey]
  )

  const wrappedSetSort = useCallback(
    (sort: ISortBy) => {
      setItemWithExpiration(`${localStorageKey}-sort`, JSON.stringify(sort))
      setSort(sort)
    },
    [localStorageKey]
  )

  const wrappedSetPreFilterSort = useCallback(
    (preFilterSort?: ISortBy) => {
      setItemWithExpiration(`${localStorageKey}-preFilterSort`, JSON.stringify(preFilterSort))
      setPreFilterSort(preFilterSort)
    },
    [localStorageKey]
  )

  const wrappedSetPage = useCallback(
    (page: number) => {
      setItemWithExpiration(`${localStorageKey}-page`, String(page))
      setPage(page)
    },
    [localStorageKey]
  )

  const wrappedSetPerPage = useCallback(
    (perPage: number) => {
      localStorage.setItem(`${localStorageKey}-perPage`, String(perPage))
      setPerPage(perPage)
    },
    [localStorageKey]
  )

  const stateContext = useMemo(
    () => ({
      search,
      setSearch: wrappedSetSearch,
      sort,
      setSort: wrappedSetSort,
      preFilterSort,
      setPreFilterSort: wrappedSetPreFilterSort,
      page,
      setPage: wrappedSetPage,
      perPage,
      setPerPage: wrappedSetPerPage,
    }),
    [
      search,
      wrappedSetSearch,
      sort,
      wrappedSetSort,
      preFilterSort,
      wrappedSetPreFilterSort,
      page,
      wrappedSetPage,
      perPage,
      wrappedSetPerPage,
    ]
  )
  return <AcmTableStateContext.Provider value={stateContext}>{props.children}</AcmTableStateContext.Provider>
}
