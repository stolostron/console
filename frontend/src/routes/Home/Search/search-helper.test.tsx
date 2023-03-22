/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { t } from 'i18next'
import { convertStringToQuery, formatSearchbarSuggestions, getSearchCompleteString } from './search-helper'

test('Correctly returns formatSearchbarSuggestions', () => {
  const testData = ['kind', 'cluster', 'deployment']
  const result = formatSearchbarSuggestions(testData, 'filter', '', 1000, t)
  expect(result).toMatchSnapshot()
})

test('Correctly returns formatSearchbarSuggestions of name values', () => {
  const testData = ['name1', 'name2', 'name3']
  const result = formatSearchbarSuggestions(testData, 'value', 'name:name1 name:', 1000, t)
  expect(result).toMatchSnapshot()
})

test('Correctly returns formatSearchbarSuggestions of namespace values', () => {
  const testData = ['namespace1', 'namespace2', 'namespace3']
  const result = formatSearchbarSuggestions(testData, 'value', 'name:name1 namespace:', 1000, t)
  expect(result).toMatchSnapshot()
})

test('Correctly returns formatSearchbarSuggestions of operators', () => {
  const testData = ['isNumber']
  const result = formatSearchbarSuggestions(testData, 'value', 'cpu:', 1000, t)
  expect(result).toMatchSnapshot()
})

test('Correctly returns formatSearchbarSuggestions with operator already chosen', () => {
  const testData = ['isNumber', '1', '10']
  const result = formatSearchbarSuggestions(testData, 'value', 'cpu:=', 1000, t)
  expect(result).toMatchSnapshot()
})

test('Correctly returns formatSearchbarSuggestions with operator already chosen (single number option)', () => {
  const testData = ['isNumber', '1']
  const result = formatSearchbarSuggestions(testData, 'value', 'cpu:=', 1000, t)
  expect(result).toMatchSnapshot()
})

test('Correctly returns formatSearchbarSuggestions with date', () => {
  const testData = ['isDate']
  const result = formatSearchbarSuggestions(testData, 'value', 'created:', 1000, t)
  expect(result).toMatchSnapshot()
})

test('Correctly returns convertStringToQuery', () => {
  const testData = 'namespace:open-cluster-management kind:pod'
  const result = convertStringToQuery(testData, 1000)
  expect(result).toMatchSnapshot()
})

test('Correctly returns getSearchCompleteString', () => {
  const testData = 'namespace:open-cluster-management kind:'
  const result = getSearchCompleteString(testData)
  expect(result).toMatchSnapshot()
})

test('Correctly returns getSearchCompleteString with operator', () => {
  const testData = 'cpu:='
  const result = getSearchCompleteString(testData)
  expect(result).toMatchSnapshot()
})
