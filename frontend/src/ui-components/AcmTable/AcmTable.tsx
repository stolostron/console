/* Copyright Contributors to the Open Cluster Management project */

import { css } from '@emotion/css'
import {
  Badge,
  ButtonVariant,
  MenuToggle,
  PageSection,
  Pagination,
  PaginationProps,
  PaginationVariant,
  PerPageOptions,
  Skeleton,
  Toolbar,
  ToolbarChip,
  ToolbarContent,
  ToolbarFilter,
  ToolbarGroup,
  ToolbarItem,
  Tooltip,
  TooltipPosition,
  TooltipProps,
} from '@patternfly/react-core'
import {
  Dropdown,
  DropdownItem,
  DropdownToggle,
  DropdownToggleCheckbox,
  Select,
  SelectGroup,
  SelectOption,
  SelectOptionObject,
  SelectVariant,
} from '@patternfly/react-core/deprecated'
import { EllipsisVIcon, ExportIcon, FilterIcon } from '@patternfly/react-icons'
import { css as cssPF } from '@patternfly/react-styles'
import {
  ActionsColumn,
  CustomActionsToggleProps,
  ExpandableRowContent,
  IAction,
  IExtraData,
  IRow,
  IRowCell,
  IRowData,
  ISortBy,
  ITransform,
  nowrap,
  SortByDirection,
  Table,
  TableGridBreakpoint,
  TableVariant,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@patternfly/react-table'
import useResizeObserver from '@react-hook/resize-observer'
import { debounce } from 'debounce'
import Fuse from 'fuse.js'
import get from 'get-value'
import { mergeWith } from 'lodash'
import { parse, ParsedQuery, stringify } from 'query-string'
import {
  cloneElement,
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
import { useLocation, useNavigate } from 'react-router-dom-v5-compat'
import { HighlightSearchText } from '../../components/HighlightSearchText'
import { useTranslation } from '../../lib/acm-i18next'
import { usePaginationTitles } from '../../lib/paginationStrings'
import { PluginContext } from '../../lib/PluginContext'
import { FilterCounts, IRequestListView, IResultListView, IResultStatuses } from '../../lib/useAggregates'
import { createDownloadFile, matchesFilterValue, parseLabel, returnCSVSafeString } from '../../resources/utils'
import { IAlertContext } from '../AcmAlert/AcmAlert'
import { AcmToastContext } from '../AcmAlert/AcmToast'
import { AcmButton } from '../AcmButton/AcmButton'
import { AcmDropdown, AcmDropdownItems } from '../AcmDropdown'
import { AcmEmptyState } from '../AcmEmptyState/AcmEmptyState'
import { AcmSearchInput, SearchConstraint, SearchOperator } from '../AcmSearchInput'
import { AcmManageColumn } from './AcmManageColumn'
import { filterLabelMargin, filterOption, filterOptionBadge } from './filterStyles'

type SortFn<T> = (a: T, b: T) => number
type CellFn<T> = (item: T, search: string) => ReactNode
type SearchFn<T> = (item: T) => string | boolean | number | string[] | boolean[] | number[]

// when a filter has more then this many options, give it its own dropdown
const SPLIT_FILTER_THRESHOLD = 30
// so we don't create 3000 elements, only create this many
// with the assumption that if the user is looking for an option
// they will use filter to find it
const MAXIMUM_OPTIONS = 200

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

  /** exported value as a string, supported export: CSV*/
  exportContent?: CellFn<T>

  disableExport?: boolean

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

  // Used to supply export information for Sub Rows. If true, the table will include column item within the CSV export
  isSubRowExport?: boolean
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
export interface IAcmTableActionSeparator {
  id: string
  variant: 'action-separator'
}

/**
 * Type for table action dropdown options group
 */
export interface IAcmTableActionGroup<T> {
  id: string
  title: string | React.ReactNode
  actions: (IAcmTableBulkAction<T> | IAcmTableActionSeparator)[]
  variant: 'action-group'
}

export type IAcmTableAction<T> = IAcmTableBulkAction<T> | IAcmTableActionSeparator | IAcmTableActionGroup<T>

export interface ExportableIRow extends IRow {
  // content from subrow to include in export document
  exportSubRow?: {
    header: string
    exportContent: (item: any) => string
  }[]
}

interface ITableItem<T> {
  item: T
  key: string
  subRows?: ExportableIRow[]
  [key: string]: unknown
}

type FilterOptionValueT = string
type FilterSelection = FilterOptionValueT[]
type TableFilterOption<FilterOptionValueT> = { label: ReactNode; value: FilterOptionValueT }

type AdvancedFilterSelection = {
  operator: SearchOperator
  value: string
}

type CurrentFilters<S> = {
  [filter: string]: S
}

type TableFilterBase<T, S> = {
  /** unique identifier for the filter */
  id: string
  /** string displayed in the UI */
  label: string
  /** A required function that returns a boolean if the item is a match to the current filters */
  tableFilterFn: (selection: S, item: T) => boolean
}
export interface ITableFilter<T> extends TableFilterBase<T, FilterSelection> {
  /** Options is an array to define the exact filter options */
  options: TableFilterOption<FilterOptionValueT>[]
  showEmptyOptions?: boolean
  supportsInequality?: boolean
}
interface IValidFilters<T> {
  filter: ITableFilter<T>
  options: { option: TableFilterOption<string>; count: number }[]
}

export interface ITableAdvancedFilter<T> extends TableFilterBase<T, AdvancedFilterSelection> {
  availableOperators: SearchOperator[]
}

type TableFilterOptions = { option: TableFilterOption<string>; count: number }

// render filter options with highlights for searched filter text
// if option is a label like 'key=value', add a toggle button that toggles between = and !=
function renderFilterSelectOption(
  filterId: string,
  option: TableFilterOptions,
  supportsInequality?: boolean,
  toggleEquality?: (filterId: string, option: TableFilterOptions) => void,
  search?: string
) {
  const key = `${filterId}-${option.option.value}`
  const handleInequality = () => {
    toggleEquality?.(filterId, option)
  }
  return (
    <SelectOption key={key} inputId={key} value={createFilterSelectOptionObject(filterId, option.option.value)}>
      <div className={filterOption}>
        <HighlightSearchText
          text={(option.option.label as string) ?? '-'}
          supportsInequality={supportsInequality}
          toggleEquality={handleInequality}
          searchText={search}
        />
        <Badge className={filterOptionBadge} key={key} isRead>
          {option.count}
        </Badge>
      </div>
    </SelectOption>
  )
}

// filter options are retrieved from the url query and in the local storage
// but they maybe old, so we make sure they're still valid by matching them up
// with current filter options
function getValidFilterSelections<T>(
  filters: ITableFilter<T>[],
  selections: CurrentFilters<FilterSelection> | ParsedQuery<string>
) {
  const validSelections: CurrentFilters<FilterSelection> = {}
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
        const supportsInequality = !!filter.supportsInequality
        validSelections[key] = filterValues.filter((fv) => {
          const inx = filter.options.findIndex(({ value }) => matchesFilterValue(supportsInequality, value, fv))
          if (inx === -1) {
            removedOptions = true
            return false
          }
          return true
        }) as string[]

        // if none left
        if (validSelections[key].length === 0) {
          delete validSelections[key]
        }
      }
    }
  })
  return { validSelections, removedOptions }
}

