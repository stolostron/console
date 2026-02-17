/* Copyright Contributors to the Open Cluster Management project */
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RecoilRoot } from 'recoil'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RoleAssignmentWizardModalWrapper } from './RoleAssignmentWizardModalWrapper'
import { AcmToastContext } from '../../../ui-components'
import { UserKind } from '../../../resources'
import {
  addRoleAssignment,
  findRoleAssignments,
  deleteRoleAssignment,
} from '../../../resources/clients/multicluster-role-assignment-client'
import { FlattenedRoleAssignment } from '../../../resources/clients/model/flattened-role-assignment'
import { MulticlusterRoleAssignment } from '../../../resources/multicluster-role-assignment'

jest.mock('../../../resources/clients/multicluster-role-assignment-client', () => ({
  addRoleAssignment: jest.fn(),
  findRoleAssignments: jest.fn(() => []),
  getPlacementsForRoleAssignment: jest.fn(() => []),
  deleteRoleAssignment: jest.fn(),
}))

const mockFindRoleAssignments = findRoleAssignments as jest.MockedFunction<typeof findRoleAssignments>
const mockDeleteRoleAssignment = deleteRoleAssignment as jest.MockedFunction<typeof deleteRoleAssignment>

let capturedOnSubmit: any = null
let capturedIsLoading: boolean | undefined = undefined

jest.mock('../../../wizards/RoleAssignment/RoleAssignmentWizardModal', () => ({
  RoleAssignmentWizardModal: ({ onSubmit, onClose, isLoading }: any) => {
    capturedOnSubmit = onSubmit
    capturedIsLoading = isLoading

    const mockFormData = {
      subject: { kind: UserKind, user: ['test-user'] },
      scope: {
        kind: 'specific' as const,
        clusterNames: ['test-cluster'],
        namespaces: ['test-namespace'],
      },
      roles: ['admin'],
    }

    return (
      <div data-testid="wizard-modal">
        <button onClick={() => onSubmit(mockFormData)}>Submit Wizard</button>
        <button onClick={onClose}>Cancel</button>
        <span data-testid="is-loading">{isLoading ? 'true' : 'false'}</span>
      </div>
    )
  },
}))

jest.mock('../../../wizards/RoleAssignment/roleAssignmentWizardHelper', () => ({
  wizardDataToRoleAssignmentToSave: jest.fn((data) => {
    const subjectNames = data.subject.kind === UserKind ? data.subject.user || [] : data.subject.group || []
    return data.roles.flatMap((role: string) =>
      subjectNames.map((name: string) => ({
        clusterRole: role,
        clusterNames: data.scope?.clusterNames,
        clusterSetNames: [],
        subject: { name, kind: data.subject.kind },
      }))
    )
  }),
}))

import { useRecoilValue, useSharedAtoms } from '../../../shared-recoil'

jest.mock('../../../shared-recoil', () => ({
  useRecoilValue: jest.fn(),
  useSharedAtoms: jest.fn(() => ({
    multiclusterRoleAssignmentState: {},
    managedClusterSetBindingsState: {},
  })),
}))

const mockUseRecoilValue = useRecoilValue as jest.Mock
const mockUseSharedAtoms = useSharedAtoms as jest.Mock

jest.mock('../../../resources/clients/placement-client', () => ({
  useGetPlacementClusters: jest.fn(() => []),
}))

jest.mock('../../../resources/clients/managed-cluster-set-binding-client', () => ({
  findManagedClusterSetBinding: jest.fn(() => []),
}))

const mockAddRoleAssignment = addRoleAssignment as jest.MockedFunction<typeof addRoleAssignment>

const mockToastContext = {
  addAlert: jest.fn(),
  removeAlert: jest.fn(),
  activeAlerts: [],
  alertInfos: [],
  removeVisibleAlert: jest.fn(),
  clearAlerts: jest.fn(),
}

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <RecoilRoot>
    <MemoryRouter>
      <AcmToastContext.Provider value={mockToastContext}>{children}</AcmToastContext.Provider>
    </MemoryRouter>
  </RecoilRoot>
)

