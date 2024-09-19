import { render } from '@testing-library/react'
import { AcmSearchInput, SearchableColumn, SearchConstraint, SearchOperator } from '../AcmSearchInput'
import { axe } from 'jest-axe'
import userEvent from '@testing-library/user-event'

describe('AcmSearchInput', () => {
  const pendingConstraints: SearchConstraint[] = [{ columnName: 'name' }]
  const columns: SearchableColumn[] = [
    { columnName: 'name', availableOperators: [SearchOperator.Equals] },
    { columnName: 'namespace', availableOperators: [SearchOperator.Equals] },
  ]
  const AcmSearchInputComponent = () => (
    <AcmSearchInput
      useAdvancedSearchPopper
      canAddConstraints
      setActiveConstraints={() => {}}
      pendingConstraints={pendingConstraints}
      searchableColumns={columns}
    />
  )

  test('renders', () => {
    const { getByLabelText } = render(<AcmSearchInputComponent />)
    expect(getByLabelText('Open advanced search')).toBeInTheDocument()
  })

  test('popper renders', () => {
    const { getByLabelText, getByText } = render(<AcmSearchInputComponent />)
    expect(getByLabelText('Open advanced search')).toBeInTheDocument()
    userEvent.click(getByLabelText('Open advanced search'))
    userEvent.click(getByText('Has the words'))
  })

  test('can add search constraints', () => {
    const { getByLabelText, getByText, getAllByText } = render(<AcmSearchInputComponent />)
    expect(getByLabelText('Open advanced search')).toBeInTheDocument()
    userEvent.click(getByLabelText('Open advanced search'))
    expect(getByText('Add a search constraint')).toBeInTheDocument()
    userEvent.click(getByText('Add a search constraint'))
    expect(getAllByText('Column')).toHaveLength(2)
  })

  test('has zero accessibility defects', async () => {
    const { container } = render(<AcmSearchInputComponent />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