export function useTableFilterSelections<T>({ id, filters }: { id?: string; filters: ITableFilter<T>[] }) {
  const tableFilterLocalStorageKey = id ? `acm-table-filter.${id}` : undefined

  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const [queuedSearch, setQueuedSearch] = useState<string | null>(null)

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
    (newFilters: CurrentFilters<FilterSelection>, saveFilters: boolean = true) => {
      const updatedParams = { ...filteredQueryParams, ...newFilters }
      const updatedSearch = stringify(updatedParams, { arrayFormat: 'comma' })
      const newSearch = updatedSearch ? `?${updatedSearch}` : ''

      if (search !== newSearch) {
        setQueuedSearch(newSearch)
      }

      if (saveFilters && tableFilterLocalStorageKey) {
        setLocalStorage(tableFilterLocalStorageKey, newFilters)
      }
    },
    [filteredQueryParams, search, tableFilterLocalStorageKey]
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

  // for filters that are labels (ex: key=value), toggle the label between = and !=
  const negateFilterValue = useCallback(
    (key: string, value: string) => {
      let newFilters
      if (!filterSelections[key]?.includes(value)) {
        const newFilter = { [key]: [value] }
        const { validSelections } = getValidFilterSelections(filters, newFilter)
        if (validSelections[key]?.length) {
          newFilters = { ...filterSelections, [key]: [...(filterSelections[key] || []), value] }
        }
      } else {
        newFilters = { ...filterSelections }
      }
      if (newFilters) {
        const inx = newFilters[key].findIndex((fv) => fv === value)
        const p = parseLabel(value)
        const toggledValue = `${p.prefix}${p.oper === '=' ? '!=' : '='}${p.suffix}`
        newFilters[key].splice(inx, 1, toggledValue)
        updateFilters(newFilters)
      }
    },
    [filterSelections, filters, updateFilters]
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

  useEffect(() => {
    if (queuedSearch !== null) {
      navigate({ pathname, search: queuedSearch }, { replace: true })
      setQueuedSearch(null)
    }
  }, [navigate, pathname, queuedSearch])

  return { filterSelections, addFilterValue, removeFilterValue, negateFilterValue, removeFilter, clearFilters }
}

function setLocalStorage(key: string | undefined, value: any) {
  try {
    window.localStorage.setItem(key as string, JSON.stringify(value))
  } catch {
    // catch possible errors
  }
}

function getLocalStorage(key: string | undefined, initialValue: object) {
  try {
    const value = window.localStorage.getItem(key as string)
    return value ? JSON.parse(value) : initialValue
  } catch {
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
      borderBottom: 'var(--pf-v5-c-table--border-width--base) solid var(--pf-v5-c-table--BorderColor)',
    },
  },
})

export const SEARCH_DEBOUNCE_TIME = 500

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

const findFilterMatch = <T, S>(filter: string, filterArray: TableFilterBase<T, S>[]) =>
  filterArray.find((filterItem) => filterItem.id === filter)

const applyFilters = <T, S>(
  items: ITableItem<T>[],
  filterSelections: CurrentFilters<S>,
  filterArray: TableFilterBase<T, S>[]
): ITableItem<T>[] => {
  const filterCategories = Object.keys(filterSelections)
  return items.filter(({ item }) =>
    filterCategories.every(
      (filter: string) => findFilterMatch(filter, filterArray)?.tableFilterFn(filterSelections[filter], item) ?? true
    )
  )
}

