/* Copyright Contributors to the Open Cluster Management project */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectsList } from './ProjectsList'

jest.mock('../../components/RBACProjectsTable', () => ({
  RBACProjectsTable: ({ selectedClusters, onCreateClick, onSelectionChange }: any) => (
    <div id="rbac-projects-table">
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
    render(<ProjectsList />)
    await userEvent.click(screen.getByText('Create common project'))
    await waitFor(() => {
      expect(screen.getByTestId('common-project-create')).toBeInTheDocument()
    })
    await userEvent.click(screen.getByText('Cancel'))
    await waitFor(() => {
      expect(screen.queryByTestId('common-project-create')).not.toBeInTheDocument()
    })
    expect(screen.getByTestId('rbac-projects-table')).toBeInTheDocument()
  })

  it('returns to table view when project creation succeeds', async () => {
    render(<ProjectsList />)
    await userEvent.click(screen.getByText('Create common project'))
    expect(await screen.findByTestId('common-project-create')).toBeInTheDocument()
    await userEvent.click(screen.getByText('Submit'))
    await waitFor(() => {
      expect(screen.queryByTestId('common-project-create')).not.toBeInTheDocument()
    })
    expect(screen.getByTestId('rbac-projects-table')).toBeInTheDocument()
  })

  it('handles project selection changes', async () => {
    render(<ProjectsList />)
    expect(screen.getByTestId('rbac-projects-table')).toBeInTheDocument()
    const selectButton = screen.getByText('Select Project')
    await userEvent.click(selectButton)
    expect(screen.getByTestId('rbac-projects-table')).toBeInTheDocument()
  })
})
