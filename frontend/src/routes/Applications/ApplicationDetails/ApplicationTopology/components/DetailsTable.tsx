/* Copyright Contributors to the Open Cluster Management project */

import React, { Fragment, useCallback, useLayoutEffect, useMemo, useState } from 'react'
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
  DetailsTableNodeSpecs,
  DetailsTableNodeSpecsStatusMap,
  PulseColor,
} from '../types'

const PAGE_SIZES: PageSizes = {
  DEFAULT: 10,
  VALUES: [10, 20, 50, 75, 100],
}

function deriveDetailsTableState(
  props: DetailsTableProps,
  state: Pick<DetailsTableState, 'perPage' | 'sortBy' | 'searchValue' | 'detailType'>
): Pick<DetailsTableState, 'tableData' | 'columns' | 'rows' | 'page' | 'detailType'> {
  const { id, node } = props
  const { perPage, sortBy, searchValue, detailType } = state

  localStorage.setItem(`table-${id}-page-size`, perPage.toString())

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

  const { name, namespace, type, specs = {} } = node
  const { resources = [{ name, namespace }], clustersNames = [] } = specs as DetailsTableNodeSpecs

  let { replicaCount = 1 } = specs
  replicaCount = Number.isNaN(Number(replicaCount)) ? 1 : Number(replicaCount)

  const statusMap = (specs[`${node.type}Model`] || {}) as DetailsTableNodeSpecsStatusMap

  let available: DetailsTableResourceItem[] = []
  resources.forEach((resource) => {
    clustersNames.forEach((cluster) => {
      const displayResource = resource.cluster ? resource.cluster === cluster : true

      if (displayResource) {
        Array.from(new Array(replicaCount)).forEach((_, i) => {
          const modelKey = resource.namespace
            ? `${resource.name}-${cluster}-${resource.namespace}`
            : `${resource.name}-${cluster}`
          const status = statusMap[modelKey as keyof typeof statusMap]

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

  available = available.sort((a, b) => {
    const cmp =
      pulseValueArr.indexOf(a.pulse as PulseColor | undefined) - pulseValueArr.indexOf(b.pulse as PulseColor | undefined)
    return cmp !== 0 ? cmp : a.name.localeCompare(b.name)
  })

  const newState: Pick<DetailsTableState, 'tableData' | 'columns' | 'rows' | 'page' | 'detailType'> = {
    tableData,
    columns: [],
    rows: [],
    page: 1,
    detailType,
  }

  const columns = tableData.map(({ id: colId }) => ({ key: colId }))
  newState.columns = columns

  if (detailType !== type) {
    newState.page = 1
    newState.detailType = type
  }

  let rows: DetailsTableResourceItem[] = []
  available.forEach((item) => {
    rows.push(item)
  })

  if (searchValue) {
    rows = rows.filter((row) => {
      return (
        get(row, 'name', '').indexOf(searchValue) !== -1 ||
        get(row, 'namespace', '').indexOf(searchValue) !== -1 ||
        get(row, 'cluster', '').indexOf(searchValue) !== -1
      )
    })
  }

  const { sortIndex, direction = 'asc' } = sortBy
  if (sortIndex !== undefined) {
    rows = orderBy(rows, [tableData[sortIndex].id], [direction])
  }

  newState.rows = rows.map((item): DetailsTableRow => {
    const cells = tableData.map((data) => {
      const { id: rid } = data

      if (rid === 'name') {
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
 * DetailsTable component displays resource information in a paginated, sortable table format.
 * It shows resources associated with a topology node, including their status, name, namespace, and cluster.
 * The table supports searching, sorting, and pagination for better user experience with large datasets.
 */
function DetailsTable(props: DetailsTableProps): React.ReactNode {
  const { id, node, t, handleOpen } = props
  const { type } = node

  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(
    () => Number.parseInt(localStorage.getItem(`table-${id}-page-size`) || '', 10) || PAGE_SIZES.DEFAULT
  )
  const [sortBy, setSortBy] = useState<DetailsTableState['sortBy']>({})
  const [searchValue, setSearchValue] = useState('')
  const [detailType, setDetailType] = useState(type)

  const typeMismatch = detailType !== node.type
  const slicePage = typeMismatch ? 1 : page

  const derived = useMemo(
    () => deriveDetailsTableState(props, { perPage, sortBy, searchValue, detailType }),
    [id, node, handleOpen, t, perPage, sortBy, searchValue, detailType]
  )

  useLayoutEffect(() => {
    if (detailType !== node.type) {
      setDetailType(node.type)
      setPage(1)
    }
  }, [node.type, detailType])

  const tableData = derived.tableData
  const unfilteredRows = derived.rows ?? []

  const handleSort = useCallback((_event: React.MouseEvent, index: number, direction: 'asc' | 'desc'): void => {
    setSortBy({
      index,
      sortIndex: index,
      direction,
    })
  }, [])

  const getColumns = useCallback((): TableColumnHeader[] => {
    if (!tableData) {
      return []
    }

    const headers: TableColumnHeader[] = tableData.map(({ name, width }) => ({
      title: name,
      columnTransforms: [
        () => {
          return { style: { width: width || 'auto' } }
        },
      ],
      transforms: [sortable],
    }))

    headers.push({ key: 'action', title: '' })
    return headers
  }, [tableData])

  const inx = (slicePage - 1) * perPage
  const rows = unfilteredRows.slice(inx, inx + perPage)
  const columns = getColumns()
  const resources = get(node, 'specs.resources', [])

  return (
    <div className="creation-view-controls-table-container">
      <div className="creation-view-controls-table">
        <Fragment>
          <Toolbar>
            <ToolbarContent>
              <ToolbarItem>
                <SearchInput
                  style={{ minWidth: '350px', display: 'flex' }}
                  placeholder={t('search.label')}
                  value={searchValue}
                  onChange={(_evt: React.FormEvent<HTMLInputElement>, value: string) => {
                    setSearchValue(value || '')
                    setPage(1)
                  }}
                  onClear={() => {
                    setSearchValue('')
                    setPage(1)
                  }}
                  resultsCount={`${rows.length} / ${resources.length}`}
                />
              </ToolbarItem>
            </ToolbarContent>
          </Toolbar>

          <Fragment>
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
                              onSort: handleSort,
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

            <Split>
              <SplitItem style={{ width: '100%' }}>
                {resources.length !== 0 && (
                  <Pagination
                    itemCount={unfilteredRows.length}
                    perPage={perPage}
                    page={slicePage}
                    variant={PaginationVariant.bottom}
                    onSetPage={(_event: React.MouseEvent | React.KeyboardEvent | MouseEvent, nextPage: number) => {
                      setPage(nextPage)
                    }}
                    onPerPageSelect={(_event: React.MouseEvent | React.KeyboardEvent | MouseEvent, nextPerPage: number) => {
                      setPerPage(nextPerPage)
                      setPage(1)
                    }}
                  />
                )}
              </SplitItem>
            </Split>
          </Fragment>
        </Fragment>
      </div>
    </div>
  )
}

export default DetailsTable
