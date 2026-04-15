/* Copyright Contributors to the Open Cluster Management project */

import { getColumnValues, mergePersistedSelectedColumnIds } from './localColumnStorage'

describe('mergePersistedSelectedColumnIds', () => {
  const requiredColIds = ['a']
  const defaultColIds = ['a', 'b', 'c']
  const defaultOrderIds = ['a', 'b', 'c']

  test('no persisted selection uses required and default column ids', () => {
    expect(
      mergePersistedSelectedColumnIds({
        localSavedCols: [],
        localSavedColOrder: [],
        requiredColIds,
        defaultColIds,
        defaultOrderIds,
      })
    ).toEqual(['a', 'b', 'c'])
  })

  test('when persisted order lacks a new column id, selects that column if it is in defaultColIds', () => {
    const savedOrderBeforeNewColumn = ['a', 'b']
    expect(
      mergePersistedSelectedColumnIds({
        localSavedCols: ['a', 'b'],
        localSavedColOrder: savedOrderBeforeNewColumn,
        requiredColIds,
        defaultColIds: ['a', 'b', 'c', 'gpu'],
        defaultOrderIds: ['a', 'b', 'c', 'gpu'],
      })
    ).toEqual(['a', 'b', 'c', 'gpu'])
  })

  test('does not re-select optional columns the user hid (still in saved order)', () => {
    expect(
      mergePersistedSelectedColumnIds({
        localSavedCols: ['a', 'b'],
        localSavedColOrder: ['a', 'b', 'c'],
        requiredColIds,
        defaultColIds: ['a', 'b', 'c'],
        defaultOrderIds: ['a', 'b', 'c'],
      })
    ).toEqual(['a', 'b'])
  })

  test('when saved order is empty, treats full default order as baseline so nothing is treated as newly shipped', () => {
    expect(
      mergePersistedSelectedColumnIds({
        localSavedCols: ['a', 'b'],
        localSavedColOrder: [],
        requiredColIds,
        defaultColIds: ['a', 'b', 'c'],
        defaultOrderIds: ['a', 'b', 'c'],
      })
    ).toEqual(['a', 'b'])
  })
})

describe('getColumnValues', () => {
  afterEach(() => {
    window.localStorage.clear()
  })

  test('treats non-array JSON as empty selection (e.g. wrong key or legacy shape)', () => {
    const id = 'testTable'
    window.localStorage.setItem(`${id}SavedCols`, JSON.stringify({ label: ['x'] }))
    window.localStorage.setItem(`${id}SavedColOrder`, JSON.stringify({ not: 'an array' }))
    expect(getColumnValues(id)).toEqual({ localSavedCols: [], localSavedColOrder: [] })
  })

  test('preserves string[] column ids when valid', () => {
    const id = 'testTable2'
    window.localStorage.setItem(`${id}SavedCols`, JSON.stringify(['a', 'b']))
    window.localStorage.setItem(`${id}SavedColOrder`, JSON.stringify(['b', 'a']))
    expect(getColumnValues(id)).toEqual({ localSavedCols: ['a', 'b'], localSavedColOrder: ['b', 'a'] })
  })
})
