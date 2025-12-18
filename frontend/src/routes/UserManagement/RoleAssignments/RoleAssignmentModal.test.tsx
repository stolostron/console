/* Copyright Contributors to the Open Cluster Management project */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RecoilRoot } from 'recoil'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RoleAssignmentModal } from './RoleAssignmentModal'
import { AcmToastContext } from '../../../ui-components'
import { UserKind } from '../../../resources'
import { addRoleAssignment, findRoleAssignments } from '../../../resources/clients/multicluster-role-assignment-client'

jest.mock('../../../resources/clients/multicluster-role-assignment-client', () => ({
  addRoleAssignment: jest.fn(),
  findRoleAssignments: jest.fn(() => []),
}))

const mockFindRoleAssignments = findRoleAssignments as jest.MockedFunction<typeof findRoleAssignments>

let capturedOnSubmit: any = null

jest.mock('./RoleAssignmentForm', () => ({
  RoleAssignmentForm: ({ onSubmit, onCancel }: any) => {
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
      <div>
        <button onClick={() => onSubmit(mockFormData)}>Submit Form</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    )
  },
}))

jest.mock('../../../shared-recoil', () => ({
  useRecoilValue: jest.fn(() => []),
  useSharedAtoms: jest.fn(() => ({ multiclusterRoleAssignmentState: {} })),
}))

