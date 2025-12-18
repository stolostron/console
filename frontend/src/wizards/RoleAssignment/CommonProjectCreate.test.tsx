/* Copyright Contributors to the Open Cluster Management project */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CommonProjectCreate } from './CommonProjectCreate'
import * as projectResource from '../../resources/project'
import { AcmToastContext } from '../../ui-components'

// Mock the dependencies
jest.mock('../../resources/project')
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

const mockCreateProject = projectResource.createProject as jest.MockedFunction<typeof projectResource.createProject>

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

describe('CommonProjectCreate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateProject.mockReturnValue({
      promise: Promise.resolve({
        apiVersion: 'project.openshift.io/v1',
        kind: 'Project',
        metadata: { name: 'test-project' },
      }),
      abort: jest.fn(),
    })
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

  it('creates project correctly with properties structure', async () => {
    render(
      <TestWrapper>
        <CommonProjectCreate
          onCancelCallback={mockOnCancel}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
          selectedClusters={[]}
        />
      </TestWrapper>
    )

    const submitButton = screen.getByText('Submit')
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(mockCreateProject).toHaveBeenCalledWith(
        'test-project',
        undefined, // labels
        {
          displayName: 'Test Project',
          description: 'Test Description',
        }
      )
    })

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledTimes(1)
    })

    // Verify success toast was called
    await waitFor(() => {
      expect(mockAddAlert).toHaveBeenCalledWith({
        title: 'Common project created',
        message: 'test-project project has been successfully created.',
        type: 'success',
        autoClose: true,
      })
    })
  })

  it('shows success toast with project name from response', async () => {
    render(
      <TestWrapper>
        <CommonProjectCreate onCancelCallback={mockOnCancel} onSuccess={mockOnSuccess} selectedClusters={[]} />
      </TestWrapper>
    )

    const submitButton = screen.getByText('Submit')
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(mockAddAlert).toHaveBeenCalledWith({
        title: 'Common project created',
        message: 'test-project project has been successfully created.',
        type: 'success',
        autoClose: true,
      })
    })
  })

  it('calls createProject with correct properties structure', async () => {
    render(
      <TestWrapper>
        <CommonProjectCreate onCancelCallback={mockOnCancel} onSuccess={mockOnSuccess} selectedClusters={[]} />
      </TestWrapper>
    )

    const submitButton = screen.getByText('Submit')
    await userEvent.click(submitButton)

    // Verify createProject was called with the new properties structure
    await waitFor(() => {
      expect(mockCreateProject).toHaveBeenCalledWith('test-project', undefined, {
        displayName: 'Test Project',
        description: 'Test Description',
      })
    })
  })
})
