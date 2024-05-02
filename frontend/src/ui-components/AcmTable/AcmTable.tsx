/* Copyright Contributors to the Open Cluster Management project */
import { css } from '@emotion/css'
import {
  Badge,
  ButtonVariant,
  Dropdown,
  DropdownGroup,
  DropdownItem,
  DropdownSeparator,
  DropdownToggle,
  DropdownToggleCheckbox,
  EmptyState,
  EmptyStateIcon,
  PageSection,
  Pagination,
  PaginationVariant,
  PerPageOptions,
  SearchInput,
  Select,
  SelectGroup,
  SelectOption,
  SelectOptionObject,
  SelectVariant,
  Spinner,
  Title,
  Toolbar,
  ToolbarChip,
  ToolbarContent,
  ToolbarFilter,
  ToolbarGroup,
  ToolbarItem,
  TooltipProps,
} from '@patternfly/react-core'
import { FilterIcon } from '@patternfly/react-icons'
import CaretDownIcon from '@patternfly/react-icons/dist/js/icons/caret-down-icon'
import {
  expandable,
  IAction,
  IExtraData,
  IRow,
  IRowData,
  ISortBy,
  ITransform,
  nowrap,
  RowWrapper,
  RowWrapperProps,
  sortable,
  SortByDirection,
  Table,
  TableBody,
  TableGridBreakpoint,
  TableHeader,
  TableVariant,
} from '@patternfly/react-table'
import useResizeObserver from '@react-hook/resize-observer'
import { debounce } from 'debounce'
import Fuse from 'fuse.js'
import get from 'get-value'
import hash from 'object-hash'
import {
  createContext,
  FormEvent,
  Fragment,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react'
import { AcmButton } from '../AcmButton/AcmButton'
import { AcmEmptyState } from '../AcmEmptyState/AcmEmptyState'
import { useTranslation } from '../../lib/acm-i18next'
import { usePaginationTitles } from '../../lib/paginationStrings'
import { filterLabelMargin, filterOption, filterOptionBadge } from './filterStyles'
import { AcmManageColumn } from './AcmManageColumn'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom-v5-compat'
import { ParsedQuery, parse, stringify } from 'query-string'

type SortFn<T> = (a: T, b: T) => number
type CellFn<T> = (item: T) => ReactNode
type SearchFn<T> = (item: T) => string | boolean | number | string[] | boolean[] | number[]

/* istanbul ignore next */
export interface IAcmTableColumn<T> {
  /** the header of the column */
  header: string

  tooltip?: ReactNode

  /** enables sort either on field name of using sort function */
  sort?: SortFn<T> | string

  /** if defined will enable search of the search field */
  search?: SearchFn<T> | string

  /** cell content, either on field name of using cell function */
  cell: CellFn<T> | string

  transforms?: ITransform[]

  cellTransforms?: ITransform[]

  // Below this for column management
  id?: string

  order?: number

  isDefault?: boolean
  // If it is true, This column always the last one and isn't managed by column management filter
  isActionCol?: boolean
  // isFirstVisitChecked=true, When users visit at the first time, users can see these columns.
  // unlike isDefualt columns, these columns can be controllable.
  isFirstVisitChecked?: boolean
}

/* istanbul ignore next */
export interface IAcmRowAction<T> {
  /** Action identifier */
  id: string
  /** Display a tooltip for this action */
  tooltip?: string
  /** Additional tooltip props forwarded to tooltip component */
  tooltipProps?: Partial<TooltipProps>
  /** Inject a separator horizontal rule immediately before an action */
  addSeparator?: boolean
  /** Display an action as being ariaDisabled */
  isAriaDisabled?: boolean
  /** Display an action as being disabled */
  isDisabled?: boolean
  /** Visible text for action */
  title: string | React.ReactNode
  /** Function for onClick() action */
  click: (item: T) => void
}

/**
 * Type for table primary and secondary buttons.
 */
export interface IAcmTableButtonAction {
  id: string
  title: string | React.ReactNode
  click: () => void
  isDisabled?: boolean | undefined
  tooltip?: string | React.ReactNode
  variant: ButtonVariant.primary | ButtonVariant.secondary
}

/**
 * Type for table action
 */
export interface IAcmTableDropdownAction<T> {
  id: string
  title: string | React.ReactNode
  click: (items: T[]) => void
  isDisabled?: ((items: T[]) => boolean) | boolean
  tooltip?: string | React.ReactNode
  variant: 'dropdown-action'
}

/**
 * Type for bulk actions on table items
 */
export interface IAcmTableBulkAction<T> {
  id: string
  title: string | React.ReactNode
  click: (items: T[]) => void
  isDisabled?: ((items: T[]) => boolean) | boolean
  tooltip?: string | React.ReactNode
  variant: 'bulk-action'
}

/**
 * Type for separator line in action dropdown
 */
export interface IAcmTableActionSeperator {
  id: string
  variant: 'action-seperator'
}

/**
 * Type for table action dropdown options group
 */
export interface IAcmTableActionGroup<T> {
  id: string
  title: string | React.ReactNode
  actions: IAcmTableBulkAction<T>[] | IAcmTableDropdownAction<T>[]
  variant: 'action-group'
}

export type IAcmTableAction<T> =
  | IAcmTableDropdownAction<T>
  | IAcmTableBulkAction<T>
  | IAcmTableActionSeperator
  | IAcmTableActionGroup<T>

interface ITableItem<T> {
  item: T
  key: string
  subRows?: IRow[]
  [key: string]: unknown
}

type FilterOptionValueT = string
type TableFilterOption<FilterOptionValueT> = { label: ReactNode; value: FilterOptionValueT }
export type TableFilterFn<T> = (selectedValues: string[], item: T) => boolean
/**
 * Interface defining required params for table filtering property "filterItems"
 * @interface
 * @param {string} label - label is the string displayed in UI
 * @param {string} id - ID is unique identifier
 * @param {TableFilterOption<FilterOptionValueT>[]} options - Options is an array to define the exact filter options
 * @param {TableFilterFn<T>} tableFilterFn - A required function that returns a boolean if the item is a match to the current filters
 */
export interface ITableFilter<T> {
  label: string
  id: string
  options: TableFilterOption<FilterOptionValueT>[]
  tableFilterFn: TableFilterFn<T>
  showEmptyOptions?: boolean
}

export type FilterSelections = {
  [filter: string]: string[]
}

function getValidFilterSelections<T>(filters: ITableFilter<T>[], selections: FilterSelections | ParsedQuery<string>) {
  const validSelections: FilterSelections = {}
  let removedOptions = false
  Object.keys(selections).forEach((key) => {
    const filter = filters.find((filter) => filter.id === key)
    if (filter) {
      const filterValue = selections[key]
      if (filterValue) {
        // Normalize to array
        let filterValues: (string | null)[] = []
        if (Array.isArray(filterValue)) {
          filterValues = filterValue
        } else if (typeof filterValue === 'string') {
          filterValues = [filterValue]
        }

        // Filter out invalid options
        validSelections[key] = filterValues.filter((fv) => {
          const matchedOption = filter.options.find(({ value }) => value === fv)
          if (!matchedOption) {
            removedOptions = true
          }
          return matchedOption
        }) as string[]
      }
    }
  })
  return { validSelections, removedOptions }
}

export function useTableFilterSelections<T>({ id, filters }: { id?: string; filters: ITableFilter<T>[] }) {
  const tableFilterLocalStorageKey = id ? `acm-table-filter.${id}` : undefined

  const { pathname, search } = useLocation()
  const navigate = useNavigate()

  const queryParams = useMemo(() => {
    return parse(search, { arrayFormat: 'comma' })
  }, [search])

  const filteredQueryParams = useMemo(() => {
    const filteredQueryParams: ParsedQuery<string> = {}
    Object.keys(queryParams).forEach((key) => {
      const filter = filters.find((filter) => filter.id === key)
      if (!filter) {
        filteredQueryParams[key] = queryParams[key]
      }
    })
    return filteredQueryParams
  }, [filters, queryParams])

  const updateFilters = useCallback(
    (newFilters: FilterSelections, saveFilters: boolean = true) => {
      const updatedParams = { ...filteredQueryParams, ...newFilters }
      const updatedSearch = stringify(updatedParams, { arrayFormat: 'comma' })
      navigate(pathname + '?' + updatedSearch, { replace: true })
      if (saveFilters && tableFilterLocalStorageKey) {
        setLocalStorage(tableFilterLocalStorageKey, newFilters)
      }
    },
    [filteredQueryParams, navigate, pathname, tableFilterLocalStorageKey]
  )

  const filterSelections = useMemo(() => {
    // Load filter selections from query params and validate
    const { validSelections, removedOptions } = getValidFilterSelections(filters, queryParams)
    if (Object.keys(validSelections).length) {
      if (removedOptions) {
        updateFilters(validSelections, false)
      }
      return validSelections
    } else if (tableFilterLocalStorageKey) {
      // if no query param filters, check local storage
      const { validSelections } = getValidFilterSelections(filters, getLocalStorage(tableFilterLocalStorageKey, {}))
      if (Object.keys(validSelections).length) {
        updateFilters(validSelections, false)
      }
      return validSelections
    }
    return {}
  }, [filters, tableFilterLocalStorageKey, queryParams, updateFilters])

  const addFilterValue = useCallback(
    (key: string, value: string) => {
      const newFilter = { [key]: [value] }
      const { validSelections } = getValidFilterSelections(filters, newFilter)
      if (validSelections[key]?.length) {
        const newFilters = { ...filterSelections, [key]: [...(filterSelections[key] || []), value] }
        updateFilters(newFilters)
      }
    },
    [filterSelections, filters, updateFilters]
  )

  const removeFilterValue = useCallback(
    (key: string, value: string) => {
      if (filterSelections[key]?.includes(value)) {
        const newFilters = { ...filterSelections, [key]: filterSelections[key].filter((fv) => fv !== value) }
        if (newFilters[key].length === 0) {
          delete newFilters[key]
        }
        updateFilters(newFilters)
      }
    },
    [filterSelections, updateFilters]
  )

  const removeFilter = useCallback(
    (key: string) => {
      if (filterSelections[key]) {
        const newFilters = { ...filterSelections }
        delete newFilters[key]
        updateFilters(newFilters)
      }
    },
    [filterSelections, updateFilters]
  )

  const clearFilters = useCallback(() => {
    updateFilters({})
  }, [updateFilters])

  return { filterSelections, addFilterValue, removeFilterValue, removeFilter, clearFilters }
}

function setLocalStorage(key: string | undefined, value: any) {
  try {
    window.localStorage.setItem(key as string, JSON.stringify(value))
  } catch (e) {
    // catch possible errors
  }
}

function getLocalStorage(key: string | undefined, initialValue: {}) {
  try {
    const value = window.localStorage.getItem(key as string)
    return value ? JSON.parse(value) : initialValue
  } catch (e) {
    // if error, return initial value
    return initialValue
  }
}

type FilterSelectOptionObject = SelectOptionObject & {
  filterId: string
  value: FilterOptionValueT
}

const createFilterSelectOptionObject = (filterId: string, value: FilterOptionValueT): FilterSelectOptionObject => ({
  filterId,
  value,
  toString: () => value,
  compareTo: (selectOption: FilterSelectOptionObject) =>
    selectOption.filterId === filterId && selectOption.value === value,
})

const tableDivClass = css({
  display: 'table',
  width: '100%',
})
const outerDivClass = css({
  display: 'block',
})
const tableClass = css({
  '& tbody.pf-m-expanded > tr': {
    borderBottom: 0,
    '&:last-of-type': {
      borderBottom: 'var(--pf-c-table--border-width--base) solid var(--pf-c-table--BorderColor)',
    },
  },
})

function OuiaIdRowWrapper(props: RowWrapperProps) {
  return <RowWrapper {...props} ouiaId={get(props, 'row.props.key')} />
}

const SEARCH_DEBOUNCE_TIME = 500

const DEFAULT_ITEMS_PER_PAGE = 10

const BREAKPOINT_SIZES = [
  { name: TableGridBreakpoint.none, size: 0 },
  { name: TableGridBreakpoint.gridMd, size: 768 },
  { name: TableGridBreakpoint.gridLg, size: 992 },
  { name: TableGridBreakpoint.gridXl, size: 1200 },
  { name: TableGridBreakpoint.grid2xl, size: 1450 },
  { name: TableGridBreakpoint.grid, size: Infinity },
]

const AcmTablePaginationContext: React.Context<{
  perPage?: number
  setPerPage?: (perPage: number) => void
}> = createContext({})

export function AcmTablePaginationContextProvider(props: { children: ReactNode; localStorageKey: string }) {
  const { children, localStorageKey } = props
  const [perPage, setPerPage] = useState(
    parseInt(localStorage.getItem(localStorageKey) || '0', 10) || DEFAULT_ITEMS_PER_PAGE
  )
  const paginationContext = {
    perPage,
    setPerPage: (perPage: number) => {
      localStorage.setItem(localStorageKey, String(perPage))
      setPerPage(perPage)
    },
  }
  return <AcmTablePaginationContext.Provider value={paginationContext}>{children}</AcmTablePaginationContext.Provider>
}

export type AcmTableProps<T> = {
  items?: T[]
  addSubRows?: (item: T) => IRow[] | undefined
  initialSelectedItems?: T[]
  disabledItems?: T[]
  columns: IAcmTableColumn<T>[]
  keyFn: (item: T) => string
  customTableAction?: ReactNode
  tableActionButtons?: IAcmTableButtonAction[]
  tableActions?: IAcmTableAction<T>[]
  rowActions?: IAcmRowAction<T>[]
  rowActionResolver?: (item: T) => IAcmRowAction<T>[]
  extraToolbarControls?: ReactNode
  emptyState: ReactNode
  onSelect?: (items: T[]) => void
  initialPage?: number
  page?: number
  setPage?: (page: number) => void
  initialPerPage?: number
  initialSearch?: string
  search?: string
  setSearch?: (search: string) => void
  searchPlaceholder?: string
  initialSort?: ISortBy | undefined
  sort?: ISortBy | undefined
  setSort?: (sort: ISortBy) => void
  showToolbar?: boolean
  gridBreakPoint?: TableGridBreakpoint
  perPageOptions?: PerPageOptions[]
  autoHidePagination?: boolean
  noBorders?: boolean
  fuseThreshold?: number
  filters?: ITableFilter<T>[]
  id?: string
  showColumManagement?: boolean
}

export function AcmTable<T>(props: AcmTableProps<T>) {
  const {
    id,
    items,
    columns,
    addSubRows,
    keyFn,
    tableActions = [],
    rowActions = [],
    rowActionResolver,
    customTableAction,
    filters = [],
    gridBreakPoint,
    initialSelectedItems,
    onSelect: propsOnSelect,
    showColumManagement,
  } = props

  const defaultSort = {
    index: 0,
    direction: SortByDirection.asc,
  }
  const initialSort = props.initialSort || defaultSort
  const initialSearch = props.initialSearch || ''

  const { t } = useTranslation()
  const ff = useLocation()

  // State that can come from context or component state (perPage)
  const [statePerPage, stateSetPerPage] = useState(props.initialPerPage || DEFAULT_ITEMS_PER_PAGE)
  const { perPage: contextPerPage, setPerPage: contextSetPerPage } = useContext(AcmTablePaginationContext)
  const perPage = contextPerPage || statePerPage
  const setPerPage = contextSetPerPage || stateSetPerPage

  // State that can be controlled from component props or uncontrolled from component state (page, search, sort)
  const [statePage, stateSetPage] = useState(props.initialPage || 1)
  const page = props.page || statePage
  const setPage = props.setPage || stateSetPage
  const [stateSearch, stateSetSearch] = useState(initialSearch)
  const search = props.search || stateSearch
  const setSearch = props.setSearch || stateSetSearch
  const searchPlaceholder = props.searchPlaceholder || t('Search')
  const [stateSort, stateSetSort] = useState<ISortBy | undefined>(initialSort)
  const sort = props.sort || stateSort
  const setSort = props.setSort || stateSetSort

  // State that is only stored in the component state
  const [selected, setSelected] = useState<{ [uid: string]: boolean }>({})
  const [disabled, setDisabled] = useState<{ [uid: string]: boolean }>({})
  const [preFilterSort, setPreFilterSort] = useState<ISortBy | undefined>(initialSort)
  const [expanded, setExpanded] = useState<{ [uid: string]: boolean }>({})
  const [internalSearch, setInternalSearch] = useState(search)

  // Dynamic gridBreakPoint
  const [breakpoint, setBreakpoint] = useState<TableGridBreakpoint>(TableGridBreakpoint.none)
  const [exactBreakpoint, setExactBreakpoint] = useState<number | undefined>()
  const [outerDiv, setOuterDiv] = useState<HTMLDivElement | null>(null)
  const [tableDiv, setTableDiv] = useState<HTMLDivElement | null>(null)
  const outerDivRef = useCallback((elem: HTMLDivElement | null) => setOuterDiv(elem), [])
  const tableDivRef = useCallback((elem: HTMLDivElement | null) => setTableDiv(elem), [])

  const { filterSelections, clearFilters } = useTableFilterSelections({ id, filters })

  //Column management
  const requiredColIds = useMemo(
    () => columns.filter((col) => col.isDefault && col.id && !col.isActionCol).map((col) => col.id as string),
    [columns]
  )
  const defaultColIds = useMemo(
    () =>
      columns
        .filter((col) => (col.isFirstVisitChecked || col.isDefault) && col.id && !col.isActionCol)
        .map((col) => col.id as string),
    [columns]
  )
  const defaultOrderIds = useMemo(
    () =>
      columns
        .filter((col) => !col.isActionCol)
        .sort((a, b) => {
          return a.order != null && b.order != null ? a.order - b.order : -1
        })
        .map((col) => col.id as string),
    [columns]
  )
  const localSavedCols = JSON.parse(localStorage.getItem(id + 'SavedCols')!)
  const localSavedColOrder = JSON.parse(localStorage.getItem(id + 'SavedColOrder')!)
  const [colOrderIds, setColOrderIds] = useState<string[]>(localSavedColOrder || defaultOrderIds)
  const [selectedColIds, setSelectedColIds] = useState<string[]>(
    localSavedCols || [...requiredColIds, ...defaultColIds]
  )
  const selectedSortedCols = useMemo(() => {
    const sortedColumns: IAcmTableColumn<T>[] = []

    if (!showColumManagement) {
      return columns
    }

    // sort column by column management order
    colOrderIds.forEach((id) => {
      const find = columns.find((col) => col.id === id)
      find && sortedColumns.push(find!)
    })

    const sortedSelected = sortedColumns.filter((column) => {
      return selectedColIds.includes(column.id as string)
    })

    // Btn column is always the last
    const btn = columns.find((col) => col.isActionCol)
    btn && sortedSelected.push(btn)

    return sortedSelected
  }, [columns, selectedColIds, colOrderIds, showColumManagement])

  useEffect(() => {
    localStorage.setItem(id + 'SavedCols', JSON.stringify(selectedColIds))
  }, [selectedColIds, id])

  useEffect(() => {
    localStorage.setItem(id + 'SavedColOrder', JSON.stringify(colOrderIds))
  }, [colOrderIds, id])

  /* istanbul ignore next */
  const updateBreakpoint = useCallback(
    (width: number, tableWidth: number) => {
      const viewportWidth = window.innerWidth
      if (tableWidth > width) {
        // table needs to switch to cards; make the change and record viewport size when this happened
        const newBreakpoint = BREAKPOINT_SIZES.find((b) => viewportWidth <= b.size)?.name || TableGridBreakpoint.none
        setBreakpoint(newBreakpoint)
        setExactBreakpoint(width)
      } else if (exactBreakpoint && width > exactBreakpoint) {
        // outerDiv is now bigger than when we last switched to cards; try bigger breakpoint, which will
        // be reverted in the layout effect if the table view is still too wide
        const newBreakpoint =
          [...BREAKPOINT_SIZES].reverse().find((b) => viewportWidth > b.size)?.name || TableGridBreakpoint.grid
        setBreakpoint(newBreakpoint)
      }
    },
    [exactBreakpoint]
  )

  useLayoutEffect(
    () => {
      if (!gridBreakPoint && outerDiv && tableDiv) {
        updateBreakpoint(outerDiv.clientWidth, tableDiv.clientWidth)
      }
    },
    // Check breakpoints as soon as ref callbacks are set, in case initial viewport is too small for table
    // Need to check on every update to breakpoint as well for the same case, so that display
    // doesn't thrash between table/cards on initial expansion of viewport
    [breakpoint, gridBreakPoint, outerDiv, tableDiv, updateBreakpoint]
  )

  /* istanbul ignore next */
  useResizeObserver(outerDiv, () => {
    if (!gridBreakPoint && outerDiv && tableDiv) {
      const width = outerDiv.clientWidth
      const tableWidth = tableDiv.clientWidth
      updateBreakpoint(width, tableWidth)
    }
  })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const setInternalSearchWithDebounce = useCallback(
    process.env.NODE_ENV !== 'test'
      ? debounce((search: string) => {
          setInternalSearch(search)
        }, SEARCH_DEBOUNCE_TIME)
      : setInternalSearch,
    [setInternalSearch]
  )

  useEffect(() => {
    setInternalSearchWithDebounce(search)
    return () => {
      if ('clear' in setInternalSearchWithDebounce) {
        setInternalSearchWithDebounce.clear()
      }
    }
  }, [search, setInternalSearchWithDebounce])

  useEffect(() => {
    /* istanbul ignore else */
    if (initialSelectedItems?.length) {
      const initialSelected: { [uid: string]: boolean } = {}

      initialSelectedItems.forEach((item) => {
        const key = keyFn(item)
        initialSelected[key] = true
      })
      setSelected(initialSelected)
    }
    if (props.disabledItems?.length) {
      const initialDisabled: { [uid: string]: boolean } = {}

      props.disabledItems.forEach((item) => {
        const key = keyFn(item)
        initialDisabled[key] = true
      })
      setDisabled(initialDisabled)
    }
  }, [props.disabledItems, initialSelectedItems, keyFn])

  useLayoutEffect(() => {
    setSelected((selected) => {
      const newSelected = (items ?? []).reduce((newSelected, item) => {
        const itemKey = keyFn(item)
        /* istanbul ignore if */
        if (selected[itemKey]) {
          newSelected[itemKey] = true
        }
        return newSelected
      }, {} as { [uid: string]: boolean })
      if (Object.keys(newSelected).length !== Object.keys(selected).length) {
        // Only update the selected object to the newSelected object if it changed
        selected = newSelected
      }
      return selected
    })
  }, [items, keyFn])

  const { tableItems, totalCount } = useMemo<{
    tableItems: ITableItem<T>[]
    totalCount: number
  }>(() => {
    /* istanbul ignore if */
    if (!items) return { tableItems: [], totalCount: 0 }
    let filteredItems: T[] = items
    if (filters.length && Object.keys(filterSelections).length) {
      const filterCategories = Object.keys(filterSelections)
      filteredItems = items.filter((item: T) => {
        let isFilterMatch = true
        // Item must match 1 filter of each category
        filterCategories.forEach((filter: string) => {
          const filterItem: ITableFilter<T> | undefined = filters.find((filterItem) => filterItem.id === filter)
          /* istanbul ignore next */
          const isMatch = filterItem?.tableFilterFn(filterSelections[filter], item) ?? true
          if (!isMatch) {
            isFilterMatch = false
          }
        })
        return isFilterMatch
      })
    }
    const tableItems = filteredItems.map((item) => {
      const key = keyFn(item)
      const subRows = addSubRows?.(item)
      // Establish key for subrow based on parent row
      subRows?.map((row, idx) => (row.props = { key: `${key}-subrow-${idx}` }))

      const tableItem: ITableItem<T> = { item, subRows, key }
      for (let i = 0; i < selectedSortedCols.length; i++) {
        const column = selectedSortedCols[i]
        if (column.search) {
          if (typeof column.search === 'string') {
            tableItem[`column-${i}`] = get(item as unknown as Record<string, unknown>, column.search)
          } else {
            tableItem[`column-${i}`] = column.search(item)
          }
        }
      }
      return tableItem
    })
    return { tableItems, totalCount: tableItems.length }
  }, [items, selectedSortedCols, addSubRows, keyFn, filters, filterSelections])

  const { filtered, filteredCount } = useMemo<{
    filtered: ITableItem<T>[]
    filteredCount: number
  }>(() => {
    let threshold = 0.3
    if (props.fuseThreshold != undefined) {
      threshold = props.fuseThreshold
    }
    if (internalSearch && internalSearch !== '') {
      const fuse = new Fuse(tableItems, {
        ignoreLocation: true,
        threshold: threshold,
        keys: columns
          .map((column, i) => (column.search ? `column-${i}` : undefined))
          .filter((value) => value !== undefined) as string[],
        // TODO use FuseOptionKeyObject to allow for weights
      })
      const filtered = fuse.search<ITableItem<T>>(internalSearch).map((result) => result.item)
      return { filtered, filteredCount: filtered.length }
    } else {
      return { filtered: tableItems, filteredCount: totalCount }
    }
  }, [props.fuseThreshold, internalSearch, tableItems, columns, totalCount])

  const { sorted, itemCount } = useMemo<{
    sorted: ITableItem<T>[]
    itemCount: number
  }>(() => {
    const sorted: ITableItem<T>[] = [...filtered]
    if (sort && sort.index !== undefined) {
      const compare = selectedSortedCols[sort.index].sort
      /* istanbul ignore else */
      if (compare) {
        if (typeof compare === 'string') {
          sorted.sort(compareItems(`item.${compare}`))
        } else {
          sorted.sort((a, b) => compare(a.item, b.item))
        }
      }
      if (sort.direction === SortByDirection.desc) {
        sorted.reverse()
      }
    }
    return { sorted, itemCount: sorted.length }
  }, [filtered, sort, selectedSortedCols])

  const actualPage = useMemo<number>(() => {
    const start = (page - 1) * perPage
    let actualPage = page
    if (start >= sorted.length) {
      actualPage = Math.max(1, Math.ceil(sorted.length / perPage))
    }
    return actualPage
  }, [sorted, page, perPage])

  useEffect(() => {
    if (page !== actualPage) {
      setPage(actualPage)
    }
  }, [page, actualPage, setPage])

  const paged = useMemo<ITableItem<T>[]>(() => {
    const start = (actualPage - 1) * perPage
    return sorted.slice(start, start + perPage)
  }, [sorted, actualPage, perPage])

  const { rows, addedSubRowCount } = useMemo<{ rows: IRow[]; addedSubRowCount: number }>(() => {
    const newRows: IRow[] = []
    const itemToCells = (item: T, key: string) =>
      selectedSortedCols.map((column) => {
        return typeof column.cell === 'string'
          ? get(item as Record<string, unknown>, column.cell)
          : { title: <Fragment key={key}>{column.cell(item)}</Fragment> }
      })
    let addedSubRowCount = 0
    paged.forEach((tableItem, i) => {
      const { item, key, subRows } = tableItem
      const isOpen = expanded[key] ?? (subRows?.length ? false : undefined)

      newRows.push({
        isOpen,
        selected: selected[key] === true,
        props: { key },
        disableSelection: disabled[key] === true,
        cells: itemToCells(item, key),
      })
      if (subRows) {
        subRows.forEach((subRow) => newRows.push({ ...subRow, parent: i + addedSubRowCount }))
        addedSubRowCount += subRows.length
      }
    })
    return { rows: newRows, addedSubRowCount }
  }, [paged, selectedSortedCols, expanded, selected, disabled])

  const onCollapse = useMemo<((_event: unknown, rowIndex: number, isOpen: boolean) => void) | undefined>(() => {
    if (addSubRows && addedSubRowCount) {
      return (_event, rowIndex, isOpen) => {
        /* istanbul ignore next */
        if (!rows[rowIndex] && isOpen) {
          // Expand all
          let tempExpanded = {}
          rows.forEach((_, idx) => {
            const rowKey = rows[idx]?.props?.key.toString()
            tempExpanded = rowKey ? { ...tempExpanded, [rowKey]: true } : tempExpanded
          })
          setExpanded(tempExpanded)
        } else if (!rows[rowIndex] && !isOpen) {
          // Collapse all
          setExpanded({})
        } else if (rows[rowIndex]) {
          // Expand/collpase single row
          const rowKey = rows[rowIndex].props.key.toString()
          setExpanded({ ...expanded, [rowKey]: isOpen })
        }
      }
    }
    return undefined
  }, [rows, addedSubRowCount, expanded, addSubRows])

  // Compensate for PF auto-added columns
  // sort state always contains the data index
  // adjustedSort and the updateSort callback compensate for header display index used in PF
  /* istanbul ignore next */
  const hasSelectionColumn =
    tableActions?.some((action) => action.variant === 'action-group' || action.variant === 'bulk-action') ||
    !!propsOnSelect
  const adjustedSortIndexOffset = (hasSelectionColumn ? 1 : 0) + (onCollapse ? 1 : 0)
  const adjustedSort =
    sort && sort.index !== undefined && sort.index !== null && sort.direction && filtered.length > 0
      ? {
          index: sort.index + adjustedSortIndexOffset,
          direction: sort.direction,
        }
      : sort

  const clearSearch = useCallback(() => {
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'test') {
      ;(setInternalSearchWithDebounce as unknown as ReturnType<typeof debounce>).clear()
    }
    setSearch('')
    setInternalSearch('')
    setPage(1)
    if (preFilterSort) {
      setSort(preFilterSort)
    }
  }, [setSearch, setPage, preFilterSort, setInternalSearchWithDebounce, setSort])

  const clearSearchAndFilters = useCallback(() => {
    clearSearch()
    clearFilters()
  }, [clearSearch, clearFilters])

  const updateSearch = useCallback(
    (input: any) => {
      // **Note: PatternFly change the fn signature
      // From: (value: string, event: React.FormEvent<HTMLInputElement>) => void
      // To: (_event: React.FormEvent<HTMLInputElement>, value: string) => void
      // both cases need to be handled for backwards compatibility
      const newSearch = typeof input === 'string' ? input : (input.target as HTMLInputElement).value
      setSearch(newSearch)
      setPage(1)
      if (!newSearch) {
        // clearing filtered state; restore previous sorting if applicable
        if (preFilterSort) {
          setSort(preFilterSort)
        }
      } else if (!search) {
        // entering a filtered state; save sort setting use fuzzy match sort
        setPreFilterSort(sort)
        setSort({})
      }
    },
    // setSort/setSearch/setPage can come from props, but setPreFilterSort is only from state and therefore
    // guaranteed stable - not needed in dependency list
    [search, sort, preFilterSort, setSort, setSearch, setPage]
  )

  const updateSort = useCallback(
    (newSort: ISortBy) => {
      if (filtered.length === 0) {
        setSort(newSort)
      } else {
        setSort({
          index: (newSort && newSort.index ? newSort.index : 0) - adjustedSortIndexOffset,
          direction: newSort && newSort.direction,
        })
      }
      if (internalSearch) {
        // sort changed while filtering; forget previous setting
        setPreFilterSort(undefined)
      }
    },
    [filtered.length, internalSearch, setSort, adjustedSortIndexOffset]
  )

  const updatePerPage = useCallback(
    (newPerPage: number) => {
      // keep the first item in view on pagination size change
      const newPage = Math.floor(((page - 1) * perPage) / newPerPage) + 1
      setPage(newPage)
      setPerPage(newPerPage)
    },
    [page, perPage, setPage, setPerPage]
  )

  const onSelect = useCallback(
    (_event: FormEvent, isSelected: boolean, rowId: number) => {
      const newSelected = { ...selected }
      if (isSelected) {
        newSelected[rows[rowId].props.key] = true
      } else {
        delete newSelected[rows[rowId].props.key]
      }
      setSelected(newSelected)
      /* istanbul ignore next */
      if (propsOnSelect && items) {
        propsOnSelect(items.filter((item) => newSelected[keyFn(item)]))
      }
    },
    [items, propsOnSelect, selected, rows, keyFn]
  )

  const resolveTableItem = useCallback(
    (rowData: IRowData, rowId: number): ITableItem<T> | undefined => {
      if (addSubRows) {
        return rowData.props?.key && filtered.find((tableItem) => tableItem.key === rowData.props.key)
      } else {
        return paged[rowId]
      }
    },
    [addSubRows, filtered, paged]
  )

  // Function to parse provided actions from AcmTable IAcmRowAction --> Patternfly Table IAction
  const parseRowAction = useCallback(
    (rowActions: IAcmRowAction<T>[]) => {
      const actions: IAction[] = []
      rowActions.forEach((action) => {
        // Add separator if specified
        if (action.addSeparator) {
          actions.push({
            isSeparator: true,
          })
        }

        actions.push({
          title: action.tooltip ? (
            <DropdownItem
              isAriaDisabled={action.isDisabled}
              tooltip={action.tooltip}
              tooltipProps={action.tooltipProps}
              style={{ padding: 0, cursor: action.isDisabled ? 'not-allowed' : 'pointer' }}
            >
              {action.title}
            </DropdownItem>
          ) : (
            action.title
          ),
          isAriaDisabled: action.isDisabled ? true : false,
          onClick: action.isDisabled
            ? undefined
            : (_event: React.MouseEvent, rowId: number, rowData: IRowData) => {
                const tableItem = resolveTableItem(rowData, rowId)
                if (tableItem) {
                  action.click(tableItem.item)
                }
              },
        })
      })
      return actions
    },
    [resolveTableItem]
  )

  // Parse static actions
  const actions = useMemo(() => parseRowAction(rowActions), [parseRowAction, rowActions])

  // Wrap provided action resolver
  const actionResolver = useMemo(
    () =>
      rowActionResolver
        ? (rowData: IRowData, extraData: IExtraData) => {
            const tableItem = resolveTableItem(rowData, extraData.rowIndex!)
            if (tableItem) {
              return parseRowAction(rowActionResolver(tableItem.item))
            }
            return []
          }
        : undefined,
    [parseRowAction, resolveTableItem, rowActionResolver]
  )

  const filtersHash = useMemo(() => hash(filters), [filters])

  const hasSearch = useMemo(() => columns.some((column) => column.search), [columns])
  const hasFilter = filters && filters.length > 0
  const hasItems = items && items.length > 0 && filtered
  const showToolbar = props.showToolbar !== false ? hasItems : false
  const topToolbarStyle = items ? {} : { paddingBottom: 0 }

  const translatedPaginationTitles = usePaginationTitles()

  return (
    <Fragment>
      {props.extraToolbarControls && (
        <Toolbar style={topToolbarStyle} inset={{ default: 'insetMd', xl: 'insetLg' }}>
          <ToolbarContent>
            <ToolbarGroup alignment={{ default: 'alignRight' }}>
              <ToolbarItem>{props.extraToolbarControls}</ToolbarItem>
            </ToolbarGroup>
          </ToolbarContent>
        </Toolbar>
      )}
      {showToolbar && (
        <Toolbar
          clearFiltersButtonText={t('Clear all filters')}
          key={filtersHash} // reset state if filters change
          clearAllFilters={clearSearchAndFilters}
          collapseListedFiltersBreakpoint={'lg'}
          inset={{ default: 'insetMd', xl: 'insetLg' }}
        >
          <ToolbarContent>
            {hasSelectionColumn && (
              <ToolbarItem>
                <TableSelectionDropdown
                  itemCount={itemCount}
                  selectedCount={Object.keys(selected).length}
                  perPage={perPage}
                  onSelectNone={() => {
                    const newSelected: { [uid: string]: boolean } = {}
                    setSelected(newSelected)
                  }}
                  onSelectPage={() => {
                    const newSelected: { [uid: string]: boolean } = {}
                    for (const tableItem of paged) {
                      newSelected[tableItem.key] = true
                    }
                    setSelected(newSelected)
                    /* istanbul ignore next */
                    if (propsOnSelect && items) {
                      propsOnSelect(items.filter((item) => newSelected[keyFn(item)]))
                    }
                  }}
                  onSelectAll={() => {
                    const newSelected: { [uid: string]: boolean } = {}
                    for (const tableItem of filtered) {
                      if (!disabled[tableItem.key]) {
                        newSelected[tableItem.key] = true
                      }
                    }
                    setSelected(newSelected)
                    /* istanbul ignore next */
                    if (propsOnSelect && items) {
                      propsOnSelect(items.filter((item) => newSelected[keyFn(item)]))
                    }
                  }}
                />
              </ToolbarItem>
            )}
            {(hasFilter || hasSearch) && (
              <ToolbarGroup variant="filter-group">
                {hasSearch && (
                  <ToolbarItem variant="search-filter">
                    <SearchInput
                      placeholder={searchPlaceholder}
                      value={search}
                      onChange={updateSearch}
                      onClear={clearSearch}
                      resultsCount={`${search === internalSearch ? filteredCount : '-'} / ${totalCount}`}
                      style={{ flexGrow: 1 }}
                    />
                  </ToolbarItem>
                )}
                {hasFilter && <TableColumnFilters id={id} filters={filters} items={items} />}
              </ToolbarGroup>
            )}
            {props.tableActionButtons && props.tableActionButtons.length > 0 && (
              <TableActionsButtons
                actions={props.tableActionButtons}
                hasSelections={Object.keys(selected).length > 0}
              />
            )}
            {tableActions.length > 0 && (
              <TableActions actions={tableActions} selections={selected} items={items} keyFn={keyFn} />
            )}
            {showColumManagement && (
              <AcmManageColumn<T>
                {...{ selectedColIds, setSelectedColIds, requiredColIds, defaultColIds, setColOrderIds, colOrderIds }}
                allCols={columns.filter((col) => !col.isActionCol)}
              />
            )}
            {customTableAction}
            {(!props.autoHidePagination || filtered.length > perPage) && (
              <ToolbarItem variant="pagination">
                <Pagination
                  titles={translatedPaginationTitles}
                  itemCount={itemCount}
                  perPage={perPage}
                  page={page}
                  variant={PaginationVariant.top}
                  onSetPage={(_event, page) => setPage(page)}
                  onPerPageSelect={(_event, perPage) => updatePerPage(perPage)}
                  aria-label={t('Pagination top')}
                  isCompact
                />
              </ToolbarItem>
            )}
          </ToolbarContent>
        </Toolbar>
      )}
      {!items || !rows || !filtered || !paged ? (
        <PageSection variant="light" padding={{ default: 'noPadding' }}>
          <EmptyState>
            <EmptyStateIcon variant="container" component={Spinner} />
            <Title size="lg" headingLevel="h4">
              {t('Loading')}
            </Title>
          </EmptyState>
        </PageSection>
      ) : items.length === 0 ? (
        props.emptyState && (
          <PageSection variant={props.extraToolbarControls ? 'light' : 'default'} padding={{ default: 'noPadding' }}>
            {props.emptyState}
          </PageSection>
        )
      ) : (
        <Fragment>
          <div ref={outerDivRef} className={outerDivClass}>
            <div ref={tableDivRef} className={tableDivClass}>
              <Table
                className={tableClass}
                cells={selectedSortedCols.map((column) => {
                  return {
                    title: column.header,
                    header: column.tooltip
                      ? {
                          info: {
                            popover: column.tooltip,
                          },
                        }
                      : {},
                    transforms: [nowrap, ...(column.transforms || []), ...(column.sort ? [sortable] : [])],
                    cellTransforms: column.cellTransforms || [],
                    cellFormatters: onCollapse ? [expandable] : [],
                  }
                })}
                rows={rows}
                rowWrapper={OuiaIdRowWrapper}
                actionResolver={actionResolver}
                actions={actions}
                aria-label={t('Simple Table')}
                sortBy={adjustedSort}
                onSort={(_event, index, direction) => updateSort({ index, direction })}
                onSelect={
                  /* istanbul ignore next */
                  rows.length &&
                  (tableActions?.some(
                    (action) => action.variant === 'action-group' || action.variant === 'bulk-action'
                  ) ||
                    !!propsOnSelect)
                    ? onSelect
                    : undefined
                }
                canSelectAll={false}
                onCollapse={onCollapse}
                borders={!props.noBorders}
                variant={TableVariant.compact}
                gridBreakPoint={gridBreakPoint ?? breakpoint}
              >
                <TableHeader />
                <TableBody />
              </Table>
            </div>
          </div>
          {!filtered.length && (
            <PageSection variant="light" padding={{ default: 'noPadding' }}>
              <AcmEmptyState
                title={t('No results found')}
                message={t('No results match the filter criteria. Clear filters to show results.')}
                showSearchIcon={true}
                action={
                  <AcmButton variant="link" onClick={clearSearchAndFilters}>
                    {t('Clear all filters')}
                  </AcmButton>
                }
              />
            </PageSection>
          )}
          {(!props.autoHidePagination || filtered.length > perPage) && (
            <Pagination
              titles={translatedPaginationTitles}
              itemCount={itemCount}
              perPage={perPage}
              page={page}
              variant={PaginationVariant.bottom}
              onSetPage={/* istanbul ignore next */ (_event, page) => setPage(page)}
              onPerPageSelect={/* istanbul ignore next */ (_event, perPage) => updatePerPage(perPage)}
              aria-label={t('Pagination bottom')}
            />
          )}
        </Fragment>
      )}
    </Fragment>
  )
}

