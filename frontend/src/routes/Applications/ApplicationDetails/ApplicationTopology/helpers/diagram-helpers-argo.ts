/* Copyright Contributors to the Open Cluster Management project */

import type { URLSearchData } from './types'

/**
 * Parse the browser's current query string and return supported parameters.
 *
 * Currently recognized keys:
 * - apiVersion: string (e.g., "argoproj.io/v1alpha1")
 * - cluster: string (e.g., a cluster name)
 *
 * Values are optional and omitted if not present in the URL.
 */
export const getURLSearchData = (): URLSearchData => {
  const search: string = window.location.search
  const searchItems: URLSearchParams | undefined = search ? new URLSearchParams(search) : undefined

  let cluster: string | undefined
  let apiVersion: string | undefined

  if (searchItems && searchItems.get('apiVersion')) {
    apiVersion = searchItems.get('apiVersion') || undefined
  }
  if (searchItems && searchItems.get('cluster')) {
    cluster = searchItems.get('cluster') || undefined
  }

  return {
    apiVersion,
    cluster,
  }
}
