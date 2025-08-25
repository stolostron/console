/* Copyright Contributors to the Open Cluster Management project */

import { ButtonVariant, PaginationProps, PerPageOptions, TooltipProps } from '@patternfly/react-core'
import { IRow, ISortBy, ITransform, TableGridBreakpoint } from '@patternfly/react-table'
import { ReactNode } from 'react'
import { IRequestListView, IResultListView, IResultStatuses } from '../../lib/useAggregates'
import { SearchOperator } from '../AcmSearchInput'
import { SelectOptionObject } from '@patternfly/react-core/deprecated'

type SortFn<T> = (a: T, b: T) => number
type CellFn<T> = (item: T, search: string) => ReactNode
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

  // whether the column is hidden or not
  isHidden?: boolean
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
  /** Visible description for action */
  description?: string | React.ReactNode
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
  isDisabled?: boolean
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

export interface ITableItem<T> {
  item: T
  key: string
  subRows?: ExportableIRow[]
  [key: string]: unknown
}

export type CommonPaginationPropsType = Partial<Omit<PaginationProps, 'ref'>>

export type FilterSelection = string[]
export type TableFilterOption = { label: ReactNode; value: string }

export type AdvancedFilterSelection = {
  operator: SearchOperator
  value: string
}

export type FilterSelectOptionObject = SelectOptionObject & {
  filterId: string
  value: string
}

export type TableFilterBase<T, S> = {
  /** unique identifier for the filter */
  id: string
  /** string displayed in the UI */
  label: string
  /** A required function that returns a boolean if the item is a match to the current filters */
  tableFilterFn: (selection: S, item: T) => boolean
}

export interface ITableFilter<T> extends TableFilterBase<T, FilterSelection> {
  /** Options is an array to define the exact filter options */
  options: TableFilterOption[]
  showEmptyOptions?: boolean
  supportsInequality?: boolean
}
export interface IValidFilters<T> {
  filter: ITableFilter<T>
  options: { option: TableFilterOption; count: number }[]
}

export interface ITableAdvancedFilter<T> extends TableFilterBase<T, AdvancedFilterSelection> {
  availableOperators: SearchOperator[]
}

export type TableFilterOptions = { option: TableFilterOption; count: number }

export type CurrentFilters<S> = {
  [filter: string]: S
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
