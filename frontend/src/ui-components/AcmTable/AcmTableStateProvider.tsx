/* Copyright Contributors to the Open Cluster Management project */

import { ISortBy, SortByDirection } from '@patternfly/react-table'
import { createContext, ReactNode, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom-v5-compat'

const DEFAULT_ITEMS_PER_PAGE = 10
const STORAGE_EXPIRATION_MS = 30 * 60 * 1000 // 30 minutes in milliseconds

const DEFAULT_SORT: ISortBy = {
  index: 0,
  direction: SortByDirection.asc,
}

// Helper functions for localStorage with expiration
interface StorageItem {
  value: string
  timestamp: number
}

export function setItemWithExpiration(key: string, value: string): void {
  const item: StorageItem = {
    value,
    timestamp: Date.now(),
  }
  localStorage.setItem(key, JSON.stringify(item))
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

const AcmTableStateContext: React.Context<{
  search?: string
  setSearch?: (search: string) => void
  sort?: ISortBy
  setSort?: (sort: ISortBy) => void
  page?: number
  setPage?: (page: number) => void
  perPage?: number
  setPerPage?: (perPage: number) => void
}> = createContext({})

export function AcmTableStateProvider(props: { children: ReactNode; localStorageKey?: string }) {
  const location = useLocation()
  const { localStorageKey = `${location.pathname.split('/').pop() || 'default'}-table-state` } = props
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(DEFAULT_ITEMS_PER_PAGE)
  const [sort, setSort] = useState<ISortBy>(DEFAULT_SORT)
  useEffect(() => {
    setSearch(getItemWithExpiration(`${localStorageKey}-search`) || '')
    setPage(Number.parseInt(getItemWithExpiration(`${localStorageKey}-page`) || '0', 10) || 1)
    setPerPage(Number.parseInt(localStorage.getItem(`${localStorageKey}-perPage`) || '0', 10) || DEFAULT_ITEMS_PER_PAGE)
    setSort(
      (() => {
        const sortValue = getItemWithExpiration(`${localStorageKey}-sort`)
        return (sortValue && JSON.parse(sortValue)) ?? DEFAULT_SORT
      })()
    )
  }, [localStorageKey, setSearch, setPage, setPerPage, setSort])

  const stateContext = useMemo(
    () => ({
      search,
      setSearch: (search: string) => {
        setItemWithExpiration(`${localStorageKey}-search`, search)
        setSearch(search)
      },
      sort,
      setSort: (sort: ISortBy) => {
        const newSort = sort ?? DEFAULT_SORT
        setItemWithExpiration(`${localStorageKey}-sort`, JSON.stringify(newSort))
        setSort(newSort)
      },
      page,
      setPage: (page: number) => {
        setItemWithExpiration(`${localStorageKey}-page`, String(page))
        setPage(page)
      },
      perPage,
      setPerPage: (perPage: number) => {
        localStorage.setItem(`${localStorageKey}-perPage`, String(perPage))
        setPerPage(perPage)
      },
    }),
    [search, setSearch, sort, setSort, page, setPage, perPage, setPerPage, localStorageKey]
  )
  return <AcmTableStateContext.Provider value={stateContext}>{props.children}</AcmTableStateContext.Provider>
}

export { AcmTableStateContext, DEFAULT_ITEMS_PER_PAGE, DEFAULT_SORT }
