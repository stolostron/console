/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { RoleAssignmentLabel } from './RoleAssignmentLabel'

jest.mock('../../../lib/acm-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: number }) =>
      key === 'show.more' && options?.count !== undefined ? `${options.count} more` : key,
  }),
}))

describe('RoleAssignmentLabel', () => {
  it.each([[undefined], [[]]])('shows emptyElementsText when elements is %s', (elements: undefined | string[]) => {
    // Act
    render(<RoleAssignmentLabel emptyElementsText="All namespaces" numLabel={0} elements={elements} />)

    // Assert
    expect(screen.getByText('All namespaces')).toBeInTheDocument()
  })

  it('shows "-" when elements is empty and emptyElementsText is "-"', () => {
    render(<RoleAssignmentLabel emptyElementsText="-" numLabel={0} elements={[]} />)
    expect(screen.getByText('-')).toBeInTheDocument()
  })

  it.each([
    ['greater than', 4],
    ['equal to', 3],
  ])('numLabel %s elements length', (_title: string, numLabel: number) => {
    // Act
    render(<RoleAssignmentLabel emptyElementsText="-" numLabel={numLabel} elements={['a', 'b', 'c']} />)

    // Assert
    expect(screen.getByText(/a/i)).toBeInTheDocument()
    expect(screen.getByText(/b/i)).toBeInTheDocument()
    expect(screen.getByText(/c/i)).toBeInTheDocument()
    expect(screen.queryByText('more')).not.toBeInTheDocument()
  })

  it('numLabel lower than elements length by 1', () => {
    // Act
    render(<RoleAssignmentLabel emptyElementsText="-" numLabel={2} elements={['a', 'b', 'c']} />)

    // Assert
    expect(screen.getByText(/a/i)).toBeInTheDocument()
    expect(screen.getByText(/b/i)).toBeInTheDocument()
    expect(screen.queryByText(/c/i)).not.toBeInTheDocument()
    expect(screen.getByText(/1 more/i)).toBeInTheDocument()
  })

  it('numLabel lower than elements length by 2', () => {
    // Act
    render(<RoleAssignmentLabel emptyElementsText="-" numLabel={1} elements={['a', 'b', 'c']} />)

    // Assert
    expect(screen.getByText(/a/i)).toBeInTheDocument()
    expect(screen.queryByText(/b/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/c/i)).not.toBeInTheDocument()
    expect(screen.getByText(/2 more/i)).toBeInTheDocument()
  })
})
