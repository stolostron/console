/* Copyright Contributors to the Open Cluster Management project */

import { DEFAULT_MAX_VISIBLE_LABELS, getCollapsedLabelKeys, getOverflowLabelKeys } from './labelCollapse'

describe('getCollapsedLabelKeys', () => {
  it('returns empty array when label count is within the max', () => {
    const labels = {
      a: '1',
      b: '2',
      c: '3',
      d: '4',
      e: '5',
    }
    expect(getCollapsedLabelKeys(labels)).toEqual([])
  })

  it('collapses keys beyond the default max of 5, sorted alphabetically', () => {
    const labels = {
      zebra: 'z',
      alpha: 'a',
      beta: 'b',
      gamma: 'g',
      delta: 'd',
      epsilon: 'e',
      theta: 't',
    }
    expect(DEFAULT_MAX_VISIBLE_LABELS).toBe(5)
    expect(getCollapsedLabelKeys(labels)).toEqual(['theta', 'zebra'])
  })

  it('respects a custom maxVisible value', () => {
    const labels = { a: '1', b: '2', c: '3' }
    expect(getCollapsedLabelKeys(labels, 2)).toEqual(['c'])
  })
})

describe('getOverflowLabelKeys', () => {
  it('returns only preferCollapse when visible keys fit within maxVisible', () => {
    expect(getOverflowLabelKeys(['a', 'b', 'c', 'd'], ['a'], 3)).toEqual(['a'])
  })

  it('appends overflow keys after preferCollapse when visible keys exceed maxVisible', () => {
    expect(getOverflowLabelKeys(['sys', 'a', 'b', 'c', 'd', 'e'], ['sys'], 3)).toEqual(['sys', 'd', 'e'])
  })
})