function mergeProps(...props: any) {
  const firstProps = props[0]
  const restProps = props.slice(1)

  if (!restProps.length) {
    return { ...firstProps }
  }

  return mergeWith({ ...firstProps }, ...restProps, (a: any, b: any, key: any) => {
    if (key === 'children') {
      if (a && b) {
        return cloneElement(a, {
          children: b,
        })
      }
      return { ...b, ...a }
    }

    if (key === 'className') {
      return cssPF(a, b)
    }

    return undefined
  })
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
  additionalToolbarItems?: ReactNode
  emptyState: ReactNode
  onSelect?: (items: T[]) => void
  initialPage?: number
  page?: number
  setPage?: (page: number) => void
  setRequestView?: (requestedView: IRequestListView) => void
  resultView?: IResultListView
  resultCounts?: IResultStatuses
  fetchExport?: (requestedExport: IRequestListView) => Promise<IResultListView | undefined>
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
  secondaryFilterIds?: string[]
  advancedFilters?: ITableAdvancedFilter<T>[]
  id?: string
  showColumnManagement?: boolean
  showExportButton?: boolean
  exportFilePrefix?: string
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
    additionalToolbarItems,
    filters = [],
    secondaryFilterIds,
    advancedFilters = [],
    gridBreakPoint,
    initialSelectedItems,
    onSelect: propsOnSelect,
    showColumnManagement,
    showExportButton,
    exportFilePrefix,
    setRequestView,
    resultView,
    resultCounts,
    fetchExport,
  } = props

  const defaultSort = {
    index: 0,
    direction: SortByDirection.asc,
  }
  const initialSort = props.initialSort || defaultSort
  const initialSearch = props.initialSearch || ''
  const { isPreProcessed, loading, emptyResult } = resultView || {}
  const { filterCounts } = resultCounts || {}

  const { t } = useTranslation()
  const toastContext = useContext(AcmToastContext)

  // table loading state
  const { dataContext } = useContext(PluginContext)
  const { loadStarted, loadCompleted } = useContext(dataContext)
  const [isLoading, setIsLoading] = useState(resultView ? loading : !loadCompleted)
  useEffect(() => {
    if (resultView) {
      setIsLoading(loading as boolean)
    } else {
      setIsLoading(!loadStarted || (!loadCompleted && (!items || items.length === 0)))
    }
  }, [items, loading, loadStarted, loadCompleted, resultView])

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
  const [activeAdvancedFilters, setActiveAdvancedFilters] = useState<SearchConstraint[]>([])
  const [pendingConstraints, setPendingConstraints] = useState<SearchConstraint[]>([
    { operator: undefined, value: '', columnId: '' },
  ])

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

    if (!showColumnManagement) {
      return columns
    }

    // sort column by column management order
    colOrderIds.forEach((id) => {
      const find = columns.find((col) => col.id === id)
      if (find) {
        sortedColumns.push(find)
      }
    })

    const sortedSelected = sortedColumns.filter((column) => {
      return selectedColIds.includes(column.id as string)
    })

    // Btn column is always the last
    const btn = columns.find((col) => col.isActionCol)
    if (btn) {
      sortedSelected.push(btn)
    }

    return sortedSelected
  }, [columns, selectedColIds, colOrderIds, showColumnManagement])

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
      const newSelected = (items ?? []).reduce(
        (newSelected, item) => {
          const itemKey = keyFn(item)
          /* istanbul ignore if */
          if (selected[itemKey]) {
            newSelected[itemKey] = true
          }
          return newSelected
        },
        {} as { [uid: string]: boolean }
      )
      if (Object.keys(newSelected).length !== Object.keys(selected).length) {
        // Only update the selected object to the newSelected object if it changed
        selected = newSelected
      }
      return selected
    })
  }, [items, keyFn])

  // when paging items from backend
  // send request to backend
  const filterSelectionsStr = JSON.stringify(filterSelections)
  useEffect(() => {
    if (setRequestView && isPreProcessed) {
      setRequestView({
        page,
        perPage,
        search: internalSearch,
        filters: JSON.parse(filterSelectionsStr),
        sortBy: sort,
      })
    }
  }, [filterSelectionsStr, internalSearch, isPreProcessed, page, perPage, setRequestView, sort])

  const { tableItems, totalCount, allTableItems } = useMemo<{
    tableItems: ITableItem<T>[]
    totalCount: number
    allTableItems: ITableItem<T>[]
  }>(() => {
    /* istanbul ignore if */
    if (!items) return { tableItems: [], totalCount: 0, allTableItems: [] }

    const unfilteredTableItems: ITableItem<T>[] = items.map((item) => {
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
    let filteredTableItems: ITableItem<T>[] = unfilteredTableItems

    // if using a result view from backend, the items have already been filtered
    if (!isPreProcessed) {
      if (filters.length && Object.keys(filterSelections).length) {
        filteredTableItems = applyFilters(unfilteredTableItems, filterSelections, filters)
      }

      // advanced filtering
      const advancedFilterSelections: CurrentFilters<AdvancedFilterSelection> = {}
      activeAdvancedFilters.forEach(({ columnId, value, operator }) => {
        if (columnId && value && operator) {
          advancedFilterSelections[columnId] = { operator, value }
        }
      })

      if (advancedFilters.length && Object.keys(advancedFilterSelections).length) {
        filteredTableItems = applyFilters(unfilteredTableItems, advancedFilterSelections, advancedFilters)
      }
    }

    return {
      tableItems: filteredTableItems,
      totalCount: (isPreProcessed && resultCounts?.itemCount) || filteredTableItems.length,
      allTableItems: unfilteredTableItems,
    }
  }, [
    items,
    isPreProcessed,
    resultCounts?.itemCount,
    filters,
    filterSelections,
    keyFn,
    addSubRows,
    selectedSortedCols,
    activeAdvancedFilters,
    advancedFilters,
  ])

  const { filtered, filteredCount } = useMemo<{
    filtered: ITableItem<T>[]
    filteredCount: number
  }>(() => {
    let threshold = 0.3
    if (props.fuseThreshold != undefined) {
      threshold = props.fuseThreshold
    }
    // if using a result view from backend, the items have already been searched
    if (!isPreProcessed && internalSearch && internalSearch !== '') {
      const fuse = new Fuse(tableItems, {
        ignoreLocation: true,
        threshold: threshold,
        keys: columns
          .map((column, i) => (column.search ? `column-${i}` : undefined))
          .filter((value) => value !== undefined),
        // TODO use FuseOptionKeyObject to allow for weights
      })
      const filtered = fuse.search<ITableItem<T>>(internalSearch).map((result) => result.item)
      return { filtered, filteredCount: filtered.length }
    } else {
      return { filtered: tableItems, filteredCount: totalCount }
    }
  }, [props.fuseThreshold, isPreProcessed, internalSearch, tableItems, columns, totalCount])
  const { sorted, itemCount } = useMemo<{
    sorted: ITableItem<T>[]
    itemCount: number
  }>(() => {
    const sorted: ITableItem<T>[] = [...filtered]

    // if using a result view from backend, the items have already been sorted
    if (!isPreProcessed && sort?.index !== undefined) {
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
    return { sorted, itemCount: (isPreProcessed && resultCounts?.itemCount) || sorted.length }
  }, [filtered, isPreProcessed, sort, resultCounts?.itemCount, selectedSortedCols])

  const actualPage = useMemo<number>(() => {
    let actualPage = page

    // if using a result view from backend, actual page is determined by backend
    if (!isPreProcessed) {
      const start = (page - 1) * perPage
      if (start >= sorted.length) {
        actualPage = Math.max(1, Math.ceil(sorted.length / perPage))
      }
    }
    return actualPage
  }, [page, isPreProcessed, perPage, sorted.length])

  useEffect(() => {
    if (page !== actualPage) {
      setPage(actualPage)
    }
  }, [page, actualPage, setPage])

  const exportTable = useCallback(
    async (toastContext: IAlertContext) => {
      toastContext.addAlert({
        title: t('Generating data. Download may take a moment to start.'),
        type: 'info',
        autoClose: true,
      })

      const fileNamePrefix = exportFilePrefix ?? 'table-values'
      const headerString: string[] = []
      const csvExportCellArray: string[] = []

      columns.forEach(({ header, disableExport }) => {
        if (header && !disableExport) {
          headerString.push(header)
        }
      })
      allTableItems[0].subRows?.[0]?.exportSubRow?.forEach(({ header }) => {
        if (header) {
          headerString.push(header)
        }
      })
      csvExportCellArray.push(headerString.join(','))

      // if table is pagenated from backend,
      // we need to fetch all backend items to export
      let exportItems = allTableItems
      if (fetchExport) {
        const fetchedItems = await fetchExport({
          page: 1,
          perPage: -1,
          sortBy: undefined,
        })
        if (fetchedItems) {
          exportItems = fetchedItems.items.map((item) => {
            return {
              item,
            } as ITableItem<T>
          })
        }
      }

      exportItems.forEach(({ item, subRows }) => {
        let contentString: string[] = []
        columns.forEach(({ header, exportContent, disableExport }) => {
          if (header && !disableExport) {
            // if callback and its output exists, add to array, else add "-"
            const exportvalue = exportContent?.(item, '')
            contentString.push(exportvalue ? returnCSVSafeString(exportvalue) : '-')
          }
        })
        subRows?.forEach(({ exportSubRow }) => {
          exportSubRow?.forEach(({ header, exportContent }) => {
            if (header) {
              const exportvalue = exportContent?.(item)
              contentString.push(exportvalue ? returnCSVSafeString(exportvalue) : '-')
            }
          })
        })

        contentString = [contentString.join(',')]
        if (contentString[0]) {
          csvExportCellArray.push(contentString[0])
        }
      })

      const exportString = csvExportCellArray.join('\n')
      const fileName = `${fileNamePrefix}-${Date.now()}.csv`

      createDownloadFile(fileName, exportString, 'text/csv')

      toastContext.addAlert({
        title: t('Export successful'),
        type: 'success',
        autoClose: true,
      })
    },
    [t, allTableItems, columns, exportFilePrefix, fetchExport]
  )

  const paged = useMemo<ITableItem<T>[]>(() => {
    // if using a result view from backend, the items have already been sliced and diced
    if (!isPreProcessed) {
      const start = (actualPage - 1) * perPage
      return sorted.slice(start, start + perPage)
    } else {
      return sorted
    }
  }, [isPreProcessed, actualPage, perPage, sorted])

  const { rows, primaryRows, addedSubRows, addedSubRowCount } = useMemo<{
    rows: IRow[]
    primaryRows: IRow[]
    addedSubRows: IRow[]
    addedSubRowCount: number
  }>(() => {
    const newRows: IRow[] = []
    const newSubRows: IRow[] = []
    const itemToCells = (item: T, key: string) =>
      selectedSortedCols.map((column) => {
        return typeof column.cell === 'string'
          ? get(item as Record<string, unknown>, column.cell)
          : { title: <Fragment key={key}>{column.cell(item, internalSearch)}</Fragment> }
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
        subRows.forEach((subRow) => {
          newRows.push({ ...subRow, parent: i + addedSubRowCount })
          newSubRows[i] = { ...subRow, parent: i + addedSubRowCount }
        })
        addedSubRowCount += subRows.length
      }
    })
    return {
      rows: newRows,
      primaryRows: newRows.filter((row) => row.parent == undefined),
      addedSubRows: newSubRows,
      addedSubRowCount,
    }
  }, [paged, selectedSortedCols, internalSearch, expanded, selected, disabled])

  const onCollapse = useMemo<((_event: unknown, rowIndex: number, isOpen: boolean) => void) | undefined>(() => {
    if (addSubRows && addedSubRowCount) {
      return (_event, rowIndex, isOpen) => {
        /* istanbul ignore next */
        if (!primaryRows[rowIndex] && isOpen) {
          // Expand all
          let tempExpanded = {}
          primaryRows.forEach((_, idx) => {
            const rowKey = primaryRows[idx]?.props?.key.toString()
            tempExpanded = rowKey ? { ...tempExpanded, [rowKey]: true } : tempExpanded
          })
          setExpanded(tempExpanded)
        } else if (!primaryRows[rowIndex] && !isOpen) {
          // Collapse all
          setExpanded({})
        } else if (primaryRows[rowIndex]) {
          // Expand/collpase single row
          const rowKey = primaryRows[rowIndex].props.key.toString()
          setExpanded({ ...expanded, [rowKey]: isOpen })
        }
      }
    }
    return undefined
  }, [primaryRows, addedSubRowCount, expanded, addSubRows])

  // Compensate for PF auto-added columns
  // sort state always contains the data index
  // adjustedSort and the updateSort callback compensate for header display index used in PF
  /* istanbul ignore next */
  const hasSelectionColumn =
    tableActions?.some((action) => action.variant === 'action-group' || action.variant === 'bulk-action') ||
    !!propsOnSelect
  const adjustedSort =
    sort && sort.index !== undefined && sort.index !== null && sort.direction && filtered.length > 0
      ? {
          index: sort.index,
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
    setActiveAdvancedFilters([])
    setPendingConstraints([{ operator: undefined, value: '', columnId: '' }])
  }, [clearSearch, clearFilters, setActiveAdvancedFilters, setPendingConstraints])

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
          index: newSort?.index ? newSort.index : 0,
          direction: newSort && newSort.direction,
        })
      }
      if (internalSearch) {
        // sort changed while filtering; forget previous setting
        setPreFilterSort(undefined)
      }
    },
    [filtered.length, internalSearch, setSort]
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
        newSelected[primaryRows[rowId]?.props?.key] = true
      } else {
        delete newSelected[primaryRows[rowId]?.props?.key]
      }
      setSelected(newSelected)
      /* istanbul ignore next */
      if (propsOnSelect && items) {
        propsOnSelect(items.filter((item) => newSelected[keyFn(item)]))
      }
    },
    [items, primaryRows, propsOnSelect, selected, keyFn]
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
              component={'span'} // default component is <a> which causes link styling
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

  const actionsToggle = useCallback(
    ({ onToggle, isOpen, isDisabled, toggleRef }: CustomActionsToggleProps) => (
      <MenuToggle
        aria-label={t('Actions')}
        ref={toggleRef}
        onClick={onToggle}
        isExpanded={isOpen}
        isDisabled={isDisabled}
        variant="plain"
      >
        <EllipsisVIcon />
      </MenuToggle>
    ),
    [t]
  )

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

  const hasSearch = useMemo(() => columns.some((column) => column.search), [columns])
  const hasFilter = filters && filters.length > 0
  const hasItems = items && items.length > 0 && filtered
  const showToolbar =
    props.showToolbar !== false ? hasItems || emptyResult || (process.env.NODE_ENV !== 'test' && isLoading) : false
  const topToolbarStyle = items ? {} : { paddingBottom: 0 }
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false)

  const translatedPaginationTitles = usePaginationTitles()

  const commonPaginationProps: Partial<Omit<PaginationProps, 'ref'>> = {
    titles: translatedPaginationTitles,
    itemCount,
    perPage,
    page: isPreProcessed ? resultView?.page : page,
    onSetPage: (_event, page) => setPage(page),
    onPerPageSelect: (_event, perPage) => updatePerPage(perPage),
  }

  const onSelectCallback = useCallback(() => {
    return rows.length &&
      (tableActions?.some((action) => action.variant === 'action-group' || action.variant === 'bulk-action') ||
        !!propsOnSelect)
      ? onSelect
      : undefined
  }, [rows, tableActions, propsOnSelect, onSelect])

  const isActionMenu = (cellIndex: number): boolean => {
    return selectedSortedCols[cellIndex].isActionCol ?? false
  }

  function renderCellContent(cell: ReactNode | IRowCell<any> | string): ReactNode {
    if (cell) {
      if (typeof cell === 'object') {
        if ('title' in cell && cell.title !== undefined) {
          return cell.title as ReactNode
        }
        return cell as ReactNode
      } else if (typeof cell === 'string' || typeof cell === 'number') {
        return cell as ReactNode
      }
    }
    return null
  }

  return (
    <Fragment>
      {props.extraToolbarControls && (
        <Toolbar style={topToolbarStyle} inset={{ default: 'insetMd', xl: 'insetLg' }}>
          <ToolbarContent>
            <ToolbarGroup align={{ default: 'alignRight' }}>
              <ToolbarItem>{props.extraToolbarControls}</ToolbarItem>
            </ToolbarGroup>
          </ToolbarContent>
        </Toolbar>
      )}
      {showToolbar && (
        <Toolbar
          clearFiltersButtonText={t('Clear all filters')}
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
                    <AcmSearchInput
                      placeholder={searchPlaceholder}
                      spellCheck={false}
                      resultsCount={`${search === internalSearch ? filteredCount : '-'} / ${totalCount}`}
                      style={{ flexGrow: 1 }}
                      canAddConstraints
                      useAdvancedSearchPopper={advancedFilters.length > 0}
                      setActiveConstraints={setActiveAdvancedFilters}
                      pendingConstraints={pendingConstraints}
                      setPendingConstraints={setPendingConstraints}
                      searchableColumns={advancedFilters.map((filter) => ({
                        columnId: filter.id,
                        columnDisplayName: filter.label,
                        availableOperators: filter.availableOperators,
                      }))}
                      fuzzySearchValue={search}
                      fuzzySearchOnChange={updateSearch}
                      fuzzySearchOnClear={clearSearch}
                    />
                  </ToolbarItem>
                )}
                {hasFilter && (
                  <TableColumnFilters
                    id={id}
                    filters={filters}
                    secondaryFilterIds={secondaryFilterIds}
                    filterCounts={filterCounts}
                    items={items}
                  />
                )}
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
            {showColumnManagement && (
              <AcmManageColumn<T>
                {...{ selectedColIds, setSelectedColIds, requiredColIds, defaultColIds, setColOrderIds, colOrderIds }}
                allCols={columns.filter((col) => !col.isActionCol)}
              />
            )}
            {customTableAction}
            {showExportButton && (
              <Tooltip content={t('Export all table data')}>
                <ToolbarItem key={`export-toolbar-item`}>
                  <Dropdown
                    onSelect={(event) => {
                      event?.stopPropagation()
                      setIsExportMenuOpen(false)
                    }}
                    className="export-dropdownMenu"
                    toggle={
                      <DropdownToggle
                        toggleIndicator={null}
                        onToggle={(event, value) => {
                          event.stopPropagation()
                          setIsExportMenuOpen(value)
                        }}
                        aria-label="export-search-result"
                        id="export-search-result"
                      >
                        <ExportIcon />
                      </DropdownToggle>
                    }
                    isOpen={isExportMenuOpen}
                    isPlain
                    dropdownItems={[
                      <DropdownItem key="export-csv" onClick={() => exportTable(toastContext)}>
                        {t('Export all to CSV')}
                      </DropdownItem>,
                    ]}
                    position={'left'}
                  />
                </ToolbarItem>
              </Tooltip>
            )}
            {additionalToolbarItems}
            {(!props.autoHidePagination || filtered.length > perPage) && (
              <ToolbarItem variant="pagination">
                <Pagination
                  {...commonPaginationProps}
                  aria-label={t('Pagination top')}
                  isCompact
                  perPageOptions={props.perPageOptions}
                />
              </ToolbarItem>
            )}
          </ToolbarContent>
        </Toolbar>
      )}
      {!items || !rows || !filtered || !paged || (process.env.NODE_ENV !== 'test' && isLoading) ? (
        <PageSection variant="light" padding={{ default: 'noPadding' }}>
          <PageSection variant={props.extraToolbarControls ? 'light' : 'default'} padding={{ default: 'padding' }}>
            <Fragment>
              {Array(10).fill(
                <>
                  <Skeleton width="100%" role="progressbar" screenreaderText="Loading" />
                  <br />
                </>
              )}
            </Fragment>
          </PageSection>
        </PageSection>
      ) : items.length === 0 && !emptyResult ? (
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
                aria-label={t('Simple Table')}
                borders={!props.noBorders}
                variant={TableVariant.compact}
                gridBreakPoint={gridBreakPoint ?? breakpoint}
              >
                <Thead>
                  <Tr>
                    {onCollapse && <Th screenReaderText={t('Row collapse')} />}
                    {hasSelectionColumn && <Th screenReaderText={t('Row select')} />}
                    {selectedSortedCols
                      .filter((column) => !!column.header)
                      .map((column, columnIndex) => {
                        // setup column props, including column transforms
                        const transforms: ITransform[] | undefined = [nowrap, ...(column.transforms || [])]
                        const iTransformColumnProps = transforms
                          ? mergeProps(...transforms.map((transform: ITransform) => transform()))
                          : []
                        const sortProps = column.sort
                          ? {
                              sort: {
                                sortBy: adjustedSort || {},
                                onSort: (_event: React.MouseEvent, index: number, direction: SortByDirection) => {
                                  return updateSort({ index, direction })
                                },
                                columnIndex: columnIndex,
                              },
                            }
                          : {}
                        const tooltipProps = column.tooltip
                          ? {
                              tooltip: column.tooltip,
                              tooltipProps: { position: TooltipPosition.left },
                              info: {
                                popover: column.tooltip,
                              },
                            }
                          : undefined
                        return (
                          <Th
                            key={column.id}
                            dataLabel={column.header}
                            {...tooltipProps}
                            {...sortProps}
                            {...iTransformColumnProps}
                          >
                            {column.header}
                          </Th>
                        )
                      })}
                  </Tr>
                </Thead>
                {primaryRows.map((row, rowIndex) => {
                  return (
                    <Tbody isExpanded={row.isOpen} key={`${row.props.key}-tablebody`}>
                      <Tr key={`${row.props.key}-tablerow`} ouiaId={row?.props?.key}>
                        {onCollapse && (
                          <Td
                            expand={{
                              isExpanded: row.isOpen || false,
                              rowIndex,
                              onToggle: onCollapse,
                              expandId: 'expandable-toggle',
                            }}
                          />
                        )}
                        {hasSelectionColumn && (
                          <Td
                            key={`${row.props.key}-select`}
                            select={{
                              rowIndex,
                              onSelect: onSelectCallback(),
                              isSelected: selected[row.props.key],
                              isDisabled: row.disableSelection,
                            }}
                          />
                        )}
                        {row?.cells?.map((cell, cellIndex) => {
                          // setup row props, including celltransforms
                          const transforms: ITransform[] | undefined = selectedSortedCols[cellIndex]?.cellTransforms
                          const iTransformCellProps = transforms
                            ? mergeProps(
                                ...transforms.map((transform: ITransform) =>
                                  transform(row, {
                                    rowIndex,
                                  })
                                )
                              )
                            : []
                          const isActionKebab = isActionMenu(cellIndex)
                          const rowProps = {
                            dataLabel: isActionKebab ? undefined : columns[cellIndex].header,
                            ...iTransformCellProps,
                          }
                          return (
                            <Td key={`row-${rowIndex}-cell-${cellIndex}`} {...rowProps} isActionCell={isActionKebab}>
                              {renderCellContent(cell)}
                            </Td>
                          )
                        })}
                        {(!!actionResolver || actions.length > 0) && (
                          <Td isActionCell>
                            {((!!actionResolver && actionResolver?.(row, { rowIndex }).length > 0) ||
                              actions.length > 0) && (
                              <ActionsColumn
                                items={actionResolver ? actionResolver(row, { rowIndex }) : actions}
                                actionsToggle={actionsToggle}
                                extraData={{ rowIndex }}
                                rowData={row}
                              />
                            )}
                          </Td>
                        )}
                      </Tr>
                      {addedSubRowCount > 0 && (
                        <Tr isExpanded={row.isOpen} key={addedSubRows[rowIndex]?.props?.key}>
                          {/* include spacing for expandable and selection columns in subrow */}
                          {onCollapse && <Td />}
                          {hasSelectionColumn && <Td />}
                          <Td key={addedSubRows[rowIndex]?.props?.key} colSpan={selectedSortedCols.length}>
                            <ExpandableRowContent>
                              {addedSubRows[rowIndex]?.cells?.map((cell) => renderCellContent(cell))}
                            </ExpandableRowContent>
                          </Td>
                        </Tr>
                      )}
                    </Tbody>
                  )
                })}
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
              {...commonPaginationProps}
              variant={PaginationVariant.bottom}
              aria-label={t('Pagination bottom')}
              perPageOptions={props.perPageOptions}
            />
          )}
        </Fragment>
      )}
    </Fragment>
  )
}

