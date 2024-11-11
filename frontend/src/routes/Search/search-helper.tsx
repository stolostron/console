/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project

import { TFunction } from 'react-i18next'
import { Link } from 'react-router-dom-v5-compat'
import { NavigationPath } from '../../NavigationPath'
import { SearchAlertProps } from './components/SearchAlertGroup'
import { DropdownSuggestionsProps } from './components/Searchbar'

export const federatedErrorText = 'error sending federated request'
export const operators = ['<=', '>=', '!=', '!', '=', '<', '>']
const dateValues = ['hour', 'day', 'week', 'month', 'year']

export function formatSearchbarSuggestions(
  data: string[],
  suggestionKind: 'label' | 'filter' | 'value',
  searchQuery: string,
  limit: number,
  isLoading: boolean,
  t: TFunction
) {
  const valuesToRemoveFromSuggestions: string[] = []
  let suggestions: DropdownSuggestionsProps[] = []
  const labelTag = {
    id: 'id-suggestions-label',
    name: t('Filters'),
    kind: suggestionKind,
    disabled: true,
  }
  if (suggestionKind === 'value') {
    // Get a list of duplicate values to remove from suggestions dropdown
    const searchTokens = searchQuery.split(' ')
    const searchCompleteFilter = searchTokens[searchTokens.length - 1].substring(
      0,
      searchTokens[searchTokens.length - 1].indexOf(':')
    )
    labelTag.name = t('{{0}} values', [searchCompleteFilter])
    const query = convertStringToQuery(searchQuery, limit)
    query.filters.forEach((filter) => {
      valuesToRemoveFromSuggestions.push(...(filter.property === searchCompleteFilter ? filter.values : []))
    })
    if (data[0] === 'isNumber') {
      if (operators.some((operator: string) => searchQuery.endsWith(operator))) {
        // operator is already chosen
        const numberRange =
          data.length > 2
            ? `Min: ${parseInt(data[1], 10)} - Max: ${parseInt(data[2], 10)}`
            : `Min: ${parseInt(data[1], 10)} - Max: ${parseInt(data[1], 10)}`

        return [
          labelTag,
          {
            id: 'id-values-range',
            name: numberRange,
            kind: suggestionKind,
            disabled: true,
          },
        ]
      }
      suggestions = operators.map((op) => {
        return {
          id: `id-${op}`,
          name: op,
          kind: suggestionKind,
        }
      })
      suggestions.unshift({
        id: 'id-operator-label',
        name: t('Operators'),
        kind: 'label',
        disabled: true,
      })
      return suggestions
    } else if (data[0] === 'isDate') {
      suggestions = dateValues.map((date) => {
        return {
          id: `id-date-${date}`,
          name: date,
          kind: suggestionKind,
        }
      })
      suggestions.unshift({
        id: 'id-filter-label',
        name: t('{{0}} within the last:', [searchCompleteFilter]),
        kind: 'label',
        disabled: true,
      })
      return suggestions
    }
  }

  suggestions = data
    .filter((suggestion) => {
      return valuesToRemoveFromSuggestions.indexOf(suggestion) === -1
    })
    .map((field) => {
      return {
        id: `id-${field}`,
        name: field,
        kind: suggestionKind,
      }
    })
  suggestions.unshift(labelTag)
  if (isLoading) {
    suggestions.push({
      id: 'id-loading',
      name: suggestionKind === 'filter' ? t('Loading...') : t('Loading more...'),
      kind: 'label',
      disabled: true,
    })
  }
  return suggestions
}

export const convertStringToQuery = (searchText: string, queryResultLimit: number) => {
  const searchTokens = searchText.split(' ')
  const keywords = searchTokens.filter((token) => token !== '' && token.indexOf(':') < 0)
  const filters = searchTokens
    .filter((token) => token.indexOf(':') >= 0)
    .map((f) => {
      const splitIdx = f.indexOf(':')
      const property = f.substring(0, splitIdx)
      const values = f.substring(splitIdx + 1)
      return { property, values: values.split(',') }
    })

  return {
    keywords,
    filters,
    limit: queryResultLimit,
  }
}

export const getSearchCompleteString = (searchQuery: string) => {
  const queryTags = searchQuery.split(' ')
  if (queryTags[queryTags.length - 1].endsWith(':')) {
    return queryTags[queryTags.length - 1].replace(':', '')
  } else if (
    operators.some(
      (op) => queryTags[queryTags.length - 1].substring(queryTags[queryTags.length - 1].length - op.length) === op
    )
  ) {
    const operator = operators.filter(
      (op) => queryTags[queryTags.length - 1].substring(queryTags[queryTags.length - 1].length - op.length) === op
    )
    return queryTags[queryTags.length - 1].replace(':', '').replace(operator[0], '')
  }
  return ''
}

export function setFederatedErrorAlert(
  loading: boolean,
  error: any,
  data: any,
  alerts: SearchAlertProps[],
  addSearchAlert: (alert: SearchAlertProps) => void,
  removeSearchAlert: (key: string) => void,
  t: any
) {
  const federatedWarningKey = 'federated-error'
  if (!loading && error && error?.graphQLErrors.find((error: any) => error?.includes(federatedErrorText))) {
    if (!alerts.find((alert) => alert.key === federatedWarningKey)) {
      addSearchAlert({
        key: federatedWarningKey,
        variant: 'warning',
        title: t('One or more managed hubs are not reporting'),
        children: (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {t(
              'Resources from these managed hubs and managed clusters will be missing in search results. Resolve cluster issues to see all cluster resources.'
            )}
            <Link style={{ paddingTop: '0.25rem' }} to={NavigationPath.clusters}>
              {t('View clusters')}
            </Link>
          </div>
        ),
      })
    }
  } else if (
    !loading &&
    !error?.graphQLErrors.find((error: any) => error?.includes(federatedErrorText)) &&
    data &&
    alerts.find((alert) => alert.key === federatedWarningKey)
  ) {
    removeSearchAlert(federatedWarningKey)
  }
}
