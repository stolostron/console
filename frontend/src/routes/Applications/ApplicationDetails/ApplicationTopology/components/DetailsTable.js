/* Copyright Contributors to the Open Cluster Management project */

import { Component, Fragment } from 'react'
import PropTypes from 'prop-types'
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
import { sortable, Table, TableBody, TableHeader, TableVariant } from '@patternfly/react-table'
import { get, orderBy } from 'lodash'
import { pulseValueArr } from '../helpers/diagram-helpers'

const PAGE_SIZES = {
  DEFAULT: 10,
  VALUES: [10, 20, 50, 75, 100],
}

class DetailsTable extends Component {
  static propTypes = {
    handleOpen: PropTypes.func,
    id: PropTypes.string,
    node: PropTypes.object,
    t: PropTypes.func,
  }

  static getDerivedStateFromProps(props, state) {
    const { id, node, handleOpen } = props
    const { perPage, sortBy, searchValue, detailType } = state
    localStorage.setItem(`table-${id}-page-size`, perPage)
    const tableData = [
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
    const { resources = [{ name, namespace }], clustersNames = [], replicaCount = 1 } = specs
    const statusMap = specs[`${node.type}Model`] || {}
    let available = []
    resources.forEach((resource) => {
      clustersNames.forEach((cluster) => {
        const displayResource = resource.cluster ? (resource.cluster === cluster ? true : false) : true

        if (displayResource) {
          Array.from(Array(replicaCount)).forEach((_, i) => {
            const modelKey = resource.namespace
              ? `${resource.name}-${cluster}-${resource.namespace}`
              : `${resource.name}-${cluster}`
            const status = statusMap[modelKey]
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
      const cmp = pulseValueArr.indexOf(a.pulse) - pulseValueArr.indexOf(b.pulse)
      return cmp !== 0 ? cmp : a.name.localeCompare(b.name)
    })

    const newState = { tableData }

    const columns = tableData.map(({ id }) => ({ key: id }))
    newState.columns = columns

    if (detailType !== type) {
      newState.page = 1
      newState.detailType = type
    }

    let rows = []
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

    const { sortIndex, direction } = sortBy
    if (sortIndex !== undefined) {
      rows = orderBy(rows, [tableData[sortIndex].id], [direction])
    }

    newState.rows = rows.map((item) => {
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
            case undefined:
            case 'orange':
              icon = 'pending'
              break
          }
          return (
            <div>
              <div style={{ display: 'flex' }}>
                <div style={{ marginRight: '8px' }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill={pulse}>
                    <use href={`#drawerShapes_${icon}`} width={12} height={12} />
                  </svg>
                </div>
                <Button onClick={() => handleOpen(node, item)} variant="link" isInline>
                  {item[rid]}
                </Button>
              </div>
            </div>
          )
        } else {
          return item[rid]
        }
      })
      return {
        id,
        cells,
      }
    })

    return newState
  }

  constructor(props) {
    super(props)
    const { id, node } = props
    const { type } = node
    this.state = {
      page: 1,
      perPage: parseInt(localStorage.getItem(`table-${id}-page-size`), 10) || PAGE_SIZES.DEFAULT,
      sortBy: {},
      searchValue: '',
      detailType: type,
    }
    this.handleSort = this.handleSort.bind(this)
  }

  getColumns() {
    const { tableData } = this.state
    const headers = tableData.map(({ name, width }) => ({
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
  }

  handleSort(event, index, direction) {
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

  render() {
    const { page = 1, perPage } = this.state
    let { rows = [] } = this.state
    const inx = (page - 1) * perPage
    rows = rows.slice(inx, inx + perPage)
    return (
      <div className="creation-view-controls-table-container">
        <div className="creation-view-controls-table">{this.renderTable(rows)}</div>
      </div>
    )
  }

  renderTable(rows) {
    const { node, t } = this.props
    const resources = get(node, 'specs.resources', [])
    const { sortBy, page, perPage, rows: unfilteredRows } = this.state
    const columns = this.getColumns()
    const { searchValue } = this.state
    return (
      <Fragment>
        <Toolbar>
          <ToolbarContent>
            <ToolbarItem>
              <SearchInput
                style={{ minWidth: '350px', display: 'flex' }}
                placeholder={t('search.label')}
                value={searchValue}
                onChange={(value) => {
                  this.setState({
                    searchValue: value || '',
                    page: 1,
                  })
                }}
                onClear={() => {
                  this.setState({
                    searchValue: '',
                    page: 1,
                  })
                }}
                resultsCount={`${rows.length} / ${resources.length}`}
              />
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>
        <Fragment>
          <Table
            aria-label="Resource Table"
            sortBy={sortBy}
            onSort={this.handleSort}
            variant={TableVariant.compact}
            cells={columns}
            rows={rows}
          >
            <TableHeader />
            <TableBody />
          </Table>
          <Split>
            <SplitItem style={{ width: '100%' }}>
              {resources.length !== 0 && (
                <Pagination
                  itemCount={unfilteredRows.length}
                  perPage={perPage}
                  page={page}
                  variant={PaginationVariant.bottom}
                  onSetPage={(_event, page) => {
                    this.setState({
                      page,
                    })
                  }}
                  onPerPageSelect={(_event, perPage) => {
                    this.setState({
                      perPage,
                      page: 1,
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