function TableColumnFilters<T>(props: Readonly<{ id?: string; filters: ITableFilter<T>[]; items?: T[] }>) {
  const [isOpen, setIsOpen] = useState(false)
  const { id, filters, items } = props
  const { filterSelections, addFilterValue, removeFilterValue, removeFilter } = useTableFilterSelections({
    id,
    filters,
  })
  const { t } = useTranslation()

  const onFilterSelect = useCallback(
    (selection: FilterSelectOptionObject) => {
      const { filterId, value } = selection
      if (filterSelections[filterId]?.includes(value)) {
        removeFilterValue(filterId, value)
      } else {
        addFilterValue(filterId, value)
      }
    },
    [addFilterValue, filterSelections, removeFilterValue]
  )

  const onDelete = useCallback(
    (filter: string, chip: ToolbarChip) => {
      removeFilterValue(filter, chip.key)
    },
    [removeFilterValue]
  )

  const onDeleteGroup = useCallback(
    (filter: string) => {
      removeFilter(filter)
    },
    [removeFilter]
  )

  const selections = useMemo(() => {
    return Object.keys(filterSelections).reduce(
      (acc: FilterSelectOptionObject[], filterId: string) =>
        acc.concat(filterSelections[filterId].map((value) => createFilterSelectOptionObject(filterId, value))),
      []
    )
  }, [filterSelections])

  const filterSelectGroups = useMemo(() => {
    const validFilters: {
      filter: ITableFilter<T>
      options: { option: TableFilterOption<string>; count: number }[]
    }[] = []
    for (const filter of filters) {
      const options: { option: TableFilterOption<string>; count: number }[] = []
      for (const option of filter.options) {
        /* istanbul ignore next */
        const count = items?.filter((item) => filter.tableFilterFn([option.value], item)).length
        /* istanbul ignore next */
        if (
          filter.showEmptyOptions ||
          (count !== undefined && count > 0) ||
          // if option is selected, it may be impacting results, so always show it even if options with 0 matches are being filtered
          selections.find((selection) => selection.filterId === filter.id && selection.value === option.value)
        ) {
          options.push({ option, count: count ?? 0 })
        }
      }
      /* istanbul ignore else */
      if (options.length) {
        validFilters.push({ filter, options })
      }
    }

    return validFilters.map((filter) => (
      <SelectGroup key={filter.filter.id} label={filter.filter.label}>
        {filter.options.map((option) => {
          const key = `${filter.filter.id}-${option.option.value}`
          return (
            <SelectOption
              key={key}
              inputId={key}
              value={createFilterSelectOptionObject(filter.filter.id, option.option.value)}
            >
              <div className={filterOption}>
                {option.option.label}
                <Badge className={filterOptionBadge} key={key} isRead>
                  {option.count}
                </Badge>
              </div>
            </SelectOption>
          )
        })}
      </SelectGroup>
    ))
  }, [filters, items, selections])

  return (
    <ToolbarItem>
      {filters.reduce(
        (acc, current) => (
          <ToolbarFilter
            key={'acm-table-filter-key'}
            chips={current.options
              .filter((option: TableFilterOption<string>) => {
                const currentCategorySelected = filterSelections[current.id] ?? []
                return currentCategorySelected.includes(option.value)
              })
              .map<ToolbarChip>((option: TableFilterOption<string>) => {
                return { key: option.value, node: option.label }
              })}
            deleteChip={(_category, chip) => {
              chip = chip as ToolbarChip
              onDelete(current.id, chip)
            }}
            deleteChipGroup={() => onDeleteGroup(current.id)}
            categoryName={current.label}
          >
            {acc}
          </ToolbarFilter>
        ),
        <Select
          key={'acm-table-filter-select-key'}
          variant={SelectVariant.checkbox}
          aria-label={'acm-table-filter-select-key'}
          onToggle={() => setIsOpen(!isOpen)}
          onSelect={(
            _event: React.MouseEvent<Element, MouseEvent> | React.ChangeEvent<Element>,
            selection: SelectOptionObject
          ) => onFilterSelect(selection as FilterSelectOptionObject)}
          selections={selections}
          isOpen={isOpen}
          isGrouped
          placeholderText={
            <div>
              <FilterIcon className={filterLabelMargin} />
              {t('Filter')}
            </div>
          }
          noResultsFoundText={t('No results found')}
        >
          {filterSelectGroups}
        </Select>
      )}
    </ToolbarItem>
  )
}

