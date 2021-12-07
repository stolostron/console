/** *****************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2018, 2019. All Rights Reserved.
 *
 * US Government Users Restricted Rights - Use, duplication or disclosure
 * restricted by GSA ADP Schedule Contract with IBM Corp.
 *******************************************************************************/
// Copyright (c) 2020 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project

export const convertStringToQuery = searchText => {
  let relatedKinds = []

  if (searchText.indexOf('kind:subscription') >= 0) {
    relatedKinds = [
      'placementrule',
      'deployable',
      'application',
      'subscription',
      'channel'
    ]
  } else if (searchText.indexOf('kind:channel') >= 0) {
    relatedKinds = ['subscription']
  } else if (searchText.indexOf('kind:placementrule') >= 0) {
    relatedKinds = ['subscription']
  }

  const searchTokens = searchText.split(' ')
  const keywords = searchTokens.filter(
    token => token !== '' && token.indexOf(':') < 0
  )
  const filters = searchTokens
    .filter(token => token.indexOf(':') >= 0)
    .map(f => {
      const [property, values] = f.split(':')
      return { property, values: values.split(',') }
    })
    .filter(
      f =>
        ['', '=', '<', '>', '<=', '>=', '!=', '!'].findIndex(
          op => op === f.values[0]
        ) === -1
    )
  return { keywords, filters, relatedKinds }
}

export const formatNumber = count => {
  if (count > 999) {
    // show one decimal place
    const num = (count - count % 100) / 1000
    return `${num}k`
  }
  return count
}

const MAX_SEARCH_ATTEMPTS = 3
let searchFailureCount = 0
let searchErrorCount = 0

export const searchFailure = () => {
  searchFailureCount++
  searchErrorCount = 0
}
export const searchError = () => {
  searchErrorCount++
}
export const searchSuccess = () => {
  searchFailureCount = 0
  searchErrorCount = 0
}

export const shouldTrySearch = () =>
  searchFailureCount + searchErrorCount < MAX_SEARCH_ATTEMPTS

export const isSearchAvailable = () =>
  searchFailureCount === 0 && searchErrorCount === 0
export const isYAMLEditAvailable = () => searchErrorCount === 0
