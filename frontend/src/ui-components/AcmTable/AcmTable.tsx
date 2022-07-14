/* Copyright Contributors to the Open Cluster Management project */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { makeStyles } from '@material-ui/styles'
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
} from '@patternfly/react-core'
import { FilterIcon } from '@patternfly/react-icons'
import CaretDownIcon from '@patternfly/react-icons/dist/js/icons/caret-down-icon'
import {
    expandable,
    IAction,
    IActionsResolver,
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
}

/* istanbul ignore next */
export interface IAcmRowAction<T> {
    /** Action identifier */
    id: string
    /** Display a tooltip for this action */
    tooltip?: string | ((item: T) => void)
    /** Additional tooltip props forwarded to tooltip component */
    tooltipProps?: React.ReactNode
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
    group?: string
    subItems?: T[]
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

const useStyles = makeStyles({
    tableDiv: {
        display: 'table',
        width: '100%',
    },
    outerDiv: {
        display: 'block',
    },
    table: {
        '& tbody.pf-m-expanded > tr': {
            borderBottom: 0,
            overflowY: 'visible !important',
            '& .pf-c-table__expandable-row-content': {
                paddingTop: 0,
                paddingBottom: 0,
            },
            '&:first-of-type, &:last-of-type': {
                borderBottom: 'var(--pf-c-table--border-width--base) solid var(--pf-c-table--BorderColor)',
            },
        },
    },
    filterLabelMargin: {
        marginRight: '.5rem',
    },
    filterOption: {
        display: 'flex',
        alignItems: 'center',
    },
    filterOptionBadge: {
        marginLeft: '.5rem',
    },
})

function countGroups(items: ITableItem<unknown>[]): number {
    const { ungrouped, groups } = items.reduce(
        (acc, item) => {
            if (item.group) {
                acc.groups.add(item.group)
            } else {
                acc.ungrouped++
            }
            return acc
        },
        { ungrouped: 0, groups: new Set() }
    )
    return ungrouped + groups.size
}

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

export interface AcmTableProps<T> {
    plural: string
    items?: T[]
    addSubRows?: (item: T) => IRow[] | undefined
    initialSelectedItems?: T[]
    disabledItems?: T[]
    columns: IAcmTableColumn<T>[]
    keyFn: (item: T) => string
    groupFn?: (item: T) => string | null
    groupSummaryFn?: (items: T[]) => IRow
    customTableAction?: ReactNode
    tableActionButtons?: IAcmTableButtonAction[]
    tableActions?: IAcmTableAction<T>[]
    rowActions?: IAcmRowAction<T>[]
    rowActionResolver?: (item: T) => IAcmRowAction<T>[]
    extraToolbarControls?: ReactNode
    emptyState?: ReactNode
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
    setSort?: (sort: ISortBy | undefined) => void
    showToolbar?: boolean
    gridBreakPoint?: TableGridBreakpoint
    perPageOptions?: PerPageOptions[]
    autoHidePagination?: boolean
    noBorders?: boolean
    fuseThreshold?: number
    initialFilters?: { [key: string]: string[] }
    filters?: ITableFilter<T>[]
}
export function AcmTable<T>(props: AcmTableProps<T>) {
    const {
        items,
        columns,
        addSubRows,
        keyFn,
        groupFn,
        groupSummaryFn,
        tableActions = [],
        rowActions = [],
        rowActionResolver,
        customTableAction,
        filters = [],
    } = props

    const defaultSort = {
        index: 0,
        direction: SortByDirection.asc,
    }
    const initialSort = props.initialSort || defaultSort
    const initialSearch = props.initialSearch || ''
    const initialFilters = props.initialFilters || {}

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
    const searchPlaceholder = props.searchPlaceholder || 'Search'
    const [stateSort, stateSetSort] = useState<ISortBy | undefined>(initialSort)
    const sort = props.sort || stateSort
    const setSort = props.setSort || stateSetSort

    // State that is only stored in the component state
    const [selected, setSelected] = useState<{ [uid: string]: boolean }>({})
    const [disabled, setDisabled] = useState<{ [uid: string]: boolean }>({})
    const [preFilterSort, setPreFilterSort] = useState<ISortBy | undefined>(initialSort)
    const [expanded, setExpanded] = useState<{ [uid: string]: boolean }>({})
    const [openGroups, setOpenGroups] = useState<{ [key: string]: boolean }>({})
    const [toolbarFilterIds, setToolbarFilterIds] = useState<{ [key: string]: string[] }>(initialFilters)
    const [internalSearch, setInternalSearch] = useState(search)

    // Dynamic gridBreakPoint
    const [breakpoint, setBreakpoint] = useState<TableGridBreakpoint>(TableGridBreakpoint.none)
    const [exactBreakpoint, setExactBreakpoint] = useState<number | undefined>()
    const [outerDiv, setOuterDiv] = useState<HTMLDivElement | null>(null)
    const [tableDiv, setTableDiv] = useState<HTMLDivElement | null>(null)
    const outerDivRef = useCallback((elem) => setOuterDiv(elem), [])
    const tableDivRef = useCallback((elem) => setTableDiv(elem), [])

    /* istanbul ignore next */
    const updateBreakpoint = (width: number, tableWidth: number) => {
        const viewportWidth = window.innerWidth
        if (tableWidth > width) {
            // table needs to switch to cards; make the change and record viewport size when this happened
            const newBreakpoint =
                BREAKPOINT_SIZES.find((b) => viewportWidth <= b.size)?.name || TableGridBreakpoint.none
            setBreakpoint(newBreakpoint)
            setExactBreakpoint(width)
        } else if (exactBreakpoint && width > exactBreakpoint) {
            // outerDiv is now bigger than when we last switched to cards; try bigger breakpoint, which will
            // be reverted in the layout effect if the table view is still too wide
            const newBreakpoint =
                [...BREAKPOINT_SIZES].reverse().find((b) => viewportWidth > b.size)?.name || TableGridBreakpoint.grid
            setBreakpoint(newBreakpoint)
        }
    }

    useLayoutEffect(
        () => {
            if (!props.gridBreakPoint && outerDiv && tableDiv) {
                updateBreakpoint(outerDiv.clientWidth, tableDiv.clientWidth)
            }
        },
        // Check breakpoints as soon as ref callbacks are set, in case initial viewport is too small for table
        // Need to check on every update to breakpoint as well for the same case, so that display
        // doesn't thrash between table/cards on initial expansion of viewport
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [breakpoint, outerDiv, tableDiv]
    )

    /* istanbul ignore next */
    useResizeObserver(outerDiv, () => {
        if (!props.gridBreakPoint && outerDiv && tableDiv) {
            const width = outerDiv.clientWidth
            const tableWidth = tableDiv.clientWidth
            updateBreakpoint(width, tableWidth)
        }
    })

    const classes = useStyles()

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const setInternalSearchWithDebounce = useCallback(
        /* istanbul ignore next */
        process.env.NODE_ENV !== 'test'
            ? debounce((search: string) => {
                  setInternalSearch(search)
              }, SEARCH_DEBOUNCE_TIME)
            : setInternalSearch,
        []
    )

    useEffect(() => {
        setInternalSearchWithDebounce(search)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search])

    useEffect(() => {
        /* istanbul ignore else */
        if (props.initialSelectedItems?.length) {
            const initialSelected: { [uid: string]: boolean } = {}

            props.initialSelectedItems.forEach((item) => {
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.initialSelectedItems])

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items])

    const { tableItems, totalCount } = useMemo<{
        tableItems: ITableItem<T>[]
        totalCount: number
    }>(() => {
        /* istanbul ignore if */
        if (!items) return { tableItems: [], totalCount: 0 }
        let filteredItems: T[] = items
        if (filters.length && Object.keys(toolbarFilterIds).length) {
            const filterCategories = Object.keys(toolbarFilterIds)
            filteredItems = items.filter((item: T) => {
                let isFilterMatch = true
                // Item must match 1 filter of each category
                filterCategories.forEach((filter: string) => {
                    const filterItem: ITableFilter<T> | undefined = filters.find(
                        (filterItem) => filterItem.id === filter
                    )
                    /* istanbul ignore next */
                    const isMatch = filterItem?.tableFilterFn(toolbarFilterIds[filter], item) ?? true
                    if (!isMatch) {
                        isFilterMatch = false
                    }
                })
                return isFilterMatch
            })
        }
        const tableItems = filteredItems.map((item) => {
            const key = keyFn(item)
            const group = (groupFn && groupFn(item)) || undefined
            const subRows = addSubRows?.(item)
            const tableItem: ITableItem<T> = { item, subRows, key, group }
            for (let i = 0; i < columns.length; i++) {
                const column = columns[i]
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
        return { tableItems, totalCount: groupFn ? countGroups(tableItems) : tableItems.length }
    }, [items, columns, addSubRows, keyFn, groupFn, filters, toolbarFilterIds])

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
            return { filtered, filteredCount: groupFn ? countGroups(filtered) : filtered.length }
        } else {
            return { filtered: tableItems, filteredCount: totalCount }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [internalSearch, items, tableItems, totalCount, columns, groupFn])

    const sorted = useMemo<ITableItem<T>[]>(() => {
        if (sort && sort.index !== undefined) {
            const compare = columns[sort.index].sort
            const sorted: ITableItem<T>[] = [...filtered]
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
            return sorted
        } else {
            return filtered
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filtered, sort, columns])

    const { grouped, itemCount } = useMemo<{
        grouped: ITableItem<T>[]
        itemCount: number
    }>(() => {
        if (groupFn) {
            const grouped: ITableItem<T>[] = []
            const groupSubItems: { [key: string]: T[] } = {}
            sorted.forEach((tableItem) => {
                const { group, item } = tableItem
                if (group) {
                    tableItem.subItems = []
                    if (!groupSubItems[group]) {
                        groupSubItems[group] = tableItem.subItems
                        grouped.push(tableItem)
                    } else {
                        groupSubItems[group].push(item)
                    }
                } else {
                    grouped.push(tableItem)
                }
            })
            return { grouped, itemCount: grouped.length }
        } else {
            return { grouped: sorted, itemCount: sorted.length }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sorted, columns, groupFn])

    const actualPage = useMemo<number>(() => {
        const start = (page - 1) * perPage
        let actualPage = page
        if (start >= grouped.length) {
            actualPage = Math.max(1, Math.ceil(grouped.length / perPage))
        }
        return actualPage
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [grouped, page, perPage])

    useEffect(() => {
        if (page !== actualPage) {
            setPage(actualPage)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, actualPage])

    const paged = useMemo<ITableItem<T>[]>(() => {
        const start = (actualPage - 1) * perPage
        return grouped.slice(start, start + perPage)
    }, [grouped, actualPage, perPage])

    const { rows, addedSubRowCount } = useMemo<{ rows: IRow[]; addedSubRowCount: number }>(() => {
        const newRows: IRow[] = []
        const itemToCells = (item: T, key: string) =>
            columns.map((column) => {
                return typeof column.cell === 'string'
                    ? get(item as Record<string, unknown>, column.cell)
                    : { title: <Fragment key={key}>{column.cell(item)}</Fragment> }
            })
        let addedSubRowCount = 0
        paged.forEach((tableItem, i) => {
            const { item, key, group, subItems, subRows } = tableItem
            let isOpen: boolean | undefined = undefined
            if (group) {
                // Only expandable if the next item is also part of the group
                if (subItems!.length) {
                    isOpen = !!openGroups[group]
                }
            } else {
                isOpen = expanded[key] ?? (subRows?.length ? false : undefined)
            }
            // if there will be a group summary, include first item with the sub items
            const allSubItems =
                (group && groupSummaryFn && subItems && subItems!.length && [item].concat(subItems)) || subItems
            if (group && groupSummaryFn && allSubItems) {
                // if there are no sub items, pass in single item
                const groupSummary = groupSummaryFn(allSubItems.length ? allSubItems : [item])
                newRows.push({
                    ...groupSummary,
                    isOpen,
                    selected: selected[key] === true,
                    disableSelection: disabled[key] === true,
                    props: { key: group, group },
                })
            } else {
                newRows.push({
                    isOpen,
                    selected: selected[key] === true,
                    props: { key, group },
                    disableSelection: disabled[key] === true,
                    cells: itemToCells(item, key),
                })
            }
            if (allSubItems) {
                allSubItems.forEach((item) => {
                    const key = keyFn(item)
                    newRows.push({
                        parent: i + addedSubRowCount,
                        props: { key },
                        cells: itemToCells(item, key),
                    })
                })
                addedSubRowCount += allSubItems.length
            } else if (subRows) {
                subRows.forEach((subRow) => newRows.push({ ...subRow, parent: i + addedSubRowCount }))
                addedSubRowCount += subRows.length
            }
        })
        return { rows: newRows, addedSubRowCount }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected, paged, columns, expanded, openGroups, keyFn])

    const onCollapse = useMemo<((_event: unknown, rowIndex: number, isOpen: boolean) => void) | undefined>(() => {
        if (groupFn && addedSubRowCount) {
            return (_event, rowIndex, isOpen) => {
                /* istanbul ignore next */
                if (!rows[rowIndex] && isOpen) {
                    // Open all
                    let tempOpenGrouops = {}
                    rows.forEach((_, idx) => {
                        const rowKey = rows[idx]?.props?.group.toString()
                        tempOpenGrouops = rowKey ? { ...tempOpenGrouops, [rowKey]: true } : tempOpenGrouops
                    })
                    setOpenGroups(tempOpenGrouops)
                } else if (!rows[rowIndex] && !isOpen) {
                    // Close all
                    setOpenGroups({})
                } else if (rows[rowIndex]) {
                    // Open/close single row
                    const rowKey = rows[rowIndex].props.group.toString()
                    setOpenGroups({ ...expanded, [rowKey]: isOpen })
                }
            }
        } else if (addSubRows && addedSubRowCount) {
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rows, addedSubRowCount, openGroups, setOpenGroups, expanded, setExpanded, groupFn, addSubRows])

    // Compensate for PF auto-added columns
    // sort state always contains the data index
    // adjustedSort and the updateSort callback compensate for header display index used in PF
    /* istanbul ignore next */
    const hasSelectionColumn =
        tableActions?.some((action) => action.variant === 'action-group' || action.variant === 'bulk-action') ||
        !!props.onSelect
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
            ;(setInternalSearchWithDebounce as ReturnType<typeof debounce>).clear()
        }
        setSearch('')
        setInternalSearch('')
        setPage(1)
        if (preFilterSort) {
            setSort(preFilterSort)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [preFilterSort, setPage, setSort, setSearch, setInternalSearch])

    const clearFilters = useCallback(() => setToolbarFilterIds({}), [setToolbarFilterIds])

    const clearSearchAndFilters = useCallback(() => {
        clearSearch()
        clearFilters()
    }, [clearSearch, clearFilters])

    const updateSearch = useCallback(
        (newSearch: string) => {
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
                setSort(undefined)
            }
        },
        // setSort/setSearch/setPage can come from props, but setPreFilterSort is only from state and therefore
        // guaranteed stable - not needed in dependency list
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [internalSearch, filtered, adjustedSortIndexOffset]
    )

    const updatePerPage = useCallback(
        (newPerPage: number) => {
            // keep the first item in view on pagination size change
            const newPage = Math.floor(((page - 1) * perPage) / newPerPage) + 1
            setPage(newPage)
            setPerPage(newPerPage)
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
            if (props.onSelect && items) {
                props.onSelect(items.filter((item) => newSelected[keyFn(item)]))
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [filtered, rows, keyFn]
    )

    // Function to parse provided actions from AcmTable IAcmRowAction --> Patternfly Table IAction
    const parseRowAction = (rowActions: IAcmRowAction<T>[]) => {
        const actions: IAction[] = []
        rowActions.forEach((action) => {
            // Add separator if specified
            if (action.addSeparator) {
                actions.push({
                    isSeparator: true,
                })
            }
            // Add row action with tooltip
            if (action.tooltip) {
                actions.push({
                    title: (
                        <DropdownItem
                            isAriaDisabled={action.isDisabled}
                            tooltip={action.tooltip}
                            tooltipProps={action.tooltipProps}
                            style={{ padding: 0, cursor: action.isDisabled ? 'not-allowed' : 'pointer' }}
                        >
                            {action.title}
                        </DropdownItem>
                    ),
                    onClick: action.isDisabled
                        ? undefined
                        : (_event: React.MouseEvent, rowId: number, rowData: IRowData) => {
                              if (groupFn || addSubRows) {
                                  const tableItem =
                                      rowData.props?.key &&
                                      paged.find((tableItem) => tableItem.key === rowData.props.key)
                                  if (tableItem) {
                                      action.click(tableItem.item)
                                  }
                              } else {
                                  action.click(paged[rowId].item)
                              }
                          },
                })
            } else {
                // Add generic row action
                actions.push({
                    title: action.title,
                    isAriaDisabled: action.isDisabled ? true : false,
                    onClick: (_event: React.MouseEvent, rowId: number, rowData: IRowData) => {
                        if (groupFn || addSubRows) {
                            const tableItem =
                                rowData.props?.key && filtered.find((tableItem) => tableItem.key === rowData.props.key)
                            if (tableItem) {
                                action.click(tableItem.item)
                            }
                        } else {
                            action.click(paged[rowId].item)
                        }
                    },
                })
            }
        })
        return actions
    }

    // Parse static actions
    const actions = parseRowAction(rowActions)

    const renderCustomTableAction = (customTableAction: ReactNode) => {
        return customTableAction
    }

    const renderCustomTableActionResults = customTableAction && renderCustomTableAction(customTableAction)

    // Wrap provided action resolver
    let actionResolver: IActionsResolver | undefined
    if (rowActionResolver) {
        actionResolver = (rowData: IRowData, extraData: IExtraData) => {
            let tableItem
            if (groupFn || addSubRows) {
                tableItem = rowData.props?.key && filtered.find((tableItem) => tableItem.key === rowData.props.key)
            } else {
                tableItem = paged[extraData.rowIndex!]
            }
            if (tableItem) {
                return parseRowAction(rowActionResolver(tableItem.item))
            }
            return []
        }
    }

    const filtersHash = useMemo(() => hash(filters), [filters])

    const hasSearch = useMemo(() => columns.some((column) => column.search), [columns])
    const hasFilter = filters && filters.length > 0
    const hasItems = items && items.length > 0 && filtered
    const showToolbar = props.showToolbar !== false ? hasItems : false
    const topToolbarStyle = items ? {} : { paddingBottom: 0 }

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
                                        if (props.onSelect && items) {
                                            props.onSelect(items.filter((item) => newSelected[keyFn(item)]))
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
                                        if (props.onSelect && items) {
                                            props.onSelect(items.filter((item) => newSelected[keyFn(item)]))
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
                                            resultsCount={`${
                                                search === internalSearch ? filteredCount : '-'
                                            } / ${totalCount}`}
                                            style={{ flexGrow: 1 }}
                                        />
                                    </ToolbarItem>
                                )}
                                {hasFilter && (
                                    <TableColumnFilters
                                        filters={filters}
                                        items={items}
                                        toolbarFilterIds={toolbarFilterIds}
                                        setToolbarFilterIds={setToolbarFilterIds}
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
                        {renderCustomTableActionResults}
                        {(!props.autoHidePagination || filtered.length > perPage) && (
                            <ToolbarItem variant="pagination">
                                <Pagination
                                    itemCount={itemCount}
                                    perPage={perPage}
                                    page={page}
                                    variant={PaginationVariant.top}
                                    onSetPage={(_event, page) => setPage(page)}
                                    onPerPageSelect={(_event, perPage) => updatePerPage(perPage)}
                                    aria-label="Pagination top"
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
                            Loading
                        </Title>
                    </EmptyState>
                </PageSection>
            ) : items.length === 0 ? (
                <PageSection
                    variant={props.extraToolbarControls ? 'light' : 'default'}
                    padding={{ default: 'noPadding' }}
                >
                    {props.emptyState ?? (
                        <AcmEmptyState
                            title={`No ${props.plural} found`}
                            message={`You do not have any ${props.plural} yet.`}
                        />
                    )}
                </PageSection>
            ) : (
                <Fragment>
                    <div ref={outerDivRef} className={classes.outerDiv}>
                        <div ref={tableDivRef} className={classes.tableDiv}>
                            <Table
                                className={classes.table}
                                cells={columns.map((column) => {
                                    return {
                                        title: column.header,
                                        header: column.tooltip
                                            ? {
                                                  info: {
                                                      popover: column.tooltip,
                                                  },
                                              }
                                            : {},
                                        transforms: [
                                            nowrap,
                                            ...(column.transforms || []),
                                            ...(column.sort ? [sortable] : []),
                                        ],
                                        cellTransforms: column.cellTransforms || [],
                                        cellFormatters: onCollapse ? [expandable] : [],
                                    }
                                })}
                                rows={rows}
                                rowWrapper={OuiaIdRowWrapper}
                                actionResolver={actionResolver}
                                actions={actions}
                                aria-label="Simple Table"
                                sortBy={adjustedSort}
                                onSort={(_event, index, direction) => updateSort({ index, direction })}
                                onSelect={
                                    /* istanbul ignore next */
                                    rows.length &&
                                    (tableActions?.some(
                                        (action) =>
                                            action.variant === 'action-group' || action.variant === 'bulk-action'
                                    ) ||
                                        !!props.onSelect)
                                        ? onSelect
                                        : undefined
                                }
                                canSelectAll={false}
                                onCollapse={onCollapse}
                                borders={!props.noBorders}
                                variant={TableVariant.compact}
                                gridBreakPoint={props.gridBreakPoint ?? breakpoint}
                            >
                                <TableHeader />
                                <TableBody />
                            </Table>
                        </div>
                    </div>
                    {!filtered.length && (
                        <PageSection variant="light" padding={{ default: 'noPadding' }}>
                            <AcmEmptyState
                                title="No results found"
                                message="No results match the filter criteria. Clear filters to show results."
                                showIcon={false}
                                action={
                                    <AcmButton variant="link" onClick={clearSearchAndFilters}>
                                        Clear all filters
                                    </AcmButton>
                                }
                            />
                        </PageSection>
                    )}
                    {(!props.autoHidePagination || filtered.length > perPage) && (
                        <Pagination
                            itemCount={itemCount}
                            perPage={perPage}
                            page={page}
                            variant={PaginationVariant.bottom}
                            onSetPage={/* istanbul ignore next */ (_event, page) => setPage(page)}
                            onPerPageSelect={/* istanbul ignore next */ (_event, perPage) => updatePerPage(perPage)}
                            aria-label="Pagination bottom"
                        />
                    )}
                </Fragment>
            )}
        </Fragment>
    )
}

function TableColumnFilters<T>(props: {
    filters: ITableFilter<T>[]
    toolbarFilterIds: { [key: string]: string[] }
    setToolbarFilterIds: React.Dispatch<
        React.SetStateAction<{
            [key: string]: string[]
        }>
    >
    items?: T[]
}) {
    const [isOpen, setIsOpen] = useState(false)
    const classes = useStyles()
    const { filters, toolbarFilterIds, setToolbarFilterIds, items } = props

    const onFilterSelect = useCallback(
        (selection: string | SelectOptionObject) => {
            /* istanbul ignore if */
            if (typeof selection !== 'string') {
                /* istanbul ignore next */
                throw new Error('Filter select error: Incorrect selection type')
            }
            let filterId = ''
            for (const filter of filters) {
                /* istanbul ignore next */
                if (filter.options.find((option) => option.value === selection)) {
                    filterId = filter.id
                    break
                }
            }
            setToolbarFilterIds((toolbarFilterIds) => {
                const selectedFilterValues = toolbarFilterIds[filterId]
                /* istanbul ignore next */
                const isCurrentlySelected = selectedFilterValues?.includes(selection)
                const updatedFilters = { ...toolbarFilterIds }
                if (isCurrentlySelected) {
                    if (selectedFilterValues.length === 1) {
                        delete updatedFilters[filterId]
                    } else {
                        updatedFilters[filterId] = updatedFilters[filterId].filter(
                            (filterValue) => filterValue !== selection
                        )
                    }
                } else {
                    updatedFilters[filterId] = [...(updatedFilters[filterId] ?? []), selection]
                }
                return updatedFilters
            })
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [filters]
    )

    const onDelete = useCallback((filter: string, id: ToolbarChip) => {
        setToolbarFilterIds((toolbarFilterIds) => {
            const updatedFilters = { ...toolbarFilterIds }
            if (updatedFilters[filter].length === 1) {
                delete updatedFilters[filter]
            } else {
                updatedFilters[filter] = updatedFilters[filter].filter((f: string) => f !== id.key)
            }
            return updatedFilters
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const onDeleteGroup = useCallback((filter: string) => {
        setToolbarFilterIds((toolbarFilterIds) => {
            const updatedFilters = { ...toolbarFilterIds }
            delete updatedFilters[filter]
            return updatedFilters
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const FilterSelectGroups = useMemo(() => {
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
                if (filter.showEmptyOptions) {
                    options.push({ option, count: count ?? 0 })
                } else {
                    if (count !== undefined && count > 0) {
                        options.push({ option, count })
                    }
                }
            }
            /* istanbul ignore else */
            if (options.length) {
                validFilters.push({ filter, options })
            }
        }

        return validFilters.map((filter) => (
            <SelectGroup key={filter.filter.id} label={filter.filter.label}>
                {filter.options.map((option) => (
                    <SelectOption
                        key={option.option.value}
                        inputId={option.option.value}
                        value={option.option.value}
                        isChecked={
                            /* istanbul ignore next */
                            toolbarFilterIds[filter.filter.id]?.indexOf(option.option.value) > -1 ?? false
                        }
                    >
                        <div className={classes.filterOption}>
                            {option.option.label}
                            <Badge className={classes.filterOptionBadge} key={option.option.value} isRead>
                                {option.count}
                            </Badge>
                        </div>
                    </SelectOption>
                ))}
            </SelectGroup>
        ))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, items, toolbarFilterIds])

    return (
        <ToolbarItem>
            {filters.reduce(
                (acc, current) => (
                    <ToolbarFilter
                        key={'acm-table-filter-key'}
                        chips={current.options
                            .filter((option: TableFilterOption<string>) => {
                                const currentCategorySelected = toolbarFilterIds[current.id] ?? []
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
                        selection: string | SelectOptionObject
                    ) => onFilterSelect(selection)}
                    selections={Object.keys(toolbarFilterIds).reduce(
                        (acc: string[], val: string) => acc.concat(toolbarFilterIds[val]),
                        []
                    )}
                    isOpen={isOpen}
                    placeholderText={
                        <div>
                            <FilterIcon className={classes.filterLabelMargin} />
                            {'Filter'}
                        </div>
                    }
                >
                    {FilterSelectGroups}
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
                                (typeof action.isDisabled === 'boolean'
                                    ? action.isDisabled
                                    : action.isDisabled?.(items)) ||
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
                    Actions
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

    const onToggleCheckbox = useCallback(() => {
        if (props.selectedCount > 0) props.onSelectNone()
        else props.onSelectAll()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.selectedCount, props.onSelectNone, props.onSelectAll])

    const toggleText = useMemo(() => {
        return props.selectedCount > 0 ? `${props.selectedCount} selected` : ''
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.selectedCount, props.selectedCount])

    const toggle = useMemo(() => {
        return (
            <DropdownToggle
                splitButtonItems={[
                    <DropdownToggleCheckbox
                        id="select-all"
                        key="select-all"
                        aria-label="Select all"
                        isChecked={props.selectedCount > 0}
                        onChange={onToggleCheckbox}
                    >
                        {toggleText}
                    </DropdownToggleCheckbox>,
                ]}
                onToggle={(isOpen) => setIsOpen(isOpen)}
            />
        )
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.selectedCount, toggleText, onToggleCheckbox])

    const selectNoneDropdownItem = useMemo(() => {
        return (
            <DropdownItem
                id="select-none"
                key="select-none"
                onClick={() => {
                    props.onSelectNone()
                    setIsOpen(false)
                }}
            >
                Select none
            </DropdownItem>
        )
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.onSelectNone])

    const selectPageDropdownItem = useMemo(() => {
        return (
            <DropdownItem
                id="select-page"
                key="select-page"
                onClick={() => {
                    props.onSelectPage()
                    setIsOpen(false)
                }}
            >
                {`Select ${Math.min(props.perPage, props.itemCount)} page items`}
            </DropdownItem>
        )
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.onSelectPage, props.perPage, props.itemCount])

    const selectAllDropdownItem = useMemo(() => {
        return (
            <DropdownItem
                id="select-all"
                key="select-all"
                onClick={() => {
                    props.onSelectAll()
                    setIsOpen(false)
                }}
            >
                {`Select all ${props.itemCount} items`}
            </DropdownItem>
        )
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.onSelectAll, props.itemCount])

    const dropdownItems = useMemo(
        () => [selectNoneDropdownItem, selectPageDropdownItem, selectAllDropdownItem],
        [selectNoneDropdownItem, selectPageDropdownItem, selectAllDropdownItem]
    )

    return <Dropdown isOpen={isOpen} toggle={toggle} dropdownItems={dropdownItems} />
}
