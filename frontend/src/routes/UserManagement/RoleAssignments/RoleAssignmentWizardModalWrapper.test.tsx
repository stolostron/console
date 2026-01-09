/* Copyright Contributors to the Open Cluster Management project */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RecoilRoot } from 'recoil'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RoleAssignmentWizardModalWrapper } from './RoleAssignmentWizardModalWrapper'
import { AcmToastContext } from '../../../ui-components'
import { UserKind } from '../../../resources'
import { addRoleAssignment, findRoleAssignments } from '../../../resources/clients/multicluster-role-assignment-client'

jest.mock('../../../resources/clients/multicluster-role-assignment-client', () => ({
  addRoleAssignment: jest.fn(),
  findRoleAssignments: jest.fn(() => []),
  getPlacementsForRoleAssignment: jest.fn(() => []),
}))

const mockFindRoleAssignments = findRoleAssignments as jest.MockedFunction<typeof findRoleAssignments>

let capturedOnSubmit: any = null

jest.mock('../../../wizards/RoleAssignment/RoleAssignmentWizardModal', () => ({
  RoleAssignmentWizardModal: ({ onSubmit, onClose }: any) => {
    capturedOnSubmit = onSubmit

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
      </div>
    )
  },
}))

jest.mock('../../../wizards/RoleAssignment/roleAssignmentWizardHelper', () => ({
  wizardDataToRoleAssignmentToSave: jest.fn((data, _allClusterNames) => {
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
    mockUseRecoilValue.mockReturnValue([])
    mockUseSharedAtoms.mockReturnValue({
      multiclusterRoleAssignmentState: {},
      managedClusterSetBindingsState: {},
    })
  })

  describe('Wizard success and failure', () => {
    it('should display success message when role assignment is created successfully', async () => {
      mockAddRoleAssignment.mockResolvedValue({
        promise: Promise.resolve({}),
        abort: jest.fn(),
      } as never)

      render(
        <TestWrapper>
          <RoleAssignmentWizardModalWrapper close={mockClose} isOpen={true} />
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
      expect(mockClose).toHaveBeenCalled()
    })

    it('should display duplicate error message when duplicate role assignment is detected', async () => {
      const duplicateError = new Error('Duplicate role assignment detected for user test-user')
      mockAddRoleAssignment.mockRejectedValue(duplicateError)

      render(
        <TestWrapper>
          <RoleAssignmentWizardModalWrapper close={mockClose} isOpen={true} />
        </TestWrapper>
      )

      const submitButton = screen.getByText('Submit Wizard')
      userEvent.click(submitButton)

      await waitFor(() => expect(mockToastContext.addAlert).toHaveBeenCalled())

      expect(mockToastContext.addAlert).toHaveBeenCalledWith({
        title: 'Role assignment creation failed',
        message: 'This role assignment already exists. Please modify the selection to create a unique assignment.',
        type: 'danger',
        autoClose: true,
      })
      expect(mockClose).toHaveBeenCalled()
    })

    it('should display generic error message for non-duplicate errors', async () => {
      const genericError = new Error('Network connection failed')
      mockAddRoleAssignment.mockRejectedValue(genericError)

      render(
        <TestWrapper>
          <RoleAssignmentWizardModalWrapper close={mockClose} isOpen={true} />
        </TestWrapper>
      )

      const submitButton = screen.getByText('Submit Wizard')
      userEvent.click(submitButton)

      await waitFor(() => expect(mockToastContext.addAlert).toHaveBeenCalled())

      expect(mockToastContext.addAlert).toHaveBeenCalledWith({
        title: 'Role assignment creation failed',
        message: 'The role assignment creation for admin role failed. Error: Error: Network connection failed',
        type: 'danger',
        autoClose: true,
      })
      expect(mockClose).toHaveBeenCalled()
    })
  })

  describe('Wizard Behavior', () => {
    it('should call close when cancel is clicked', () => {
      render(
        <TestWrapper>
          <RoleAssignmentWizardModalWrapper close={mockClose} isOpen={true} />
        </TestWrapper>
      )

      const cancelButton = screen.getByText('Cancel')
      userEvent.click(cancelButton)

      expect(mockClose).toHaveBeenCalled()
    })

    it('should render the wizard modal', () => {
      render(
        <TestWrapper>
          <RoleAssignmentWizardModalWrapper close={mockClose} isOpen={true} />
        </TestWrapper>
      )

      expect(screen.getByText('Submit Wizard')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })
  })

  describe('Multi-Subject Role Assignments', () => {
    it('should create separate role assignments for multiple users', async () => {
      mockAddRoleAssignment.mockResolvedValue({
        promise: Promise.resolve({}) as any,
        abort: jest.fn(),
      })

      render(
        <TestWrapper>
          <RoleAssignmentWizardModalWrapper close={mockClose} isOpen={true} />
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
      mockAddRoleAssignment.mockResolvedValue({
        promise: Promise.resolve({}) as any,
        abort: jest.fn(),
      })

      render(
        <TestWrapper>
          <RoleAssignmentWizardModalWrapper close={mockClose} isOpen={true} />
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

      mockAddRoleAssignment.mockResolvedValue({
        promise: Promise.resolve({}) as any,
        abort: jest.fn(),
      })

      render(
        <TestWrapper>
          <RoleAssignmentWizardModalWrapper close={mockClose} isOpen={true} />
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
        expect(mockAddRoleAssignment.mock.calls[0][1].existingMulticlusterRoleAssignment).toBe(existingAssignment)
      })
    })

    it('should handle empty existingRoleAssignments', async () => {
      mockFindRoleAssignments.mockReturnValue([])

      mockAddRoleAssignment.mockResolvedValue({
        promise: Promise.resolve({}) as any,
        abort: jest.fn(),
      })

      render(
        <TestWrapper>
          <RoleAssignmentWizardModalWrapper close={mockClose} isOpen={true} />
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
        expect(mockAddRoleAssignment.mock.calls[0][1].existingMulticlusterRoleAssignment).toBeUndefined()
      })
    })
  })

  describe('Group Subjects', () => {
    it('should handle group subjects', async () => {
      mockAddRoleAssignment.mockResolvedValue({
        promise: Promise.resolve({}) as any,
        abort: jest.fn(),
      })

      render(
        <TestWrapper>
          <RoleAssignmentWizardModalWrapper close={mockClose} isOpen={true} />
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
})