function TableActions<T>(props: {
  actions: IAcmTableAction<T>[]
  selections: { [uid: string]: boolean }
  items: T[] | undefined
  keyFn: (item: T) => string
}) {
  const { actions, selections, items, keyFn } = props
  /* istanbul ignore if */
  if (actions.length === 0) return <Fragment />
  return <TableActionsDropdown actions={actions} selections={selections} items={items} keyFn={keyFn} />
}

function TableActionsButtons(props: { actions: IAcmTableButtonAction[]; hasSelections?: boolean }) {
  return (
    <ToolbarGroup variant="button-group">
      {props.actions.map((action) => {
        /* istanbul ignore next */
        const variant = props.hasSelections ? 'secondary' : action.variant
        return (
          <ToolbarItem key={`${action.id}-toolbar-item`}>
            <AcmButton
              id={action.id}
              key={action.id}
              onClick={action.click}
              isDisabled={action.isDisabled}
              tooltip={action.tooltip}
              variant={variant}
            >
              {action.title}
            </AcmButton>
          </ToolbarItem>
        )
      })}
    </ToolbarGroup>
  )
}

function TableActionsDropdown<T>(props: {
  actions: IAcmTableAction<T>[] | IAcmTableBulkAction<T>[]
  selections: { [uid: string]: boolean }
  items: T[] | undefined
  keyFn: (item: T) => string
  // showTableButtons?: boolean
}) {
  /* istanbul ignore next */
  const { actions, selections = {}, items = [], keyFn } = props
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()
  function DropdownItems(
    actions: IAcmTableAction<T>[] | IAcmTableBulkAction<T>[],
    selections: { [uid: string]: boolean },
    items: T[],
    keyFn: (item: T) => string
  ) {
    return actions.map((action: IAcmTableAction<T> | IAcmTableBulkAction<T>) => {
      switch (action.variant) {
        case 'dropdown-action':
          return (
            <DropdownItem
              id={action.id}
              key={action.id}
              onClick={() => {
                setOpen(false)
                action.click(items!.filter((item) => selections[keyFn(item)]))
              }}
              isDisabled={
                /* istanbul ignore next */
                typeof action.isDisabled === 'boolean' ? action.isDisabled : action.isDisabled?.(items)
              }
              tooltip={action.tooltip}
            >
              {action.title}
            </DropdownItem>
          )
        case 'bulk-action':
          return (
            <DropdownItem
              id={action.id}
              key={action.id}
              onClick={() => {
                setOpen(false)
                action.click(items!.filter((item) => selections[keyFn(item)]))
              }}
              isDisabled={
                /* istanbul ignore next */
                (typeof action.isDisabled === 'boolean' ? action.isDisabled : action.isDisabled?.(items)) ||
                (selections && Object.keys(selections).length === 0)
              }
              tooltip={action.tooltip}
            >
              {action.title}
            </DropdownItem>
          )
        case 'action-seperator':
          return <DropdownSeparator id={action.id} key={action.id} />
        case 'action-group':
          return (
            <DropdownGroup id={action.id} key={action.id} label={action.title}>
              {DropdownItems(action.actions, selections, items, keyFn)}
            </DropdownGroup>
          )
        /* istanbul ignore next */
        default:
          return <Fragment />
      }
    })
  }

  return (
    <Dropdown
      toggle={
        <DropdownToggle
          id="toggle-id"
          onToggle={() => setOpen(!open)}
          toggleIndicator={CaretDownIcon}
          isPrimary={Object.keys(selections).length > 0}
        >
          {t('Actions')}
        </DropdownToggle>
      }
      isOpen={open}
      dropdownItems={DropdownItems(actions, selections, items, keyFn)}
    />
  )
}

