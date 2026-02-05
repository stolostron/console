/* Copyright Contributors to the Open Cluster Management project */

import { css } from '@emotion/css'
import {
  MenuToggle,
  PageSection,
  Pagination,
  PaginationVariant,
  Skeleton,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
  Tooltip,
  TooltipPosition,
} from '@patternfly/react-core'
import { EllipsisVIcon } from '@patternfly/react-icons'
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
import Fuse from 'fuse.js'
import get from 'get-value'
import { mergeWith } from 'lodash'
import {
  cloneElement,
  FormEvent,
  Fragment,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useTranslation } from '../../lib/acm-i18next'
import { usePaginationTitles } from '../../lib/paginationStrings'
import { PluginContext } from '../../lib/PluginContext'
import { createDownloadFile, returnCSVSafeString } from '../../resources/utils'
import { AcmToastContext } from '../AcmAlert/AcmToast'
import { AcmButton } from '../AcmButton/AcmButton'
import { AcmEmptyState } from '../AcmEmptyState/AcmEmptyState'
import { SearchConstraint } from '../AcmSearchInput'
import { AcmManageColumn } from './AcmManageColumn'
import { AcmTableStateContext, DEFAULT_ITEMS_PER_PAGE, DEFAULT_SORT } from './AcmTableStateProvider'
import { AcmTableToolbar, applyFilters, ToolbarRef, useTableFilterSelections } from './AcmTableToolbar'
import {
  AcmTableProps,
  AdvancedFilterSelection,
  CommonPaginationPropsType,
  CurrentFilters,
  IAcmRowAction,
  IAcmTableColumn,
  ITableItem,
} from './AcmTableTypes'
import { getColumnValues, setColumnValues } from './localColumnStorage'

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

