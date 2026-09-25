/* Copyright Contributors to the Open Cluster Management project */
import { readFileSync } from 'fs'
import { join } from 'path'
import { render, screen, waitFor } from '@testing-library/react'
import { RecoilRoot } from 'recoil'
import { argoCDsState } from '../../atoms'
import { AcmToastContext } from '../../ui-components'
import { CreateArgoResources } from './CreateArgoResources'
import { ResourceError, ResourceErrorCode } from '../../resources/utils/resource-request'
import { IResource } from '../../resources'
import { clickElement, typeElement } from '~/lib/test-util'

const mockReconcileResources = jest.fn()
jest.mock('../../resources/utils', () => ({
  ...jest.requireActual('../../resources/utils'),
  reconcileResources: (...args: unknown[]) => mockReconcileResources(...args),
}))

const mockArgoCD: IResource = {
  apiVersion: 'argoproj.io/v1alpha1',
  kind: 'ArgoCD',
  metadata: {
    name: 'openshift-gitops',
    namespace: 'openshift-gitops',
  },
}

const mockClusterSets = [
  {
    apiVersion: 'cluster.open-cluster-management.io/v1beta2',
    kind: 'ManagedClusterSet',
    metadata: {
      name: 'default',
    },
    status: {
      conditions: [{ message: 'Cluster set is ready' }],
    },
  },
]

function TestCreateArgoResources({
  mockHandleModalToggle,
  mockAddAlert,
}: {
  mockHandleModalToggle: jest.Mock
  mockAddAlert: jest.Mock
}) {
  const toastContextValue = {
    activeAlerts: [],
    alertInfos: [],
    addAlert: mockAddAlert,
    removeAlert: jest.fn(),
    removeVisibleAlert: jest.fn(),
    clearAlerts: jest.fn(),
    modifyAlert: jest.fn(),
  }

  return (
    <RecoilRoot
      initializeState={(snapshot) => {
        snapshot.set(argoCDsState, [mockArgoCD])
      }}
    >
      <AcmToastContext.Provider value={toastContextValue}>
        <CreateArgoResources handleModalToggle={mockHandleModalToggle} clusterSets={mockClusterSets} />
      </AcmToastContext.Provider>
    </RecoilRoot>
  )
}

