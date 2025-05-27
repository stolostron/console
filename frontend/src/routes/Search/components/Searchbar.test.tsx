/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2022 Red Hat, Inc.

import { MockedProvider } from '@apollo/client/testing'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useMemo, useState } from 'react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { getSearchDefinitions } from '../searchDefinitions'
import { generateSearchResultExport } from '../SearchResults/utils'
import { updateBrowserUrl } from '../urlQuery'
import { convertStringToTags, DropdownSuggestionsProps, getNoFilterText, handleCSVExport, Searchbar } from './Searchbar'

jest.mock('../SearchResults/utils')
const toastContextMock: any = {
  addAlert: jest.fn(),
}
const t = (key: string) => key

export const BlankSearchbar = () => {
  const [currentQuery, setCurrentQuery] = useState('')

  const suggestions: DropdownSuggestionsProps[] = useMemo(() => {
    const tags = convertStringToTags(currentQuery)
    const lastTag = tags[tags.length - 1]
    if (!lastTag || !lastTag.name.endsWith(':')) {
      return [
        {
          id: 'id-suggestions-label',
          key: 'key-suggestions-label',
          name: 'Filters',
          kind: 'filter',
          disabled: true,
        },
        {
          id: 'id-kind',
          key: 'key-kind',
          name: 'kind',
          kind: 'filter',
        },
        {
          id: 'id-name',
          key: 'key-name',
          name: 'name',
          kind: 'filter',
        },
        {
          id: 'id-namespace',
          key: 'key-namespace',
          name: 'namespace',
          kind: 'filter',
        },
        {
          id: 'id-label',
          key: 'key-label',
          name: 'label',
          kind: 'filter',
        },
      ]
    }
    if (lastTag && lastTag.name.includes('kind:')) {
      return [
        { id: '1', name: 'Values', kind: 'label', disabled: true },
        { id: '2', name: 'Pod', kind: 'value' },
        { id: '3', name: 'Deployment', kind: 'value' },
        { id: '4', name: 'Cluster', kind: 'value' },
        { id: '7', name: 'Application', kind: 'value' },
      ]
    } else if (lastTag && lastTag.name.includes('name:')) {
      return [
        { id: '1', name: 'Values', kind: 'label', disabled: true },
        { id: '2', name: 'name1', kind: 'value' },
        { id: '3', name: 'name2', kind: 'value' },
        { id: '4', name: 'name3', kind: 'value' },
      ]
    } else if (lastTag && lastTag.name.includes('namespace:')) {
      return [
        { id: '1', name: 'Values', kind: 'label', disabled: true },
        { id: '2', name: 'namespace1', kind: 'value' },
        { id: '3', name: 'namespace2', kind: 'value' },
        { id: '4', name: 'namespace3', kind: 'value' },
      ]
    } else if (lastTag && lastTag.name.includes('label:')) {
      return [
        { id: '1', name: 'Values', kind: 'label', disabled: true },
        { id: '2', name: 'app=search', kind: 'value' },
        { id: '3', name: 'app=governance', kind: 'value' },
        { id: '4', name: 'app=application', kind: 'value' },
      ]
    }
    return [{ id: '1', name: 'No filters', kind: 'label', disabled: true }]
  }, [currentQuery])

  return (
    <RecoilRoot>
      <MemoryRouter>
        <MockedProvider mocks={[]}>
          <Searchbar
            queryString={''}
            saveSearchTooltip={''}
            setSaveSearch={() => {}}
            suggestions={suggestions}
            currentQueryCallback={(updatedQuery) => {
              setCurrentQuery(updatedQuery)
            }}
            toggleInfoModal={() => null}
            updateBrowserUrl={updateBrowserUrl}
            savedSearchQueries={[
              {
                description: '',
                id: '1234567890',
                name: 'All pods',
                searchText: 'kind:Pod',
              },
            ]}
            searchResultData={undefined}
            refetchSearch={() => {}}
          />
        </MockedProvider>
      </MemoryRouter>
    </RecoilRoot>
  )
}

