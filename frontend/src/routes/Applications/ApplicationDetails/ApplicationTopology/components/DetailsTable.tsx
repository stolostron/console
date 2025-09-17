/* Copyright Contributors to the Open Cluster Management project */

import React, { Component, Fragment } from 'react'
import {
  Button,
  Pagination,
  PaginationVariant,
  SearchInput,
  Split,
  SplitItem,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from '@patternfly/react-core'
import { Table, Thead, Tr, Th, Tbody, Td, sortable, TableVariant } from '@patternfly/react-table'
import { get, orderBy } from 'lodash'
import { pulseValueArr } from '../helpers/diagram-helpers'
import {
  PageSizes,
  TableData,
  DetailsTableResourceItem,
  DetailsTableRow,
  TableColumnHeader,
  DetailsTableProps,
  DetailsTableState,
} from '../model/types'
import { Pulse } from '../helpers/types'

/**
 * Page size configuration for table pagination
 * Defines default page size and available options for users
 */
const PAGE_SIZES: PageSizes = {
  DEFAULT: 10,
  VALUES: [10, 20, 50, 75, 100],
}

/**
 * DetailsTable component displays resource information in a paginated, sortable table format.
 * It shows resources associated with a topology node, including their status, name, namespace, and cluster.
 * The table supports searching, sorting, and pagination for better user experience with large datasets.
 */
class DetailsTable extends Component<DetailsTableProps, DetailsTableState> {
  /**
   * Derives state from props and processes node data into table format.
   * This method handles the complex logic of transforming topology node data into table rows,
   * including status calculation, filtering, and sorting.
   *
   * @param props - Component props containing node data and handlers
   * @param state - Current component state with pagination and filter settings
   * @returns New state object with processed table data
   */
  static getDerivedStateFromProps(props: DetailsTableProps, state: DetailsTableState): Partial<DetailsTableState> {
    const { id, node } = props
    const { perPage, sortBy, searchValue, detailType } = state

    // Persist page size preference in localStorage for user convenience
    localStorage.setItem(`table-${id}-page-size`, perPage.toString())

    /**
     * Define table column configuration
     * Each column specifies display name, data field ID, and width
     */
    const tableData: TableData[] = [
      {
        name: 'Name',
        id: 'name',
        width: '40%',
      },
      {
        name: 'Namespace',
        id: 'namespace',
        width: '40%',
      },
      {
        name: 'Cluster',
        id: 'cluster',
        width: '30%',
      },
    ]

    // Extract node properties with defaults for missing values
    const { name, namespace, type, specs = {} } = node
    const { resources = [{ name, namespace }], clustersNames = [] } = specs

    // Parse replica count, defaulting to 1 if invalid or missing
    let { replicaCount = 1 } = specs
    replicaCount = isNaN(Number(replicaCount)) ? 1 : Number(replicaCount)

    // Get status information from the appropriate model (e.g., subscriptionModel, podModel)
    const statusMap = specs[`${node.type}Model`] || {}

    /**
     * Build available resources array by combining resources with clusters and replicas
     * This creates individual entries for each resource instance across all clusters
     */
    let available: DetailsTableResourceItem[] = []
    resources.forEach((resource) => {
      clustersNames.forEach((cluster) => {
        // Check if resource should be displayed on this cluster
        const displayResource = resource.cluster ? (resource.cluster === cluster ? true : false) : true

        if (displayResource) {
          // Create entries for each replica of the resource
          Array.from(Array(replicaCount)).forEach((_, i) => {
            // Build model key for status lookup
            const modelKey = resource.namespace
              ? `${resource.name}-${cluster}-${resource.namespace}`
              : `${resource.name}-${cluster}`
            const status = statusMap[modelKey]

            // Create resource item with status information
            available.push({
              pulse: status && status.length > i ? status[i].pulse || 'green' : 'orange',
              name: status && status.length > i ? status[i].name : resource.name,
              namespace: status && status.length > i ? status[i].namespace : resource.namespace,
              cluster: cluster,
              type: type,
            })
          })
        }
      })
    })

    /**
     * Sort available resources by status priority (pulse color) and then by name
     * This ensures failed/warning resources appear first, followed by successful ones
     */
    available = available.sort((a, b) => {
      const cmp =
        pulseValueArr.indexOf(a.pulse as Pulse | undefined) - pulseValueArr.indexOf(b.pulse as Pulse | undefined)
      return cmp !== 0 ? cmp : a.name.localeCompare(b.name)
    })

    const newState: Partial<DetailsTableState> = { tableData }

    // Create column configuration for table headers
    const columns = tableData.map(({ id }) => ({ key: id }))
    newState.columns = columns

    // Reset pagination when switching between different detail types
    if (detailType !== type) {
      newState.page = 1
      newState.detailType = type
    }

    // Start with all available resources
    let rows: DetailsTableResourceItem[] = []
    available.forEach((item) => {
      rows.push(item)
    })

    /**
     * Apply search filter if search value is provided
     * Searches across name, namespace, and cluster fields
     */
    if (searchValue) {
      rows = rows.filter((row) => {
        return (
          get(row, 'name', '').indexOf(searchValue) !== -1 ||
          get(row, 'namespace', '').indexOf(searchValue) !== -1 ||
          get(row, 'cluster', '').indexOf(searchValue) !== -1
        )
      })
    }

    /**
     * Apply sorting if sort configuration is provided
     * Uses lodash orderBy for consistent sorting behavior
     */
    const { sortIndex, direction } = sortBy
    if (sortIndex !== undefined) {
      rows = orderBy(rows, [tableData[sortIndex].id], [direction])
    }

    /**
     * Transform resource items into table row format
     * Each row contains cells with rendered content, including status icons and action buttons
     */
    newState.rows = rows.map((item): DetailsTableRow => {
      const cells = tableData.map((data) => {
        const { id: rid } = data

        // Special handling for name column to include status icon and action button
        if (rid === 'name') {
          // Map pulse color to appropriate icon type
          let icon = ''
          const pulse = item.pulse
          switch (pulse) {
            case 'green':
              icon = 'success'
              break
            case 'red':
              icon = 'failure'
              break
            case 'yellow':
              icon = 'warning'
              break
            case 'blocked':
              icon = 'blocked'
              break
            case undefined:
            case 'orange':
              icon = 'pending'
              break
          }

          // Render name cell with status icon and clickable button
          return (
            <div key={rid}>
              <div style={{ display: 'flex' }}>
                <div style={{ marginRight: '8px' }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill={pulse}>
                    <use href={`#drawerShapes_${icon}`} width={12} height={12} />
                  </svg>
                </div>
                <Button onClick={() => props.handleOpen?.(node, item)} variant="link" isInline>
                  {item[rid as keyof DetailsTableResourceItem]}
                </Button>
              </div>
            </div>
          )
        } else {
          // For other columns, just return the raw value
          return item[rid as keyof DetailsTableResourceItem]
        }
      })

      return {
        id: id,
        cells,
      }
    })

    return newState
  }

  /**
   * Component constructor initializes state with default values and binds methods
   * Retrieves saved page size from localStorage for user preference persistence
   */
  constructor(props: DetailsTableProps) {
    super(props)
    const { id, node } = props
    const { type } = node

    this.state = {
      page: 1,
      perPage: parseInt(localStorage.getItem(`table-${id}-page-size`) || '', 10) || PAGE_SIZES.DEFAULT,
      sortBy: {},
      searchValue: '',
      detailType: type,
    }

    // Bind event handlers to maintain proper 'this' context
    this.handleSort = this.handleSort.bind(this)
  }

  /**
   * Generates column header configuration for PatternFly table component
   * Includes width styling and sortable transforms for interactive columns
   *
   * @returns Array of column header configurations
   */
  getColumns(): TableColumnHeader[] {
    const { tableData } = this.state

    if (!tableData) {
      return []
    }

    // Map table data to PatternFly column header format
    const headers: TableColumnHeader[] = tableData.map(({ name, width }) => ({
      title: name,
      columnTransforms: [
        () => {
          return { style: { width: width || 'auto' } }
        },
      ],
      transforms: [sortable], // Enable sorting for all columns
    }))

    // Add empty action column for consistent spacing
    headers.push({ key: 'action', title: '' })
    return headers
  }

  /**
   * Handles table column sorting by updating sort state
   * Triggered when user clicks on sortable column headers
   *
   * @param _event - Click event (unused)
   * @param index - Column index being sorted
   * @param direction - Sort direction ('asc' or 'desc')
   */
  handleSort(_event: React.MouseEvent, index: number, direction: 'asc' | 'desc'): void {
    this.setState(() => {
      return {
        sortBy: {
          index,
          sortIndex: index,
          direction,
        },
      }
    })
  }

  /**
   * Main render method that displays the paginated table
   * Applies pagination to the processed rows before rendering
   */
  render(): React.ReactNode {
    const { page = 1, perPage } = this.state
    let { rows = [] } = this.state

    // Calculate pagination slice indices
    const inx = (page - 1) * perPage
    rows = rows.slice(inx, inx + perPage)

    return (
      <div className="creation-view-controls-table-container">
        <div className="creation-view-controls-table">{this.renderTable(rows)}</div>
      </div>
    )
  }

  /**
   * Renders the complete table with toolbar, search, table content, and pagination
   * This method handles the full table UI including search functionality and pagination controls
   *
   * @param rows - Paginated table rows to display
   * @returns Complete table JSX element
   */
  renderTable(rows: DetailsTableRow[]): React.ReactNode {
    const { node, t } = this.props
    const resources = get(node, 'specs.resources', [])
    const { sortBy, page, perPage, rows: unfilteredRows } = this.state
    const columns = this.getColumns()
    const { searchValue } = this.state

    return (
      <Fragment>
        {/* Search toolbar for filtering table content */}
        <Toolbar>
          <ToolbarContent>
            <ToolbarItem>
              <SearchInput
                style={{ minWidth: '350px', display: 'flex' }}
                placeholder={t('search.label')}
                value={searchValue}
                onChange={(_evt: React.FormEvent<HTMLInputElement>, value: string) => {
                  this.setState({
                    searchValue: value || '',
                    page: 1, // Reset to first page when searching
                  })
                }}
                onClear={() => {
                  this.setState({
                    searchValue: '',
                    page: 1, // Reset to first page when clearing search
                  })
                }}
                resultsCount={`${rows.length} / ${resources.length}`}
              />
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>

        <Fragment>
          {/* Main data table with sortable columns */}
          <Table aria-label="Resource Table" variant={TableVariant.compact}>
            <Thead>
              <Tr>
                {columns.map((column, columnIndex) => (
                  <Th
                    key={columnIndex}
                    sort={
                      column.transforms?.includes(sortable)
                        ? {
                            sortBy: sortBy,
                            onSort: this.handleSort,
                            columnIndex: columnIndex,
                          }
                        : undefined
                    }
                    style={column.columnTransforms?.[0]()?.style}
                  >
                    {column.title}
                  </Th>
                ))}
              </Tr>
            </Thead>
            <Tbody>
              {rows.map((row, rowIndex) => (
                <Tr key={rowIndex}>
                  {row.cells.map((cell, cellIndex) => (
                    <Td key={cellIndex} dataLabel={columns[cellIndex]?.title}>
                      {cell}
                    </Td>
                  ))}
                </Tr>
              ))}
            </Tbody>
          </Table>

          {/* Pagination controls at bottom of table */}
          <Split>
            <SplitItem style={{ width: '100%' }}>
              {resources.length !== 0 && (
                <Pagination
                  itemCount={unfilteredRows?.length || 0}
                  perPage={perPage}
                  page={page}
                  variant={PaginationVariant.bottom}
                  onSetPage={(_event: React.MouseEvent | React.KeyboardEvent | MouseEvent, page: number) => {
                    this.setState({
                      page,
                    })
                  }}
                  onPerPageSelect={(_event: React.MouseEvent | React.KeyboardEvent | MouseEvent, perPage: number) => {
                    this.setState({
                      perPage,
                      page: 1, // Reset to first page when changing page size
                    })
                  }}
                />
              )}
            </SplitItem>
          </Split>
        </Fragment>
      </Fragment>
    )
  }
}

export default DetailsTable