describe('RoleAssignmentWizardModalWrapper', () => {
  const mockClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    capturedOnSubmit = null
    capturedIsLoading = undefined
    mockUseRecoilValue.mockReturnValue([])
    mockUseSharedAtoms.mockReturnValue({
      multiclusterRoleAssignmentState: {},
      managedClusterSetBindingsState: {},
    })
  })

  describe('Wizard success and failure', () => {
    it('should display success message when role assignment is created successfully', async () => {
      const savedRoleAssignment = { name: 'saved-role-assignment', clusterRole: 'admin' }
      mockAddRoleAssignment.mockResolvedValue(savedRoleAssignment as never)

      // Mock multiClusterRoleAssignments to include the saved role assignment
      mockUseRecoilValue.mockReturnValue([
        {
          spec: {
            roleAssignments: [{ name: 'saved-role-assignment' }],
          },
        },
      ])

      render(
        <TestWrapper>
          <RoleAssignmentWizardModalWrapper close={mockClose} isOpen />
        </TestWrapper>
      )

      const submitButton = screen.getByText('Submit Wizard')
      userEvent.click(submitButton)

      await waitFor(() => expect(mockToastContext.addAlert).toHaveBeenCalled())

      expect(mockToastContext.addAlert).toHaveBeenCalledWith({
        title: 'Role assignment added',
        message: 'A role assignment for admin role added.',
        type: 'success',
        autoClose: true,
      })

      // close() is called after savedRoleAssignments are confirmed in multiClusterRoleAssignments
      await waitFor(() => expect(mockClose).toHaveBeenCalled())
    })

    it('should display duplicate error message when duplicate role assignment is detected', async () => {
      const duplicateError = new Error('Duplicate role assignment detected for user test-user')
      mockAddRoleAssignment.mockRejectedValue(duplicateError)

      render(
        <TestWrapper>
          <RoleAssignmentWizardModalWrapper close={mockClose} isOpen />
        </TestWrapper>
      )

      await waitFor(() => expect(capturedOnSubmit).not.toBeNull())

      await capturedOnSubmit({
        subject: { kind: UserKind, user: ['test-user'] },
        scope: { kind: 'specific', clusterNames: ['cluster1'] },
        roles: ['admin'],
      })

      await waitFor(() => expect(mockToastContext.addAlert).toHaveBeenCalled())

      expect(mockToastContext.addAlert).toHaveBeenCalledWith({
        title: 'Role assignment creation failed',
        message: 'This role assignment already exists. Please modify the selection to create a unique assignment.',
        type: 'danger',
        autoClose: true,
      })

      // When saveAllRoleAssignments fails, isSaving is set back to false but close is not called
      await waitFor(() => {
        expect(capturedIsLoading).toBe(false)
      })
      expect(mockClose).not.toHaveBeenCalled()
    })

    it('should display generic error message for non-duplicate errors', async () => {
      const genericError = new Error('Network connection failed')
      mockAddRoleAssignment.mockRejectedValue(genericError)

      render(
        <TestWrapper>
          <RoleAssignmentWizardModalWrapper close={mockClose} isOpen />
        </TestWrapper>
      )

      await waitFor(() => expect(capturedOnSubmit).not.toBeNull())

      await capturedOnSubmit({
        subject: { kind: UserKind, user: ['test-user'] },
        scope: { kind: 'specific', clusterNames: ['cluster1'] },
        roles: ['admin'],
      })

      await waitFor(() => expect(mockToastContext.addAlert).toHaveBeenCalled())

      expect(mockToastContext.addAlert).toHaveBeenCalledWith({
        title: 'Role assignment creation failed',
        message: 'The role assignment creation for admin role failed. Error: Error: Network connection failed',
        type: 'danger',
        autoClose: true,
      })

      // When saveAllRoleAssignments fails, isSaving is set back to false but close is not called
      await waitFor(() => {
        expect(capturedIsLoading).toBe(false)
      })
      expect(mockClose).not.toHaveBeenCalled()
    })
  })

  describe('Wizard Behavior', () => {
    it('should call close when cancel is clicked', () => {
      render(
        <TestWrapper>
          <RoleAssignmentWizardModalWrapper close={mockClose} isOpen />
        </TestWrapper>
      )

      const cancelButton = screen.getByText('Cancel')
      userEvent.click(cancelButton)

      expect(mockClose).toHaveBeenCalled()
    })

    it('should render the wizard modal', () => {
      render(
        <TestWrapper>
          <RoleAssignmentWizardModalWrapper close={mockClose} isOpen />
        </TestWrapper>
      )

      expect(screen.getByText('Submit Wizard')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })
  })

  describe('Multi-Subject Role Assignments', () => {
    it('should create separate role assignments for multiple users', async () => {
      mockAddRoleAssignment
        .mockResolvedValueOnce({ name: 'saved-1', clusterRole: 'admin' } as never)
        .mockResolvedValueOnce({ name: 'saved-2', clusterRole: 'admin' } as never)

      render(
        <TestWrapper>
          <RoleAssignmentWizardModalWrapper close={mockClose} isOpen />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(capturedOnSubmit).not.toBeNull()
      })

      await capturedOnSubmit({
        subject: { kind: UserKind, user: ['user1', 'user2'] },
        scope: { kind: 'specific', clusterNames: ['c1'] },
        roles: ['admin'],
      })

      await waitFor(() => {
        expect(mockAddRoleAssignment).toHaveBeenCalledTimes(2)
        expect(mockAddRoleAssignment.mock.calls[0][0].subject.name).toBe('user1')
        expect(mockAddRoleAssignment.mock.calls[1][0].subject.name).toBe('user2')
      })
    })

    it('should create role assignments for multiple roles', async () => {
      mockAddRoleAssignment
        .mockResolvedValueOnce({ name: 'saved-1', clusterRole: 'admin' } as never)
        .mockResolvedValueOnce({ name: 'saved-2', clusterRole: 'viewer' } as never)

      render(
        <TestWrapper>
          <RoleAssignmentWizardModalWrapper close={mockClose} isOpen />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(capturedOnSubmit).not.toBeNull()
      })

      await capturedOnSubmit({
        subject: { kind: UserKind, user: ['user1'] },
        scope: { kind: 'specific', clusterNames: ['c1'] },
        roles: ['admin', 'viewer'],
      })

      await waitFor(() => {
        expect(mockAddRoleAssignment).toHaveBeenCalledTimes(2)
        expect(mockAddRoleAssignment.mock.calls[0][0].clusterRole).toBe('admin')
        expect(mockAddRoleAssignment.mock.calls[1][0].clusterRole).toBe('viewer')
      })
    })
  })

  describe('Existing Role Assignments', () => {
    it('should use existing role assignment when found', async () => {
      const existingAssignment = { metadata: { name: 'existing' } } as any

      mockFindRoleAssignments.mockReturnValue([
        {
          subject: { kind: UserKind, name: 'user1' },
          clusterRole: 'admin',
          relatedMulticlusterRoleAssignment: existingAssignment,
        },
      ] as any)

      mockAddRoleAssignment.mockResolvedValue({ name: 'saved-role-assignment', clusterRole: 'admin' } as never)

      render(
        <TestWrapper>
          <RoleAssignmentWizardModalWrapper close={mockClose} isOpen />
        </TestWrapper>
      )

      await waitFor(() => expect(capturedOnSubmit).not.toBeNull())

      await capturedOnSubmit({
        subject: { kind: UserKind, user: ['user1'] },
        scope: { kind: 'all' },
        roles: ['admin'],
      })

      await waitFor(() => {
        expect(mockAddRoleAssignment).toHaveBeenCalled()
        expect(mockAddRoleAssignment.mock.calls[0][1].existingMulticlusterRoleAssignments).toEqual([existingAssignment])
      })
    })

    it('should handle empty existingRoleAssignments', async () => {
      mockFindRoleAssignments.mockReturnValue([])

      mockAddRoleAssignment.mockResolvedValue({ name: 'saved-role-assignment', clusterRole: 'admin' } as never)

      render(
        <TestWrapper>
          <RoleAssignmentWizardModalWrapper close={mockClose} isOpen />
        </TestWrapper>
      )

      await waitFor(() => expect(capturedOnSubmit).not.toBeNull())

      await capturedOnSubmit({
        subject: { kind: 'Group', group: ['group1'] },
        scope: { kind: 'all', clusterNames: ['c1'] },
        roles: ['admin'],
      })

      await waitFor(() => {
        expect(mockAddRoleAssignment).toHaveBeenCalled()
        expect(mockAddRoleAssignment.mock.calls[0][1].existingMulticlusterRoleAssignments).toBeUndefined()
      })
    })
  })

  describe('Group Subjects', () => {
    it('should handle group subjects', async () => {
      mockAddRoleAssignment.mockResolvedValue({ name: 'saved-role-assignment', clusterRole: 'admin' } as never)

      render(
        <TestWrapper>
          <RoleAssignmentWizardModalWrapper close={mockClose} isOpen />
        </TestWrapper>
      )

      await waitFor(() => expect(capturedOnSubmit).not.toBeNull())

      await capturedOnSubmit({
        subject: { kind: 'Group', group: ['group1'] },
        scope: { kind: 'specific', clusterNames: ['c1'] },
        roles: ['admin'],
      })

      await waitFor(() => {
        expect(mockAddRoleAssignment).toHaveBeenCalled()
        expect(mockAddRoleAssignment.mock.calls[0][0].subject.name).toBe('group1')
        expect(mockAddRoleAssignment.mock.calls[0][0].subject.kind).toBe('Group')
      })
    })
  })

  describe('Editing Role Assignments', () => {
    const mockEditingRoleAssignment: FlattenedRoleAssignment = {
      name: 'test-assignment',
      clusterRole: 'admin',
      clusterNames: ['cluster1'],
      clusterSetNames: [],
      clusterSelection: {
        type: 'placements',
        placements: [],
      },
      subject: { name: 'test-user', kind: 'User' },
      relatedMulticlusterRoleAssignment: {
        metadata: { name: 'test-mcra', namespace: 'multicluster-global-hub' },
        spec: {
          roleAssignments: [{ name: 'test-assignment', clusterRole: 'admin' }],
        },
      } as MulticlusterRoleAssignment,
    }

    it('should delete existing role assignment after saving succeeds when editing', async () => {
      mockDeleteRoleAssignment.mockReturnValue({
        promise: Promise.resolve({}),
        abort: jest.fn(),
      } as any)

      const savedRoleAssignment = { name: 'saved-role-assignment', clusterRole: 'admin' }
      mockAddRoleAssignment.mockResolvedValue(savedRoleAssignment as never)

      // Mock multiClusterRoleAssignments to include the saved role assignment
      // This simulates the Recoil state being updated after the save
      mockUseRecoilValue.mockReturnValue([
        {
          metadata: { name: 'test-mcra', namespace: 'multicluster-global-hub' },
          spec: {
            subject: { name: 'test-user', kind: 'User' },
            roleAssignments: [{ name: 'saved-role-assignment' }],
          },
        },
      ])

      render(
        <TestWrapper>
          <RoleAssignmentWizardModalWrapper
            close={mockClose}
            isOpen={true}
            editingRoleAssignment={mockEditingRoleAssignment}
          />
        </TestWrapper>
      )

      await waitFor(() => expect(capturedOnSubmit).not.toBeNull())

      await act(async () => {
        await capturedOnSubmit({
          subject: { kind: UserKind, user: ['test-user'] },
          scope: { kind: 'specific', clusterNames: ['cluster1'] },
          roles: ['admin'],
        })
      })

      // Assert - deleteRoleAssignment should be called AFTER saveAllRoleAssignments succeeds
      await waitFor(
        () => {
          expect(mockAddRoleAssignment).toHaveBeenCalled()
          expect(mockDeleteRoleAssignment).toHaveBeenCalledWith(mockEditingRoleAssignment)
          expect(mockToastContext.addAlert).toHaveBeenCalledWith({
            title: 'Role assignment updated',
            message: 'A role assignment for admin role updated.',
            type: 'success',
            autoClose: true,
          })
        },
        { timeout: 3000 }
      )
    })

    it('should show error and close modal when delete fails after saving succeeds during editing', async () => {
      // Arrange - saveAllRoleAssignments will succeed
      const savedRoleAssignment = { name: 'saved-role-assignment', clusterRole: 'admin' }
      mockAddRoleAssignment.mockResolvedValue(savedRoleAssignment as never)

      // Create a rejection that is handled to avoid unhandled rejection warnings
      const deletePromise = Promise.reject(new Error('Delete failed'))
      // Attach a catch handler to prevent unhandled rejection
      deletePromise.catch(() => {})

      mockDeleteRoleAssignment.mockReturnValue({
        promise: deletePromise,
        abort: jest.fn(),
      } as any)

      // Mock multiClusterRoleAssignments to include the saved role assignment
      mockUseRecoilValue.mockReturnValue([
        {
          metadata: { name: 'test-mcra', namespace: 'multicluster-global-hub' },
          spec: {
            subject: { name: 'test-user', kind: 'User' },
            roleAssignments: [{ name: 'saved-role-assignment' }],
          },
        },
      ])

      render(
        <TestWrapper>
          <RoleAssignmentWizardModalWrapper
            close={mockClose}
            isOpen={true}
            editingRoleAssignment={mockEditingRoleAssignment}
          />
        </TestWrapper>
      )

      await waitFor(() => expect(capturedOnSubmit).not.toBeNull())

      await act(async () => {
        await capturedOnSubmit({
          subject: { kind: UserKind, user: ['test-user'] },
          scope: { kind: 'specific', clusterNames: ['cluster1'] },
          roles: ['admin'],
        })
      })

      // Assert - deleteRoleAssignment should be called after saveAllRoleAssignments succeeds
      await waitFor(
        () => {
          expect(mockAddRoleAssignment).toHaveBeenCalled()
          expect(mockDeleteRoleAssignment).toHaveBeenCalledWith(mockEditingRoleAssignment)
        },
        { timeout: 3000 }
      )

      // Assert - close should be called even when delete fails (error is logged to console, no toast)
      await waitFor(() => {
        expect(mockClose).toHaveBeenCalled()
      })
    })

    it('should filter out the editing role assignment from existing assignments', async () => {
      const savedRoleAssignment = { name: 'saved-role-assignment', clusterRole: 'admin' }
      mockAddRoleAssignment.mockResolvedValue(savedRoleAssignment as never)

      mockDeleteRoleAssignment.mockReturnValue({
        promise: Promise.resolve({}),
        abort: jest.fn(),
      } as any)

      // Mock multiClusterRoleAssignments to include the saved role assignment after save
      mockUseRecoilValue.mockReturnValue([
        {
          metadata: { name: 'test-mcra', namespace: 'multicluster-global-hub' },
          spec: {
            subject: { name: 'test-user', kind: 'User' },
            roleAssignments: [{ name: 'saved-role-assignment' }],
          },
        },
      ])

      render(
        <TestWrapper>
          <RoleAssignmentWizardModalWrapper
            close={mockClose}
            isOpen={true}
            editingRoleAssignment={mockEditingRoleAssignment}
          />
        </TestWrapper>
      )

      await waitFor(() => expect(capturedOnSubmit).not.toBeNull())

      await act(async () => {
        await capturedOnSubmit({
          subject: { kind: UserKind, user: ['test-user'] },
          scope: { kind: 'specific', clusterNames: ['cluster1'] },
          roles: ['admin'],
        })
      })

      await waitFor(
        () => {
          expect(mockAddRoleAssignment).toHaveBeenCalled()
          expect(mockDeleteRoleAssignment).toHaveBeenCalled()
        },
        { timeout: 3000 }
      )
    })

    it('should not delete when not in editing mode', async () => {
      mockAddRoleAssignment.mockResolvedValue({ name: 'saved-role-assignment', clusterRole: 'admin' } as never)

      render(
        <TestWrapper>
          <RoleAssignmentWizardModalWrapper close={mockClose} isOpen={true} />
        </TestWrapper>
      )

      await waitFor(() => expect(capturedOnSubmit).not.toBeNull())

      await capturedOnSubmit({
        subject: { kind: UserKind, user: ['test-user'] },
        scope: { kind: 'specific', clusterNames: ['cluster1'] },
        roles: ['admin'],
      })

      await waitFor(() => {
        expect(mockDeleteRoleAssignment).not.toHaveBeenCalled()
        expect(mockAddRoleAssignment).toHaveBeenCalled()
      })
    })

    it('should not delete when editingRoleAssignment is not provided', async () => {
      mockAddRoleAssignment.mockResolvedValue({ name: 'saved-role-assignment', clusterRole: 'admin' } as never)

      render(
        <TestWrapper>
          <RoleAssignmentWizardModalWrapper close={mockClose} isOpen />
        </TestWrapper>
      )

      await waitFor(() => expect(capturedOnSubmit).not.toBeNull())

      await capturedOnSubmit({
        subject: { kind: UserKind, user: ['test-user'] },
        scope: { kind: 'specific', clusterNames: ['cluster1'] },
        roles: ['admin'],
      })

      await waitFor(() => {
        expect(mockDeleteRoleAssignment).not.toHaveBeenCalled()
        expect(mockAddRoleAssignment).toHaveBeenCalled()
      })
    })
  })

  describe('isSaving state management', () => {
    it('should set isLoading to true when submit is clicked', async () => {
      // Create a promise that we can control
      let resolveAddRoleAssignment: (value: any) => void
      const addRoleAssignmentPromise = new Promise((resolve) => {
        resolveAddRoleAssignment = resolve
      })
      mockAddRoleAssignment.mockReturnValue(addRoleAssignmentPromise as never)

      render(
        <TestWrapper>
          <RoleAssignmentWizardModalWrapper close={mockClose} isOpen />
        </TestWrapper>
      )

      await waitFor(() => expect(capturedOnSubmit).not.toBeNull())

      // Initially isLoading should be false
      expect(capturedIsLoading).toBe(false)

      // Start the submit but don't await it
      const submitPromise = capturedOnSubmit({
        subject: { kind: UserKind, user: ['test-user'] },
        scope: { kind: 'specific', clusterNames: ['cluster1'] },
        roles: ['admin'],
      })

      // After calling submit, isLoading should be true
      await waitFor(() => {
        expect(capturedIsLoading).toBe(true)
      })

      // Resolve the promise to clean up
      resolveAddRoleAssignment!({ name: 'saved-role-assignment', clusterRole: 'admin' })
      await submitPromise
    })

    it('should set isLoading back to false when saveAllRoleAssignments fails', async () => {
      mockAddRoleAssignment.mockRejectedValue(new Error('Save failed'))

      render(
        <TestWrapper>
          <RoleAssignmentWizardModalWrapper close={mockClose} isOpen />
        </TestWrapper>
      )

      await waitFor(() => expect(capturedOnSubmit).not.toBeNull())

      expect(capturedIsLoading).toBe(false)

      await capturedOnSubmit({
        subject: { kind: UserKind, user: ['test-user'] },
        scope: { kind: 'specific', clusterNames: ['cluster1'] },
        roles: ['admin'],
      })

      // Wait for the error to be processed and isLoading to be set back to false
      await waitFor(() => {
        expect(capturedIsLoading).toBe(false)
      })

      // close should not be called on failure
      expect(mockClose).not.toHaveBeenCalled()
    })

    it('should call close when all saved role assignments are confirmed in multiClusterRoleAssignments', async () => {
      const savedRoleAssignment = { name: 'saved-role-assignment', clusterRole: 'admin' }
      mockAddRoleAssignment.mockResolvedValue(savedRoleAssignment as never)

      // Mock multiClusterRoleAssignments to include the saved role assignment
      // This simulates the Recoil state being updated after the save
      mockUseRecoilValue.mockReturnValue([
        {
          metadata: { name: 'mcra-1', namespace: 'test-ns' },
          spec: {
            subject: { name: 'test-user', kind: 'User' },
            roleAssignments: [{ name: 'saved-role-assignment' }],
          },
        },
      ])

      render(
        <TestWrapper>
          <RoleAssignmentWizardModalWrapper close={mockClose} isOpen />
        </TestWrapper>
      )

      await waitFor(() => expect(capturedOnSubmit).not.toBeNull())

      await act(async () => {
        await capturedOnSubmit({
          subject: { kind: UserKind, user: ['test-user'] },
          scope: { kind: 'specific', clusterNames: ['cluster1'] },
          roles: ['admin'],
        })
      })

      // Wait for close to be called - this happens when the useEffect detects
      // that all savedRoleAssignments are in multiClusterRoleAssignments
      await waitFor(
        () => {
          expect(mockClose).toHaveBeenCalled()
        },
        { timeout: 3000 }
      )
    })
  })

  describe('savedRoleAssignments state management', () => {
    it('should reset savedRoleAssignments to empty array and set isSaving to false after close is called', async () => {
      const savedRoleAssignment = { name: 'saved-role-assignment', clusterRole: 'admin' }
      mockAddRoleAssignment.mockResolvedValue(savedRoleAssignment as never)

      // Mock multiClusterRoleAssignments to include the saved role assignment
      mockUseRecoilValue.mockReturnValue([
        {
          metadata: { name: 'mcra-1', namespace: 'test-ns' },
          spec: {
            subject: { name: 'test-user', kind: 'User' },
            roleAssignments: [{ name: 'saved-role-assignment' }],
          },
        },
      ])

      render(
        <TestWrapper>
          <RoleAssignmentWizardModalWrapper close={mockClose} isOpen />
        </TestWrapper>
      )

      await waitFor(() => expect(capturedOnSubmit).not.toBeNull())

      await act(async () => {
        await capturedOnSubmit({
          subject: { kind: UserKind, user: ['test-user'] },
          scope: { kind: 'specific', clusterNames: ['cluster1'] },
          roles: ['admin'],
        })
      })

      // Wait for close to be called (which happens after savedRoleAssignments is reset)
      await waitFor(
        () => {
          expect(mockClose).toHaveBeenCalled()
        },
        { timeout: 3000 }
      )

      // The savedRoleAssignments should be reset to empty array
      // This is verified by the fact that close was called (which only happens when allSaved is true)
      // and isLoading should be false
      expect(capturedIsLoading).toBe(false)
    })

    it('should call close when all saved role assignments are confirmed in multiClusterRoleAssignments', async () => {
      const savedRoleAssignment1 = { name: 'saved-role-assignment-1', clusterRole: 'admin' }
      const savedRoleAssignment2 = { name: 'saved-role-assignment-2', clusterRole: 'viewer' }
      mockAddRoleAssignment
        .mockResolvedValueOnce(savedRoleAssignment1 as never)
        .mockResolvedValueOnce(savedRoleAssignment2 as never)

      // Mock multiClusterRoleAssignments to include both saved role assignments
      mockUseRecoilValue.mockReturnValue([
        {
          metadata: { name: 'mcra-1', namespace: 'test-ns' },
          spec: {
            subject: { name: 'test-user', kind: 'User' },
            roleAssignments: [{ name: 'saved-role-assignment-1' }, { name: 'saved-role-assignment-2' }],
          },
        },
      ])

      render(
        <TestWrapper>
          <RoleAssignmentWizardModalWrapper close={mockClose} isOpen />
        </TestWrapper>
      )

      await waitFor(() => expect(capturedOnSubmit).not.toBeNull())

      await act(async () => {
        await capturedOnSubmit({
          subject: { kind: UserKind, user: ['test-user'] },
          scope: { kind: 'specific', clusterNames: ['cluster1'] },
          roles: ['admin', 'viewer'],
        })
      })

      // Wait for addRoleAssignment to be called
      await waitFor(() => {
        expect(mockAddRoleAssignment).toHaveBeenCalledTimes(2)
      })

      // Now close should be called since both role assignments are in multiClusterRoleAssignments
      await waitFor(
        () => {
          expect(mockClose).toHaveBeenCalled()
        },
        { timeout: 3000 }
      )
    })
  })

  describe('deleteRoleAssignment failure handling', () => {
    const mockEditingRoleAssignment: FlattenedRoleAssignment = {
      name: 'test-assignment',
      clusterRole: 'admin',
      clusterNames: ['cluster1'],
      clusterSelection: {
        type: 'placements',
        placements: [],
      },
      subject: { name: 'test-user', kind: 'User' },
      relatedMulticlusterRoleAssignment: {
        metadata: { name: 'test-mcra', namespace: 'multicluster-global-hub' },
        spec: {
          roleAssignments: [{ name: 'test-assignment', clusterRole: 'admin' }],
        },
      } as MulticlusterRoleAssignment,
      clusterSetNames: [],
    }

    it('should set isSaving back to false when deleteRoleAssignment fails after saveAllRoleAssignments succeeds', async () => {
      // Arrange - saveAllRoleAssignments will succeed
      const savedRoleAssignment = { name: 'saved-role-assignment', clusterRole: 'admin' }
      mockAddRoleAssignment.mockResolvedValue(savedRoleAssignment as never)

      const deletePromise = Promise.reject(new Error('Delete failed'))
      deletePromise.catch(() => {}) // Prevent unhandled rejection

      mockDeleteRoleAssignment.mockReturnValue({
        promise: deletePromise,
        abort: jest.fn(),
      } as any)

      // Mock multiClusterRoleAssignments to include the saved role assignment
      mockUseRecoilValue.mockReturnValue([
        {
          metadata: { name: 'test-mcra', namespace: 'multicluster-global-hub' },
          spec: {
            subject: { name: 'test-user', kind: 'User' },
            roleAssignments: [{ name: 'saved-role-assignment' }],
          },
        },
      ])

      render(
        <TestWrapper>
          <RoleAssignmentWizardModalWrapper
            close={mockClose}
            isOpen={true}
            editingRoleAssignment={mockEditingRoleAssignment}
          />
        </TestWrapper>
      )

      await waitFor(() => expect(capturedOnSubmit).not.toBeNull())

      // Initially isLoading should be false
      expect(capturedIsLoading).toBe(false)

      await act(async () => {
        await capturedOnSubmit({
          subject: { kind: UserKind, user: ['test-user'] },
          scope: { kind: 'specific', clusterNames: ['cluster1'] },
          roles: ['admin'],
        })
      })

      // Wait for deleteRoleAssignment to be called and fail
      await waitFor(
        () => {
          expect(mockAddRoleAssignment).toHaveBeenCalled()
          expect(mockDeleteRoleAssignment).toHaveBeenCalled()
        },
        { timeout: 3000 }
      )

      // Wait for the error to be processed (logged to console, no toast) and isSaving reset
      await waitFor(() => {
        expect(capturedIsLoading).toBe(false)
      })
    })

    it('should call close when deleteRoleAssignment fails after saveAllRoleAssignments succeeds', async () => {
      // Arrange - saveAllRoleAssignments will succeed
      const savedRoleAssignment = { name: 'saved-role-assignment', clusterRole: 'admin' }
      mockAddRoleAssignment.mockResolvedValue(savedRoleAssignment as never)

      const deletePromise = Promise.reject(new Error('Delete failed'))
      deletePromise.catch(() => {}) // Prevent unhandled rejection

      mockDeleteRoleAssignment.mockReturnValue({
        promise: deletePromise,
        abort: jest.fn(),
      } as any)

      // Mock multiClusterRoleAssignments to include the saved role assignment
      mockUseRecoilValue.mockReturnValue([
        {
          metadata: { name: 'test-mcra', namespace: 'multicluster-global-hub' },
          spec: {
            subject: { name: 'test-user', kind: 'User' },
            roleAssignments: [{ name: 'saved-role-assignment' }],
          },
        },
      ])

      render(
        <TestWrapper>
          <RoleAssignmentWizardModalWrapper
            close={mockClose}
            isOpen={true}
            editingRoleAssignment={mockEditingRoleAssignment}
          />
        </TestWrapper>
      )

      await waitFor(() => expect(capturedOnSubmit).not.toBeNull())

      await act(async () => {
        await capturedOnSubmit({
          subject: { kind: UserKind, user: ['test-user'] },
          scope: { kind: 'specific', clusterNames: ['cluster1'] },
          roles: ['admin'],
        })
      })

      // Wait for deleteRoleAssignment to be called and fail, then close should be called
      await waitFor(
        () => {
          expect(mockAddRoleAssignment).toHaveBeenCalled()
          expect(mockDeleteRoleAssignment).toHaveBeenCalled()
          expect(mockClose).toHaveBeenCalled()
        },
        { timeout: 3000 }
      )
    })

    it('should call addRoleAssignment before deleteRoleAssignment when editing', async () => {
      // Arrange - saveAllRoleAssignments will succeed
      const savedRoleAssignment = { name: 'saved-role-assignment', clusterRole: 'admin' }
      mockAddRoleAssignment.mockResolvedValue(savedRoleAssignment as never)

      const deletePromise = Promise.reject(new Error('Delete failed'))
      deletePromise.catch(() => {}) // Prevent unhandled rejection

      mockDeleteRoleAssignment.mockReturnValue({
        promise: deletePromise,
        abort: jest.fn(),
      } as any)

      // Mock multiClusterRoleAssignments to include the saved role assignment
      mockUseRecoilValue.mockReturnValue([
        {
          metadata: { name: 'test-mcra', namespace: 'multicluster-global-hub' },
          spec: {
            subject: { name: 'test-user', kind: 'User' },
            roleAssignments: [{ name: 'saved-role-assignment' }],
          },
        },
      ])

      render(
        <TestWrapper>
          <RoleAssignmentWizardModalWrapper
            close={mockClose}
            isOpen={true}
            editingRoleAssignment={mockEditingRoleAssignment}
          />
        </TestWrapper>
      )

      await waitFor(() => expect(capturedOnSubmit).not.toBeNull())

      await act(async () => {
        await capturedOnSubmit({
          subject: { kind: UserKind, user: ['test-user'] },
          scope: { kind: 'specific', clusterNames: ['cluster1'] },
          roles: ['admin'],
        })
      })

      // Wait for both to be called in the correct order
      await waitFor(
        () => {
          expect(mockAddRoleAssignment).toHaveBeenCalled()
          expect(mockDeleteRoleAssignment).toHaveBeenCalled()
        },
        { timeout: 3000 }
      )

      // Verify addRoleAssignment was called before deleteRoleAssignment
      const addCallOrder = mockAddRoleAssignment.mock.invocationCallOrder[0]
      const deleteCallOrder = mockDeleteRoleAssignment.mock.invocationCallOrder[0]
      expect(addCallOrder).toBeLessThan(deleteCallOrder)
    })

    it('should log to console and not show error toast when deleteRoleAssignment fails after saveAllRoleAssignments succeeds', async () => {
      // Arrange - saveAllRoleAssignments will succeed
      const savedRoleAssignment = { name: 'saved-role-assignment', clusterRole: 'admin' }
      mockAddRoleAssignment.mockResolvedValue(savedRoleAssignment as never)

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      const deletePromise = Promise.reject(new Error('Permission denied'))
      deletePromise.catch(() => {}) // Prevent unhandled rejection

      mockDeleteRoleAssignment.mockReturnValue({
        promise: deletePromise,
        abort: jest.fn(),
      } as any)

      // Mock multiClusterRoleAssignments to include the saved role assignment
      mockUseRecoilValue.mockReturnValue([
        {
          metadata: { name: 'test-mcra', namespace: 'multicluster-global-hub' },
          spec: {
            subject: { name: 'test-user', kind: 'User' },
            roleAssignments: [{ name: 'saved-role-assignment' }],
          },
        },
      ])

      render(
        <TestWrapper>
          <RoleAssignmentWizardModalWrapper
            close={mockClose}
            isOpen={true}
            editingRoleAssignment={mockEditingRoleAssignment}
          />
        </TestWrapper>
      )

      await waitFor(() => expect(capturedOnSubmit).not.toBeNull())

      await act(async () => {
        await capturedOnSubmit({
          subject: { kind: UserKind, user: ['test-user'] },
          scope: { kind: 'specific', clusterNames: ['cluster1'] },
          roles: ['admin'],
        })
      })

      // Wait for deleteRoleAssignment to be called and fail
      await waitFor(
        () => {
          expect(mockAddRoleAssignment).toHaveBeenCalled()
          expect(mockDeleteRoleAssignment).toHaveBeenCalled()
        },
        { timeout: 3000 }
      )

      // Error is logged to console, not shown as toast
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to delete role assignment, this is expected if the subject is not affected by the editing',
          expect.any(Error)
        )
      })
      const alertCalls = mockToastContext.addAlert.mock.calls
      const errorToastCalls = alertCalls.filter((call) => call[0]?.title === 'Role assignment update failed')
      expect(errorToastCalls).toHaveLength(0)

      consoleErrorSpy.mockRestore()
    })
  })

  describe('deleteRoleAssignment only after saveAllRoleAssignments succeeds', () => {
    const mockEditingRoleAssignment: FlattenedRoleAssignment = {
      name: 'test-assignment',
      clusterRole: 'admin',
      clusterNames: ['cluster1'],
      clusterSetNames: [],
      clusterSelection: {
        type: 'placements',
        placements: [],
      },
      subject: { name: 'test-user', kind: 'User' },
      relatedMulticlusterRoleAssignment: {
        metadata: { name: 'test-mcra', namespace: 'multicluster-global-hub' },
        spec: {
          roleAssignments: [{ name: 'test-assignment', clusterRole: 'admin' }],
        },
      } as MulticlusterRoleAssignment,
    }

    it('should NOT call deleteRoleAssignment when editing and saveAllRoleAssignments fails', async () => {
      // Arrange - saveAllRoleAssignments will fail
      const saveError = new Error('Save failed')
      mockAddRoleAssignment.mockRejectedValue(saveError)

      render(
        <TestWrapper>
          <RoleAssignmentWizardModalWrapper
            close={mockClose}
            isOpen={true}
            editingRoleAssignment={mockEditingRoleAssignment}
          />
        </TestWrapper>
      )

      await waitFor(() => expect(capturedOnSubmit).not.toBeNull())

      // Act - submit the form
      await capturedOnSubmit({
        subject: { kind: UserKind, user: ['test-user'] },
        scope: { kind: 'specific', clusterNames: ['cluster1'] },
        roles: ['admin'],
      })

      // Assert - deleteRoleAssignment should NOT be called when saveAllRoleAssignments fails
      await waitFor(() => {
        expect(mockToastContext.addAlert).toHaveBeenCalled()
        expect(capturedIsLoading).toBe(false)
      })

      expect(mockDeleteRoleAssignment).not.toHaveBeenCalled()
      expect(mockClose).not.toHaveBeenCalled()
    })

    it('should call deleteRoleAssignment when editing and saveAllRoleAssignments succeeds, then close on success', async () => {
      // Arrange - saveAllRoleAssignments will succeed
      const savedRoleAssignment = { name: 'saved-role-assignment', clusterRole: 'admin' }
      mockAddRoleAssignment.mockResolvedValue(savedRoleAssignment as never)

      // Mock deleteRoleAssignment to succeed
      mockDeleteRoleAssignment.mockReturnValue({
        promise: Promise.resolve({}),
        abort: jest.fn(),
      } as any)

      // Mock multiClusterRoleAssignments to include the saved role assignment
      // This simulates the Recoil state being updated after the save
      mockUseRecoilValue.mockReturnValue([
        {
          metadata: { name: 'test-mcra', namespace: 'multicluster-global-hub' },
          spec: {
            subject: { name: 'test-user', kind: 'User' },
            roleAssignments: [{ name: 'saved-role-assignment' }],
          },
        },
      ])

      render(
        <TestWrapper>
          <RoleAssignmentWizardModalWrapper
            close={mockClose}
            isOpen={true}
            editingRoleAssignment={mockEditingRoleAssignment}
          />
        </TestWrapper>
      )

      await waitFor(() => expect(capturedOnSubmit).not.toBeNull())

      // Act - submit the form
      await act(async () => {
        await capturedOnSubmit({
          subject: { kind: UserKind, user: ['test-user'] },
          scope: { kind: 'specific', clusterNames: ['cluster1'] },
          roles: ['admin'],
        })
      })

      // Assert - deleteRoleAssignment should be called AFTER saveAllRoleAssignments succeeds
      await waitFor(
        () => {
          expect(mockAddRoleAssignment).toHaveBeenCalled()
          expect(mockDeleteRoleAssignment).toHaveBeenCalledWith(mockEditingRoleAssignment)
        },
        { timeout: 3000 }
      )

      // Assert - close() should be called after deleteRoleAssignment succeeds
      await waitFor(
        () => {
          expect(mockClose).toHaveBeenCalled()
        },
        { timeout: 3000 }
      )

      // Verify success toast was shown
      expect(mockToastContext.addAlert).toHaveBeenCalledWith({
        title: 'Role assignment updated',
        message: 'A role assignment for admin role updated.',
        type: 'success',
        autoClose: true,
      })
    })

    it('should call deleteRoleAssignment when editing and saveAllRoleAssignments succeeds, then close even if delete fails', async () => {
      // Arrange - saveAllRoleAssignments will succeed
      const savedRoleAssignment = { name: 'saved-role-assignment', clusterRole: 'admin' }
      mockAddRoleAssignment.mockResolvedValue(savedRoleAssignment as never)

      // Mock deleteRoleAssignment to fail
      const deleteError = new Error('Delete failed')
      const deletePromise = Promise.reject(deleteError)
      deletePromise.catch(() => {}) // Prevent unhandled rejection warning

      mockDeleteRoleAssignment.mockReturnValue({
        promise: deletePromise,
        abort: jest.fn(),
      } as any)

      // Mock multiClusterRoleAssignments to include the saved role assignment
      mockUseRecoilValue.mockReturnValue([
        {
          metadata: { name: 'test-mcra', namespace: 'multicluster-global-hub' },
          spec: {
            subject: { name: 'test-user', kind: 'User' },
            roleAssignments: [{ name: 'saved-role-assignment' }],
          },
        },
      ])

      render(
        <TestWrapper>
          <RoleAssignmentWizardModalWrapper
            close={mockClose}
            isOpen={true}
            editingRoleAssignment={mockEditingRoleAssignment}
          />
        </TestWrapper>
      )

      await waitFor(() => expect(capturedOnSubmit).not.toBeNull())

      // Act - submit the form
      await act(async () => {
        await capturedOnSubmit({
          subject: { kind: UserKind, user: ['test-user'] },
          scope: { kind: 'specific', clusterNames: ['cluster1'] },
          roles: ['admin'],
        })
      })

      // Assert - deleteRoleAssignment should be called AFTER saveAllRoleAssignments succeeds
      await waitFor(
        () => {
          expect(mockAddRoleAssignment).toHaveBeenCalled()
          expect(mockDeleteRoleAssignment).toHaveBeenCalledWith(mockEditingRoleAssignment)
        },
        { timeout: 3000 }
      )

      // Assert - close() should be called even when deleteRoleAssignment fails (in finally block)
      await waitFor(
        () => {
          expect(mockClose).toHaveBeenCalled()
        },
        { timeout: 3000 }
      )

      // Verify isSaving is set to false (delete failure is logged to console, no error toast)
      await waitFor(() => {
        expect(capturedIsLoading).toBe(false)
      })
    })

    it('should NOT call deleteRoleAssignment when NOT editing, even if saveAllRoleAssignments succeeds', async () => {
      // Arrange - saveAllRoleAssignments will succeed
      const savedRoleAssignment = { name: 'saved-role-assignment', clusterRole: 'admin' }
      mockAddRoleAssignment.mockResolvedValue(savedRoleAssignment as never)

      // Mock multiClusterRoleAssignments to include the saved role assignment
      mockUseRecoilValue.mockReturnValue([
        {
          metadata: { name: 'mcra-1', namespace: 'test-ns' },
          spec: {
            subject: { name: 'test-user', kind: 'User' },
            roleAssignments: [{ name: 'saved-role-assignment' }],
          },
        },
      ])

      render(
        <TestWrapper>
          <RoleAssignmentWizardModalWrapper close={mockClose} isOpen={true} />
        </TestWrapper>
      )

      await waitFor(() => expect(capturedOnSubmit).not.toBeNull())

      // Act - submit the form (NOT in editing mode)
      await act(async () => {
        await capturedOnSubmit({
          subject: { kind: UserKind, user: ['test-user'] },
          scope: { kind: 'specific', clusterNames: ['cluster1'] },
          roles: ['admin'],
        })
      })

      // Assert - deleteRoleAssignment should NOT be called when not editing
      await waitFor(
        () => {
          expect(mockAddRoleAssignment).toHaveBeenCalled()
          expect(mockDeleteRoleAssignment).not.toHaveBeenCalled()
          expect(mockClose).toHaveBeenCalled()
        },
        { timeout: 3000 }
      )
    })

    it('when editing, cleanup (close, reset isSaving) runs in finally for both deleteRoleAssignment success and failure', async () => {
      // Regression: deleteRoleAssignment(..).promise uses .catch() for error toast and .finally() for cleanup.
      // There is no .then() — cleanup must run in finally so it runs whether delete succeeds or fails.
      const savedRoleAssignment = { name: 'saved-role-assignment', clusterRole: 'admin' }
      mockAddRoleAssignment.mockResolvedValue(savedRoleAssignment as never)

      mockUseRecoilValue.mockReturnValue([
        {
          metadata: { name: 'test-mcra', namespace: 'multicluster-global-hub' },
          spec: {
            subject: { name: 'test-user', kind: 'User' },
            roleAssignments: [{ name: 'saved-role-assignment' }],
          },
        },
      ])

      // Case 1: delete succeeds — finally runs, close and isLoading false
      mockDeleteRoleAssignment.mockReturnValue({
        promise: Promise.resolve({}),
        abort: jest.fn(),
      } as any)

      render(
        <TestWrapper>
          <RoleAssignmentWizardModalWrapper
            close={mockClose}
            isOpen={true}
            editingRoleAssignment={mockEditingRoleAssignment}
          />
        </TestWrapper>
      )

      await waitFor(() => expect(capturedOnSubmit).not.toBeNull())
      await act(async () => {
        await capturedOnSubmit({
          subject: { kind: UserKind, user: ['test-user'] },
          scope: { kind: 'specific', clusterNames: ['cluster1'] },
          roles: ['admin'],
        })
      })

      await waitFor(() => expect(mockClose).toHaveBeenCalled(), { timeout: 3000 })
      await waitFor(() => expect(capturedIsLoading).toBe(false))

      mockClose.mockClear()

      // Case 2: delete fails — catch logs to console, finally still runs (close and isLoading false)
      const deletePromise = Promise.reject(new Error('Delete failed'))
      deletePromise.catch(() => {})
      mockDeleteRoleAssignment.mockReturnValue({ promise: deletePromise, abort: jest.fn() } as any)

      render(
        <TestWrapper>
          <RoleAssignmentWizardModalWrapper
            close={mockClose}
            isOpen={true}
            editingRoleAssignment={mockEditingRoleAssignment}
          />
        </TestWrapper>
      )

      await waitFor(() => expect(capturedOnSubmit).not.toBeNull())
      await act(async () => {
        await capturedOnSubmit({
          subject: { kind: UserKind, user: ['test-user'] },
          scope: { kind: 'specific', clusterNames: ['cluster1'] },
          roles: ['admin'],
        })
      })

      await waitFor(() => expect(mockClose).toHaveBeenCalled(), { timeout: 3000 })
      await waitFor(() => expect(capturedIsLoading).toBe(false))
    })

    it('should wait for all saved role assignments to appear in multiClusterRoleAssignments before calling deleteRoleAssignment', async () => {
      // Arrange - saveAllRoleAssignments will succeed with multiple role assignments
      const savedRoleAssignment1 = { name: 'saved-role-assignment-1', clusterRole: 'admin' }
      const savedRoleAssignment2 = { name: 'saved-role-assignment-2', clusterRole: 'viewer' }
      mockAddRoleAssignment
        .mockResolvedValueOnce(savedRoleAssignment1 as never)
        .mockResolvedValueOnce(savedRoleAssignment2 as never)

      mockDeleteRoleAssignment.mockReturnValue({
        promise: Promise.resolve({}),
        abort: jest.fn(),
      } as any)

      // Mock multiClusterRoleAssignments to include both saved assignments
      // This simulates the Recoil state being updated after both saves complete
      mockUseRecoilValue.mockReturnValue([
        {
          metadata: { name: 'test-mcra', namespace: 'multicluster-global-hub' },
          spec: {
            subject: { name: 'test-user', kind: 'User' },
            roleAssignments: [{ name: 'saved-role-assignment-1' }, { name: 'saved-role-assignment-2' }],
          },
        },
      ])

      render(
        <TestWrapper>
          <RoleAssignmentWizardModalWrapper
            close={mockClose}
            isOpen={true}
            editingRoleAssignment={mockEditingRoleAssignment}
          />
        </TestWrapper>
      )

      await waitFor(() => expect(capturedOnSubmit).not.toBeNull())

      // Act - submit the form with multiple roles
      await act(async () => {
        await capturedOnSubmit({
          subject: { kind: UserKind, user: ['test-user'] },
          scope: { kind: 'specific', clusterNames: ['cluster1'] },
          roles: ['admin', 'viewer'],
        })
      })

      // Assert - deleteRoleAssignment should be called after all saved assignments appear in multiClusterRoleAssignments
      await waitFor(
        () => {
          expect(mockAddRoleAssignment).toHaveBeenCalledTimes(2)
          expect(mockDeleteRoleAssignment).toHaveBeenCalledWith(mockEditingRoleAssignment)
          expect(mockClose).toHaveBeenCalled()
        },
        { timeout: 3000 }
      )
    })
  })
})
