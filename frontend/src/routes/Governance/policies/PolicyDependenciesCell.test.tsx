/* Copyright Contributors to the Open Cluster Management project */

import type { TFunction } from 'i18next'
import type { DependencySummary } from './policyDependencySummary'
import { getDependencySummaryText } from './PolicyDependenciesCell'

const t = ((key: string, options?: { count?: number }) =>
  key.replace('{{count}}', String(options?.count ?? ''))) as TFunction

const empty: DependencySummary = {
  total: 0,
  met: 0,
  notMet: 0,
  unknown: 0,
  invalid: 0,
  notEvaluated: false,
  unavailable: false,
}

test('formats observed, unknown, invalid, and not-evaluated counts', () => {
  expect(getDependencySummaryText(empty, t)).toBe('-')
  expect(getDependencySummaryText({ ...empty, total: 3, met: 1, notMet: 1, unknown: 1 }, t)).toBe(
    '1 not met, 1 met, 1 unknown'
  )
  expect(getDependencySummaryText({ ...empty, total: 3, notEvaluated: true }, t)).toBe('3 dependencies · not evaluated')
  expect(getDependencySummaryText({ ...empty, total: 2, invalid: 2 }, t)).toBe('2 invalid')
  expect(getDependencySummaryText({ ...empty, total: 2, met: 1 }, t)).toBe('Dependency status unavailable')
  expect(getDependencySummaryText({ ...empty, unavailable: true }, t)).toBe('Dependency status unavailable')
})
