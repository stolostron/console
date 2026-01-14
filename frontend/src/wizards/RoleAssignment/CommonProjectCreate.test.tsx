/* Copyright Contributors to the Open Cluster Management project */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as managedClusterAction from '../../resources/managedclusteraction'
import type { Cluster } from '../../routes/UserManagement/RoleAssignments/hook/RoleAssignmentDataHook'
import { AcmToastContext } from '../../ui-components'
import { CommonProjectCreate } from './CommonProjectCreate'

// Mock the dependencies
jest.mock('../../resources/managedclusteraction')
jest.mock('../../components/project', () => ({
  ProjectCreateForm: ({ onCancelCallback, onSubmit }: any) => (
    <div>
      <div>Mock ProjectCreateForm</div>
      <button onClick={onCancelCallback}>Cancel</button>
      <button
        onClick={() =>
          onSubmit({
            name: 'test-project',
            displayName: 'Test Project',
            description: 'Test Description',
          })
        }
      >
        Submit
      </button>
      <button
        onClick={() =>
          onSubmit({
            name: 'my-custom-project',
            displayName: 'My Custom Project',
            description: 'Custom Description',
          })
        }
      >
        Submit Custom
      </button>
    </div>
  ),
}))

const mockFireManagedClusterActionCreate = managedClusterAction.fireManagedClusterActionCreate as jest.MockedFunction<
  typeof managedClusterAction.fireManagedClusterActionCreate
>

const mockOnCancel = jest.fn()
const mockOnSuccess = jest.fn()
const mockOnError = jest.fn()
const mockAddAlert = jest.fn()

// Mock toast context
const mockToastContext = {
  addAlert: mockAddAlert,
  clearAlerts: jest.fn(),
  removeAlert: jest.fn(),
  alerts: [],
}

// Wrapper component to provide toast context
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <AcmToastContext.Provider value={mockToastContext as any}>{children}</AcmToastContext.Provider>
)

// Sample clusters for testing
const sampleClusters: Cluster[] = [
  { name: 'cluster-1', namespace: 'cluster-1' },
  { name: 'cluster-2', namespace: 'cluster-2' },
]

