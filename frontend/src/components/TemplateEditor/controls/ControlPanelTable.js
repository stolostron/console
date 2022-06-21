'use strict'

import React, { Fragment } from 'react'
import PropTypes from 'prop-types'
import {
  Alert,
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
  EmptyStateVariant,
  Pagination,
  PaginationVariant,
  SearchInput,
  Spinner,
  Split,
  SplitItem,
  Title,
  Toolbar,
  ToolbarContent,
  SelectOption,
  ToolbarItem,
} from '@patternfly/react-core'
import { sortable, EditableSelectInputCell, Table, TableBody, TableHeader, TableVariant } from '@patternfly/react-table'
import { ControlMode } from '../utils/source-utils'
import { NoResourceIcon } from '../icons/NoResource'
import keyBy from 'lodash/keyBy'
import get from 'lodash/get'
import orderBy from 'lodash/orderBy'
import set from 'lodash/set'

const add = 'table.actions.add'
const remove = 'table.actions.remove'
const edit = 'table.actions.edit'

const PAGE_SIZES = {
  DEFAULT: 5,
  VALUES: [5, 10, 20, 50, 75, 100],
}

class ControlPanelTable extends React.Component {
  static propTypes = {
    control: PropTypes.object,
    fetchData: PropTypes.object,
    handleChange: PropTypes.func,
    i18n: PropTypes.func,
  }

  static getDerivedStateFromProps(props, state) {
    const { control } = props
    const { id, isLoaded } = control
    const { available = [] } = control
    const { perPage } = state
    const { rows = [] } = state
    const newState = {}
    localStorage.setItem(`table-${id}-page-size`, perPage)
    if (!state.originalSet) {
      newState.originalSet = new Set(isLoaded ? Object.keys(keyBy(available, 'id')) : [])
    }
    const { active } = control
    const { controlData } = control
    const { onSelect, onToggle, clearSelection, searchValue } = state
    const columns = controlData.filter(({ mode }) => mode !== ControlMode.PROMPT_ONLY).map(({ id }) => ({ key: id }))
    newState.columns = columns
    const activeMap = keyBy(active, 'id')
    const rowMap = keyBy(rows, 'id')
    const newRows = []
    available.forEach((item) => {
      if (!rowMap[item.id]) {
        rowMap[item.id] = item
        newRows.push(item)
      }
    })
    newState.rows = [...newRows, ...rows].map((item) => {
      const { id } = item
      const row = rowMap[id]

      // create table rows
      if (!row.cells) {
        const cells = controlData
          .filter(({ mode }) => mode !== ControlMode.PROMPT_ONLY)
          .map((data) => {
            const { id: rid, type, available } = data
            const ractive = get(activeMap[id], rid)
            switch (type) {
              case 'text':
                return item[rid]
              case 'toggle':
                return {
                  title: (value, rowIndex, cellIndex, props) => (
                    <EditableSelectInputCell
                      value={value}
                      rowIndex={rowIndex}
                      cellIndex={cellIndex}
                      props={props}
                      onSelect={onSelect}
                      clearSelection={clearSelection}
                      /* eslint-disable-next-line react/prop-types */
                      isOpen={props.isSelectOpen}
                      /* eslint-disable-next-line react/prop-types */
                      options={props.options.map((option, index) => (
                        <SelectOption
                          /* eslint-disable-next-line react/no-array-index-key */
                          key={index}
                          value={option.value}
                          id={rid + index}
                        />
                      ))}
                      onToggle={(isOpen) => {
                        onToggle(isOpen, rowIndex, cellIndex)
                      }}
                      /* eslint-disable-next-line react/prop-types */
                      selections={props.selected}
                    />
                  ),
                  props: {
                    value: ractive,
                    name: rid,
                    isSelectOpen: false,
                    selected: [ractive],
                    options: available.map((value) => {
                      return { value }
                    }),
                    editableSelectProps: {
                      variant: 'single',
                      'aria-label': rid,
                    },
                  },
                }
            }
          })
        return {
          id,
          cells,
          selected: !!activeMap[id],
          rowEditBtnAriaLabel: (idx) => `Edit row ${idx}`,
          rowSaveBtnAriaLabel: (idx) => `Save edits for row ${idx}`,
          rowCancelBtnAriaLabel: (idx) => `Cancel edits for row ${idx}`,
          available: row,
        }
      } else {
        // update table row
        row.selected = !!activeMap[id]
        if (!row.isEditable) {
          row.cells.forEach((cell, inx) => {
            if (activeMap[id]) {
              const { props } = cell || {}
              const key = columns[inx].key
              const value = activeMap[id][key]
              if (typeof cell === 'string') {
                row.cells[inx] = value
              } else if (props) {
                /* eslint-disable-next-line react/prop-types */
                props.selected = value
                /* eslint-disable-next-line react/prop-types */
                props.value = value
              }
            }
          })
        }
        return row
      }
    })

    if (searchValue) {
      newState.rows = newState.rows.filter((row) => {
        return get(row, 'cells[0]', '').indexOf(searchValue) !== -1
      })
    }
    return newState
  }

