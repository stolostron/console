/* Copyright Contributors to the Open Cluster Management project */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RecoilRoot } from 'recoil'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RoleAssignmentModal } from './RoleAssignmentModal'
import { AcmToastContext } from '../../../ui-components'
import { UserKind } from '../../../resources'
import { addRoleAssignment } from '../../../resources/clients/multicluster-role-assignment-client'

jest.mock('../../../resources/clients/multicluster-role-assignment-client', () => ({
  addRoleAssignment: jest.fn(),
  findRoleAssignments: jest.fn(() => []),
}))

jest.mock('./RoleAssignmentForm', () => ({
  RoleAssignmentForm: ({ onSubmit, onCancel }: any) => {
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
  useRecoilValue: jest.fn(),
  useSharedAtoms: jest.fn(() => ({})),
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
  mockAddRoleAssignment.mockReturnValue(mockReturn)
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
  })

  describe('Modal success and failure', () => {
    it('should display duplicate error message when duplicate role assignment is detected', async () => {
      const duplicateError = new Error('Duplicate role assignment detected for user test-user')
      const submitButton = setupModalTest(
        {
          promise: Promise.reject(duplicateError),
          abort: jest.fn(),
        },
        mockClose
      )

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
      const submitButton = setupModalTest(
        {
          promise: Promise.reject(genericError),
          abort: jest.fn(),
        },
        mockClose
      )

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
})
