/* Copyright Contributors to the Open Cluster Management project */

import { getColumnValues, setColumnValues } from '~/ui-components/AcmTable/localColumnStorage'
import { APPLICATIONS_TABLE_ID, initializeApplicationColumnOrder } from './initializeApplicationColumnOrder'
import {
  DEFAULT_SORT,
  getItemWithExpiration,
  setItemWithExpiration,
} from '~/ui-components/AcmTable/AcmTableStateProvider'

describe('Applications column order initialization', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  test('moves a previously appended Model after Type without changing other column preferences', () => {
    const selected = ['name', 'type', 'namespace', 'health', 'model']
    setColumnValues(APPLICATIONS_TABLE_ID, selected, ['name', 'type', 'health', 'namespace', 'labels', 'model'])

    initializeApplicationColumnOrder()

    expect(getColumnValues(APPLICATIONS_TABLE_ID)).toEqual({
      localSavedCols: selected,
      localSavedColOrder: ['name', 'type', 'model', 'health', 'namespace', 'labels'],
    })
  })

  test('places the newly introduced Model after Type and selects it for an older saved layout', () => {
    setColumnValues(APPLICATIONS_TABLE_ID, ['name', 'type', 'namespace'], ['name', 'type', 'namespace', 'labels'])

    initializeApplicationColumnOrder()

    expect(getColumnValues(APPLICATIONS_TABLE_ID)).toEqual({
      localSavedCols: ['name', 'type', 'namespace', 'model'],
      localSavedColOrder: ['name', 'type', 'model', 'namespace', 'labels'],
    })
  })

  test('keeps Model hidden when the user previously hid it', () => {
    setColumnValues(APPLICATIONS_TABLE_ID, ['name', 'type'], ['name', 'type', 'namespace', 'model'])

    initializeApplicationColumnOrder()

    expect(getColumnValues(APPLICATIONS_TABLE_ID).localSavedCols).toEqual(['name', 'type'])
  })

  test.each([
    {
      selected: ['name', 'type', 'namespace', 'model'],
      order: ['name', 'type', 'namespace', 'model'],
      index: 2,
      next: 3,
    },
    { selected: ['name', 'type', 'namespace'], order: ['name', 'type', 'namespace'], index: 2, next: 3 },
    { selected: ['name', 'type', 'namespace'], order: ['name', 'type', 'namespace', 'model'], index: 2, next: 2 },
    { selected: ['name', 'type', 'retired'], order: ['name', 'type', 'retired'], index: 2, next: 0 },
  ])('preserves sort column identity during migration: %j', ({ selected, order, index, next }) => {
    setColumnValues(APPLICATIONS_TABLE_ID, selected, order)
    const key = 'applications-overview-table-state'
    setItemWithExpiration(`${key}-sort`, JSON.stringify({ index, direction: 'desc' }))
    setItemWithExpiration(`${key}-preFilterSort`, JSON.stringify({ index, direction: 'asc' }))
    initializeApplicationColumnOrder()
    expect(JSON.parse(getItemWithExpiration(`${key}-sort`)!)).toEqual(
      next === 0 ? DEFAULT_SORT : { index: next, direction: 'desc' }
    )
    expect(JSON.parse(getItemWithExpiration(`${key}-preFilterSort`)!)).toEqual({ index: next, direction: 'asc' })
  })

  test('preserves column reordering made after initialization', () => {
    initializeApplicationColumnOrder()
    const order = ['name', 'type', 'namespace', 'model']
    setColumnValues(APPLICATIONS_TABLE_ID, order, order)

    initializeApplicationColumnOrder()

    expect(getColumnValues(APPLICATIONS_TABLE_ID).localSavedColOrder).toEqual(order)
  })

  test('keeps an intentionally cleared search sort while migrating its pre-filter sort', () => {
    setColumnValues(APPLICATIONS_TABLE_ID, ['name', 'type', 'namespace'], ['name', 'type', 'namespace'])
    const key = 'applications-overview-table-state'
    setItemWithExpiration(`${key}-sort`, '{}')
    setItemWithExpiration(`${key}-preFilterSort`, JSON.stringify({ index: 2, direction: 'desc' }))
    initializeApplicationColumnOrder()
    expect(JSON.parse(getItemWithExpiration(`${key}-sort`)!)).toEqual({})
    expect(JSON.parse(getItemWithExpiration(`${key}-preFilterSort`)!)).toEqual({ index: 3, direction: 'desc' })
  })
})
