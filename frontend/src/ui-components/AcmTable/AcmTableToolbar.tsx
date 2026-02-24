/* Copyright Contributors to the Open Cluster Management project */

import {
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  MenuToggleCheckbox,
  Pagination,
  Toolbar,
  ToolbarContent,
  ToolbarFilter,
  ToolbarGroup,
  ToolbarItem,
  ToolbarLabel,
  Tooltip,
} from '@patternfly/react-core'
import { ExportIcon } from '@patternfly/react-icons'
import { ISortBy } from '@patternfly/react-table'
import { debounce } from 'debounce'
import { noop } from 'lodash'
import { parse, ParsedQuery, stringify } from 'query-string'
import {
  forwardRef,
  Fragment,
  Ref,
  RefObject,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react'
import { useLocation, useNavigate } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../lib/acm-i18next'
import { FilterCounts } from '../../lib/useAggregates'
import { matchesFilterValue, parseLabel } from '../../resources/utils'
import { AcmButton } from '../AcmButton'
import { AcmDropdown, AcmDropdownItems } from '../AcmDropdown'
import { AcmSearchInput, SearchConstraint } from '../AcmSearchInput'
import { AcmTableStateContext } from './AcmTableStateProvider'
import {
  AcmTableProps,
  CommonPaginationPropsType,
  CurrentFilters,
  FilterSelection,
  FilterSelectOptionObject,
  IAcmTableAction,
  IAcmTableButtonAction,
  ITableFilter,
  ITableItem,
  IValidFilters,
  TableFilterBase,
  TableFilterOption,
  TableFilterOptions,
} from './AcmTableTypes'
import { FilterSelect } from './FilterSelect'
import { getLocalStorage, setLocalStorage } from './localColumnStorage'

// when a filter has more then this many options, give it its own dropdown
const SPLIT_FILTER_THRESHOLD = 30
// so we don't create 3000 elements, only create this many
// with the assumption that if the user is looking for an option
// they will use filter to find it
const MAXIMUM_OPTIONS = 200

export const SEARCH_DEBOUNCE_TIME = 500

const createFilterSelectOptionObject = (filterId: string, value: string): FilterSelectOptionObject => ({
  filterId,
  value,
  toString: () => value,
  compareTo: (selectOption: FilterSelectOptionObject) =>
    selectOption.filterId === filterId && selectOption.value === value,
})

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

const findFilterMatch = <T, S>(filter: string, filterArray: TableFilterBase<T, S>[]) =>
  filterArray.find((filterItem) => filterItem.id === filter)

export const applyFilters = <T, S>(
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

export type AcmTableToolbarProps<T> = Pick<AcmTableProps<T>, Exclude<keyof AcmTableProps<T>, 'setPage' | 'setSort'>> & {
  hasFilter: boolean
  hasSelectionColumn: boolean
  commonPaginationProps: CommonPaginationPropsType
  preFilterSort: ISortBy | undefined
  setPage: (page: number) => void
  setSort: (sort: ISortBy) => void
  setPreFilterSort: React.Dispatch<React.SetStateAction<ISortBy | undefined>>
  selected: { [uid: string]: boolean }
  setSelected: React.Dispatch<React.SetStateAction<{ [uid: string]: boolean }>>
  disabled: { [uid: string]: boolean }
  internalSearch: string
  setInternalSearch: React.Dispatch<React.SetStateAction<string>>
  exportTable: () => Promise<void>
  renderColumnManagement: () => JSX.Element | undefined
  setActiveAdvancedFilters: React.Dispatch<React.SetStateAction<SearchConstraint[]>>
  perPage: number
  paged: ITableItem<T>[]
  filtered: ITableItem<T>[]
  filteredCount: number
  totalCount: number
}

export interface ToolbarRef {
  clearSearchAndFilters: () => void
}
const AcmTableToolbarBase = <T,>(props: AcmTableToolbarProps<T>, ref: Ref<ToolbarRef>) => {
  useImperativeHandle(ref, () => ({ clearSearchAndFilters }))
  const {
    id,
    items,
    columns,
    keyFn,
    tableActions = [],
    customTableAction,
    additionalToolbarItems,
    filters = [],
    secondaryFilterIds,
    advancedFilters = [],
    onSelect: propsOnSelect,
    resultCounts,
    renderColumnManagement,
    showExportButton,
    hasFilter,
    hasSelectionColumn,
    commonPaginationProps,
    sort,
    setPage,
    setSort,
    setPreFilterSort,
    selected,
    setSelected,
    disabled,
    internalSearch,
    setInternalSearch,
    preFilterSort,
    exportTable,
    setActiveAdvancedFilters,
    perPage,
    paged,
    filtered,
    filteredCount,
    totalCount,
  } = props

  const { t } = useTranslation()
  const initialSearch = props.initialSearch ?? ''

  const [stateSearch, stateSetSearch] = useState(initialSearch)
  const { search: storedSearch, setSearch: setStoredSearch = noop } = useContext(AcmTableStateContext)
  const search = props.search ?? storedSearch ?? stateSearch
  const setSearch = props.setSearch ?? stateSetSearch

  const searchPlaceholder = props.searchPlaceholder ?? t('Search')
  const hasSearch = useMemo(() => columns.some((column) => column.search), [columns])
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false)
  const { filterCounts } = resultCounts ?? {}

  const { clearFilters } = useTableFilterSelections({ id, filters })
  const [pendingConstraints, setPendingConstraints] = useState<SearchConstraint[]>([
    { operator: undefined, value: '', columnId: '' },
  ])

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
        ;(setInternalSearchWithDebounce as any).clear()
      }
    }
  }, [search, setInternalSearchWithDebounce])

  const clearSearch = useCallback(() => {
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'test') {
      ;(setInternalSearchWithDebounce as unknown as ReturnType<typeof debounce>).clear()
    }
    setSearch('')
    setInternalSearch('')
    setStoredSearch('')
    setPage(1)
    if (preFilterSort) {
      setSort(preFilterSort)
    }
  }, [setSearch, setStoredSearch, setInternalSearch, setPage, preFilterSort, setInternalSearchWithDebounce, setSort])

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
      setStoredSearch(newSearch)
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
    [setSearch, setStoredSearch, setPage, search, preFilterSort, setSort, setPreFilterSort, sort]
  )

  return (
    <Toolbar
      clearFiltersButtonText={t('Clear all filters')}
      clearAllFilters={clearSearchAndFilters}
      collapseListedFiltersBreakpoint={'lg'}
      inset={{ default: 'insetNone' }}
    >
      <ToolbarContent>
        {hasSelectionColumn && (
          <ToolbarItem>
            <TableSelectionDropdown
              itemCount={commonPaginationProps.itemCount ?? 0}
              selectedCount={Object.keys(selected).length}
              perPage={perPage}
              onSelectNone={() => {
                const newSelected: { [uid: string]: boolean } = {}
                setSelected(newSelected)
                if (propsOnSelect && items) {
                  propsOnSelect(items.filter((item) => newSelected[keyFn(item)]))
                }
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
              <ToolbarItem>
                <AcmSearchInput
                  placeholder={searchPlaceholder}
                  spellCheck={false}
                  resultsCount={`${search === internalSearch ? filteredCount : '-'} / ${totalCount}`}
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
          <TableActionsButtons actions={props.tableActionButtons} hasSelections={Object.keys(selected).length > 0} />
        )}
        {tableActions.length > 0 && (
          <TableActions actions={tableActions} selections={selected} items={items} keyFn={keyFn} />
        )}
        {renderColumnManagement()}
        {customTableAction}
        {showExportButton && (
          <Tooltip content={t('Export all table data')}>
            <ToolbarItem key={`export-toolbar-item`}>
              <Dropdown
                onOpenChange={(isOpen) => {
                  setIsExportMenuOpen(isOpen)
                }}
                onSelect={(event) => {
                  event?.stopPropagation()
                  setIsExportMenuOpen(false)
                }}
                className="export-dropdownMenu"
                toggle={(toggleRef) => (
                  <MenuToggle
                    ref={toggleRef}
                    variant="plain"
                    onClick={(event) => {
                      event.stopPropagation()
                      setIsExportMenuOpen(!isExportMenuOpen)
                    }}
                    aria-label="export-search-result"
                    id="export-search-result"
                  >
                    <ExportIcon />
                  </MenuToggle>
                )}
                isOpen={isExportMenuOpen}
                popperProps={{
                  position: 'left',
                }}
              >
                <DropdownList>
                  <DropdownItem key="export-csv" onClick={() => exportTable()}>
                    {t('Export all to CSV')}
                  </DropdownItem>
                </DropdownList>
              </Dropdown>
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
  const { id, filters, secondaryFilterIds, items, filterCounts } = props
  const { filterSelections, addFilterValue, removeFilterValue, removeFilter, negateFilterValue } =
    useTableFilterSelections({
      id,
      filters,
    })

  const onToggleEquality = useCallback(
    (filterId: string, option: TableFilterOptions) => {
      negateFilterValue(filterId, option.option.value)
    },
    [negateFilterValue]
  )

  const onDelete = useCallback(
    (filter: string, chip: ToolbarLabel) => {
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
        validFilters: [] as IValidFilters<T>[],
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
        const opt: TableFilterOption =
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
            return a?.option?.label?.toString().localeCompare(b?.option?.label?.toString() ?? '') || 0
          })

          filterGroups.push({
            allFilters: [] as ITableFilter<T>[],
            validFilters: [] as IValidFilters<T>[],
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

    return filterGroups.map(({ allFilters, validFilters }) => {
      return {
        groupFilters: allFilters,
        validFilters,
      }
    })
  }, [filterCounts, filters, items, secondaryFilterIds, selections])

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
          .filter((option: TableFilterOption) => {
            return currentCategorySelected.includes(option.value)
          })
          .map<ToolbarLabel>((option: TableFilterOption) => {
            return { key: option.value, node: option.label }
          })
      }
    },
    [filterSelections]
  )

  return (
    <ToolbarItem>
      <div style={{ display: 'flex' }}>
        {filterSelectGroups.map(({ groupFilters, validFilters }, inx) => {
          return groupFilters.reduce(
            (acc, current) => (
              <ToolbarFilter
                key={`acm-table-filter-key-${current.id}`}
                labels={createChips(current)}
                deleteLabel={(_category, chip) => {
                  chip = chip as ToolbarLabel
                  onDelete(current.id, chip)
                }}
                deleteLabelGroup={() => onDeleteGroup(current.id)}
                categoryName={current.label}
              >
                {acc}
              </ToolbarFilter>
            ),
            <FilterSelect
              label={inx !== 0 ? groupFilters[0].label : undefined}
              selectedFilters={Object.values(filterSelections).flat()}
              validFilters={validFilters}
              onToggleEquality={onToggleEquality}
              hasFilter={inx !== 0}
              onSelect={(filterId, value) => {
                if (filterSelections[filterId as string]?.includes(value)) {
                  removeFilterValue(filterId as string, value)
                } else {
                  addFilterValue(filterId as string, value)
                }
              }}
              isScrollable
            />
          )
        })}
      </div>
    </ToolbarItem>
  )
}

function TableActions<T>(
  props: Readonly<{
    actions: IAcmTableAction<T>[]
    selections: { [uid: string]: boolean }
    items: T[] | undefined
    keyFn: (item: T) => string
  }>
) {
  const { actions, selections, items, keyFn } = props
  /* istanbul ignore if */
  if (actions.length === 0) return <Fragment />
  return <TableActionsDropdown actions={actions} selections={selections} items={items} keyFn={keyFn} />
}

function TableActionsButtons(props: Readonly<{ actions: IAcmTableButtonAction[]; hasSelections?: boolean }>) {
  return (
    <ToolbarGroup variant="action-group">
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

function TableActionsDropdown<T>(
  props: Readonly<{
    actions: IAcmTableAction<T>[]
    selections: { [uid: string]: boolean }
    items: T[] | undefined
    keyFn: (item: T) => string
  }>
) {
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
              ? { flyoutMenu: convertAcmTableActionsToAcmDropdownItems(action.actions)! }
              : {
                  tooltip: action.tooltip,
                  isAriaDisabled:
                    (typeof action.isDisabled === 'boolean' ? action.isDisabled : action.isDisabled?.(items)) ||
                    !hasSelections,
                }),
          }
        })
        .filter((action) => action !== null) as AcmDropdownItems[]
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

