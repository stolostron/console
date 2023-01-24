/* Copyright Contributors to the Open Cluster Management project */
import { getUsername } from '../lib/username'
import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'
import { createResource, patchResource } from './utils/resource-request'

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

export function createUserPreference(savedSearches: SavedSearch[]) {
  return getUsername()
    .promise.then((payload) => {
      const username =
        payload && payload.body && payload.body.username
          ? payload.body.username.toLowerCase().replace(/[^a-z0-9-.]/g, '-')
          : 'undefined'
      createResource<UserPreference>({
        apiVersion: UserPreferenceApiVersion,
        kind: UserPreferenceKind,
        metadata: {
          name: username,
        },
        spec: {
          savedSearches,
        },
      })
    })
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
  const searchIndex = resource?.spec?.savedSearches?.findIndex((search: SavedSearch) => search.id === savedSearch.id)
  if (searchIndex === -1) {
    // If we are adding a new saved search add it to the end of savedSearches array
    return patchResource(resource, [
      { op: 'add', path: `/spec/savedSearches/${resource?.spec?.savedSearches?.length}`, value: savedSearch },
    ])
  }
  // else patch the savedSearch at the correct index
  return patchResource(resource, [{ op: operation, path: `/spec/savedSearches/${searchIndex}`, value: savedSearch }])
}

export function getUserPreference(userPreferences: UserPreference[]) {
  // Get the username from the console backend
  return getUsername()
    .promise.then((payload) => {
      const username =
        payload && payload.body && payload.body.username
          ? payload.body.username.toLowerCase().replace(/[^a-z0-9-.]/g, '-')
          : 'undefined'
      return userPreferences.find((userPreference) => userPreference.metadata.name === username)
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error(error)
      return undefined
    })
}
