/* Copyright Contributors to the Open Cluster Management project */

import { getColumnValues, setColumnValues } from '~/ui-components/AcmTable/localColumnStorage'
import { APPLICATIONS_TABLE_ID, initializeApplicationColumnOrder } from './initializeApplicationColumnOrder'

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

  test('preserves column reordering made after initialization', () => {
    initializeApplicationColumnOrder()
    const order = ['name', 'type', 'namespace', 'model']
    setColumnValues(APPLICATIONS_TABLE_ID, order, order)

    initializeApplicationColumnOrder()

    expect(getColumnValues(APPLICATIONS_TABLE_ID).localSavedColOrder).toEqual(order)
  })
})
