/* Copyright Contributors to the Open Cluster Management project */

import queryString from 'query-string'

// This function updates url query string based on page filter selections
// export function updateBrowserUrlFilterPresets(filters, search, sort) {
//     // TODO
// }

/**
 * transformBrowserUrlToFilterPresets returns preset filters, search text, sorting, current page number and items per page defined in the window.location.search.
 *
 * initialFilters - An arry of { filterID, options[] } objects
 *
 * initialSearch - A string to use in the table searchbar.
 *
 * initialSort - Name of the column to sort on, prefixed with an '-' or '' to denote ascending or descending sorting.
 *
 * initialPage - the current page number.
 *
 * initialPageSize - How many items to display per page.
 *
 * Example usage: ?region=us-east&region=us-south&status=online&status=offline&search=some text goes here&sort=-name&page=5&pageSize=10
 * Example response: {"initialFilters":[{"id":"region","options":["us-east","us-south"]},{"id":"status","options":["online","offline"]}],"initialSearch":"some text goes here","initialSort":{"colName":"name","direction":"asc"},"initialPage":5,"initialPageSize":10}
 * */
export function transformBrowserUrlToFilterPresets(urlSearch: string) {
    const initialFilters: {
        id: string
        options: string[]
    }[] = []
    let initialSearch = ''
    let initialSort: { colName: string; direction: 'asc' | 'desc' } = { colName: '', direction: 'asc' }
    let initialPage = 1
    let initialPageSize = 10
    const parsedQuery = queryString.parse(urlSearch)
    const queryKeys = Object.keys(parsedQuery)
    if (queryKeys.length > 0) {
        queryKeys.forEach((key: string) => {
            const value = parsedQuery[key] as string
            switch (key) {
                case 'search':
                    initialSearch = value
                    break
                case 'sort':
                    initialSort = {
                        colName: value.startsWith('-') ? value.replace('-', '') : value,
                        direction: value.startsWith('-') ? 'asc' : 'desc',
                    }
                    break
                case 'page':
                    initialPage = Number.parseInt(value || '1')
                    break
                case 'pageSize':
                    initialPageSize = Number.parseInt(value || '10')
                    break
                default:
                    initialFilters.push({ id: key, options: parsedQuery[key] as string[] })
            }
        })
    }

    return { initialFilters, initialSearch, initialSort, initialPage, initialPageSize }
}