function TableColumnFilters<T>(
  props: Readonly<{
    id?: string
    filters: ITableFilter<T>[]
    secondaryFilterIds?: string[]
    filterCounts: FilterCounts | undefined
    items?: T[]
  }>
) {
  const [isOpen, setIsOpen] = useState([false])
  const { id, filters, secondaryFilterIds, items, filterCounts } = props
  const { filterSelections, addFilterValue, removeFilterValue, removeFilter, negateFilterValue } =
    useTableFilterSelections({
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

  const onToggleEquality = useCallback(
    (filterId: string, option: TableFilterOptions) => {
      negateFilterValue(filterId, option.option.value)
    },
    [negateFilterValue]
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
    const filterGroups = [
      {
        allFilters: [] as ITableFilter<T>[],
        groupSelections: [] as FilterSelectOptionObject[],
        validFilters: [] as IValidFilters<T>[],
        allOptions: [] as TableFilterOptions[],
      },
    ]
    for (const filter of filters) {
      const supportsInequality = !!filter.supportsInequality
      let options: TableFilterOptions[] = []
      for (const option of filter.options) {
        /* istanbul ignore next */
        const count = filterCounts?.[filter.id]
          ? filterCounts[filter.id][option.value]
          : items?.filter((item) => filter.tableFilterFn([option.value], item)).length

        // option is one of the options static filter options from our table (see derived table)
        // we use that to find its matching current selection (from selections)
        // we need to do special processing to match a selection like (key!=value)
        //  because it won't directly match the original option (key=value)
        const selectedOption = selections.find(
          (selection) =>
            selection.filterId === filter.id && matchesFilterValue(supportsInequality, option.value, selection.value)
        )

        // if the selection is a key!=value we can't use the original option (key=value)
        // so we create a new option instead
        const opt: TableFilterOption<string> =
          supportsInequality && selectedOption
            ? { label: selectedOption.value, value: selectedOption.value }
            : { ...option }

        /* istanbul ignore next */
        if (
          filter.showEmptyOptions ||
          (count !== undefined && count > 0) ||
          // if option is selected, it may be impacting results, so always show it even if options with 0 matches are being filtered
          selectedOption
        ) {
          options.push({ option: opt, count: count ?? 0 })
        }
      }

      // filter options can be spread out into multiple dropdowns if:
      // 1 there's more then SPLIT_FILTER_THRESHOLD options or
      // 2 the secondaryFilterId  (ex: secondaryFilterId = 'labels' will make it its own labels dropdown)
      let group = filterGroups[0]
      /* istanbul ignore else */
      if (options.length) {
        if (options.length > SPLIT_FILTER_THRESHOLD || secondaryFilterIds?.includes(filter.id)) {
          options.sort((a, b) => {
            return a?.option?.label?.toString().localeCompare(b?.option?.label?.toString() || '') || 0
          })

          filterGroups.push({
            allFilters: [] as ITableFilter<T>[],
            groupSelections: [] as FilterSelectOptionObject[],
            validFilters: [] as IValidFilters<T>[],
            allOptions: options,
          })
          // to avoid create lots of react components,
          // just create a smaller set with the assumption that user
          // won't be scrolling the entire list of 3000 clusters
          // but will instead search for a cluster--at which point
          // we will create react components for just that search
          // in onFilterOptions
          options = options.slice(0, MAXIMUM_OPTIONS)
          group = filterGroups[filterGroups.length - 1]
        }
        group.validFilters.push({ filter, options })
      }
      group.allFilters.push(filter)
    }

    // if user has made selections and there are multiple filter dropdowns
    // split the selections up by filter dropdown
    filterGroups[0].groupSelections = selections
    if (filterGroups.length > 1) {
      let allSelections = [...selections]
      filterGroups.forEach((group, inx) => {
        if (inx !== 0) {
          const remainingSelections = [] as FilterSelectOptionObject[]
          filterGroups[inx].groupSelections = allSelections.filter((selected) => {
            // there should only be one validFilter in extra filter dropdowns
            // just for the type filter type (ex: cluster) in this dropdown
            if (group.validFilters[0].filter.id !== selected.filterId) {
              remainingSelections.push(selected)
              return false
            }
            return true
          })
          allSelections = remainingSelections
        }
      })
      filterGroups[0].groupSelections = allSelections
    }

    return filterGroups.map(({ allFilters, allOptions, groupSelections, validFilters }) => {
      return {
        groupFilters: allFilters,
        groupOptions: allOptions,
        groupSelections,
        groupSelectionList: validFilters.map((filter) => {
          return (
            <SelectGroup key={filter.filter.id} label={filter.filter.label}>
              {filter.options.map((option) => {
                return renderFilterSelectOption(
                  filter.filter.id,
                  option,
                  filter.filter.supportsInequality,
                  onToggleEquality
                )
              })}
            </SelectGroup>
          )
        }),
      }
    })
  }, [filterCounts, filters, items, onToggleEquality, secondaryFilterIds, selections])

  // used by filters with lots of options to filter the options
  const onFilterOptions = useCallback(
    (_: any, textInput: string, inx: number) => {
      if (textInput !== '') {
        const { id, supportsInequality } = filterSelectGroups[inx].groupFilters[0]
        return filterSelectGroups[inx].groupOptions
          .filter(({ option }) => {
            return option?.value.toLowerCase().includes(textInput.toLowerCase())
          })
          .map((option) => {
            return renderFilterSelectOption(id, option, supportsInequality, onToggleEquality, textInput.toLowerCase())
          })
      } else {
        return filterSelectGroups[inx].groupSelectionList
      }
    },
    [filterSelectGroups, onToggleEquality]
  )

  // create toolbar chips
  const createChips = useCallback(
    (current: ITableFilter<T>) => {
      const currentCategorySelected = filterSelections[current.id] ?? []
      // if options are made up of labels (key=value) just use the current selection values
      if (current.supportsInequality) {
        return currentCategorySelected.map((value) => {
          return { key: value, node: value }
        })
      } else {
        // else we need to get the correct label/value from derived table
        return current.options
          .filter((option: TableFilterOption<string>) => {
            return currentCategorySelected.includes(option.value)
          })
          .map<ToolbarChip>((option: TableFilterOption<string>) => {
            return { key: option.value, node: option.label }
          })
      }
    },
    [filterSelections]
  )

  return (
    <ToolbarItem>
      <div style={{ display: 'flex' }}>
        {filterSelectGroups.map(({ groupFilters, groupSelections, groupSelectionList }, inx) => {
          return groupFilters.reduce(
            (acc, current) => (
              <ToolbarFilter
                key={'acm-table-filter-key'}
                chips={createChips(current)}
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
              onToggle={() => {
                const arr = [...isOpen]
                arr[inx] = !isOpen[inx]
                setIsOpen(arr)
              }}
              onSelect={(
                _event: React.MouseEvent<Element, MouseEvent> | React.ChangeEvent<Element>,
                selection: SelectOptionObject
              ) => onFilterSelect(selection as FilterSelectOptionObject)}
              selections={groupSelections}
              isOpen={isOpen[inx]}
              isGrouped
              placeholderText={
                <div>
                  <FilterIcon className={filterLabelMargin} />
                  {inx === 0 ? t('Filter') : filterSelectGroups[inx].groupFilters[0].label}
                </div>
              }
              noResultsFoundText={t('No results found')}
              onFilter={(e, textInput) => onFilterOptions(e, textInput, inx)}
              hasInlineFilter={inx !== 0}
            >
              {groupSelectionList}
            </Select>
          )
        })}
      </div>
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

/**
 * A dropdown component that handles bulk actions for selected table rows.
 * Used internally by AcmTable for rendering table-wide actions that operate on multiple selected items.
 *
 * @component
 * @template T - The type of items in the table
 *
 * @example
 * ```tsx
 * <TableActionsDropdown
 *   actions={[
 *     {
 *       id: 'delete',
 *       title: 'Delete selected',
 *       click: (items) => handleBulkDelete(items),
 *       variant: 'bulk-action'
 *     }
 *   ]}
 *   selections={{ 'item-1': true, 'item-2': true }}
 *   items={tableItems}
 *   keyFn={(item) => item.id}
 * />
 * ```
 *
 * @param props - Component props
 * @param props.actions - Array of table actions (bulk actions, separators, action groups)
 * @param props.selections - Object mapping item keys to their selection state
 * @param props.items - Array of table items that actions can operate on
 * @param props.keyFn - Function to generate unique key for each item
 *
 * @remarks
 * - Uses AcmDropdown internally to render the actions menu
 * - Handles nested action groups and separators
 * - Converts IAcmTableAction to AcmDropdownItems format
 * - Executes bulk actions on selected items
 * - Different from RbacDropdown as it:
 *   - Operates on multiple selected items
 *   - Does not perform permission checks
 *   - Used for table-wide operations
 *
 * @returns A dropdown menu component for table bulk actions
 */

function TableActionsDropdown<T>(props: {
  actions: IAcmTableAction<T>[]
  selections: { [uid: string]: boolean }
  items: T[] | undefined
  keyFn: (item: T) => string
}) {
  const { actions, selections = {}, items = [], keyFn } = props
  const { t } = useTranslation()
  const hasSelections = Object.keys(selections).length > 0

  const dropdownItems = useMemo(() => {
    function convertAcmTableActionsToAcmDropdownItems(actions: IAcmTableAction<T>[]): AcmDropdownItems[] {
      return actions
        .map((action, index) => {
          if (action.variant === 'action-separator') {
            return null
          }
          return {
            id: action.id,
            text: action.title,
            separator: !!(index > 0 && actions[index - 1].variant === 'action-separator'),
            ...(action.variant === 'action-group'
              ? { flyoutMenu: convertAcmTableActionsToAcmDropdownItems(action.actions) }
              : {
                  tooltip: action.tooltip,
                  isAriaDisabled:
                    (typeof action.isDisabled === 'boolean' ? action.isDisabled : action.isDisabled?.(items)) ||
                    !hasSelections,
                }),
          }
        })
        .filter((action) => action !== null)
    }

    return convertAcmTableActionsToAcmDropdownItems(actions)
  }, [actions, items, hasSelections])

  const handleSelect = useCallback(
    (id: string) => {
      // finds the action in both the top-level and the nested actions
      const findAction = (actions: IAcmTableAction<T>[]): IAcmTableAction<T> | undefined => {
        for (const action of actions) {
          if (action.id === id) return action
          if (action.variant === 'action-group') {
            const nestedAction = findAction(action.actions)
            if (nestedAction) return nestedAction
          }
        }
        return undefined
      }

      const action = findAction(actions)
      if (action && action.variant !== 'action-separator' && action.variant !== 'action-group') {
        const selectedItems = items?.filter((item) => selections[keyFn(item)]) || []
        action.click(selectedItems)
      }
    },
    [actions, items, selections, keyFn]
  )

  return (
    <AcmDropdown
      id="table-actions-dropdown"
      onSelect={handleSelect}
      text={t('Actions')}
      dropdownItems={dropdownItems}
      isPrimary={hasSelections}
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
        onToggle={(_event, isOpen) => setIsOpen(isOpen)}
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