const LoadingSearchbar = () => (
  <RecoilRoot>
    <MemoryRouter>
      <MockedProvider mocks={[]}>
        <Searchbar
          queryString={''}
          saveSearchTooltip={''}
          setSaveSearch={() => {}}
          suggestions={[
            {
              disabled: true,
              id: 'id-suggestions-label',
              kind: 'value',
              name: 'kind values',
            },
            {
              id: 'id-Loading...',
              kind: 'value',
              name: 'Loading...',
            },
          ]}
          currentQueryCallback={(query: string) => query}
          toggleInfoModal={() => null}
          updateBrowserUrl={updateBrowserUrl}
          savedSearchQueries={[
            {
              description: '',
              id: '1234567890',
              name: 'All pods',
              searchText: 'kind:Pod',
            },
          ]}
          searchResultData={undefined}
          refetchSearch={() => {}}
        />
      </MockedProvider>
    </MemoryRouter>
  </RecoilRoot>
)

const PrefilledSearchbar = () => (
  <RecoilRoot>
    <MemoryRouter>
      <MockedProvider mocks={[]}>
        <Searchbar
          queryString={'kind:Pod name:name1'}
          saveSearchTooltip={''}
          setSaveSearch={() => {}}
          suggestions={[
            {
              id: 'id-suggestions-label',
              name: 'Filters',
              kind: 'filter',
              disabled: true,
            },
            {
              id: 'id-cluster',
              name: 'cluster',
              kind: 'filter',
            },
            {
              id: 'id-kind',
              name: 'kind',
              kind: 'filter',
            },
            {
              id: 'id-name',
              name: 'name',
              kind: 'filter',
            },
            {
              id: 'id-namespace',
              name: 'namespace',
              kind: 'filter',
            },
          ]}
          currentQueryCallback={(query: string) => query}
          toggleInfoModal={() => null}
          updateBrowserUrl={updateBrowserUrl}
          savedSearchQueries={[
            {
              description: '',
              id: '1234567890',
              name: 'All pods',
              searchText: 'kind:Pod',
            },
          ]}
          searchResultData={{
            searchResult: [
              {
                items: [
                  {
                    _hubClusterResource: 'true',
                    _ownerUID: 'local-cluster/1234-abcd',
                    _uid: 'local-cluster/1234-abcd',
                    apiversion: 'v1',
                    cluster: 'local-cluster',
                    container: 'search-postgres',
                    created: '2024-04-15T14:23:59Z',
                    hostIP: '10.0.68.86',
                    image: 'quay.io/image',
                    kind: 'Pod',
                    kind_plural: 'pods',
                    label:
                      'app=search; component=search-v2-operator; name=search-postgres; pod-template-hash=d7778bcb6',
                    name: 'name1',
                    namespace: 'open-cluster-management',
                    podIP: '10.129.0.116',
                    restarts: '0',
                    startedAt: '2024-04-15T14:23:59Z',
                    status: 'Running',
                  },
                ],
              },
            ],
          }}
          refetchSearch={() => {}}
          exportEnabled={true}
        />
      </MockedProvider>
    </MemoryRouter>
  </RecoilRoot>
)

