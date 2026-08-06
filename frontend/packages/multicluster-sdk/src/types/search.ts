/* Copyright Contributors to the Open Cluster Management project */
import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk'
import { Fleet } from './fleet'

export type Maybe<T> = T | null
export type InputMaybe<T> = Maybe<T>
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string }
  String: { input: string; output: string }
  Boolean: { input: boolean; output: boolean }
  Int: { input: number; output: number }
  Float: { input: number; output: number }
  Date: { input: any; output: any }
  Map: { input: any; output: any }
}

/**
 * Defines a key/value to filter results.
 * When multiple values are provided for a property, it is interpreted as an OR operation.
 */
// Copied from internal/search/search-sdk
export type SearchFilter = {
  /** Name of the property (key). */
  property: Scalars['String']['input']
  /**
   * Values for the property. Multiple values per property are interpreted as an OR operation.
   * Optionally one of these operations `=,!,!=,>,>=,<,<=` can be included at the beginning of the value.
   * By default the equality operation is used.
   * The values available for datetime fields (Ex: `created`, `startedAt`) are `hour`, `day`, `week`, `month` and `year`.
   * Property `kind`, if included in the filter, will be matched using a case-insensitive comparison.
   * For example, `kind:Pod` and `kind:pod` will bring up all pods. This is to maintain compatibility with Search V1.
   *
   * Wildcard matching: the `*` character can be used as a wildcard to match any sequence of characters.
   * For example, a filter with property `name` and value `nginx-*` matches any resource whose name starts with `nginx-`.
   * Similarly, property `namespace` with value `prod*` matches any namespace starting with `prod`.
   * Wildcard matches are case-sensitive.
   */
  values: Array<InputMaybe<Scalars['String']['input']>>
}

/** Input options to the search query. */
// Copied from internal/search/search-sdk
export type SearchInput = {
  /**
   * List of SearchFilter, which is a key(property) and values.
   * When multiple filters are provided, results will match all filters (AND operation).
   */
  filters?: InputMaybe<Array<InputMaybe<SearchFilter>>>
  /**
   * List of strings to match resources.
   * Will match resources containing any of the keywords in any text field.
   * When multiple keywords are provided, it is interpreted as an AND operation.
   * Matches are case insensitive.
   */
  keywords?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
  /**
   * Max number of results returned by the query.
   * **Default is** 10,000
   * A value of -1 will remove the limit. Use carefully because it may impact the service.
   */
  limit?: InputMaybe<Scalars['Int']['input']>
  /**
   * Number of results to skip before returning results.
   * Used in combination with limit to implement pagination.
   * **Default is** 0
   */
  offset?: InputMaybe<Scalars['Int']['input']>
  /**
   * Order results by a property and direction.
   * Format: "property_name asc" or "property_name desc"
   * Example: "name desc" or "created asc"
   */
  orderBy?: InputMaybe<Scalars['String']['input']>
  /**
   * Filter relationships to the specified kinds.
   * If empty, all relationships will be included.
   * This filter is used with the 'related' field on SearchResult.
   */
  relatedKinds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
}

export type SearchResult<R extends K8sResourceCommon | K8sResourceCommon[]> = R extends (infer T)[]
  ? Fleet<T>[]
  : Fleet<R>

export type AdvancedSearchFilter = { property: string; values: string[] }[]
