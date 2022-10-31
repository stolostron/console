/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { FormatSearchbarSuggestions, convertStringToQuery, getSearchCompleteString } from './search-helper'

test('Correctly returns FormatSearchbarSuggestions', () => {
    const testData = ['kind', 'cluster', 'deployment']
    const result = FormatSearchbarSuggestions(testData, 'filter', '')
    expect(result).toMatchSnapshot()
})

test('Correctly returns FormatSearchbarSuggestions of name values', () => {
    const testData = ['name1', 'name2', 'name3']
    const result = FormatSearchbarSuggestions(testData, 'value', 'name:name1 name:')
    expect(result).toMatchSnapshot()
})

test('Correctly returns FormatSearchbarSuggestions of namespace values', () => {
    const testData = ['namespace1', 'namespace2', 'namespace3']
    const result = FormatSearchbarSuggestions(testData, 'value', 'name:name1 namespace:')
    expect(result).toMatchSnapshot()
})

test('Correctly returns FormatSearchbarSuggestions of operators', () => {
    const testData = ['isNumber']
    const result = FormatSearchbarSuggestions(testData, 'value', 'cpu:')
    expect(result).toMatchSnapshot()
})

test('Correctly returns FormatSearchbarSuggestions with operator already chosen', () => {
    const testData = ['isNumber', '1', '10']
    const result = FormatSearchbarSuggestions(testData, 'value', 'cpu:=')
    expect(result).toMatchSnapshot()
})

test('Correctly returns FormatSearchbarSuggestions with operator already chosen (single number option)', () => {
    const testData = ['isNumber', '1']
    const result = FormatSearchbarSuggestions(testData, 'value', 'cpu:=')
    expect(result).toMatchSnapshot()
})

test('Correctly returns FormatSearchbarSuggestions with date', () => {
    const testData = ['isDate']
    const result = FormatSearchbarSuggestions(testData, 'value', 'created:')
    expect(result).toMatchSnapshot()
})

test('Correctly returns convertStringToQuery', () => {
    const testData = 'namespace:open-cluster-management kind:pod'
    const result = convertStringToQuery(testData)
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
