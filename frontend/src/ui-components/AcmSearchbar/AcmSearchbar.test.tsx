/* Copyright Contributors to the Open Cluster Management project */

import { fireEvent, render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'

import { AcmSearchbar } from './AcmSearchbar'

describe('AcmSearchbar', () => {
    const LoadingSuggestionsSearchbar = () => (
        <AcmSearchbar
            loadingSuggestions={true}
            queryString={'kind:'}
            suggestions={[]}
            currentQueryCallback={(query: string) => query}
            toggleInfoModal={() => null}
        />
    )
    const BlankSearchbar = () => (
        <AcmSearchbar
            loadingSuggestions={false}
            queryString={''}
            suggestions={[
                { id: '1', name: 'Filters', kind: 'label', disabled: true },
                { id: '2', name: 'kind', kind: 'filter' },
                { id: '3', name: 'name', kind: 'filter' },
                { id: '4', name: 'namespace', kind: 'filter' },
                { id: '5', name: 'name1', kind: 'value' },
                { id: '6', name: 'name2', kind: 'value' },
                { id: '7', name: 'namespace1', kind: 'value' },
                { id: '8', name: 'namespace2', kind: 'value' },
            ]}
            currentQueryCallback={(query: string) => query}
            toggleInfoModal={() => null}
        />
    )
    const PrefilledSearchbar = () => (
        <AcmSearchbar
            loadingSuggestions={false}
            queryString={'kind:pod,deployment namespace:default'}
            suggestions={[
                { id: '1', name: 'Filters', kind: 'label', disabled: true },
                { id: '2', name: 'kind', kind: 'filter' },
                { id: '3', name: 'name', kind: 'filter' },
                { id: '4', name: 'namespace', kind: 'filter' },
                { id: '5', name: 'name1', kind: 'value' },
                { id: '6', name: 'name2', kind: 'value' },
                { id: '7', name: 'namespace1', kind: 'value' },
                { id: '8', name: 'namespace2', kind: 'value' },
            ]}
            currentQueryCallback={(query: string) => query}
            toggleInfoModal={() => null}
        />
    )

    const SearchbarWithOperator = () => (
        <AcmSearchbar
            loadingSuggestions={false}
            queryString={'cpu:='}
            suggestions={[]}
            currentQueryCallback={(query: string) => query}
            toggleInfoModal={() => null}
        />
    )

    test('has zero accessibility defects', async () => {
        const { container } = render(<BlankSearchbar />)
        expect(await axe(container)).toHaveNoViolations()
    })

    test('renders blank searchbar', () => {
        const { getByPlaceholderText } = render(<BlankSearchbar />)
        expect(getByPlaceholderText('')).toBeInstanceOf(HTMLInputElement)
    })

    test('renders searchbar with pre-filled query', () => {
        const { getByText } = render(<PrefilledSearchbar />)
        expect(getByText('kind:pod,deployment')).toBeInTheDocument()
        expect(getByText('namespace:default')).toBeInTheDocument()
    })

    test('validates delete search tag function - no tags present', async () => {
        const { getByPlaceholderText, getByRole } = render(<BlankSearchbar />)
        userEvent.click(getByRole('combobox'))
        fireEvent.keyDown(getByRole('combobox'), { key: 'Backspace', code: 'Backspace' })
        expect(getByPlaceholderText('')).toBeInTheDocument()
    })

    test('validates delete search tag function - whole tag', async () => {
        const { getByText, queryByText } = render(<PrefilledSearchbar />)
        userEvent.click(getByText('namespace:default'))
        expect(queryByText('namespace:default')).not.toBeInTheDocument()
    })

    test('validates delete search tag function - single tag value', async () => {
        const { getByText, queryByText } = render(<PrefilledSearchbar />)
        expect(getByText('kind:pod,deployment')).toBeInTheDocument()
        userEvent.click(getByText('kind:pod,deployment'))
        expect(queryByText('kind:pod,deployment')).not.toBeInTheDocument()
        expect(queryByText('kind:pod')).toBeInTheDocument()
    })

    test('validates delete All search tags button click', async () => {
        const { getByText, queryByText, getByTestId } = render(<PrefilledSearchbar />)
        expect(getByText('kind:pod,deployment')).toBeInTheDocument()
        expect(getByText('namespace:default')).toBeInTheDocument()
        userEvent.click(getByTestId('clear-all-search-tags-button'))
        expect(queryByText('kind:pod,deployment')).not.toBeInTheDocument()
        expect(queryByText('namespace:default')).not.toBeInTheDocument()
    })

    test('validates loading dropdown suggestions state', async () => {
        const { getByText, getByRole } = render(<LoadingSuggestionsSearchbar />)
        userEvent.click(getByRole('combobox'))
        expect(getByText('Loading...')).toBeInTheDocument()
    })

    test('validates adding search keyword tags', async () => {
        const { queryByText, getByRole } = render(<BlankSearchbar />)
        userEvent.click(getByRole('combobox'))
        userEvent.type(getByRole('combobox'), 'keyword1 ') // space at end triggers the addition of the text as a tag
        userEvent.type(getByRole('combobox'), 'keyword2 ') // space at end triggers the addition of the text as a tag
        expect(queryByText('keyword1')).toBeInTheDocument()
        expect(queryByText('keyword2')).toBeInTheDocument()
    })

    test('validates adding search tags from dropdown', async () => {
        const { queryByText, getByRole } = render(<BlankSearchbar />)
        userEvent.click(getByRole('combobox'))
        userEvent.type(getByRole('combobox'), 'name ') // space at end triggers the addition of the text as a tag
        userEvent.type(getByRole('combobox'), 'name1 ') // space at end triggers the addition of the text as a tag
        userEvent.type(getByRole('combobox'), 'name ') // space at end triggers the addition of the text as a tag
        userEvent.type(getByRole('combobox'), 'name2 ') // space at end triggers the addition of the text as a tag
        userEvent.type(getByRole('combobox'), 'namespace ') // space at end triggers the addition of the text as a tag
        userEvent.type(getByRole('combobox'), 'namespace1 ') // space at end triggers the addition of the text as a tag
        userEvent.type(getByRole('combobox'), 'namespace ') // space at end triggers the addition of the text as a tag
        userEvent.type(getByRole('combobox'), 'namespace2 ') // space at end triggers the addition of the text as a tag
        expect(queryByText('name:name1,name2')).toBeInTheDocument()
        expect(queryByText('namespace:namespace1,namespace2')).toBeInTheDocument()
    })

    test('validates adding search tag with operator', () => {
        const { getByText, getByRole, queryByText } = render(<SearchbarWithOperator />)
        expect(getByText('cpu:=')).toBeInTheDocument()
        userEvent.click(getByRole('combobox'))
        userEvent.type(getByRole('combobox'), '4 ')
        expect(queryByText('cpu:=4')).toBeInTheDocument()
    })

    test('Validate a user cannot enter a string when using an operator', () => {
        const { getByText, getByRole, queryByText } = render(<SearchbarWithOperator />)
        expect(getByText('cpu:=')).toBeInTheDocument()
        userEvent.click(getByRole('combobox'))
        userEvent.type(getByRole('combobox'), 'notANumber ')
        expect(queryByText('cpu:=')).toBeInTheDocument()
    })
})
