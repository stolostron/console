/* Copyright Contributors to the Open Cluster Management project */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectsList } from './ProjectsList'

jest.mock('../../components/ProjectsTable', () => ({
  ProjectsTable: ({ selectedClusters = [], onCreateClick, onSelectionChange }: any) => {
    return (
      <div id="projects-table" data-testid="projects-table">
        <div>Clusters: {selectedClusters.map((c: any) => c.name).join(', ')}</div>
        <button onClick={onCreateClick}>Create common project</button>
        <button
          onClick={() => {
            const mockProjects = [{ name: 'project-1', type: 'Namespace', clusters: ['local-cluster'] }]
            onSelectionChange(mockProjects)
          }}
        >
          Select Project
        </button>
      </div>
    )
  },
}))

jest.mock('./CommonProjectCreate', () => ({
  CommonProjectCreate: ({ onCancelCallback, onSuccess }: any) => {
    return (
      <div id="common-project-create" data-testid="common-project-create">
        <h1>Create common project</h1>
        <button onClick={onCancelCallback}>Cancel</button>
        <button onClick={() => onSuccess('new-project')}>Submit</button>
        <button onClick={() => onSuccess('custom-project')}>Submit Custom</button>
      </div>
    )
  },
}))

describe('ProjectsList', () => {
  const mockOnSelectionChange = jest.fn()
  const defaultProps = {
    selectedClusters: [] as any[],
    onSelectionChange: mockOnSelectionChange,
  }

  beforeEach(() => {
    mockOnSelectionChange.mockClear()
  })

  it('returns to table view when cancel is clicked', async () => {
    // Arrange
    render(<ProjectsList {...defaultProps} />)

    // Act
    await userEvent.click(screen.getByText('Create common project'))
    await waitFor(() => {
      expect(screen.getByTestId('common-project-create')).toBeInTheDocument()
    })
    await userEvent.click(screen.getByText('Cancel'))

    // Assert
    await waitFor(() => {
      expect(screen.queryByTestId('common-project-create')).not.toBeInTheDocument()
    })
    expect(screen.getByTestId('projects-table')).toBeInTheDocument()
  })

  it('returns to table view when project creation succeeds', async () => {
    // Arrange
    render(<ProjectsList {...defaultProps} />)

    // Act
    await userEvent.click(screen.getByText('Create common project'))
    expect(await screen.findByTestId('common-project-create')).toBeInTheDocument()
    await userEvent.click(screen.getByText('Submit'))

    // Assert
    await waitFor(() => {
      expect(screen.queryByTestId('common-project-create')).not.toBeInTheDocument()
    })
    expect(screen.getByTestId('projects-table')).toBeInTheDocument()
  })

  it('handles project selection changes', async () => {
    // Arrange
    render(<ProjectsList {...defaultProps} />)

    // Act
    const selectButton = screen.getByText('Select Project')
    await userEvent.click(selectButton)

    // Assert
    expect(mockOnSelectionChange).toHaveBeenCalledWith(['project-1'])
    expect(screen.getByTestId('projects-table')).toBeInTheDocument()
  })
})
