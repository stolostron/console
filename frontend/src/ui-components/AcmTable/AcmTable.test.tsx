/* Copyright Contributors to the Open Cluster Management project */

import { ButtonVariant, ToggleGroup, ToggleGroupItem, TooltipPosition } from '@patternfly/react-core'
import { fitContent, SortByDirection, TableGridBreakpoint } from '@patternfly/react-table'
import { render, screen, waitFor } from '@testing-library/react'
import { configureAxe } from 'jest-axe'
import { useState } from 'react'
import { AcmDropdown } from '../AcmDropdown/AcmDropdown'
import { AcmEmptyState } from '../AcmEmptyState'
import { AcmTable } from './AcmTable'
import { AcmTableStateProvider, setItemWithExpiration } from './AcmTableStateProvider'
import { AcmTableProps, ExportableIRow, ITableAdvancedFilter } from './AcmTableTypes'

import { MemoryRouter, Route, Routes } from 'react-router'
import { handleStandardComparison } from '../../lib/search-utils'
import { getCSVDownloadLink, getCSVExportSpies, clickElement, typeElement } from '~/lib/test-util'
import { exportObjectString, returnCSVSafeString } from '../../resources/utils'
import { SearchOperator } from '../AcmSearchInput'
import { exampleData } from './AcmTable.stories'

const axe = configureAxe({
  rules: {
    'scope-attr-valid': { enabled: false },
    'landmark-unique': { enabled: false }, // Pagination is on the page twice... not sure how to fix
  },
})

interface IExampleData {
  uid: number
  firstName: string
  last_name: string
  gender: string
  email: string
  cluster: string
  ip_address: string
  availableOperators?: SearchOperator[]
}

const advancedFilters = [
  {
    label: 'gender',
    id: 'gender',
    availableOperators: [SearchOperator.Equals],
    tableFilterFn: (
      constraint: {
        operator: SearchOperator
        value: string
      },
      item: IExampleData
    ) => {
      return handleStandardComparison(constraint.value, item.gender, SearchOperator.Equals)
    },
  },
]

