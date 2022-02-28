/* Copyright Contributors to the Open Cluster Management project */

import { transformBrowserUrlToFilterPresets } from './urlQuery'

describe('UrlQuery', () => {
    test('transformBrowserUrlToFilterPresets should return empty filters', () => {
        const result = transformBrowserUrlToFilterPresets('')
        // These are the default values
        expect(result).toEqual({
            initialFilters: {},
            initialSearch: '',
            initialSort: { index: 0, direction: 'asc' },
            initialPage: 1,
            initialPerPage: 10,
        })
    })
    test('transformBrowserUrlToFilterPresets should return all filters', () => {
        const result = transformBrowserUrlToFilterPresets(
            '?region=us-east&region=us-south&status=online&status=offline&search=some text goes here&sort=-0&page=5&perPage=20'
        )
        expect(result).toEqual({
            initialFilters: { region: ['us-east', 'us-south'], status: ['online', 'offline'] },
            initialSearch: 'some text goes here',
            initialSort: { index: 0, direction: 'asc' },
            initialPage: 5,
            initialPerPage: 20,
        })
    })
})
