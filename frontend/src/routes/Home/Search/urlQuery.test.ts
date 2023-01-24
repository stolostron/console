/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { transformBrowserUrlToSearchString, updateBrowserUrl } from './urlQuery'

test('Correctly returns transformBrowserUrlToSearchString', () => {
  const testString = 'filters={"textsearch":"kind%3Adeployment%20name%3Asearch-prod-df8fa-search-api"}&showrelated=pod'
  const result = transformBrowserUrlToSearchString(testString)
  expect(result).toMatchSnapshot()
})

test('Correctly returns updateBrowserUrl', () => {
  const history = {
    push: jest.fn(),
  }
  const testData = 'kind:deployment name:search-prod-df8fa-search-api kind:'
  updateBrowserUrl(history, testData)
  expect(history.push).toHaveBeenCalled()
})

test('Correctly returns updateBrowserUrl with empty query string', () => {
  const history = {
    push: jest.fn(),
  }
  updateBrowserUrl(history, '')
  expect(history.push).toHaveBeenCalled()
})
