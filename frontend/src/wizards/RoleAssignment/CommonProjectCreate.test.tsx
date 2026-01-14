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
    jest.useFakeTimers()
    mockFireManagedClusterActionCreate.mockResolvedValue({
      actionDone: 'ActionDone',
      complete: 'Completed',
      message: 'Action completed successfully',
      result: { success: true },
    } as any)
  })

  afterEach(() => {
    jest.useRealTimers()
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

    // Advance timers to allow for the 5 second delay
    jest.advanceTimersByTime(5000)

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

    // Advance timers to allow for the 5 second delay
    jest.advanceTimersByTime(5000)

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

  it('shows info toast about reconciliation after successful creation', async () => {
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

    // Advance timers to allow for the 5 second delay
    jest.advanceTimersByTime(5000)

    await waitFor(() => {
      expect(mockAddAlert).toHaveBeenCalledWith({
        title: 'Waiting for the managed clusters to reconcile',
        message:
          'Please wait for a few seconds while the information is propagated to the managed clusters. Refresh the page if the already created project is not displayed.',
        type: 'info',
        autoClose: true,
      })
    })
  })

  it('calls onSuccess after 5 second delay when all clusters succeed', async () => {
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

    // Wait for promises to resolve
    await waitFor(() => {
      expect(mockFireManagedClusterActionCreate).toHaveBeenCalledTimes(2)
    })

    // Initially onSuccess should not be called (waiting for 5 second delay)
    expect(mockOnSuccess).not.toHaveBeenCalled()

    // Advance timers to allow for the 5 second delay
    await jest.advanceTimersByTimeAsync(5000)

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledTimes(1)
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

  it('handles empty selectedClusters array', async () => {
    render(
      <TestWrapper>
        <CommonProjectCreate onCancelCallback={mockOnCancel} onSuccess={mockOnSuccess} selectedClusters={[]} />
      </TestWrapper>
    )

    const submitButton = screen.getByText('Submit')
    await userEvent.click(submitButton)

    // Advance timers to allow for the 5 second delay
    jest.advanceTimersByTime(5000)

    await waitFor(() => {
      expect(mockFireManagedClusterActionCreate).not.toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledTimes(1)
    })
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
  })
})
