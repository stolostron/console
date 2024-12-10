// Copyright (c) 2020 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project

import { getURLSearchData } from './diagram-helpers-argo'

describe('getURLSearchData with data', () => {
  const { location } = window

  beforeAll(() => {
    delete window.location

    window.location = {
      search: '?apiVersion=argoproj.io%2Fv1alpha1&cluster=ui-managed',
    }
  })

  afterAll(() => {
    window.location = location
  })

  const expectedResult = {
    apiVersion: 'argoproj.io/v1alpha1',
    cluster: 'ui-managed',
  }
  it('should return the search data', () => {
    expect(getURLSearchData()).toEqual(expectedResult)
  })
})

describe('getURLSearchData with data', () => {
  const expectedResult = {}

  it('should return an empty object', () => {
    expect(getURLSearchData()).toEqual(expectedResult)
  })
})
