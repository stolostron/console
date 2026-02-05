/* Copyright Contributors to the Open Cluster Management project */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectsList } from './ProjectsList'

// Use an object to track captured state (avoids let variables)
const capturedState = {
  additionalProjects: undefined as string[] | undefined,
}

const mockClustersWithOne = [{ name: 'cluster-1' }]

jest.mock('../../components/ProjectsTable', () => ({
  ProjectsTable: ({
    selectedClusters = [],
    onCreateClick,
    onSelectionChange,
    additionalProjects,
    tableActionButtons,
  }: any) => {
    // Capture additionalProjects for test assertions
    capturedState.additionalProjects = additionalProjects
    const createAction = tableActionButtons?.find((a: any) => a.id === 'create-project')
    return (
      <div id="projects-table" data-testid="projects-table">
        <div>Clusters: {selectedClusters.map((c: any) => c.name).join(', ')}</div>
        <div id="additional-projects" data-testid="additional-projects">
          {additionalProjects?.join(', ') || 'none'}
        </div>
        <button
          type="button"
          onClick={createAction?.click ?? onCreateClick}
          disabled={createAction?.isDisabled ?? false}
          title={createAction?.tooltip ?? undefined}
          data-testid="create-common-project-btn"
        >
          {createAction?.title ?? 'Create common project'}
        </button>
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

  beforeEach(() => {
    capturedState.additionalProjects = undefined
    mockOnSelectionChange.mockClear()
  })

  it('returns to table view when cancel is clicked', async () => {
    // Arrange - need at least one cluster so create button is enabled
    render(<ProjectsList selectedClusters={mockClustersWithOne} onSelectionChange={mockOnSelectionChange} />)

    // Act
    await userEvent.click(screen.getByRole('button', { name: 'Create common project' }))
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
    // Arrange - need at least one cluster so create button is enabled
    render(<ProjectsList selectedClusters={mockClustersWithOne} onSelectionChange={mockOnSelectionChange} />)

    // Act
    await userEvent.click(screen.getByRole('button', { name: 'Create common project' }))
    expect(await screen.findByTestId('common-project-create')).toBeInTheDocument()
    await userEvent.click(screen.getByText('Submit'))

    // Assert
    await waitFor(() => {
      expect(screen.queryByTestId('common-project-create')).not.toBeInTheDocument()
    })
    expect(screen.getByTestId('projects-table')).toBeInTheDocument()
  })

  it('calls onSelectionChange with new project name when create succeeds and no projects selected', async () => {
    render(<ProjectsList selectedClusters={[{ name: 'cluster-1' }]} onSelectionChange={mockOnSelectionChange} />)

    await userEvent.click(screen.getByText('Create common project'))
    await waitFor(() => {
      expect(screen.getByTestId('common-project-create')).toBeInTheDocument()
    })
    await userEvent.click(screen.getByText('Submit'))

    expect(mockOnSelectionChange).toHaveBeenCalledWith(['new-project'])
  })

  it('calls onSelectionChange with existing selection plus new project name when create succeeds', async () => {
    const { rerender } = render(
      <ProjectsList selectedClusters={[{ name: 'cluster-1' }]} onSelectionChange={mockOnSelectionChange} />
    )

    await userEvent.click(screen.getByText('Create common project'))
    await waitFor(() => {
      expect(screen.getByTestId('common-project-create')).toBeInTheDocument()
    })

    rerender(
      <ProjectsList
        selectedClusters={[{ name: 'cluster-1' }]}
        selectedNamespaces={['existing-ns-1', 'existing-ns-2']}
        onSelectionChange={mockOnSelectionChange}
      />
    )

    await userEvent.click(screen.getByText('Submit Custom'))

    expect(mockOnSelectionChange).toHaveBeenCalledWith(['existing-ns-1', 'existing-ns-2', 'custom-project'])
  })

  it('handles project selection changes', async () => {
    // Arrange - empty clusters is fine for selection-only test
    render(<ProjectsList selectedClusters={mockClustersWithOne} onSelectionChange={mockOnSelectionChange} />)

    // Act
    const selectButton = screen.getByText('Select Project')
    await userEvent.click(selectButton)

    // Assert
    expect(mockOnSelectionChange).toHaveBeenCalledWith(['project-1'])
    expect(screen.getByTestId('projects-table')).toBeInTheDocument()
  })

  describe('created projects tracking', () => {
    it('passes created project name to ProjectsTable as additionalProjects after creation', async () => {
      // Arrange - need at least one cluster so create button is enabled
      render(<ProjectsList selectedClusters={mockClustersWithOne} onSelectionChange={mockOnSelectionChange} />)

      // Initially no additional projects
      expect(capturedState.additionalProjects).toEqual([])

      // Act - Create a project
      await userEvent.click(screen.getByRole('button', { name: 'Create common project' }))
      await waitFor(() => {
        expect(screen.getByTestId('common-project-create')).toBeInTheDocument()
      })
      await userEvent.click(screen.getByText('Submit'))

      // Assert - ProjectsTable should receive the new project
      await waitFor(() => {
        expect(screen.getByTestId('projects-table')).toBeInTheDocument()
      })
      expect(capturedState.additionalProjects).toEqual(['new-project'])
    })

    it('passes custom project name to ProjectsTable as additionalProjects', async () => {
      // Arrange - need at least one cluster so create button is enabled
      render(<ProjectsList selectedClusters={mockClustersWithOne} onSelectionChange={mockOnSelectionChange} />)

      // Act - Create a project with custom name
      await userEvent.click(screen.getByRole('button', { name: 'Create common project' }))
      await waitFor(() => {
        expect(screen.getByTestId('common-project-create')).toBeInTheDocument()
      })
      await userEvent.click(screen.getByText('Submit Custom'))

      // Assert - ProjectsTable should receive the custom project name
      await waitFor(() => {
        expect(screen.getByTestId('projects-table')).toBeInTheDocument()
      })
      expect(capturedState.additionalProjects).toEqual(['custom-project'])
    })

    it('accumulates multiple created projects in additionalProjects', async () => {
      // Arrange - need at least one cluster so create button is enabled
      render(<ProjectsList selectedClusters={mockClustersWithOne} onSelectionChange={mockOnSelectionChange} />)

      // Act - Create first project
      await userEvent.click(screen.getByRole('button', { name: 'Create common project' }))
      await waitFor(() => {
        expect(screen.getByTestId('common-project-create')).toBeInTheDocument()
      })
      await userEvent.click(screen.getByText('Submit'))

      // Wait for table to appear
      await waitFor(() => {
        expect(screen.getByTestId('projects-table')).toBeInTheDocument()
      })

      // Verify first project is in the list
      expect(capturedState.additionalProjects).toEqual(['new-project'])

      // Act - Create second project
      await userEvent.click(screen.getByRole('button', { name: 'Create common project' }))
      await waitFor(() => {
        expect(screen.getByTestId('common-project-create')).toBeInTheDocument()
      })
      await userEvent.click(screen.getByText('Submit Custom'))

      // Assert - Both projects should be in additionalProjects
      await waitFor(() => {
        expect(screen.getByTestId('projects-table')).toBeInTheDocument()
      })
      expect(capturedState.additionalProjects).toEqual(['new-project', 'custom-project'])
    })

    it('displays additionalProjects in the table UI', async () => {
      // Arrange - need at least one cluster so create button is enabled
      render(<ProjectsList selectedClusters={mockClustersWithOne} onSelectionChange={mockOnSelectionChange} />)

      // Act - Create a project
      await userEvent.click(screen.getByRole('button', { name: 'Create common project' }))
      await waitFor(() => {
        expect(screen.getByTestId('common-project-create')).toBeInTheDocument()
      })
      await userEvent.click(screen.getByText('Submit'))

      // Assert - The additional projects should be visible in the UI
      await waitFor(() => {
        expect(screen.getByTestId('projects-table')).toBeInTheDocument()
      })
      expect(screen.getByTestId('additional-projects')).toHaveTextContent('new-project')
    })

    it('starts with empty additionalProjects array', () => {
      // Arrange & Act - empty clusters; create button is disabled but table is shown
      render(<ProjectsList selectedClusters={[]} onSelectionChange={mockOnSelectionChange} />)

      // Assert
      expect(capturedState.additionalProjects).toEqual([])
      expect(screen.getByTestId('additional-projects')).toHaveTextContent('none')
    })

    it('does not lose created projects when canceling new project creation', async () => {
      // Arrange - need at least one cluster so create button is enabled
      render(<ProjectsList selectedClusters={mockClustersWithOne} onSelectionChange={mockOnSelectionChange} />)

      // Create first project
      await userEvent.click(screen.getByRole('button', { name: 'Create common project' }))
      await waitFor(() => {
        expect(screen.getByTestId('common-project-create')).toBeInTheDocument()
      })
      await userEvent.click(screen.getByText('Submit'))

      await waitFor(() => {
        expect(screen.getByTestId('projects-table')).toBeInTheDocument()
      })
      expect(capturedState.additionalProjects).toEqual(['new-project'])

      // Start creating another project but cancel
      await userEvent.click(screen.getByRole('button', { name: 'Create common project' }))
      await waitFor(() => {
        expect(screen.getByTestId('common-project-create')).toBeInTheDocument()
      })
      await userEvent.click(screen.getByText('Cancel'))

      // Assert - First project should still be in the list
      await waitFor(() => {
        expect(screen.getByTestId('projects-table')).toBeInTheDocument()
      })
      expect(capturedState.additionalProjects).toEqual(['new-project'])
    })
  })

  describe('create-project action when selectedClusters is empty', () => {
    it('disables create-project action when selectedClusters is empty', async () => {
      render(<ProjectsList selectedClusters={[]} onSelectionChange={mockOnSelectionChange} />)

      await waitFor(() => {
        const createBtn = screen.getByRole('button', { name: 'Create common project' })
        expect(createBtn).toBeDisabled()
      })
    })

    it('shows "No clusters selection to create projects for" tooltip when selectedClusters is empty', async () => {
      render(<ProjectsList selectedClusters={[]} onSelectionChange={mockOnSelectionChange} />)

      await waitFor(() => {
        const createBtn = screen.getByRole('button', { name: 'Create common project' })
        expect(createBtn).toHaveAttribute('title', 'No clusters selection to create projects for')
      })
    })
  })

  describe('create-project action when selectedClusters has items', () => {
    it('enables create-project action when selectedClusters has items and no projects selected', () => {
      render(<ProjectsList selectedClusters={mockClustersWithOne} onSelectionChange={mockOnSelectionChange} />)

      const createBtn = screen.getByRole('button', { name: 'Create common project' })
      expect(createBtn).toBeEnabled()
      expect(createBtn).not.toHaveAttribute('title')
    })

    it('disables create-project action when projects are selected and shows deselect tooltip', () => {
      render(
        <ProjectsList
          selectedClusters={mockClustersWithOne}
          selectedNamespaces={['my-namespace']}
          onSelectionChange={mockOnSelectionChange}
        />
      )

      const createBtn = screen.getByRole('button', { name: 'Create common project' })
      expect(createBtn).toBeDisabled()
      expect(createBtn).toHaveAttribute('title', 'Deselect projects to create a new common project')
    })
  })
})