  constructor(props) {
    super(props)
    const {
      control: { id, controlData },
    } = props
    this.state = {
      perPage: parseInt(localStorage.getItem(`table-${id}-page-size`), 10) || PAGE_SIZES.DEFAULT,
      sortBy: {},
      searchValue: '',
      onSelect: this.onSelect.bind(this),
      onToggle: this.onToggle.bind(this),
      clearSelection: this.clearSelection.bind(this),
    }
    this.headers = controlData.filter(({ mode }) => mode !== ControlMode.PROMPT_ONLY).map(({ id }) => id)
    this.loaded = false
    this.handleSelect = this.handleSelect.bind(this)
    this.handleSort = this.handleSort.bind(this)
    this.updateEditableRows = this.updateEditableRows.bind(this)
  }

  componentDidUpdate(prevProps) {
    const { fetchData, control } = this.props
    if (!prevProps.control.isLoading && !control.isLoading && !this.loaded) {
      this.loaded = true
      const { available } = control
      const requestedUIDs = get(fetchData, 'requestedUIDs', [])
      requestedUIDs.forEach((uid) => {
        const rowInx = available.findIndex(({ id }) => id === uid)
        this.handleSelect(null, true, rowInx)
      })
    }
  }

  getColumns() {
    const {
      control: { controlData },
    } = this.props
    const headers = controlData
      .filter(({ mode }) => mode !== ControlMode.PROMPT_ONLY)
      .map(({ name, width }) => ({
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
    const sortBy = {
      index,
      sortIndex: index,
      direction,
    }
    this.setState((prevState) => {
      let rows = Array.from(prevState.rows)
      const { control } = this.props
      const { sortTable, active, controlData } = control
      const { sortIndex, direction } = sortBy
      if (sortIndex) {
        const tableHeader = get(controlData, `[${sortIndex - 1}]`)
        if (sortTable && tableHeader.type !== 'text') {
          const sortKey = get(controlData, `[${sortIndex - 1}].id`)
          rows = sortTable(rows, sortKey, direction, active)
        } else {
          rows = orderBy(rows, [`cells[${sortIndex - 1}]`], [direction])
        }
      }
      return {
        rows,
        sortBy,
      }
    })
  }

  setControlRef = (control, ref) => {
    control.ref = ref
  }

  render() {
    const { control } = this.props
    const { exception } = control
    const { page = 1, perPage } = this.state
    let { rows } = this.state
    const inx = (page - 1) * perPage
    rows = rows.slice(inx, inx + perPage)
    return (
      <div className="creation-view-controls-table-container" ref={this.setControlRef.bind(this, control)}>
        <div className="creation-view-controls-table">{this.renderTree(rows)}</div>
        {exception && <div className="creation-view-controls-table-exceptions">{exception}</div>}
      </div>
    )
  }

  renderTree(rows) {
    const { control, i18n } = this.props
    const { sortBy, page, perPage, rows: unfilteredRows } = this.state
    const { isLoading, isFailed, prompts = {}, available = [] } = control
    let { active } = control
    if (!Array.isArray(active)) {
      active = []
    }
    let { actions = [] } = prompts
    actions = React.Children.map(actions, (action) => {
      return React.cloneElement(action, {
        appendTable: this.handleTableAction.bind(this, add),
      })
    })
    const columns = this.getColumns()
    const explanation =
      "You don't have any bare metal assets yet. Start by creating or importing your bare metal assets."
    if (isFailed) {
      return <Alert variant="danger" title={i18n('overview.error.default')} />
    } else if (isLoading) {
      return (
        <EmptyState>
          <EmptyStateIcon variant="container" component={Spinner} />
          <Title size="lg" headingLevel="h4">
            Loading
          </Title>
        </EmptyState>
      )
    } else {
      const { searchValue } = this.state
      return (
        <Fragment>
          <Toolbar>
            <ToolbarContent>
              <ToolbarItem>
                <SearchInput
                  style={{ minWidth: '350px', display: 'flex' }}
                  placeholder={i18n('search.label')}
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
                  resultsCount={`${rows.length} / ${available.length}`}
                />
              </ToolbarItem>
              {available.length !== 0 && (
                <div style={{ display: 'flex', marginTop: '10px' }}>
                  {actions.map((action, inx) => (
                    /* eslint-disable-next-line react/no-array-index-key */
                    <ToolbarItem key={inx}>{action}</ToolbarItem>
                  ))}
                </div>
              )}
            </ToolbarContent>
          </Toolbar>
          <Fragment>
            <Table
              aria-label="BMA Table"
              sortBy={sortBy}
              onSort={this.handleSort}
              onSelect={this.handleSelect}
              onRowEdit={this.updateEditableRows}
              canSelectAll={true}
              variant={TableVariant.compact}
              cells={columns}
              rows={rows}
            >
              <TableHeader />
              <TableBody />
            </Table>
            <Split>
              <SplitItem style={{ margin: 'auto' }}>
                {available.length === 0 && (
                  <div
                    style={{
                      display: 'flex',
                      paddingTop: '20px',
                      color: 'gray',
                    }}
                  >
                    <EmptyStateIcon icon={NoResourceIcon} />
                    <EmptyState variant={EmptyStateVariant.small}>
                      <Title headingLevel="h2" size="lg">
                        No bare metal assets found
                      </Title>
                      <EmptyStateBody>{explanation}</EmptyStateBody>
                      <EmptyStateBody>
                        <Split>
                          <SplitItem isFilled></SplitItem>
                          <SplitItem>
                            <Toolbar>
                              <ToolbarContent>
                                {actions.map((action, inx) => (
                                  /* eslint-disable-next-line react/no-array-index-key */
                                  <ToolbarItem key={inx}>{action}</ToolbarItem>
                                ))}
                              </ToolbarContent>
                            </Toolbar>
                          </SplitItem>
                          <SplitItem isFilled></SplitItem>
                        </Split>
                      </EmptyStateBody>
                    </EmptyState>
                  </div>
                )}
              </SplitItem>
              <SplitItem>
                {available.length !== 0 && (
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

  handleSelect(event, isSelected, rowId) {
    const { control } = this.props
    const { controlData, available } = control
    let { active = [] } = control
    const { rows, page = 1, perPage } = this.state

    const saveValues = (rows) => {
      rows.forEach(({ cells }) => {
        cells.forEach(({ props }) => {
          if (props) {
            props.lastValue = props.value
            props.value = ''
          }
        })
      })
    }

    const restoreValues = (rows, active) => {
      rows.forEach(({ id, cells }) => {
        cells.forEach(({ props }) => {
          if (props) {
            if (props.lastValue) {
              props.value = props.lastValue
              const inx = active.findIndex((data) => id === data.id)
              set(active[inx], `${props.name}`, props.value)
            }
          }
        })
      })
    }

    if (rowId !== -1) {
      rowId += (page - 1) * perPage

      const { id } = rows[rowId].available
      const activeMap = keyBy(active, 'id')

      if (!activeMap[id]) {
        // add to active
        this.addActives(active, [rows[rowId].available], controlData)
        restoreValues([rows[rowId]], active)
      } else {
        // remove from active
        const inx = active.findIndex((data) => id === data.id)
        active.splice(inx, 1)
        saveValues([rows[rowId]])
      }
    } else {
      control.active = []
      ;({ active } = control)
      if (isSelected) {
        this.addActives(active, available, controlData)
        restoreValues(rows, active)
      } else {
        saveValues(rows)
      }
    }
    this.props.handleChange(control)
  }

  addActives(active, actives, controlData) {
    actives.forEach((value) => {
      Object.keys(value).forEach((key) => value[key] === null && delete value[key])
      active.push({
        ...this.getDefaults(active, actives, controlData),
        ...value,
      })
    })
  }

  getDefaults(active, actives, controlData) {
    const defaults = {}
    controlData.forEach(({ id: _id, active: _active }) => {
      if (_active) {
        defaults[_id] = typeof _active === 'function' ? _active(active) : _active
      }
    })
    return defaults
  }

  onSelect(newValue, evt, rowIndex, cellIndex, isPlaceholder) {
    const { page = 1, perPage } = this.state
    rowIndex += (page - 1) * perPage
    this.setState((prevState) => {
      const newRows = Array.from(prevState.rows)
      const newCellProps = newRows[rowIndex].cells[cellIndex].props

      if (isPlaceholder) {
        newCellProps.editableValue = []
        newCellProps.selected = []
      } else if (newCellProps.selected) {
        if (newCellProps.editableValue === undefined) {
          newCellProps.editableValue = []
        }
        let newSelected = Array.from(newCellProps.selected)
        switch (newCellProps.editableSelectProps.variant) {
          case 'typeaheadmulti':
          case 'checkbox': {
            if (!newSelected.includes(newValue)) {
              newSelected.push(newValue)
            } else {
              newSelected = newSelected.filter((el) => el !== newValue)
            }
            break
          }
          default: {
            newSelected = newValue
          }
        }
        newCellProps.editableValue = newSelected
        newCellProps.selected = newSelected
      }
      return {
        rows: newRows,
      }
    })
  }

  clearSelection(rowIndex, cellIndex) {
    const { page = 1, perPage } = this.state
    rowIndex += (page - 1) * perPage
    this.setState((prevState) => {
      const newRows = Array.from(prevState.rows)
      const newCellProps = newRows[rowIndex].cells[cellIndex].props
      newCellProps.editableValue = []
      newCellProps.selected = []
      return {
        rows: newRows,
      }
    })
  }

  onToggle(isOpen, rowIndex, cellIndex) {
    const { page = 1, perPage } = this.state
    rowIndex += (page - 1) * perPage
    this.setState((prevState) => {
      const newRows = Array.from(prevState.rows)
      newRows[rowIndex].cells[cellIndex].props.isSelectOpen = isOpen
      return {
        rows: newRows,
      }
    })
  }

  updateEditableRows(evt, type, isEditable, rowIndex) {
    const { page = 1, perPage } = this.state
    rowIndex += (page - 1) * perPage
    this.setState((prevState) => {
      const newRows = Array.from(prevState.rows)
      const { control } = this.props
      const { active, controlData } = control
      const activeMap = keyBy(active, 'id')
      const { id } = newRows[rowIndex].available
      switch (type) {
        case 'cancel':
          newRows[rowIndex].isEditable = false
          break
        case 'save':
          newRows[rowIndex].cells.forEach(({ props }) => {
            if (props) {
              const { name } = props
              let { editableValue } = props
              if (!editableValue) {
                const controlDataMap = keyBy(controlData, 'id')
                const _active = controlDataMap[name].active
                editableValue = typeof _active === 'function' ? _active(editableValue) : _active
              }
              set(activeMap[id], `${name}`, editableValue)
              props.value = editableValue
            }
          })
          this.props.handleChange(control)
          newRows[rowIndex].isEditable = false
          break
        case 'edit':
          newRows[rowIndex].isEditable = true

          // make sure this row is active'
          if (!activeMap[id]) {
            this.addActives(active, [newRows[rowIndex].available], controlData)
          }
          break
      }
      return { rows: newRows }
    })
  }

  handleTableAction(action, data) {
    const { control } = this.props
    let { active, available } = control
    if (!Array.isArray(active)) {
      control.active = []
      active = control.active
    }
    if (!Array.isArray(available)) {
      control.available = []
      available = control.available
    }
    const existingMap = keyBy(available, ({ hostName, hostNamespace }) => {
      return `${hostName}-${hostNamespace}`
    })
    switch (action) {
      case remove:
        active.splice(data, 1)
        break
      case add:
        if (Array.isArray(data)) {
          data.reverse()
        } else {
          data = [data]
        }
        data = data.filter(({ hostName, hostNamespace }) => {
          return !existingMap[`${hostName}-${hostNamespace}`]
        })
        data.forEach((datum) => {
          datum.isNew = true
          available.unshift(datum)
          active.unshift(datum)
        })
        break
      case edit:
      default:
        break
    }
    this.props.handleChange(control)
  }
}

export default ControlPanelTable