describe('Searchbar tests', () => {
  it('convertStringToTags correctly returns an empty array when searchText is empty', () => {
    const result = convertStringToTags('')
    expect(result).toMatchSnapshot()
  })

  it('convertStringToTags correctly returns an array of tags', () => {
    const result = convertStringToTags('kind:Pod name:testPod')
    expect(result).toMatchSnapshot()
  })

  it('getNoFilterText correctly returns correct keyword search hint', () => {
    const result = getNoFilterText('', [], 'testing', t)
    expect(result).toMatchSnapshot()
  })
  it('getNoFilterText correctly returns correct multi keyword hint', () => {
    const result = getNoFilterText('test1', [{ id: 'test1', name: 'test1' }], 'test2', t)
    expect(result).toMatchSnapshot()
  })
  it('getNoFilterText correctly returns correct single key:value hint', () => {
    const result = getNoFilterText('name:', [{ id: 'name:', name: 'name:' }], 'testing', t)
    expect(result).toMatchSnapshot()
  })
  it('getNoFilterText correctly returns correct multi key:value hint', () => {
    const result = getNoFilterText(
      'kind:Pod name:',
      [
        { id: 'kind:Pod', name: 'kind:Pod' },
        { id: 'name:', name: 'name:' },
      ],
      'testing',
      t
    )
    expect(result).toMatchSnapshot()
  })
  it('getNoFilterText correctly returns correct key:value & keyword hint', () => {
    const result = getNoFilterText('kind:Pod', [{ id: 'kind:Pod', name: 'kind:Pod' }], 'testing', t)
    expect(result).toMatchSnapshot()
  })

  it('Searchbar should render in loading state', async () => {
    render(<LoadingSearchbar />)
    const searchbar = screen.getByLabelText('Search input')
    expect(searchbar).toBeTruthy()
    userEvent.click(searchbar)
    await waitFor(() => expect(screen.queryByText('Loading...')).toBeTruthy())
  })

  it('Searchbar should render correctly with prefilled query', async () => {
    const { getByText } = render(<PrefilledSearchbar />)
    expect(getByText('kind:Pod')).toBeInTheDocument()
  })

  it('Searchbar should render correctly and add a search via Run search button', async () => {
    render(<BlankSearchbar />)

    const searchbar = screen.getByLabelText('Search input')
    expect(searchbar).toBeTruthy()
    userEvent.click(searchbar)

    userEvent.type(searchbar, 'name ')
    userEvent.type(searchbar, 'name1 ')

    expect(screen.queryByText('name:name1')).toBeInTheDocument()

    userEvent.click(screen.getByTestId('run-search-button'))
  })

  it('Searchbar should render correctly and add a search via typing', async () => {
    render(<BlankSearchbar />)

    const searchbar = screen.getByLabelText('Search input')
    expect(searchbar).toBeTruthy()
    userEvent.click(searchbar)

    userEvent.type(searchbar, 'name ')
    userEvent.type(searchbar, 'name1 ')

    expect(screen.queryByText('name:name1')).toBeInTheDocument()
  })

  it('Searchbar should render correctly and add a partial search via typing', async () => {
    render(<BlankSearchbar />)

    const searchbar = screen.getByLabelText('Search input')
    expect(searchbar).toBeTruthy()
    userEvent.click(searchbar)

    userEvent.type(searchbar, 'label ')
    userEvent.type(searchbar, 'app=*rch ')

    expect(screen.queryByText('label:app=*rch')).toBeInTheDocument()
  })

  it('Searchbar should correctly delete existing tags', async () => {
    render(<PrefilledSearchbar />)

    const searchbar = screen.getByLabelText('Search input')
    expect(searchbar).toBeTruthy()
    userEvent.click(searchbar)

    fireEvent.keyDown(searchbar, { key: 'Backspace', code: 'Backspace' })

    expect(screen.queryByText('name:name1')).not.toBeInTheDocument()
    expect(screen.queryByText('kind:Pod')).toBeInTheDocument()
  })

  it('Searchbar should correctly delete existing tags when clean all button is clicked', async () => {
    render(<PrefilledSearchbar />)

    const searchbar = screen.getByLabelText('Search input')
    expect(searchbar).toBeTruthy()
    userEvent.click(searchbar)

    const clearAllBtn = screen.getByLabelText('Clear button for chips and input')
    expect(clearAllBtn).toBeTruthy()
    userEvent.click(clearAllBtn)

    expect(screen.queryByText('name:name1')).not.toBeInTheDocument()
    expect(screen.queryByText('kind:Pod')).not.toBeInTheDocument()
  })

  it('Searchbar should correctly delete existing comma separated tags', async () => {
    render(<PrefilledSearchbar />)

    const searchbar = screen.getByLabelText('Search input')
    expect(searchbar).toBeTruthy()
    userEvent.click(searchbar)

    userEvent.type(searchbar, 'name ')
    userEvent.type(searchbar, 'name2')
    fireEvent.keyDown(searchbar, { key: 'Enter', code: 'Enter' })
    expect(screen.queryByText('name:name1,name2')).toBeInTheDocument()

    const nameChipDeleteBtn = screen.queryAllByLabelText('delete-chip')
    expect(nameChipDeleteBtn[1]).toBeTruthy()
    userEvent.click(nameChipDeleteBtn[1])

    expect(screen.queryByText('name:name1,name2')).not.toBeInTheDocument()
    expect(screen.queryByText('name:name1')).toBeInTheDocument()
  })

  test('renders Dropdown component and handles csv export', async () => {
    render(<PrefilledSearchbar />)

    // Check if the toggle button is present
    const toggleButton = screen.getByLabelText('export-search-result')
    expect(toggleButton).toBeInTheDocument()
    userEvent.click(toggleButton)

    // Check if the dropdown item is present
    const dropdownItem = screen.getByRole('menuitem', {
      name: /export as csv/i,
    })
    expect(dropdownItem).toBeInTheDocument()
    await waitFor(() => {
      fireEvent.click(dropdownItem)
    })
  })

  it('should call generateSearchResultExport using name from saved search', () => {
    window.URL.createObjectURL = jest.fn()
    Date.now = jest.fn(() => 1234)
    const searchDefinitions = getSearchDefinitions(t)
    const currentQuery = 'kind:Pod'
    const savedSearchQueries = [{ id: '1234', searchText: 'kind:Pod', name: 'saved-search' }]
    const searchResultData = {
      searchResult: [
        {
          items: [
            {
              apiversion: 'v1',
              cluster: 'local-cluster',
              kind: 'Pod',
              kind_plural: 'pods',
              label: 'app=search; component=search-v2-operator; name=search-indexer; pod-template-hash=6bb544d4f7',
              name: 'search-pod',
              namespace: 'open-cluster-management',
              startedAt: '2024-08-29T16:30:18Z',
              status: 'Running',
            },
          ],
          __typename: 'SearchResult',
        },
      ],
    }

    handleCSVExport(currentQuery, savedSearchQueries, searchResultData, searchDefinitions, toastContextMock, t)

    expect(generateSearchResultExport).toHaveBeenCalledWith(
      `saved-search-1234`,
      searchResultData,
      searchDefinitions,
      toastContextMock,
      t
    )
  })

  it('should call generateSearchResultExport using default file name', () => {
    window.URL.createObjectURL = jest.fn()
    Date.now = jest.fn(() => 1234)
    const searchDefinitions = getSearchDefinitions(t)
    const currentQuery = 'kind:Pod'
    const searchResultData = {
      searchResult: [
        {
          items: [
            {
              apiversion: 'v1',
              cluster: 'local-cluster',
              kind: 'Pod',
              kind_plural: 'pods',
              label: 'app=search; component=search-v2-operator; name=search-indexer; pod-template-hash=6bb544d4f7',
              name: 'search-pod',
              namespace: 'open-cluster-management',
              startedAt: '2024-08-29T16:30:18Z',
              status: 'Running',
            },
          ],
          __typename: 'SearchResult',
        },
      ],
    }

    handleCSVExport(currentQuery, [], searchResultData, searchDefinitions, toastContextMock, t)

    expect(generateSearchResultExport).toHaveBeenCalledWith(
      `search-result-1234`,
      searchResultData,
      searchDefinitions,
      toastContextMock,
      t
    )
  })
})