export interface TableSelectionDropdownProps {
  itemCount: number
  selectedCount: number
  perPage: number
  onSelectNone: () => void
  onSelectPage: () => void
  onSelectAll: () => void
}

export function TableSelectionDropdown(props: Readonly<TableSelectionDropdownProps>) {
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

  const toggle = useCallback(
    (toggleRef: RefObject<any>) => {
      return (
        <MenuToggle
          ref={toggleRef}
          splitButtonItems={[
            <MenuToggleCheckbox
              id="select-all"
              key="select-all"
              aria-label={t('Select all')}
              isChecked={selectedCount > 0}
              onChange={onToggleCheckbox}
            />,
          ]}
          aria-label={t('Select')}
          onClick={(event) => {
            event.stopPropagation()
            setIsOpen(!isOpen)
          }}
        >
          {toggleText}
        </MenuToggle>
      )
    },
    [t, selectedCount, onToggleCheckbox, toggleText, isOpen]
  )

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

  return (
    <Dropdown
      isOpen={isOpen}
      toggle={(toggleRef) => toggle(toggleRef)}
      onOpenChange={(isOpen) => {
        setIsOpen(isOpen)
      }}
      onSelect={(event) => {
        event?.stopPropagation()
        setIsOpen(false)
      }}
    >
      <DropdownList>{dropdownItems}</DropdownList>
    </Dropdown>
  )
}

export const AcmTableToolbar = forwardRef(AcmTableToolbarBase) as <T>(
  props: AcmTableToolbarProps<T> & { ref?: Ref<ToolbarRef> }
) => ReturnType<typeof AcmTableToolbarBase>