describe('CommonProjectCreate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFireManagedClusterActionCreate.mockResolvedValue({
      actionDone: 'ActionDone',
      complete: 'Completed',
      message: 'Action completed successfully',
      result: { success: true },
    } as any)
  })

  it('renders the component with title', () => {
    render(
      <TestWrapper>
        <CommonProjectCreate onCancelCallback={mockOnCancel} selectedClusters={[]} />
      </TestWrapper>
    )

    expect(screen.getByText('Create common project')).toBeInTheDocument()
    expect(screen.getByText('Mock ProjectCreateForm')).toBeInTheDocument()
  })

  it('calls onCancelCallback when cancel is clicked', async () => {
    render(
      <TestWrapper>
        <CommonProjectCreate onCancelCallback={mockOnCancel} selectedClusters={[]} />
      </TestWrapper>
    )

    const cancelButton = screen.getByText('Cancel')
    await userEvent.click(cancelButton)

    expect(mockOnCancel).toHaveBeenCalledTimes(1)
  })

  it('calls fireManagedClusterActionCreate for each selected cluster on submit', async () => {
    render(
      <TestWrapper>
        <CommonProjectCreate
          onCancelCallback={mockOnCancel}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
          selectedClusters={sampleClusters}
        />
      </TestWrapper>
    )

    const submitButton = screen.getByText('Submit')
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(mockFireManagedClusterActionCreate).toHaveBeenCalledTimes(2)
    })

    // Verify it was called with correct parameters for cluster-1
    expect(mockFireManagedClusterActionCreate).toHaveBeenCalledWith('cluster-1', {
      apiVersion: 'project.openshift.io/v1',
      kind: 'ProjectRequest',
      metadata: { name: 'test-project' },
      displayName: 'Test Project',
      description: 'Test Description',
    })

    // Verify it was called with correct parameters for cluster-2
    expect(mockFireManagedClusterActionCreate).toHaveBeenCalledWith('cluster-2', {
      apiVersion: 'project.openshift.io/v1',
      kind: 'ProjectRequest',
      metadata: { name: 'test-project' },
      displayName: 'Test Project',
      description: 'Test Description',
    })
  })

  it('shows success toast for each cluster when project is created', async () => {
    render(
      <TestWrapper>
        <CommonProjectCreate
          onCancelCallback={mockOnCancel}
          onSuccess={mockOnSuccess}
          selectedClusters={sampleClusters}
        />
      </TestWrapper>
    )

    const submitButton = screen.getByText('Submit')
    await userEvent.click(submitButton)

    await waitFor(() => {
      // Success toast for cluster-1
      expect(mockAddAlert).toHaveBeenCalledWith({
        title: 'Common project created',
        message: 'test-project project has been successfully created for the cluster cluster-1.',
        type: 'success',
        autoClose: true,
      })
    })

    await waitFor(() => {
      // Success toast for cluster-2
      expect(mockAddAlert).toHaveBeenCalledWith({
        title: 'Common project created',
        message: 'test-project project has been successfully created for the cluster cluster-2.',
        type: 'success',
        autoClose: true,
      })
    })
  })

  describe('onSuccess callback with project name', () => {
    it('calls onSuccess with the created project name when all clusters succeed', async () => {
      render(
        <TestWrapper>
          <CommonProjectCreate
            onCancelCallback={mockOnCancel}
            onSuccess={mockOnSuccess}
            selectedClusters={sampleClusters}
          />
        </TestWrapper>
      )

      const submitButton = screen.getByText('Submit')
      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledTimes(1)
        expect(mockOnSuccess).toHaveBeenCalledWith('test-project')
      })
    })

    it('calls onSuccess with a custom project name', async () => {
      render(
        <TestWrapper>
          <CommonProjectCreate
            onCancelCallback={mockOnCancel}
            onSuccess={mockOnSuccess}
            selectedClusters={sampleClusters}
          />
        </TestWrapper>
      )

      const submitButton = screen.getByText('Submit Custom')
      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledTimes(1)
        expect(mockOnSuccess).toHaveBeenCalledWith('my-custom-project')
      })
    })

    it('calls onSuccess with project name for empty selectedClusters array', async () => {
      render(
        <TestWrapper>
          <CommonProjectCreate onCancelCallback={mockOnCancel} onSuccess={mockOnSuccess} selectedClusters={[]} />
        </TestWrapper>
      )

      const submitButton = screen.getByText('Submit')
      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(mockFireManagedClusterActionCreate).not.toHaveBeenCalled()
        expect(mockOnSuccess).toHaveBeenCalledTimes(1)
        expect(mockOnSuccess).toHaveBeenCalledWith('test-project')
      })
    })
  })

  it('shows error toast when action response is not ActionDone', async () => {
    mockFireManagedClusterActionCreate.mockResolvedValue({
      actionDone: 'ActionFailed',
      complete: 'Completed',
      message: 'Resource already exists',
      result: {},
    } as any)

    render(
      <TestWrapper>
        <CommonProjectCreate
          onCancelCallback={mockOnCancel}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
          selectedClusters={[{ name: 'cluster-1', namespace: 'cluster-1' }]}
        />
      </TestWrapper>
    )

    const submitButton = screen.getByText('Submit')
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(mockAddAlert).toHaveBeenCalledWith({
        title: 'Failed to create common project',
        message:
          'Failed to create common project test-project for the cluster cluster-1. Error: Resource already exists.',
        type: 'danger',
        autoClose: true,
      })
    })

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalled()
    })
  })

  it('shows error toast when fireManagedClusterActionCreate throws', async () => {
    mockFireManagedClusterActionCreate.mockRejectedValue(new Error('Network error'))

    render(
      <TestWrapper>
        <CommonProjectCreate
          onCancelCallback={mockOnCancel}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
          selectedClusters={[{ name: 'cluster-1', namespace: 'cluster-1' }]}
        />
      </TestWrapper>
    )

    const submitButton = screen.getByText('Submit')
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(mockAddAlert).toHaveBeenCalledWith({
        title: 'Failed to create common project',
        message: 'Failed to create common project test-project for the cluster cluster-1. Error: Network error.',
        type: 'danger',
        autoClose: true,
      })
    })

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalled()
    })
  })

  it('does not call onSuccess when creation fails', async () => {
    mockFireManagedClusterActionCreate.mockRejectedValue(new Error('Network error'))

    render(
      <TestWrapper>
        <CommonProjectCreate
          onCancelCallback={mockOnCancel}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
          selectedClusters={[{ name: 'cluster-1', namespace: 'cluster-1' }]}
        />
      </TestWrapper>
    )

    const submitButton = screen.getByText('Submit')
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalled()
    })

    expect(mockOnSuccess).not.toHaveBeenCalled()
  })

  it('handles partial failure - one cluster succeeds, one fails', async () => {
    mockFireManagedClusterActionCreate
      .mockResolvedValueOnce({
        actionDone: 'ActionDone',
        complete: 'Completed',
        message: 'Action completed successfully',
        result: { success: true },
      } as any)
      .mockRejectedValueOnce(new Error('Cluster unreachable'))

    render(
      <TestWrapper>
        <CommonProjectCreate
          onCancelCallback={mockOnCancel}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
          selectedClusters={sampleClusters}
        />
      </TestWrapper>
    )

    const submitButton = screen.getByText('Submit')
    await userEvent.click(submitButton)

    await waitFor(() => {
      // Success toast for cluster-1
      expect(mockAddAlert).toHaveBeenCalledWith({
        title: 'Common project created',
        message: 'test-project project has been successfully created for the cluster cluster-1.',
        type: 'success',
        autoClose: true,
      })
    })

    await waitFor(() => {
      // Error toast for cluster-2
      expect(mockAddAlert).toHaveBeenCalledWith({
        title: 'Failed to create common project',
        message: 'Failed to create common project test-project for the cluster cluster-2. Error: Cluster unreachable.',
        type: 'danger',
        autoClose: true,
      })
    })

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalled()
    })

    // onSuccess should not be called when there's a partial failure
    expect(mockOnSuccess).not.toHaveBeenCalled()
  })
})
