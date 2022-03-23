/* Copyright Contributors to the Open Cluster Management project */

// This function updates url query string based on page filter selections
// export function updateBrowserUrlFilterPresets(filters, search, sort) {
//     // TODO
// }

/**
 * transformBrowserUrlToFilterPresets returns preset filters, search text, sorting, current page number and items per page defined in the window.location.search.
 *
 * initialFilters - An object of { [key: string]: string[] } entries
 * Where key matches the filter category id (should be a lowercase string)
 * Where string[] contains strings of the selected category option values
 *
 * initialSearch - A string to use in the table searchbar.
 *
 * TODO update to use the column name instead of the index to support column management
 * initialSort - Index of the column to sort on, prefixed with an '-' or '' to denote ascending or descending sorting.
 *
 * initialPage - the current page number.
 *
 * initialPerPage - How many items to display per page.
 *
 * Example usage: ?region=us-east&region=us-south&status=online&status=offline&search=some text goes here&sort=-0&page=5&perPage=10
 * Example response: {"initialFilters":{"id":"region","options":["us-east","us-south"]},{"id":"status","options":["online","offline"]},"initialSearch":"some text goes here","initialSort":{"index":0,"direction":"asc"},"initialPage":5,"initialPerPage":10}
 * */
export function transformBrowserUrlToFilterPresets(urlSearch: string) {
    const initialFilters: { [key: string]: string[] } = {}
    let initialSearch = ''
    let initialSort: { index: number; direction: 'asc' | 'desc' } = { index: 0, direction: 'asc' }
    let initialPage = 1
    let initialPerPage = 10
    const urlparams = new URLSearchParams(decodeURIComponent(urlSearch))
    const entries = urlparams.entries()
    let entry = entries.next()
    while (!entry.done) {
        const key = entry.value[0]
        const value = entry.value[1]
        switch (key) {
            case 'search':
                initialSearch = value
                break
            case 'sort':
                initialSort = {
                    index: Number.isInteger(Number(value)) ? Math.abs(Number(value)) : 0,
                    direction: value.startsWith('-') ? 'asc' : 'desc',
                }
                break
            case 'page':
                if (Number.isInteger(Number(value))) {
                    initialPage = Number(value)
                }
                break
            case 'perPage':
                if (Number.isInteger(Number(value))) {
                    initialPerPage = Number(value)
                }
                break
            default:
                // If the key doesn't match one of the above we assume it is a filter key
                if (!initialFilters[key]) {
                    initialFilters[key] = [value]
                } else {
                    initialFilters[key].push(value)
                }
        }
        entry = entries.next()
    }

    return { initialFilters, initialSearch, initialSort, initialPage, initialPerPage }
}
