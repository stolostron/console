/* Copyright Contributors to the Open Cluster Management project */
import { ItemContext } from '@patternfly-labs/react-form-wizard/lib/src/contexts/ItemContext'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserKind } from '../../resources'
import { ProjectsList } from './ProjectsList'

const mockFormData = {
  subject: { kind: UserKind },
  scope: {
    kind: 'specific' as const,
    clusterNames: [],
    namespaces: [],
  },
  roles: [],
  scopeType: 'Select clusters' as const,
}

const renderWithContext = (component: React.ReactElement) => {
  return render(<ItemContext.Provider value={mockFormData}>{component}</ItemContext.Provider>)
}

// Use an object to track captured state (avoids let variables)
const capturedState = {
  additionalProjects: undefined as string[] | undefined,
}

jest.mock('../../components/ProjectsTable', () => ({
  ProjectsTable: ({ selectedClusters = [], onCreateClick, onSelectionChange, additionalProjects }: any) => {
    // Capture additionalProjects for test assertions
    capturedState.additionalProjects = additionalProjects
    return (
      <div id="projects-table" data-testid="projects-table">
        <div>Clusters: {selectedClusters.map((c: any) => c.name).join(', ')}</div>
        <div id="additional-projects" data-testid="additional-projects">
          {additionalProjects?.join(', ') || 'none'}
        </div>
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
  beforeEach(() => {
    capturedState.additionalProjects = undefined
  })

  it('returns to table view when cancel is clicked', async () => {
    // Arrange
    renderWithContext(<ProjectsList selectedClusters={[]} />)

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
    renderWithContext(<ProjectsList selectedClusters={[]} />)

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
    renderWithContext(<ProjectsList selectedClusters={[]} />)

    // Act
    const selectButton = screen.getByText('Select Project')
    await userEvent.click(selectButton)

    // Assert
    expect(screen.getByTestId('projects-table')).toBeInTheDocument()
  })

  describe('created projects tracking', () => {
    it('passes created project name to ProjectsTable as additionalProjects after creation', async () => {
      // Arrange
      renderWithContext(<ProjectsList selectedClusters={[]} />)

      // Initially no additional projects
      expect(capturedState.additionalProjects).toEqual([])

      // Act - Create a project
      await userEvent.click(screen.getByText('Create common project'))
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
      // Arrange
      renderWithContext(<ProjectsList selectedClusters={[]} />)

      // Act - Create a project with custom name
      await userEvent.click(screen.getByText('Create common project'))
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
      // Arrange
      renderWithContext(<ProjectsList selectedClusters={[]} />)

      // Act - Create first project
      await userEvent.click(screen.getByText('Create common project'))
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
      await userEvent.click(screen.getByText('Create common project'))
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
      // Arrange
      renderWithContext(<ProjectsList selectedClusters={[]} />)

      // Act - Create a project
      await userEvent.click(screen.getByText('Create common project'))
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
      // Arrange & Act
      renderWithContext(<ProjectsList selectedClusters={[]} />)

      // Assert
      expect(capturedState.additionalProjects).toEqual([])
      expect(screen.getByTestId('additional-projects')).toHaveTextContent('none')
    })

    it('does not lose created projects when canceling new project creation', async () => {
      // Arrange
      renderWithContext(<ProjectsList selectedClusters={[]} />)

      // Create first project
      await userEvent.click(screen.getByText('Create common project'))
      await waitFor(() => {
        expect(screen.getByTestId('common-project-create')).toBeInTheDocument()
      })
      await userEvent.click(screen.getByText('Submit'))

      await waitFor(() => {
        expect(screen.getByTestId('projects-table')).toBeInTheDocument()
      })
      expect(capturedState.additionalProjects).toEqual(['new-project'])

      // Start creating another project but cancel
      await userEvent.click(screen.getByText('Create common project'))
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
})
