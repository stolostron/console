/* Copyright Contributors to the Open Cluster Management project */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ItemContext } from '@patternfly-labs/react-form-wizard/lib/src/contexts/ItemContext'
import { ProjectsList } from './ProjectsList'
import { UserKind } from '../../resources'

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

jest.mock('../../components/ProjectsTable', () => ({
  ProjectsTable: ({ selectedClusters = [], onCreateClick, onSelectionChange }: any) => (
    <div id="projects-table">
      <div>Clusters: {selectedClusters.join(', ')}</div>
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
  ),
}))

jest.mock('./CommonProjectCreate', () => ({
  CommonProjectCreate: ({ onCancelCallback, onSuccess }: any) => (
    <div id="common-project-create">
      <h1>Create common project</h1>
      <button onClick={onCancelCallback}>Cancel</button>
      <button onClick={onSuccess}>Submit</button>
    </div>
  ),
}))

describe('ProjectsList', () => {
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
})
