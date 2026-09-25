/* Copyright Contributors to the Open Cluster Management project */
import { useState } from 'react'
import { render } from '@testing-library/react'
import { AcmSearchInput, SearchableColumn, SearchConstraint, SearchOperator } from '../AcmSearchInput'
import { axe } from 'jest-axe'
import { clickElement } from '~/lib/test-util'

describe('AcmSearchInput', () => {
  const columns: SearchableColumn[] = [
    { columnId: 'name', availableOperators: [SearchOperator.Equals] },
    { columnId: 'namespace', availableOperators: [SearchOperator.Equals] },
    {
      columnId: 'distribution',
      columnDisplayName: 'distribution',
      availableOperators: [
        SearchOperator.Equals,
        SearchOperator.GreaterThan,
        SearchOperator.LessThan,
        SearchOperator.GreaterThanOrEqualTo,
        SearchOperator.LessThanOrEqualTo,
        SearchOperator.NotEquals,
      ],
    },
  ]

  const AcmSearchInputComponent = () => {
    const [pendingConstraints, setPendingConstraints] = useState<SearchConstraint[]>([
      { operator: undefined, value: '', columnId: '' },
    ])
    return (
      <AcmSearchInput
        useAdvancedSearchPopper
        canAddConstraints
        setActiveConstraints={() => {}}
        pendingConstraints={pendingConstraints}
        setPendingConstraints={setPendingConstraints}
        searchableColumns={columns}
      />
    )
  }

  test('renders', () => {
    const { getByLabelText } = render(<AcmSearchInputComponent />)
    expect(getByLabelText('Open advanced search')).toBeInTheDocument()
  })

  test('popper renders', async () => {
    const { getByLabelText, getByText } = render(<AcmSearchInputComponent />)
    expect(getByLabelText('Open advanced search')).toBeInTheDocument()
    await clickElement(getByLabelText('Open advanced search'))
    await clickElement(getByText('Fuzzy search'))
  })

  test('can add search constraints', async () => {
    const { getByLabelText, getByText, getAllByText } = render(<AcmSearchInputComponent />)
    expect(getByLabelText('Open advanced search')).toBeInTheDocument()
    await clickElement(getByLabelText('Open advanced search'))
    expect(getByText('Add a search constraint')).toBeInTheDocument()
    await clickElement(getByText('Add a search constraint'))
    expect(getAllByText('Column')).toHaveLength(2)
  })

  test('can add search constraint with operator', async () => {
    const { getByLabelText, getByText, getAllByText } = render(<AcmSearchInputComponent />)
    expect(getByLabelText('Open advanced search')).toBeInTheDocument()
    await clickElement(getByLabelText('Open advanced search'))
    expect(getAllByText('Column')).toHaveLength(1)

    await clickElement(getByText('Select a column'))
    await clickElement(getByText('distribution'))

    await clickElement(getByText('Select an operator'))
    expect(getByText('=')).toBeInTheDocument()
    expect(getByText('!=')).toBeInTheDocument()
    expect(getByText('>')).toBeInTheDocument()
    expect(getByText('<')).toBeInTheDocument()
    expect(getByText('>=')).toBeInTheDocument()
    expect(getByText('<=')).toBeInTheDocument()
  })

  test('has zero accessibility defects', async () => {
    const { container } = render(<AcmSearchInputComponent />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
