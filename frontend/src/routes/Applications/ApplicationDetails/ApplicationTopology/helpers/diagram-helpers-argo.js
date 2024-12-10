/* Copyright Contributors to the Open Cluster Management project */
// Copyright Contributors to the Open Cluster Management project
'use strict'

export const getURLSearchData = () => {
  const search = window.location.search
  const searchItems = search ? new URLSearchParams(search) : undefined
  let cluster
  let apiVersion
  if (searchItems && searchItems.get('apiVersion')) {
    apiVersion = searchItems.get('apiVersion')
  }
  if (searchItems && searchItems.get('cluster')) {
    cluster = searchItems.get('cluster')
  }

  return {
    apiVersion,
    cluster,
  }
}