jest.mock('../../../resources/clients/placement-client', () => ({
  useGetClustersForPlacementMap: jest.fn(() => ({})),
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

const setupModalTest = (mockReturn: any, close: jest.Mock) => {
  // addRoleAssignment is async and returns Promise<IRequestResult>
  // For .then() on the modal to work, we need to return a resolved promise
  mockAddRoleAssignment.mockResolvedValue(mockReturn)
  render(
    <TestWrapper>
      <RoleAssignmentModal close={close} isOpen={true} />
    </TestWrapper>
  )
  return screen.getByText('Submit Form')
}

const clickSubmitAndWait = async (submitButton: HTMLElement) => {
  userEvent.click(submitButton)
  await waitFor(() => expect(mockToastContext.addAlert).toHaveBeenCalled())
}

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <RecoilRoot>
    <MemoryRouter>
      <AcmToastContext.Provider value={mockToastContext}>{children}</AcmToastContext.Provider>
    </MemoryRouter>
  </RecoilRoot>
)

describe('RoleAssignmentModal', () => {
  const mockClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    capturedOnSubmit = null
  })

  describe('Modal success and failure', () => {
    it('should display duplicate error message when duplicate role assignment is detected', async () => {
      const duplicateError = new Error('Duplicate role assignment detected for user test-user')
      // Use mockRejectedValue so the outer async function rejects
      mockAddRoleAssignment.mockRejectedValue(duplicateError)
      render(
        <TestWrapper>
          <RoleAssignmentModal close={mockClose} isOpen={true} />
        </TestWrapper>
      )
      const submitButton = screen.getByText('Submit Form')

      await clickSubmitAndWait(submitButton)

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
      // Use mockRejectedValue so the outer async function rejects
      mockAddRoleAssignment.mockRejectedValue(genericError)
      render(
        <TestWrapper>
          <RoleAssignmentModal close={mockClose} isOpen={true} />
        </TestWrapper>
      )
      const submitButton = screen.getByText('Submit Form')

      await clickSubmitAndWait(submitButton)

      expect(mockToastContext.addAlert).toHaveBeenCalledWith({
        title: 'Role assignment creation failed',
        message: 'The role assignment creation for admin role failed. Error: Error: Network connection failed',
        type: 'danger',
        autoClose: true,
      })
      expect(mockClose).toHaveBeenCalled()
    })

    it('should display success message when role assignment is created successfully', async () => {
      const submitButton = setupModalTest(
        {
          promise: Promise.resolve({}),
          abort: jest.fn(),
        },
        mockClose
      )

      await clickSubmitAndWait(submitButton)

      expect(mockToastContext.addAlert).toHaveBeenCalledWith({
        title: 'Role assignment added',
        message: 'A role assignment for admin role added.',
        type: 'success',
        autoClose: true,
      })
      expect(mockClose).toHaveBeenCalled()
    })
  })

  describe('Modal Behavior', () => {
    it('should call close when cancel is clicked', () => {
      render(
        <TestWrapper>
          <RoleAssignmentModal close={mockClose} isOpen={true} />
        </TestWrapper>
      )

      const cancelButton = screen.getByText('Cancel')
      userEvent.click(cancelButton)

      expect(mockClose).toHaveBeenCalled()
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
          <RoleAssignmentModal close={mockClose} isOpen={true} />
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
        // roleAssignment is the first argument, subject is nested inside it
        expect(mockAddRoleAssignment.mock.calls[0][0].subject.name).toBe('user1')
        expect(mockAddRoleAssignment.mock.calls[1][0].subject.name).toBe('user2')
      })
    })
  })

  describe('Global Role Regression Tests', () => {
    it('REGRESSION: should preserve clusterNames regardless of scope.kind (bug was conditional discard)', async () => {
      mockAddRoleAssignment.mockResolvedValue({
        promise: Promise.resolve({} as any),
        abort: jest.fn(),
      })

      render(
        <TestWrapper>
          <RoleAssignmentModal close={mockClose} isOpen={true} />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(capturedOnSubmit).not.toBeNull()
      })

      const testCases = [
        {
          description: 'global role with multiple clusters',
          kind: 'all' as const,
          clusters: ['cluster-1', 'cluster-2', 'cluster-3'],
          namespaces: undefined,
        },
        {
          description: 'specific scope with single cluster',
          kind: 'specific' as const,
          clusters: ['specific-cluster'],
          namespaces: ['namespace-1'],
        },
      ]

      for (const testCase of testCases) {
        mockAddRoleAssignment.mockClear()

        await capturedOnSubmit({
          subject: { kind: UserKind, user: ['test-user'] },
          scope: {
            kind: testCase.kind,
            clusterNames: testCase.clusters,
            namespaces: testCase.namespaces,
          },
          roles: ['admin'],
        })

        await waitFor(() => {
          expect(mockAddRoleAssignment).toHaveBeenCalled()
          const roleAssignment = mockAddRoleAssignment.mock.calls[0][0]
          expect(roleAssignment.clusterNames).toEqual(testCase.clusters)
        })
      }
    })

    it('should handle missing clusterNames and use existing role assignment', async () => {
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
          <RoleAssignmentModal close={mockClose} isOpen={true} />
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
        // existingMulticlusterRoleAssignment is the second argument (index 1)
        expect(mockAddRoleAssignment.mock.calls[0][1]).toBe(existingAssignment)
        // When scope.kind is 'all' but no clusterNames are provided, the value is undefined
        expect(mockAddRoleAssignment.mock.calls[0][0].clusterNames).toBeUndefined()
      })
    })

    it('should handle multiple users', async () => {
      const existingAssignment = { metadata: { name: 'existing' } } as any

      // Only user1 has existing role assignment
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
          <RoleAssignmentModal close={mockClose} isOpen={true} />
        </TestWrapper>
      )

      await waitFor(() => expect(capturedOnSubmit).not.toBeNull())

      await capturedOnSubmit({
        subject: { kind: UserKind, user: ['user1', 'user2'] },
        scope: { kind: 'all' },
        roles: ['admin'],
      })

      await waitFor(() => {
        expect(mockAddRoleAssignment).toHaveBeenCalledTimes(2)
        // 1st call: user1 should reuse existing assignment
        // addRoleAssignment(roleAssignment, existingMulticlusterRoleAssignment)
        expect(mockAddRoleAssignment).toHaveBeenNthCalledWith(
          1,
          expect.objectContaining({ subject: expect.objectContaining({ name: 'user1' }) }),
          existingAssignment
        )

        // 2nd call: user2 should create a new assignment (no existing)
        expect(mockAddRoleAssignment).toHaveBeenNthCalledWith(
          2,
          expect.objectContaining({ subject: expect.objectContaining({ name: 'user2' }) }),
          undefined
        )
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
          <RoleAssignmentModal close={mockClose} isOpen={true} />
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
        // existingMulticlusterRoleAssignment is at index 1, should be undefined for new assignments
        expect(mockAddRoleAssignment.mock.calls[0][1]).toBeUndefined()
      })
    })

    it('should handle group subjects', async () => {
      mockAddRoleAssignment.mockResolvedValue({
        promise: Promise.resolve({}) as any,
        abort: jest.fn(),
      })

      render(
        <TestWrapper>
          <RoleAssignmentModal close={mockClose} isOpen={true} />
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
        // subject is nested inside roleAssignment (index 0)
        expect(mockAddRoleAssignment.mock.calls[0][0].subject.name).toBe('group1')
        expect(mockAddRoleAssignment.mock.calls[0][0].subject.kind).toBe('Group')
      })
    })
  })
})