describe('CreateArgoResources', () => {
  const mockHandleModalToggle = jest.fn()
  const mockAddAlert = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('validation banner (ACM-45137)', () => {
    it('shows the required-fields banner in a PageSection without paddingTop override', async () => {
      // Mirror ArgoWizard Modal structure so the modal CSS selector applies in the DOM tree
      const { container } = render(
        <div className="add-argo-server-modal pf-v6-c-modal-box">
          <TestCreateArgoResources mockHandleModalToggle={mockHandleModalToggle} mockAddAlert={mockAddAlert} />
        </div>
      )

      await clickElement(screen.getByRole('button', { name: /^Add$/i }))

      const alert = await screen.findByText('You must fill out all required fields before you can proceed.')
      const pageSection = alert.closest('section.pf-v6-c-page__main-section')
      expect(pageSection).toBeInTheDocument()
      expect(pageSection).toBe(
        container.querySelector('.add-argo-server-modal.pf-v6-c-modal-box > .pf-v6-c-page__main-section')
      )
      expect((pageSection as HTMLElement).style.paddingTop).toBe('')
    })

    it('defines modal horizontal gutter for the form-mode error PageSection', () => {
      const css = readFileSync(join(__dirname, 'CreateArgoResources.css'), 'utf8')
      expect(css).toContain('.add-argo-server-modal.pf-v6-c-modal-box > .pf-v6-c-page__main-section')
      expect(css).toMatch(/margin-inline:\s*var\(--pf-v6-c-modal-box__body--PaddingInlineStart\)/)
    })
  })

  describe('submit function', () => {
    it('should return a Promise that resolves on success', async () => {
      mockReconcileResources.mockResolvedValue(undefined)

      render(<TestCreateArgoResources mockHandleModalToggle={mockHandleModalToggle} mockAddAlert={mockAddAlert} />)

      // Fill in the form
      const nameInput = screen.getByRole('textbox', { name: /name/i })
      await typeElement(nameInput, 'test-argo-server')

      // Select namespace
      const namespaceSelect = screen.getByRole('combobox', { name: /namespace/i })
      await clickElement(namespaceSelect)
      const namespaceOption = await screen.findByRole('option', { name: /openshift-gitops/i })
      await clickElement(namespaceOption)

      // Click Add button
      const addButton = screen.getByRole('button', { name: /^Add$/i })
      await clickElement(addButton)

      await waitFor(() => {
        expect(mockReconcileResources).toHaveBeenCalled()
      })

      await waitFor(() => {
        expect(mockAddAlert).toHaveBeenCalledWith({
          title: 'GitOpsCluster created',
          message: 'openshift-gitops has been successfully added to Argo server.',
          type: 'success',
          autoClose: true,
        })
      })

      expect(mockHandleModalToggle).toHaveBeenCalled()
    })

    it('should return a Promise that rejects on API error, allowing form to display error', async () => {
      const error = new ResourceError(ResourceErrorCode.Conflict, 'Resource already exists')
      mockReconcileResources.mockRejectedValue(error)

      render(<TestCreateArgoResources mockHandleModalToggle={mockHandleModalToggle} mockAddAlert={mockAddAlert} />)

      // Fill in the form
      const nameInput = screen.getByRole('textbox', { name: /name/i })
      await typeElement(nameInput, 'existing-server')

      // Select namespace
      const namespaceSelect = screen.getByRole('combobox', { name: /namespace/i })
      await clickElement(namespaceSelect)
      const namespaceOption = await screen.findByRole('option', { name: /openshift-gitops/i })
      await clickElement(namespaceOption)

      // Click Add button
      const addButton = screen.getByRole('button', { name: /^Add$/i })
      await clickElement(addButton)

      await waitFor(() => {
        expect(mockReconcileResources).toHaveBeenCalled()
      })

      // On error, the toast should NOT be called with success
      expect(mockAddAlert).not.toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
        })
      )

      // Modal should NOT be closed on error
      expect(mockHandleModalToggle).not.toHaveBeenCalled()

      // The error should be displayed by the form framework (AcmDataFormDefault)
      // which catches the rejected promise and displays it in an Alert
      await waitFor(() => {
        expect(screen.getByText(/Resource already exists/i)).toBeInTheDocument()
      })
    })

    it('should call reconcileResources with correct resources', async () => {
      mockReconcileResources.mockResolvedValue(undefined)

      render(<TestCreateArgoResources mockHandleModalToggle={mockHandleModalToggle} mockAddAlert={mockAddAlert} />)

      // Fill in the form
      const nameInput = screen.getByRole('textbox', { name: /name/i })
      await typeElement(nameInput, 'my-argo')

      // Select namespace
      const namespaceSelect = screen.getByRole('combobox', { name: /namespace/i })
      await clickElement(namespaceSelect)
      const namespaceOption = await screen.findByRole('option', { name: /openshift-gitops/i })
      await clickElement(namespaceOption)

      // Click Add button
      const addButton = screen.getByRole('button', { name: /^Add$/i })
      await clickElement(addButton)

      await waitFor(() => {
        expect(mockReconcileResources).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              kind: 'GitOpsCluster',
              metadata: expect.objectContaining({
                name: 'my-argo',
                namespace: 'openshift-gitops',
              }),
            }),
            expect.objectContaining({
              kind: 'ManagedClusterSetBinding',
            }),
            expect.objectContaining({
              kind: 'Placement',
              metadata: expect.objectContaining({
                name: 'my-argo-placement',
              }),
            }),
          ]),
          []
        )
      })
    })
  })
})