export function compareItems(path: string) {
  return (a: unknown, b: unknown) => {
    return compareUnknowns(get(a as Record<string, unknown>, path), get(b as Record<string, unknown>, path))
  }
}

export function compareUnknowns(a: unknown | undefined | null, b: unknown | undefined | null) {
  /* istanbul ignore next */
  if (a == undefined && b == undefined) return 0
  /* istanbul ignore next */
  if (a == undefined) return 1
  /* istanbul ignore next */
  if (b == undefined) return -1

  /* istanbul ignore else */
  if (typeof a === 'string') {
    /* istanbul ignore else */
    if (typeof b === 'string') {
      return compareStrings(a, b)
    } else if (typeof b === 'number') {
      return compareStrings(a, b.toString())
    }
  } else if (typeof a === 'number') {
    /* istanbul ignore else */
    if (typeof b === 'number') {
      return compareNumbers(a, b)
    } else if (typeof b === 'string') {
      return compareStrings(a.toString(), b)
    }
  }
  /* istanbul ignore next */
  return 0
}

/* istanbul ignore next */
export function compareStrings(a: string | undefined | null, b: string | undefined | null) {
  if (a == undefined && b == undefined) return 0
  if (a == undefined) return 1
  if (b == undefined) return -1
  return a < b ? -1 : a > b ? 1 : 0
}