describe('AcmTable', () => {
  const createAction = jest.fn()
  const bulkDeleteAction = jest.fn()
  const deleteAction = jest.fn()
  const sortFunction = jest.fn()
  const primaryTableActionFunction = jest.fn()
  const secondaryTableActionFunction = jest.fn()
  const testItems = exampleData.slice(0, 105)
  const defaultSortedItems = exampleData.slice(0, 105).sort((a, b) => a.firstName.localeCompare(b.firstName))
  const placeholderString = 'Search'
  const Table = (
    props: {
      noBorders?: boolean
      useTableActions?: boolean
      useRowActions?: boolean
      useExtraToolbarControls?: boolean
      searchPlaceholder?: string
      useSearch?: boolean
      transforms?: boolean
      gridBreakPoint?: TableGridBreakpoint
      useCustomTableAction?: boolean
      addSubRows?: () => ExportableIRow[]
      advancedFilters?: ITableAdvancedFilter<IExampleData>[]
      useRouter?: boolean
    } & Partial<AcmTableProps<IExampleData>>
  ) => {
    const {
      useTableActions = false,
      useRowActions = true,
      useExtraToolbarControls = false,
      useSearch = true,
      useCustomTableAction = false,
      addSubRows,
      advancedFilters,
      useRouter = true,
    } = props
    const [items, setItems] = useState<IExampleData[]>(testItems)
    const acmTable = (
      <AcmTable<IExampleData>
        aria-label="Example table"
        advancedFilters={advancedFilters}
        emptyState={<AcmEmptyState title="No addresses found" message="You do not have any addresses yet" />}
        items={items}
        columns={[
          {
            header: 'First Name',
            sort: 'firstName',
            cell: 'firstName',
            search: useSearch ? 'firstName' : undefined,
          },
          {
            header: 'Last Name',
            sort: 'last_name',
            cell: 'last_name',
          },
          {
            header: 'EMail',
            cell: 'email',
            search: useSearch ? 'email' : undefined,
          },
          {
            header: 'Gender',
            sort: 'gender',
            cell: (item) => item.gender,
            search: useSearch ? 'gender' : undefined,
          },
          {
            header: 'IP Address',
            sort: sortFunction,
            cell: 'ip_address',
            search: useSearch ? (item) => item['ip_address'] : undefined,
          },
          {
            header: 'UID',
            sort: 'uid',
            cell: 'uid',
            search: useSearch ? 'uid' : undefined,
            tooltip: 'Tooltip Example',
            transforms: props.transforms ? [fitContent] : undefined,
          },
          {
            header: 'Clusters',
            sort: 'cluster',
            cell: (item) => item.cluster,
            search: useSearch ? 'cluster' : undefined,
          },
        ]}
        addSubRows={addSubRows}
        keyFn={(item: IExampleData) => item.uid.toString()}
        tableActionButtons={
          useTableActions
            ? [
                {
                  id: 'primary-table-button',
                  title: 'Primary action',
                  click: () => primaryTableActionFunction(),
                  isDisabled: false,
                  variant: ButtonVariant.primary,
                },
                {
                  id: 'secondary-table-button',
                  title: 'Secondary action',
                  click: () => secondaryTableActionFunction(),
                  variant: ButtonVariant.secondary,
                },
              ]
            : undefined
        }
        tableActions={
          useTableActions
            ? [
                {
                  id: 'status-group',
                  title: 'Status',
                  actions: [
                    {
                      id: 'status-1',
                      title: 'Status 1',
                      click: () => null,
                      variant: 'bulk-action',
                    },
                    {
                      id: 'status-2',
                      title: 'Status 2',
                      click: () => null,
                      variant: 'bulk-action',
                    },
                  ],
                  variant: 'action-group',
                },
                {
                  id: 'separator-1',
                  variant: 'action-separator',
                },
                {
                  id: 'delete',
                  title: 'Delete',
                  click: (it: IExampleData[]) => {
                    setItems(items ? items.filter((i: { uid: number }) => !it.find((item) => item.uid === i.uid)) : [])
                    bulkDeleteAction(it)
                  },
                  variant: 'bulk-action',
                },
              ]
            : undefined
        }
        rowActions={
          useRowActions
            ? [
                {
                  id: 'delete',
                  title: 'Delete item',
                  click: (item: IExampleData) => {
                    deleteAction(item)
                    setItems(items.filter((i) => i.uid !== item.uid))
                  },
                },
                {
                  id: 'deletedisabled',
                  title: 'Disabled delete item',
                  isDisabled: true,
                  tooltip: 'This button is disabled',
                  click: (item: IExampleData) => {
                    deleteAction(item)
                    setItems(items.filter((i) => i.uid !== item.uid))
                  },
                },
                {
                  id: 'deletetooltipped',
                  title: 'Tooltipped delete item',
                  isDisabled: false,
                  tooltip: 'This button is not disabled',
                  click: (item: IExampleData) => {
                    deleteAction(item)
                    setItems(items.filter((i) => i.uid !== item.uid))
                  },
                },
                {
                  id: 'disablednotooltip',
                  title: 'Disabled item',
                  isDisabled: true,
                  click: (item: IExampleData) => {
                    deleteAction(item)
                    setItems(items.filter((i) => i.uid !== item.uid))
                  },
                },
              ]
            : undefined
        }
        extraToolbarControls={
          useExtraToolbarControls ? (
            <ToggleGroup>
              <ToggleGroupItem isSelected={true} text="View 1" />
              <ToggleGroupItem text="View 2" />
            </ToggleGroup>
          ) : undefined
        }
        customTableAction={
          useCustomTableAction ? (
            <AcmDropdown
              isDisabled={false}
              tooltip="Disabled"
              id="create"
              onSelect={() => null}
              text="Create"
              dropdownItems={[
                {
                  id: 'action1',
                  text: 'Action 1',
                  tooltip: 'Disabled',
                  href: '/action1',
                  tooltipPosition: TooltipPosition.right,
                },
                {
                  id: 'action2',
                  text: 'Action 2',
                  tooltip: 'Disabled',
                  href: '/action1',
                  tooltipPosition: TooltipPosition.right,
                },
              ]}
              isKebab={false}
              isPlain={true}
              isPrimary={true}
              tooltipPosition={TooltipPosition.right}
            />
          ) : undefined
        }
        {...props}
      />
    )
    if (useRouter) {
      return (
        <MemoryRouter>
          <Routes>
            <Route path="/*" element={acmTable} />
          </Routes>
        </MemoryRouter>
      )
    }
    return acmTable
  }
  const addSubRowsCallback = () => {
    return [
      {
        cells: [
          {
            title: <>Status Labels</>,
          },
        ],
        exportSubRow: [
          {
            header: 'Status Labels',
            exportContent: () => exportObjectString({ Ready: 'true', Hibernating: 'false' }),
          },
        ],
      },
    ]
  }

  test('renders', () => {
    const { container } = render(<Table />)
    expect(container.querySelector('table')).toBeInTheDocument()
  })
  test('renders without actions', () => {
    const { container } = render(<Table useTableActions={false} useRowActions={false} />)
    expect(container.querySelector('table')).toBeInTheDocument()
    expect(container.querySelector('table .pf-v6-c-table__action button')).toBeNull()
  })
  test('renders actions given an actionResolver', () => {
    const tableActionResolver = (item: IExampleData) => {
      if (item.last_name.indexOf('a') > -1) {
        return [
          {
            id: 'testAction',
            title: `${item.firstName} ${item.last_name} is the coolest!`,
            addSeparator: true,
            click: createAction,
          },
        ]
      } else {
        return []
      }
    }
    const { container } = render(
      <Table useTableActions={false} useRowActions={false} rowActionResolver={tableActionResolver} />
    )
    expect(container.querySelector('table')).toBeInTheDocument()
    expect(container.querySelector('table .pf-v6-c-table__action button')).toBeInTheDocument()
  })
  test('renders actions given an actionResolver with an expandable table', () => {
    const tableActionResolver = (item: IExampleData) => {
      if (item.last_name.indexOf('a') > -1) {
        return [
          {
            id: 'testAction',
            title: `${item.firstName} ${item.last_name} is the coolest!`,
            addSeparator: true,
            click: createAction,
          },
        ]
      } else {
        return []
      }
    }
    const { container } = render(
      <MemoryRouter>
        <AcmTable<IExampleData>
          aria-label="Example table"
          emptyState={<AcmEmptyState title="No addresses found" message="You do not have any addresses yet" />}
          showToolbar={false}
          items={exampleData.slice(0, 10)}
          addSubRows={(item: IExampleData) => {
            if (item.uid === 1) {
              return [
                {
                  cells: [
                    {
                      title: <div id="expanded">{item.uid}</div>,
                    },
                  ],
                },
              ]
            } else {
              return undefined
            }
          }}
          columns={[
            {
              header: 'First Name',
              sort: 'firstName',
              cell: 'firstName',
            },
            {
              header: 'Last Name',
              sort: 'last_name',
              cell: 'last_name',
            },
            {
              header: 'EMail',
              cell: 'email',
            },
            {
              header: 'Gender',
              sort: 'gender',
              cell: (item) => item.gender,
            },
            {
              header: 'IP Address',
              sort: sortFunction,
              cell: 'ip_address',
            },
            {
              header: 'UID',
              sort: 'uid',
              cell: 'uid',
            },
          ]}
          keyFn={(item: IExampleData) => item.uid.toString()}
          rowActionResolver={tableActionResolver}
        />
      </MemoryRouter>
    )
    expect(container.querySelector('table')).toBeInTheDocument()
    expect(container.querySelector('table .pf-v6-c-table__action button')).toBeInTheDocument()
  })

  test('keeps cells aligned when only some rows are expandable', () => {
    const { container } = render(
      <MemoryRouter>
        <AcmTable<IExampleData>
          aria-label="Example table"
          emptyState={<AcmEmptyState title="No addresses found" message="You do not have any addresses yet" />}
          showToolbar={false}
          items={exampleData.slice(0, 4)}
          addSubRows={(item: IExampleData) => {
            return item.uid === 1
              ? [
                  {
                    cells: [
                      {
                        title: <div>expanded</div>,
                      },
                    ],
                  },
                ]
              : undefined
          }}
          columns={[
            { header: 'First Name', sort: 'firstName', cell: 'firstName' },
            { header: 'Last Name', sort: 'last_name', cell: 'last_name' },
            { header: 'EMail', cell: 'email' },
          ]}
          keyFn={(item: IExampleData) => item.uid.toString()}
        />
      </MemoryRouter>
    )
    // Validate that every primary row's first cells are aligned under headers
    const tbodies = Array.from(container.querySelectorAll('tbody'))
    tbodies.forEach((tbody) => {
      const primaryRow = tbody.querySelector('tr:first-of-type') as HTMLElement | null
      expect(primaryRow?.querySelector('[data-label="First Name"]')).toBeTruthy()
      expect(primaryRow?.querySelector('[data-label="Last Name"]')).toBeTruthy()
    })
  })
  test('renders pagination with autoHidePagination when more that perPage items', () => {
    const { container } = render(<Table items={exampleData} autoHidePagination />)
    expect(container.querySelector('.pf-v6-c-pagination')).toBeInTheDocument()
  })
  test('hides pagination with autoHidePagination when less than perPage items', () => {
    const { container } = render(<Table items={exampleData.slice(0, 8)} autoHidePagination />)
    expect(container.querySelector('.pf-v6-c-pagination')).toBeNull()
  })
  test('renders with transforms', () => {
    const { container } = render(<Table transforms={true} />)
    expect(container.querySelector('table')).toBeInTheDocument()
  })
  test('renders table with gridbreakpoint override', () => {
    const { container } = render(<Table items={exampleData.slice(0, 8)} gridBreakPoint={TableGridBreakpoint.none} />)
    expect(container.querySelector('.pf-v6-c-pagination')).toBeInTheDocument()
    expect(container.querySelector('.pf-v6-c-table__sort-indicator')).toBeInTheDocument()
  })
  test('renders table with pre-selected items', () => {
    const { getByText } = render(
      <Table
        items={exampleData.slice(0, 8)}
        initialSelectedItems={exampleData.slice(0, 1)}
        onSelect={() => null}
        gridBreakPoint={TableGridBreakpoint.none}
      />
    )
    expect(getByText('1 selected')).toBeInTheDocument()
  })

  test('can support table actions with single selection', async () => {
    const { getByText, getAllByRole, queryAllByText } = render(<Table useTableActions={true} />)
    await clickElement(getAllByRole('checkbox')[1])
    expect(getByText('1 selected')).toBeInTheDocument()
    await clickElement(getAllByRole('checkbox')[1])
    expect(queryAllByText('1 selected')).toHaveLength(0)
    await clickElement(getAllByRole('checkbox')[1])
    expect(getByText('1 selected')).toBeInTheDocument()
    await clickElement(getByText('Actions'))
    await clickElement(getByText('Delete'))
    expect(bulkDeleteAction).toHaveBeenCalledWith(defaultSortedItems.slice(0, 1))
  })

  test('can support table actions with multiple selections', async () => {
    const { getByLabelText, getByText, getAllByRole, queryAllByText } = render(<Table useTableActions={true} />)

    await clickElement(getByLabelText('Select'))
    await waitFor(() => expect(getByText(/Select page/i)).toBeInTheDocument())
    await clickElement(getByText(/Select page/i))
    expect(getByText('10 selected')).toBeInTheDocument()

    await clickElement(getByLabelText('Select'))
    await waitFor(() => expect(getByText(/Select all/i)).toBeInTheDocument())
    await clickElement(getByText(/Select all/i))
    expect(getByText('105 selected')).toBeInTheDocument()

    await clickElement(getByLabelText('Select'))
    await waitFor(() => expect(getByText(/Select none/i)).toBeInTheDocument())
    await clickElement(getByText(/Select none/i))
    expect(queryAllByText('105 selected')).toHaveLength(0)

    await clickElement(getAllByRole('checkbox')[0]) // Select all by checkbox
    expect(getByText('105 selected')).toBeInTheDocument()

    await clickElement(getAllByRole('checkbox')[0]) // Select none by checkbox
    expect(queryAllByText('105 selected')).toHaveLength(0)

    await clickElement(getAllByRole('checkbox')[0]) // Select all by checkbox
    expect(getByText('105 selected')).toBeInTheDocument()

    await clickElement(getAllByRole('checkbox')[0]) // Select none by checkbox
    await clickElement(getAllByRole('checkbox')[1])
    await clickElement(getAllByRole('checkbox')[2])
    expect(getByText('2 selected')).toBeInTheDocument()

    await clickElement(getByText('Actions'))
    const statusOption = getByText('Status')
    expect(statusOption).toBeInTheDocument()

    await clickElement(getByText('Delete'))
    // First arg to bulkDeleteAction is an array with the items in any order
    expect(bulkDeleteAction.mock.calls[0][0]).toHaveLength(2)
    expect(bulkDeleteAction.mock.calls[0][0]).toContain(defaultSortedItems[0])
    expect(bulkDeleteAction.mock.calls[0][0]).toContain(defaultSortedItems[1])
  })

  test('onSelectNone calls onSelect callback with empty array', async () => {
    const onSelectMock = jest.fn()
    const { getByLabelText, getByText, getAllByRole } = render(<Table useTableActions={true} onSelect={onSelectMock} />)

    // First select some items
    await clickElement(getAllByRole('checkbox')[1])
    await clickElement(getAllByRole('checkbox')[2])
    expect(getByText('2 selected')).toBeInTheDocument()
    expect(onSelectMock).toHaveBeenLastCalledWith(
      expect.arrayContaining([defaultSortedItems[0], defaultSortedItems[1]])
    )

    // Clear the mock to check the next call
    onSelectMock.mockClear()

    // Click "Select none" from dropdown
    await clickElement(getByLabelText('Select'))
    await waitFor(() => expect(getByText(/Select none/i)).toBeInTheDocument())
    await clickElement(getByText(/Select none/i))

    // Verify onSelect was called with an empty array
    expect(onSelectMock).toHaveBeenCalledWith([])
  })

  test('can support table button actions', async () => {
    const { getByText } = render(<Table useTableActions={true} />)
    expect(getByText('Primary action')).toBeInTheDocument()
    expect(getByText('Secondary action')).toBeInTheDocument()
    await clickElement(getByText('Primary action'))
    expect(primaryTableActionFunction).toHaveBeenCalled()
    await clickElement(getByText('Secondary action'))
    expect(secondaryTableActionFunction).toHaveBeenCalled()
  })

  test('can support table row actions', async () => {
    const { getAllByLabelText, getByRole, getByText } = render(<Table />)
    expect(getAllByLabelText('Actions')).toHaveLength(10)
    await clickElement(getAllByLabelText('Actions')[0])
    await waitFor(() => expect(getByRole('menu')).toBeVisible())
    expect(getByText('Delete item')).toBeVisible()
    await clickElement(getByText('Delete item'))
    expect(deleteAction).toHaveBeenCalled()
  })
  test('can support disabled table row actions', async () => {
    const { getAllByLabelText, getByRole, getByText } = render(<Table />)
    expect(getAllByLabelText('Actions')).toHaveLength(10)
    await clickElement(getAllByLabelText('Actions')[0])
    await waitFor(() => expect(getByRole('menu')).toBeVisible())
    expect(getByText('Disabled item')).toBeVisible()
    await clickElement(getByText('Disabled item'))
    expect(deleteAction).not.toHaveBeenCalled()
  })
  test('can support disabled table row actions with tooltips', async () => {
    const { getAllByLabelText, getByRole, getByText } = render(<Table />)
    expect(getAllByLabelText('Actions')).toHaveLength(10)
    await clickElement(getAllByLabelText('Actions')[1])
    await waitFor(() => expect(getByRole('menu')).toBeVisible())
    expect(getByText('Disabled delete item')).toBeVisible()
    await clickElement(getByText('Disabled delete item'))
    expect(deleteAction).not.toHaveBeenCalled()
  })
  test('can support table row actions with tooltips', async () => {
    const { getAllByLabelText, getByRole, getByText } = render(<Table />)
    expect(getAllByLabelText('Actions')).toHaveLength(10)
    await clickElement(getAllByLabelText('Actions')[0])
    await waitFor(() => expect(getByRole('menu')).toBeVisible())
    expect(getByText('Tooltipped delete item')).toBeVisible()
    await clickElement(getByText('Tooltipped delete item'))
    expect(deleteAction).toHaveBeenCalled()
  })
  test('can customize search placeholder', () => {
    const customPlaceholder = 'Other placeholder'
    const { container } = render(<Table searchPlaceholder={customPlaceholder} />)
    expect(container.querySelector('div.pf-v6-c-toolbar #custom-advanced-search input')).toHaveAttribute(
      'placeholder',
      customPlaceholder
    )
  })
  test('can be searched', async () => {
    const { getByPlaceholderText, queryByText, getByLabelText, getByText, container } = render(<Table />)

    // verify manually deleting search, resets table with first column sorting
    await typeElement(getByPlaceholderText(placeholderString), 'B{backspace}')
    expect(container.querySelector('tbody tr:first-of-type [data-label="First Name"]')).toHaveTextContent('Abran')

    // sort by non-default column (UID)
    await clickElement(getByText('UID'))
    expect(container.querySelector('tbody tr:first-of-type [data-label="UID"]')).toHaveTextContent('1')

    // search for 'Female'
    expect(getByPlaceholderText(placeholderString)).toBeInTheDocument()
    await typeElement(getByPlaceholderText(placeholderString), 'Female')
    expect(queryByText('57 / 105')).toBeVisible()

    // clear filter
    expect(getByLabelText('Reset')).toBeVisible()
    await clickElement(getByLabelText('Reset'))
    expect(queryByText('57 / 105')).toBeNull()

    // verify previous sort column (UID) maintained
    expect(container.querySelector('tbody tr:first-of-type [data-label="UID"]')).toHaveTextContent('1')

    // search for '.net'
    expect(getByPlaceholderText(placeholderString)).toBeInTheDocument()
    await typeElement(getByPlaceholderText(placeholderString), '.net')
    expect(queryByText('25 / 105')).toBeVisible()

    // verify last sort order ignored
    expect(container.querySelector('tbody tr:first-of-type [data-label="UID"]')).toHaveTextContent('51')

    // change sort during filter (Last Name)
    await clickElement(getByText('Last Name'))
    expect(container.querySelector('tbody tr:first-of-type [data-label="Last Name"]')).toHaveTextContent('Barnham')

    // clear filter
    expect(getByLabelText('Reset')).toBeVisible()
    await clickElement(getByLabelText('Reset'))
    expect(queryByText('25 / 105')).toBeNull()

    // verify sort order set during filter (Last Name) persists
    expect(container.querySelector('tbody tr:first-of-type [data-label="Last Name"]')).toHaveTextContent('Arthur')

    // search for '.net'
    expect(getByPlaceholderText(placeholderString)).toBeInTheDocument()
    await typeElement(getByPlaceholderText(placeholderString), '.net')
    expect(queryByText('25 / 105')).toBeVisible()

    // verify last sort order ignored
    expect(container.querySelector('tbody tr:first-of-type [data-label="UID"]')).toHaveTextContent('51')

    // change sort during filter (Last Name)
    await clickElement(getByText('Last Name'))
    expect(container.querySelector('tbody tr:first-of-type [data-label="Last Name"]')).toHaveTextContent('Barnham')

    // clear filter by backspacing
    await typeElement(getByPlaceholderText(placeholderString), '{backspace}{backspace}{backspace}{backspace}')
    expect(queryByText('25 / 105')).toBeNull()

    // verify sort order set during filter (Last Name) persists
    expect(container.querySelector('tbody tr:first-of-type [data-label="Last Name"]')).toHaveTextContent('Arthur')
  })

  test('can be searched with advanced filter dropdown', async () => {
    const { getByLabelText, getByText, queryByText, getByRole } = render(<Table advancedFilters={advancedFilters} />)

    expect(getByLabelText('Open advanced search')).toBeInTheDocument()

    await clickElement(getByLabelText('Open advanced search'))
    await clickElement(getByText('Select a column'))
    expect(getByRole('option', { name: 'gender' })).toBeInTheDocument()
    await clickElement(getByText('gender'))

    await clickElement(getByText('Select an operator'))
    expect(getByText('=')).toBeInTheDocument()
    await clickElement(getByText('='))

    await typeElement(getByRole('textbox', { name: 'Value' }), 'Female')
    expect(queryByText('57 / 57')).toBeInTheDocument()
  })

  test('can be search with advanced filter fuzzy search', async () => {
    const { getByLabelText, queryByText, getByTestId } = render(<Table advancedFilters={advancedFilters} />)

    await clickElement(getByLabelText('Open advanced search'))
    expect(getByTestId('fuzzy-search-input')).toBeInTheDocument()
    await typeElement(getByTestId('fuzzy-search-input'), 'Horatia')

    expect(getByLabelText('Open advanced search')).toBeInTheDocument()
    await clickElement(getByLabelText('Open advanced search'))

    expect(getByLabelText('Search input')).toHaveValue('Horatia')
    expect(queryByText('1 / 105')).toBeInTheDocument()
  })

  const sortTest = async () => {
    const { getByText, container } = render(<Table />)

    // sort by string
    expect(container.querySelector('tbody tr:first-of-type [data-label="First Name"]')).toHaveTextContent('Abran')
    await clickElement(getByText('Gender'))
    expect(container.querySelector('tbody tr:first-of-type [data-label="Gender"]')).toHaveTextContent('Female')
    await clickElement(getByText('Gender'))
    expect(container.querySelector('tbody tr:first-of-type [data-label="Gender"]')).toHaveTextContent('Non-binary')
    // sort by number
    await clickElement(getByText('UID'))
    expect(container.querySelector('tbody tr:first-of-type [data-label="First Name"]')).toHaveTextContent('Bogart')
    await clickElement(getByText('UID'))
    expect(container.querySelector('tbody tr:first-of-type [data-label="First Name"]')).toHaveTextContent('Leroy')

    // sort with function
    await clickElement(getByText('IP Address'))
    expect(sortFunction).toHaveBeenCalled()
  }

  test('can be sorted', async () => {
    await sortTest()
  })
  test('can be sorted by initialSort property', async () => {
    // initially sort by UID
    const { getByText, container } = render(<Table initialSort={{ direction: 'asc', index: 5 }} />)
    expect(container.querySelector('tbody tr:first-of-type [data-label="UID"]')).toHaveTextContent('1')

    // verify clicking UID switches the direction
    await clickElement(getByText('UID'))
    expect(container.querySelector('tbody tr:first-of-type [data-label="UID"]')).toHaveTextContent('105')

    // verify clicking on other headers still works
    await clickElement(getByText('First Name'))
    expect(container.querySelector('tbody tr:first-of-type [data-label="First Name"]')).toHaveTextContent('Abran')
  })
  test('page size can be updated', async () => {
    const { getByLabelText, getAllByLabelText, getByText, container } = render(
      <Table useExtraToolbarControls={false} useSearch={false} useTableActions={false} />
    )

    expect(container.querySelectorAll('tbody tr')).toHaveLength(10)
    expect(getAllByLabelText('items per page').length).toBeGreaterThan(0)

    // Switch to 50 items per page
    await clickElement(getAllByLabelText('items per page')[0])
    await waitFor(() => expect(getByText('50 per page')).toBeVisible())
    await clickElement(getByText('50 per page'))
    expect(container.querySelectorAll('tbody tr')).toHaveLength(50)

    // Go to page 2
    await clickElement(getAllByLabelText('Go to next page')[0])
    expect(getAllByLabelText('Current page')[0]).toHaveValue(2)

    // Switch to 10 items per page; verify automatic move to page 6
    await clickElement(getAllByLabelText('items per page')[0])
    await waitFor(() => expect(getByText('10 per page')).toBeVisible())
    await clickElement(getByText('10 per page'))
    expect(container.querySelectorAll('tbody tr')).toHaveLength(10)
    expect(getByLabelText('Current page')).toHaveValue(6)
  })
  test('can show paginated results', async () => {
    const { getAllByLabelText } = render(<Table />)
    expect(getAllByLabelText('Go to next page').length).toBeGreaterThan(0)
    await clickElement(getAllByLabelText('Go to next page')[0])
    expect(getAllByLabelText('Current page')[0]).toHaveValue(2)
  })
  test('should show the empty state when filtered results', async () => {
    const { getByPlaceholderText, queryByText, getByText } = render(<Table />)
    expect(queryByText('No results found')).toBeNull()
    expect(getByPlaceholderText(placeholderString)).toBeInTheDocument()
    await typeElement(getByPlaceholderText(placeholderString), 'NOSEARCHRESULTS')
    expect(queryByText('No results found')).toBeVisible()
    await clickElement(getByText('Clear all filters'))
    expect(queryByText('No results found')).toBeNull()
  })
  test('can provide ouia attributes on table rows', () => {
    const { container } = render(<Table />)
    expect(
      container.querySelector(
        '[data-ouia-component-type="PF6/TableRow"][data-ouia-component-id="25"] [data-label="First Name"]'
      )
    ).toHaveTextContent('Arabela')
  })
  test('initialSearch is used when no cached search exists in localStorage', async () => {
    const storageKey = 'initial-search-no-cache-test'

    const { getByPlaceholderText } = render(
      <MemoryRouter>
        <Routes>
          <Route
            path="/*"
            element={
              <AcmTableStateProvider localStorageKey={storageKey}>
                <Table useRouter={false} initialSearch="url-query" />
              </AcmTableStateProvider>
            }
          />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(getByPlaceholderText(placeholderString)).toHaveValue('url-query')
    })
  })
  test('initialSearch takes precedence over cached search in localStorage', async () => {
    const storageKey = 'initial-beats-cached-test'
    setItemWithExpiration(`${storageKey}-search`, 'cached-query')

    const { getByPlaceholderText } = render(
      <MemoryRouter>
        <Routes>
          <Route
            path="/*"
            element={
              <AcmTableStateProvider localStorageKey={storageKey}>
                <Table useRouter={false} initialSearch="url-query" />
              </AcmTableStateProvider>
            }
          />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(getByPlaceholderText(placeholderString)).toHaveValue('url-query')
    })
  })
  test('cached search from localStorage is used when no initialSearch is provided', async () => {
    const storageKey = 'cached-search-test'
    setItemWithExpiration(`${storageKey}-search`, 'cached-query')

    const { getByPlaceholderText } = render(
      <MemoryRouter>
        <Routes>
          <Route
            path="/*"
            element={
              <AcmTableStateProvider localStorageKey={storageKey}>
                <Table useRouter={false} />
              </AcmTableStateProvider>
            }
          />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(getByPlaceholderText(placeholderString)).toHaveValue('cached-query')
    })
  })
  test('has zero accessibility defects', async () => {
    const { container } = render(<Table />)
    expect(await axe(container)).toHaveNoViolations()
  })
  test('can provide default empty state', () => {
    const { queryByText } = render(<Table items={[]} />)
    expect(queryByText('No addresses found')).toBeVisible()
  })
  test('can use custom empty state', () => {
    const { queryByText } = render(<Table items={[]} emptyState={<div>Look elsewhere!</div>} />)
    expect(queryByText('Look elsewhere!')).toBeVisible()
  })
  test('can provide default empty state with extra toolbar controls', () => {
    const { queryByText } = render(<Table items={[]} useExtraToolbarControls={true} />)
    expect(queryByText('No addresses found')).toBeVisible()
  })
  test('can render as a controlled component', async () => {
    const setPage = jest.fn()
    const setSearch = jest.fn()
    const setSort = jest.fn()
    const { container, getByLabelText, getByText } = render(
      <Table
        page={15}
        setPage={setPage}
        search="Female"
        setSearch={setSearch}
        sort={{ index: 0, direction: SortByDirection.desc }} // sort by Name
        setSort={setSort}
      />
    )
    expect(setPage).toHaveBeenCalled() // Only 6 pages; should automatically go back
    expect(getByLabelText('Current page')).toHaveValue(6)
    expect(setSearch).not.toHaveBeenCalled()
    expect(setSort).not.toHaveBeenCalled()
    expect(container.querySelector('tbody:last-of-type [data-label="First Name"]')).toHaveTextContent('Alyce')

    expect(getByLabelText('Reset')).toBeVisible()
    await clickElement(getByLabelText('Reset'))
    expect(setSearch).toHaveBeenCalled()
    expect(setSort).toHaveBeenCalled()
    setSort.mockClear()

    await clickElement(getByText('UID'))
    expect(setSort).toHaveBeenCalled()
  })
  test('shows loading', async () => {
    const { queryByText } = render(<Table items={undefined} useExtraToolbarControls={true} />)
    expect(screen.getAllByRole('progressbar')).toBeTruthy()
    expect(queryByText('View 1')).toBeVisible()
  })
  test('can have sort updated when all items filtered', async () => {
    const { getByPlaceholderText, queryByText, getByLabelText, getByText, container } = render(<Table />)

    // search for 'ABSOLUTELYZEROMATCHES'
    expect(getByPlaceholderText(placeholderString)).toBeInTheDocument()
    await typeElement(getByPlaceholderText(placeholderString), 'ABSOLUTELYZEROMATCHES')
    expect(queryByText('0 / 105')).toBeVisible()

    // change sort during filter (Last Name)
    await clickElement(getByText('Last Name'))

    // clear filter
    expect(getByLabelText('Reset')).toBeVisible()
    await clickElement(getByLabelText('Reset'))
    expect(queryByText('0 / 105')).toBeNull()

    // verify sort selection sticks
    expect(container.querySelector('tbody tr:first-of-type [data-label="Last Name"]')).toHaveTextContent('Arthur')
  })
  test('renders a table with expandable rows', async () => {
    const expandedDeleteAction = jest.fn()
    const { getByTestId } = render(
      <MemoryRouter>
        <AcmTable<IExampleData>
          aria-label="Example table"
          emptyState={<AcmEmptyState title="No addresses found" message="You do not have any addresses yet" />}
          showToolbar={false}
          items={exampleData.slice(0, 10)}
          addSubRows={(item: IExampleData) => {
            if (item.uid === 1) {
              return [
                {
                  cells: [
                    {
                      title: <div id="expanded">{item.uid}</div>,
                    },
                  ],
                },
              ]
            } else {
              return undefined
            }
          }}
          columns={[
            {
              header: 'First Name',
              sort: 'firstName',
              cell: 'firstName',
            },
            {
              header: 'Last Name',
              sort: 'last_name',
              cell: 'last_name',
            },
            {
              header: 'EMail',
              cell: 'email',
            },
            {
              header: 'Gender',
              sort: 'gender',
              cell: (item) => item.gender,
            },
            {
              header: 'IP Address',
              sort: sortFunction,
              cell: 'ip_address',
            },
            {
              header: 'UID',
              sort: 'uid',
              cell: 'uid',
            },
          ]}
          keyFn={(item: IExampleData) => item.uid.toString()}
          rowActions={[
            {
              id: 'delete',
              title: 'Delete item',
              click: () => {
                expandedDeleteAction()
              },
            },
            {
              id: 'deleteTT',
              title: 'Delete item tooltip',
              tooltip: 'delete',
              click: () => {
                expandedDeleteAction()
              },
            },
          ]}
          fuseThreshold={0}
        />
      </MemoryRouter>
    )
    await clickElement(getByTestId('expandable-toggle0'))
    expect(getByTestId('expanded')).toBeInTheDocument()
  })

  test('renders with filtering and filters options work correctly', async () => {
    const { container, getByText, getByTestId } = render(
      <Table
        filters={[
          {
            label: 'Gender',
            id: 'gender',
            options: [
              { label: 'Male', value: 'male' },
              { label: 'Female', value: 'female' },
              { label: 'Non-binary', value: 'non-binary' },
            ],
            tableFilterFn: (selectedValues: string[], item: IExampleData) => {
              if (selectedValues.indexOf(item['gender'].toLowerCase()) > -1) {
                return true
              }
              return false
            },
          },
        ]}
      />
    )

    // Table renders
    expect(getByText('Filter')).toBeInTheDocument()
    await clickElement(getByText('Filter'))
    expect(getByTestId('gender-male')).toBeInTheDocument()

    // Filtering works
    await clickElement(getByTestId('gender-male'))
    expect(container.querySelectorAll('.pf-v6-c-label-group__list-item')).toHaveLength(1)
    await clickElement(getByTestId('gender-female'))
    expect(container.querySelectorAll('.pf-v6-c-label-group__list-item')).toHaveLength(2)

    // Unselect current options
    await clickElement(getByTestId('gender-female'))
    expect(container.querySelectorAll('.pf-v6-c-label-group__list-item')).toHaveLength(1)
    await clickElement(getByTestId('gender-male'))
    expect(container.querySelectorAll('.pf-v6-c-label-group__list-item')).toHaveLength(0)
  })

  test('render table with multiple sub rows', async () => {
    const { getAllByText } = render(
      <Table
        addSubRows={() => {
          return [
            {
              cells: [{ title: 'Sub row 1' }],
            },
            {
              cells: [{ title: 'Sub row 2' }],
            },
          ]
        }}
      />
    )
    expect(getAllByText('Sub row 2').length).toBeGreaterThan(0)
  })

  test('renders with filtering and successfully deletes selected filters', async () => {
    const { container, getAllByText, getByText, getByTestId, getByLabelText } = render(
      <Table
        filters={[
          {
            label: 'Gender',
            id: 'gender',
            options: [
              { label: 'Male', value: 'male' },
              { label: 'Female', value: 'female' },
              { label: 'Non-binary', value: 'non-binary' },
            ],
            tableFilterFn: (selectedValues: string[], item: IExampleData) => {
              return selectedValues.includes(item['gender'].toLowerCase())
            },
          },
        ]}
      />
    )

    // Test deleting label group
    expect(getByText('Filter')).toBeInTheDocument()
    await clickElement(getByText('Filter'))
    await clickElement(getByTestId('gender-male'))
    await clickElement(getByTestId('gender-female'))
    await clickElement(getByLabelText('Close label group'))
    expect(container.querySelectorAll('.pf-v6-c-label-group__list-item')).toHaveLength(0)

    // test deleting single label
    expect(getByText('Filter')).toBeInTheDocument()
    await clickElement(getByText('Filter'))
    await clickElement(getByTestId('gender-male'))
    await clickElement(getByTestId('gender-female'))
    const labelItems = container.querySelectorAll('.pf-v6-c-label-group__list-item')
    expect(labelItems.length).toBe(2)
    // Find close buttons within label items - PatternFly uses button elements with TimesIcon
    const closeButtons = Array.from(labelItems).map((item) => item.querySelector('button'))
    expect(closeButtons.length).toBe(2)
    expect(closeButtons[0]).toBeTruthy()
    expect(closeButtons[1]).toBeTruthy()
    await clickElement(closeButtons[1]!)
    expect(container.querySelectorAll('.pf-v6-c-label-group__list-item')).toHaveLength(1)
    await clickElement(closeButtons[0]!)
    expect(container.querySelectorAll('.pf-v6-c-label-group__list-item')).toHaveLength(0)

    // test deleting all selected filters
    expect(getByText('Filter')).toBeInTheDocument()
    await clickElement(getByText('Filter'))
    await clickElement(getByTestId('gender-male'))
    await clickElement(getAllByText('Clear all filters')[0])
    expect(container.querySelectorAll('.pf-v6-c-label-group__list-item')).toHaveLength(0)
  })

  test('renders a table with secondary filter', async () => {
    const { container, getByText, getByTestId, getByLabelText } = render(
      <Table
        secondaryFilterIds={['cluster']}
        filters={[
          {
            label: 'Gender',
            id: 'gender',
            options: [
              { label: 'Male', value: 'male' },
              { label: 'Female', value: 'female' },
              { label: 'Non-binary', value: 'non-binary' },
            ],
            tableFilterFn: (selectedValues: string[], item: IExampleData) => {
              return selectedValues.includes(item['gender'].toLowerCase())
            },
          },
          {
            label: 'Cluster',
            id: 'cluster',
            options: Array.from(new Array(300).keys()).map((inx) => {
              return { label: `cluster${inx + 1}`, value: `cluster${inx + 1}` }
            }),
            tableFilterFn: (selectedValues: string[], item: IExampleData) => {
              return selectedValues.includes((item['cluster'] || '').toLowerCase())
            },
          },
        ]}
      />
    )

    // Test deleting label group
    expect(getByText('Cluster')).toBeInTheDocument()
    await clickElement(getByText('Cluster'))
    await clickElement(getByTestId('cluster-cluster21'))
    await clickElement(getByTestId('cluster-cluster31'))
    expect(container.querySelectorAll('.pf-v6-c-label-group__list-item')).toHaveLength(2)
    await clickElement(getByLabelText('Close label group'))
    expect(container.querySelectorAll('.pf-v6-c-label-group__list-item')).toHaveLength(0)
  })

  test('table filter dropdown is scrollable when opened', async () => {
    const { getByText } = render(
      <Table
        filters={[
          {
            label: 'Cluster',
            id: 'cluster',
            options: Array.from(new Array(50).keys()).map((inx) => ({
              label: `cluster${inx + 1}`,
              value: `cluster${inx + 1}`,
            })),
            tableFilterFn: (selectedValues: string[], item: IExampleData) =>
              selectedValues.includes((item['cluster'] || '').toLowerCase()),
          },
        ]}
      />
    )
    await clickElement(getByText('Filter'))
    await waitFor(() => {
      const scrollableMenu = document.querySelector('.pf-m-scrollable')
      expect(scrollableMenu).toBeInTheDocument()
    })
  })

  test('renders with customTableAction', async () => {
    const { container, getByRole } = render(
      <Table useCustomTableAction={true} useTableActions={false} useRowActions={false} />
    )
    expect(container.querySelector('table')).toBeInTheDocument()
    expect(getByRole('button', { name: 'Create' })).toBeVisible()
    await clickElement(getByRole('button', { name: 'Create' }))
  })

  test('renders with export button', async () => {
    const { getByTestId, getByText, container } = render(<Table showExportButton />)
    expect(container.querySelector('#export-search-result')).toBeInTheDocument()
    await clickElement(getByTestId('export-search-result'))
    expect(getByText('Export all to CSV')).toBeInTheDocument()
  })

  test('returns a csv safe string from export callback', () => {
    const exportContent = addSubRowsCallback()[0].exportSubRow[0].exportContent()
    expect(exportContent).toEqual("'Ready':'true','Hibernating':'false'")
  })

  test('export button should produce a file for download', async () => {
    const addSubRowsCallback = () => {
      return [
        {
          cells: [
            {
              title: <>Status Labels</>,
            },
          ],
          exportSubRow: [
            {
              header: 'Status Labels',
              exportContent: () => exportObjectString({ Ready: 'true' }),
            },
          ],
        },
      ]
    }
    const { getByTestId, getByText, container } = render(
      <Table items={exampleData.slice(0, 1)} showExportButton addSubRows={addSubRowsCallback} />
    )
    const { blobConstructorSpy, createElementSpy } = getCSVExportSpies()

    window.URL.createObjectURL = jest.fn()
    window.URL.revokeObjectURL = jest.fn()

    expect(container.querySelector('#export-search-result')).toBeInTheDocument()
    await clickElement(getByTestId('export-search-result'))
    await clickElement(getByText('Export all to CSV'))

    await clickElement(getByTestId('export-search-result'))
    const arrayTest = [
      'First Name,Last Name,EMail,Gender,IP Address,UID,Clusters,Status Labels\n' + "-,-,-,-,-,-,-,\"'Ready':'true'\"",
    ]

    expect(blobConstructorSpy).toHaveBeenCalledWith(arrayTest, { type: 'text/csv' })

    expect(getCSVDownloadLink(createElementSpy)?.value.download).toMatch(/^table-values-[\d]+\.csv$/)
  })
})

describe('returnCSVSafeString', () => {
  test('returns a csv safe string preserving newlines', () => {
    const content = 'testing for multiline\ndescription'
    const exportContent = returnCSVSafeString(content)
    expect(exportContent).toEqual('"testing for multiline\ndescription"')
  })

  test('returns a csv safe string escaping double quotes', () => {
    const content = 'testing for description with double quotes "'
    const exportContent = returnCSVSafeString(content)
    expect(exportContent).toEqual('"testing for description with double quotes """')
  })
})
