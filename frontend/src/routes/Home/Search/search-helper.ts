/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project

import { TFunction } from 'i18next'
import { DropdownSuggestionsProps } from './components/Searchbar'

const operators = ['=', '<', '>', '<=', '>=', '!=', '!']
const dateValues = ['hour', 'day', 'week', 'month', 'year']

export function formatSearchbarSuggestions(
  data: string[],
  suggestionKind: 'label' | 'filter' | 'value',
  searchQuery: string,
  t: TFunction
) {
  let valuesToRemoveFromSuggestions: string[] = []
  let suggestions: DropdownSuggestionsProps[] = []
  const labelTag = {
    id: 'id-suggestions-label',
    key: 'key-suggestions-label',
    name: t('Filters'),
    kind: suggestionKind,
    disabled: true,
  }
  if (suggestionKind === 'value') {
    // Get a list of duplicate values to remove from suggestions dropdown
    const searchTokens = searchQuery.split(' ')
    const searchCompleteFilter = searchTokens[searchTokens.length - 1].replace(':', '')
    labelTag.name = t('{{0}} values', [searchCompleteFilter])
    const query = convertStringToQuery(searchQuery)
    query.filters.forEach((filter) => {
      if (filter.property === searchCompleteFilter) {
        valuesToRemoveFromSuggestions = filter.values.filter((value) => data.indexOf(value) > 0)
      }
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
            key: 'key-values-range',
            name: numberRange,
            kind: suggestionKind,
            disabled: true,
          },
        ]
      }
      suggestions = operators.map((op) => {
        return {
          id: `id-${op}`,
          key: `key-${op}`,
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
          key: `key-date-${date}`,
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
        key: `key-${field}`,
        name: field,
        kind: suggestionKind,
      }
    })
  suggestions.unshift(labelTag)
  return suggestions
}

export const convertStringToQuery = (searchText: string) => {
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
    .filter((f) => ['', '=', '<', '>', '<=', '>=', '!=', '!'].findIndex((op) => op === f.values[0]) === -1)
  return {
    keywords,
    filters,
    // Limit results to  for better performance - we show a info alert to user asking them to refine search.
    limit: 10000,
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
    return queryTags[queryTags.length - 1].replace(':', '').replace(operator[operator.length - 1], '')
  }
  return ''
}
