/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import queryString from 'query-string'

// This function pushes the new search query to the browsers history
export function updateBrowserUrl(navigate: any, currentQuery: string) {
  if (currentQuery === '') {
    // on clear search query
    navigate(window.location.pathname)
  } else {
    const url = `${window.location.pathname}?filters={"textsearch":${encodeURIComponent(JSON.stringify(currentQuery))}}`
    navigate(url)
  }
}

// This function handles navigation to search page with a predefined searchquery in browsers url
export function transformBrowserUrlToSearchString(urlQuery: string) {
  // Example browser url string:
  // .../multicloud/home/search?filters={"textsearch":"kind%3Adeployment%20name%3Asearch-prod-df8fa-search-api"}&showrelated=pod
  const presetSearchQuery = ''
  const preSelectedRelatedResources: string[] = []
  if (urlQuery !== '') {
    const paramString = queryString.parse(urlQuery)

    //Filter out the search query string
    let filterString = paramString.filters?.toString()
    // cut the start of the url string
    filterString = filterString?.replace('{"textsearch":"', '')
    // cut the end of the url string
    filterString = filterString?.replace('"}', '')

    // get any pre-selected related resources
    const relatedString = paramString.showrelated?.toString().toLowerCase()
    const relatedArray = relatedString?.split(',')

    return {
      presetSearchQuery: filterString,
      preSelectedRelatedResources: relatedArray,
    }
  }
  return { presetSearchQuery, preSelectedRelatedResources }
}
