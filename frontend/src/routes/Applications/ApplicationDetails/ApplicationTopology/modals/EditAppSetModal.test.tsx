/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router'
import { axe } from 'jest-axe'
import type { ApplicationDetailsContext } from '~/routes/Applications/ApplicationDetails/ApplicationDetails'
import type { TopologyNode } from '~/routes/Applications/ApplicationDetails/ApplicationTopology/types'
import { EditAppSetModal, topologyNodeToAppSetParams } from './EditAppSetModal'

const mockOnCancel = jest.fn()
const mockOnSubmitSuccess = jest.fn()
const mockOnApplicationSetNotFound = jest.fn()

jest.mock('~/routes/Applications/CreateArgoApplication/EditArgoApplicationSet', () => ({
  EditArgoApplicationSet: (props: {
    name: string
    namespace: string
    onCancel: () => void
    onSubmitSuccess: () => void
    onApplicationSetNotFound: () => void
  }) => (
    <div id="edit-argo-appset">
      <span>{`${props.namespace} / ${props.name}`}</span>
      <button type="button" onClick={props.onCancel}>
        cancel-edit
      </button>
      <button type="button" onClick={props.onSubmitSuccess}>
        submit-success
      </button>
      <button type="button" onClick={props.onApplicationSetNotFound}>
        not-found
      </button>
    </div>
  ),
}))

const applicationNode: TopologyNode = {
  id: 'appset-1',
  name: 'my-appset',
  namespace: 'openshift-gitops',
  type: 'applicationset',
  specs: {},
}

const placementNode: TopologyNode = {
  id: 'placement-1',
  name: 'my-placement',
  namespace: 'openshift-gitops',
  type: 'placement',
  specs: {},
}

describe('topologyNodeToAppSetParams', () => {
  it('uses node name and namespace for applicationset nodes', () => {
    expect(topologyNodeToAppSetParams(applicationNode)).toEqual({
      name: 'my-appset',
      namespace: 'openshift-gitops',
    })
  })

  it('uses application name for placement nodes', () => {
    expect(topologyNodeToAppSetParams(placementNode, { name: 'parent-appset', namespace: 'parent-ns' })).toEqual({
      name: 'parent-appset',
      namespace: 'openshift-gitops',
    })
  })

  it('falls back to application namespace when placement has no namespace', () => {
    expect(
      topologyNodeToAppSetParams(
        { ...placementNode, namespace: undefined as unknown as string },
        { name: 'parent-appset', namespace: 'parent-ns' }
      )
    ).toEqual({
      name: 'parent-appset',
      namespace: 'parent-ns',
    })
  })

  it('falls back to application or node values for other node types', () => {
    expect(
      topologyNodeToAppSetParams(
        { id: 'other', name: 'node-name', namespace: 'node-ns', type: 'cluster', specs: {} },
        { name: 'app-name', namespace: 'app-ns' }
      )
    ).toEqual({
      name: 'app-name',
      namespace: 'app-ns',
    })

    expect(
      topologyNodeToAppSetParams({ id: 'other', name: 'node-name', namespace: 'node-ns', type: 'cluster', specs: {} })
    ).toEqual({
      name: 'node-name',
      namespace: 'node-ns',
    })
  })
})

describe('EditAppSetModal', () => {
  const close = jest.fn()
  const onUpdateSuccess = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockOnCancel.mockClear()
    mockOnSubmitSuccess.mockClear()
    mockOnApplicationSetNotFound.mockClear()
  })

  function renderModal(node: TopologyNode = applicationNode) {
    const context: Partial<ApplicationDetailsContext> = {
      applicationData: {
        application: { name: 'context-appset', namespace: 'context-ns' },
      } as ApplicationDetailsContext['applicationData'],
    }

    return render(
      <MemoryRouter>
        <Routes>
          <Route element={<Outlet context={context} />}>
            <Route
              path="*"
              element={<EditAppSetModal open close={close} node={node} onUpdateSuccess={onUpdateSuccess} />}
            />
          </Route>
        </Routes>
      </MemoryRouter>
    )
  }

  it('returns null when closed', () => {
    const { container } = render(<EditAppSetModal open={false} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the edit wizard with applicationset params', async () => {
    const { container } = renderModal()
    expect(await screen.findByTestId('edit-argo-appset')).toBeInTheDocument()
    expect(screen.getByText('openshift-gitops / my-appset')).toBeInTheDocument()
    expect(screen.getByText('openshift-gitops > my-appset')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('closes on cancel and not-found', async () => {
    renderModal()

    await userEvent.click(screen.getByRole('button', { name: 'cancel-edit' }))
    expect(close).toHaveBeenCalled()

    close.mockClear()
    await userEvent.click(screen.getByRole('button', { name: 'not-found' }))
    expect(close).toHaveBeenCalled()
  })

  it('notifies success and closes on submit', async () => {
    renderModal()

    await userEvent.click(screen.getByRole('button', { name: 'submit-success' }))
    expect(onUpdateSuccess).toHaveBeenCalledWith('appset-1')
    expect(close).toHaveBeenCalled()
  })

  it('uses application context for placement nodes', () => {
    renderModal(placementNode)
    expect(screen.getByText('openshift-gitops / context-appset')).toBeInTheDocument()
  })
})
