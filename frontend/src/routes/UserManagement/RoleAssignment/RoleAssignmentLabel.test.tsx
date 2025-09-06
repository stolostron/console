/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { RoleAssignmentLabel } from './RoleAssignmentLabel'

describe('RoleAssignmentsHelper', () => {
  it.each([[undefined], [[]]])('%s elements', (elements: undefined | string[]) => {
    // Act
    const { container } = render(<RoleAssignmentLabel numLabel={0} elements={elements} />)

    // Assert
    expect(container).toBeEmptyDOMElement()
  })

  it.each([
    ['greater than', 4],
    ['equal to', 3],
  ])('numLabel %s elements length', (_title: string, numLabel: number) => {
    // Act
    render(<RoleAssignmentLabel numLabel={numLabel} elements={['a', 'b', 'c']} />)

    // Assert
    expect(screen.getByText(/a/i)).toBeInTheDocument()
    expect(screen.getByText(/b/i)).toBeInTheDocument()
    expect(screen.getByText(/b/i)).toBeInTheDocument()
    expect(screen.queryByText('more')).not.toBeInTheDocument()
  })

  it('numLabel lower than elements length by 1', () => {
    // Act
    render(<RoleAssignmentLabel numLabel={2} elements={['a', 'b', 'c']} />)

    // Assert
    expect(screen.getByText(/a/i)).toBeInTheDocument()
    expect(screen.getByText(/b/i)).toBeInTheDocument()
    expect(screen.queryByText(/c/i)).not.toBeInTheDocument()
    expect(screen.getByText(/1 more/i)).toBeInTheDocument()
  })

  it('numLabel lower than elements length by 2', () => {
    // Act
    render(<RoleAssignmentLabel numLabel={1} elements={['a', 'b', 'c']} />)

    // Assert
    expect(screen.getByText(/a/i)).toBeInTheDocument()
    expect(screen.queryByText(/b/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/c/i)).not.toBeInTheDocument()
    expect(screen.getByText(/2 more/i)).toBeInTheDocument()
  })
})