/* istanbul ignore next */
export function compareNumbers(a: number | undefined | null, b: number | undefined | null) {
  if (a == undefined && b == undefined) return 0
  if (a == undefined) return 1
  if (b == undefined) return -1
  return a < b ? -1 : a > b ? 1 : 0
}

export interface TableSelectionDropdownProps {
  itemCount: number
  selectedCount: number
  perPage: number
  onSelectNone: () => void
  onSelectPage: () => void
  onSelectAll: () => void
}

export function TableSelectionDropdown(props: TableSelectionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { itemCount, perPage, selectedCount, onSelectAll, onSelectNone, onSelectPage } = props
  const [t] = useTranslation()
  const onToggleCheckbox = useCallback(() => {
    if (selectedCount > 0) onSelectNone()
    else onSelectAll()
  }, [selectedCount, onSelectNone, onSelectAll])

  const toggleText = useMemo(() => {
    return selectedCount > 0 ? t('{{count}} selected', { count: selectedCount }) : ''
  }, [selectedCount, t])

  const toggle = useMemo(() => {
    return (
      <DropdownToggle
        splitButtonItems={[
          <DropdownToggleCheckbox
            id="select-all"
            key="select-all"
            aria-label={t('Select all')}
            isChecked={selectedCount > 0}
            onChange={onToggleCheckbox}
          >
            {toggleText}
          </DropdownToggleCheckbox>,
        ]}
        onToggle={(isOpen) => setIsOpen(isOpen)}
      />
    )
  }, [t, selectedCount, onToggleCheckbox, toggleText])

  const selectNoneDropdownItem = useMemo(() => {
    return (
      <DropdownItem
        id="select-none"
        key="select-none"
        onClick={() => {
          onSelectNone()
          setIsOpen(false)
        }}
      >
        {t('Select none')}
      </DropdownItem>
    )
  }, [onSelectNone, t])

  const selectPageDropdownItem = useMemo(() => {
    return (
      <DropdownItem
        id="select-page"
        key="select-page"
        onClick={() => {
          onSelectPage()
          setIsOpen(false)
        }}
      >
        {t('Select page ({{count}} items)', { count: Math.min(perPage, itemCount) })}
      </DropdownItem>
    )
  }, [t, perPage, itemCount, onSelectPage])

  const selectAllDropdownItem = useMemo(() => {
    return (
      <DropdownItem
        id="select-all"
        key="select-all"
        onClick={() => {
          onSelectAll()
          setIsOpen(false)
        }}
      >
        {t('Select all ({{count}} items)', { count: itemCount })}
      </DropdownItem>
    )
  }, [t, itemCount, onSelectAll])

  const dropdownItems = useMemo(
    () => [selectNoneDropdownItem, selectPageDropdownItem, selectAllDropdownItem],
    [selectNoneDropdownItem, selectPageDropdownItem, selectAllDropdownItem]
  )

  return <Dropdown isOpen={isOpen} toggle={toggle} dropdownItems={dropdownItems} />
}
