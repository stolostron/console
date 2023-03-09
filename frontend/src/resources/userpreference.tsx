/* Copyright Contributors to the Open Cluster Management project */
import { getUsername } from '../lib/username'
import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'
import { fetchRetry, getBackendUrl } from './utils/resource-request'

export const UserPreferenceApiVersion = 'console.open-cluster-management.io/v1'
export type UserPreferenceApiVersionType = 'console.open-cluster-management.io/v1'

export const UserPreferenceKind = 'UserPreference'
export type UserPreferenceKindType = 'UserPreference'

export const UserPreferenceDefinition: IResourceDefinition = {
  apiVersion: UserPreferenceApiVersion,
  kind: UserPreferenceKind,
}

export interface UserPreference extends IResource {
  apiVersion: UserPreferenceApiVersionType
  kind: UserPreferenceKindType
  metadata: Metadata
  spec?: {
    savedSearches?: SavedSearch[]
  }
}

export interface SavedSearch {
  description?: string
  id: string
  name: string
  searchText: string
}

export function getUserPreference() {
  return getUsername()
    .promise.then((payload) => {
      const username =
        payload && payload.body && payload.body.username
          ? payload.body.username.toLowerCase().replace(/[^a-z0-9-.]/g, '-')
          : 'undefined'
      const backendURLPath = getBackendUrl() + `/userpreference/${username}`
      const abortController = new AbortController()
      return fetchRetry({
        method: 'GET',
        url: backendURLPath,
        signal: abortController.signal,
        retries: process.env.NODE_ENV === 'production' ? 2 : 0,
        disableRedirectUnauthorizedLogin: true,
      }).then((res) => res.data as UserPreference | undefined)
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error(error)
      return undefined
    })
}

export async function createUserPreference(savedSearches: SavedSearch[]) {
  const backendURLPath = getBackendUrl() + '/userpreference'
  const abortController = new AbortController()
  return getUsername()
    .promise.then((payload) => {
      const username =
        payload && payload.body && payload.body.username
          ? payload.body.username.toLowerCase().replace(/[^a-z0-9-.]/g, '-')
          : 'undefined'
      return fetchRetry({
        method: 'POST',
        url: backendURLPath,
        data: {
          apiVersion: UserPreferenceApiVersion,
          kind: UserPreferenceKind,
          metadata: {
            name: username,
          },
          spec: {
            savedSearches,
          },
        },
        signal: abortController.signal,
        retries: process.env.NODE_ENV === 'production' ? 2 : 0,
        disableRedirectUnauthorizedLogin: true,
      })
    })
    .then((res) => res.data as UserPreference | undefined)
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error(error)
      return undefined
    })
}

export function patchUserPreference(
  resource: UserPreference,
  operation: 'add' | 'replace' | 'remove',
  savedSearch: SavedSearch
) {
  const backendURLPath = getBackendUrl() + `/userpreference/${resource.metadata?.name ?? ''}`
  const abortController = new AbortController()
  const searchIndex = resource?.spec?.savedSearches?.findIndex((search: SavedSearch) => search.id === savedSearch.id)

  let data = []
  if (searchIndex === -1) {
    // If we are adding a new saved search add it to the end of savedSearches array
    data = [{ op: 'add', path: `/spec/savedSearches/${resource?.spec?.savedSearches?.length}`, value: savedSearch }]
  } else {
    // else patch the savedSearch at the correct index
    data = [{ op: operation, path: `/spec/savedSearches/${searchIndex}`, value: savedSearch }]
  }

  const headers: Record<string, string> = {}
  headers['Content-Type'] = 'application/json-patch+json'

  return fetchRetry({
    method: 'PATCH',
    url: backendURLPath,
    data,
    signal: abortController.signal,
    retries: process.env.NODE_ENV === 'production' ? 2 : 0,
    disableRedirectUnauthorizedLogin: true,
    headers,
  })
    .then((res) => res.data as UserPreference | undefined)
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error(error)
      return undefined
    })
}