const BREAKPOINT_SIZES = [
  { name: TableGridBreakpoint.none, size: 0 },
  { name: TableGridBreakpoint.gridMd, size: 768 },
  { name: TableGridBreakpoint.gridLg, size: 992 },
  { name: TableGridBreakpoint.gridXl, size: 1200 },
  { name: TableGridBreakpoint.grid2xl, size: 1450 },
  { name: TableGridBreakpoint.grid, size: Infinity },
]

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
    filters = [],
    advancedFilters = [],
    gridBreakPoint,
    initialSelectedItems,
    onSelect: propsOnSelect,
    showColumnManagement,
    exportFilePrefix,
    setRequestView,
    resultView,
    resultCounts,
    fetchExport,
  } = props

  // a ref forwarded from toolbar to access its methods
  const toolbarRef = useRef<ToolbarRef>(null)
  const { isPreProcessed, loading, emptyResult } = resultView || {}

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

  // State that can come from context or component state (search, sort, page, perPage)
  const initialSort = props.initialSort ?? DEFAULT_SORT
  const initialSearch = props.initialSearch ?? ''
  const [statePerPage, stateSetPerPage] = useState(props.initialPerPage || DEFAULT_ITEMS_PER_PAGE)
  const [statePage, stateSetPage] = useState(props.initialPage || 1)
  const [stateSort, stateSetSort] = useState<ISortBy | undefined>(initialSort)
  const [internalSearch, setInternalSearch] = useState(props.search ?? initialSearch)
  const {
    search: storedSearch,
    sort: storedSort,
    setSort: setStoredSort,
    page: storedPage,
    setPage: setStoredPage,
    perPage: storedPerPage,
    setPerPage: setStoredPerPage,
  } = useContext(AcmTableStateContext)
  const perPage = storedPerPage || statePerPage
  const setPerPage = setStoredPerPage || stateSetPerPage
  const page = props.page || storedPage || statePage
  const setPage = props.setPage || setStoredPage || stateSetPage
  const sort = props.sort || storedSort || stateSort
  const setSort = props.setSort || setStoredSort || stateSetSort
  useEffect(() => {
    if (process.env.NODE_ENV !== 'test') {
      setInternalSearch(storedSearch || '')
    }
  }, [storedSearch])

  const [preFilterSort, setPreFilterSort] = useState<ISortBy | undefined>(initialSort)
  const [activeAdvancedFilters, setActiveAdvancedFilters] = useState<SearchConstraint[]>([])

  // State that is only stored in the component state
  const [selected, setSelected] = useState<{ [uid: string]: boolean }>({})
  const [disabled, setDisabled] = useState<{ [uid: string]: boolean }>({})
  const [expanded, setExpanded] = useState<{ [uid: string]: boolean }>({})

  // Dynamic gridBreakPoint
  const [breakpoint, setBreakpoint] = useState<TableGridBreakpoint>(TableGridBreakpoint.none)
  const [exactBreakpoint, setExactBreakpoint] = useState<number | undefined>()
  const [outerDiv, setOuterDiv] = useState<HTMLDivElement | null>(null)
  const [tableDiv, setTableDiv] = useState<HTMLDivElement | null>(null)
  const outerDivRef = useCallback((elem: HTMLDivElement | null) => setOuterDiv(elem), [])
  const tableDivRef = useCallback((elem: HTMLDivElement | null) => setTableDiv(elem), [])

  const { filterSelections } = useTableFilterSelections({ id, filters })

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
  const { localSavedCols, localSavedColOrder } = id
    ? getColumnValues(id)
    : { localSavedCols: [], localSavedColOrder: [] }
  const [colOrderIds, setColOrderIds] = useState<string[]>(
    localSavedColOrder?.length > 0
      ? [...localSavedColOrder, ...defaultOrderIds.filter((val: string) => !localSavedColOrder.includes(val))]
      : defaultOrderIds
  )
  const [selectedColIds, setSelectedColIds] = useState<string[]>(
    localSavedCols?.length > 0
      ? [...requiredColIds, ...localSavedCols.filter((val: string) => !requiredColIds.includes(val))]
      : [...requiredColIds, ...defaultColIds]
  )
  setColumnValues(id || '', selectedColIds, colOrderIds)

  const [tableId] = useState<string>(id || '')
  const selectedSortedCols = useMemo(() => {
    const sortedColumns: IAcmTableColumn<T>[] = []

    if (!showColumnManagement) {
      return columns.filter((e) => !e.isHidden)
    }

    // sort column by column management order
    colOrderIds.forEach((id) => {
      const find = columns.find((col) => col.id === id)
      if (find) {
        sortedColumns.push(find)
      }
    })

    const sortedSelected = sortedColumns.filter((column) => selectedColIds.includes(column.id as string))

    // Btn column is always the last
    const btn = columns.find((col) => col.isActionCol)
    if (btn) {
      sortedSelected.push(btn)
    }

    return sortedSelected.filter((e) => !e.isHidden)
  }, [columns, selectedColIds, colOrderIds, showColumnManagement])

  useEffect(() => {
    setColumnValues(id || '', selectedColIds, colOrderIds)
  }, [selectedColIds, colOrderIds, id])

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
    if (!isPreProcessed && sort?.index !== undefined && selectedSortedCols.length > sort.index) {
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

  const exportTable = useCallback(async () => {
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
  }, [toastContext, t, exportFilePrefix, columns, allTableItems, fetchExport])

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
    addedSubRows: IRow[][]
    addedSubRowCount: number
  }>(() => {
    const newRows: IRow[] = []
    const newSubRows: IRow[][] = []
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
          if (!newSubRows[i]) {
            newSubRows[i] = []
          }
          newSubRows[i].push({ ...subRow, parent: i + addedSubRowCount })
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

  const updateSort = useCallback(
    (newSort: ISortBy) => {
      if (filtered.length === 0) {
        setSort(newSort)
      } else {
        setSort({
          index: newSort?.index ? newSort.index : 0,
          direction: newSort && newSort.direction ? newSort.direction : undefined,
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
            <Tooltip content={action.tooltip} {...(action.tooltipProps || {})}>
              <span
                style={{ padding: 0, cursor: action.isDisabled ? 'not-allowed' : 'pointer' }}
                aria-disabled={action.isDisabled}
              >
                {action.title}
              </span>
            </Tooltip>
          ) : (
            action.title
          ),
          description: action.description,
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

  const renderColumnManagement = () => {
    if (showColumnManagement) {
      return (
        <AcmManageColumn<T>
          {...{
            selectedColIds,
            setSelectedColIds,
            requiredColIds,
            defaultColIds,
            setColOrderIds,
            colOrderIds,
            tableId,
          }}
          allCols={columns.filter((col) => !col.isActionCol)}
        />
      )
    }
  }

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

  const hasFilter = filters && filters.length > 0
  const hasItems = items && items.length > 0 && filtered
  const showToolbar =
    props.showToolbar !== false ? hasItems || emptyResult || (process.env.NODE_ENV !== 'test' && isLoading) : false
  const topToolbarStyle = items ? {} : { paddingBottom: 0 }

  const translatedPaginationTitles = usePaginationTitles()

  const commonPaginationProps: CommonPaginationPropsType = {
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
        <Toolbar style={topToolbarStyle} inset={{ default: 'insetNone' }}>
          <ToolbarContent>
            <ToolbarGroup align={{ default: 'alignEnd' }}>
              <ToolbarItem>{props.extraToolbarControls}</ToolbarItem>
            </ToolbarGroup>
          </ToolbarContent>
        </Toolbar>
      )}
      {showToolbar && (
        <AcmTableToolbar
          {...{
            ...props,
            hasFilter,
            hasSelectionColumn,
            commonPaginationProps,
            sort,
            setPage,
            setSort,
            preFilterSort,
            setPreFilterSort,
            selected,
            setSelected,
            disabled,
            internalSearch,
            setInternalSearch,
            exportTable,
            renderColumnManagement,
            setActiveAdvancedFilters,
            perPage,
            paged,
            filtered,
            filteredCount,
            totalCount,
          }}
          ref={toolbarRef}
        />
      )}
      {!items || !rows || !filtered || !paged || (process.env.NODE_ENV !== 'test' && isLoading) ? (
        <PageSection hasBodyWrapper={false} padding={{ default: 'noPadding' }}>
          <PageSection
            hasBodyWrapper={false}
            variant={props.extraToolbarControls ? 'secondary' : 'default'}
            padding={{ default: 'padding' }}
          >
            <Fragment>
              {new Array(10).fill(
                <>
                  <Skeleton width="100%" role="progressbar" screenreaderText="Loading" />
                </>
              )}
            </Fragment>
          </PageSection>
        </PageSection>
      ) : items.length === 0 && !emptyResult ? (
        props.emptyState && (
          <PageSection
            hasBodyWrapper={false}
            variant={props.extraToolbarControls ? 'secondary' : 'default'}
            padding={{ default: 'noPadding' }}
          >
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
                                onSort: (_event: React.MouseEvent, index: number, direction: SortByDirection) =>
                                  updateSort({ index, direction }),
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
                        return column.isHidden ? null : (
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
                {primaryRows.map((row, rowIndex) => (
                  <Tbody key={`${row.props.key}-tablebody`} isExpanded={row.isOpen}>
                    <Tr key={`${row.props.key}-tablerow`} ouiaId={row?.props?.key}>
                      {onCollapse &&
                        (addedSubRows[rowIndex] ? (
                          <Td
                            expand={{
                              isExpanded: row.isOpen || false,
                              rowIndex,
                              onToggle: onCollapse,
                              expandId: 'expandable-toggle',
                            }}
                          />
                        ) : (
                          <Td />
                        ))}
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
                          dataLabel: isActionKebab ? undefined : selectedSortedCols[cellIndex].header,
                          ...iTransformCellProps,
                        }
                        return (
                          <Td
                            key={`cell-${row.props.key}-${selectedSortedCols[cellIndex]?.header}`}
                            {...rowProps}
                            isActionCell={isActionKebab}
                          >
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
                    {addedSubRows[rowIndex] &&
                      addedSubRows[rowIndex].map((subRow) => (
                        <Tr isExpanded={row.isOpen} key={`${subRow?.props?.key}-subrow`}>
                          {/* include spacing for expandable and selection columns in subrow */}
                          {onCollapse && <Td />}
                          {hasSelectionColumn && <Td />}
                          <Td key={subRow?.props?.key} colSpan={selectedSortedCols.length}>
                            <ExpandableRowContent>
                              {subRow.cells?.map((cell) => renderCellContent(cell))}
                            </ExpandableRowContent>
                          </Td>
                        </Tr>
                      ))}
                  </Tbody>
                ))}
              </Table>
            </div>
          </div>
          {!filtered.length && (
            <PageSection hasBodyWrapper={false} padding={{ default: 'noPadding' }}>
              <AcmEmptyState
                title={t('No results found')}
                message={t('No results match the filter criteria. Clear filters to show results.')}
                showSearchIcon={true}
                action={
                  <AcmButton variant="link" onClick={toolbarRef?.current?.clearSearchAndFilters}>
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
