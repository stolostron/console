/* Copyright Contributors to the Open Cluster Management project */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { PluginContext, defaultPlugin } from '~/lib/PluginContext'
import type { TopologyNode } from '~/routes/Applications/ApplicationDetails/ApplicationTopology/types'
import { EditYamlModal } from './EditYamlModal'

const mockGetResource = jest.fn()
const mockFleetResourceRequest = jest.fn()
const mockOnSave = jest.fn()
const mockOnReload = jest.fn()
const mockCanUser = jest.fn()
const mockFleetCanUser = jest.fn()
const mockUseFleetK8sWatchResource = jest.fn()

jest.mock('~/shared-recoil', () => ({
  useSharedAtoms: jest.fn(() => ({ isFineGrainedRbacEnabledState: {} })),
  useRecoilValue: jest.fn(() => false),
}))

jest.mock('~/resources/utils', () => {
  const actual = jest.requireActual('~/resources/utils')
  return {
    ...actual,
    getResource: (...args: unknown[]) => mockGetResource(...args),
  }
})

jest.mock('~/resources/utils/fleet-resource-request', () => ({
  fleetResourceRequest: (...args: unknown[]) => mockFleetResourceRequest(...args),
}))

jest.mock('~/resources/utils/fleet-can-user', () => ({
  fleetCanUser: (...args: unknown[]) => mockFleetCanUser(...args),
}))

jest.mock('~/lib/rbac-util', () => ({
  canUser: (...args: unknown[]) => mockCanUser(...args),
}))

jest.mock('~/routes/Search/components/YamlEditor/utils', () => ({
  onSave: (...args: unknown[]) => mockOnSave(...args),
  onReload: (...args: unknown[]) => mockOnReload(...args),
}))

jest.mock('~/components/SyncEditor/SyncEditor', () => ({
  SyncEditor: (props: { editorTitle: string }) => <div id="sync-editor">{props.editorTitle}</div>,
  ValidationStatus: { success: 'success', failure: 'failure', pending: 'pending' },
}))

const hubResource = {
  apiVersion: 'v1',
  kind: 'ConfigMap',
  metadata: { name: 'test-cm', namespace: 'default', resourceVersion: '1' },
}

const baseNode: TopologyNode = {
  id: 'node-1',
  name: 'test-cm',
  namespace: 'default',
  type: 'configmap',
  cluster: 'local-cluster',
  specs: {
    raw: {
      apiVersion: 'v1',
      kind: 'ConfigMap',
    },
  },
}

function renderModal(node: TopologyNode = baseNode, open = true) {
  const close = jest.fn()
  const onUpdateSuccess = jest.fn()
  const result = render(
    <MemoryRouter>
      <PluginContext.Provider
        value={{
          ...defaultPlugin,
          multiclusterApi: { useFleetK8sWatchResource: mockUseFleetK8sWatchResource },
        }}
      >
        {open ? (
          <EditYamlModal
            open
            close={close}
            node={node}
            hubClusterName="local-cluster"
            onUpdateSuccess={onUpdateSuccess}
          />
        ) : (
          <EditYamlModal open={false} />
        )}
      </PluginContext.Provider>
    </MemoryRouter>
  )
  return { ...result, close, onUpdateSuccess }
}

describe('EditYamlModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseFleetK8sWatchResource.mockReturnValue([hubResource, true, null])
    mockCanUser.mockReturnValue({
      promise: Promise.resolve({ status: { allowed: true } }),
      abort: jest.fn(),
    })
    mockFleetCanUser.mockReturnValue({
      promise: Promise.resolve({ status: { allowed: true } }),
      abort: jest.fn(),
    })
    mockGetResource.mockReturnValue({
      promise: Promise.resolve(hubResource),
    })
    mockFleetResourceRequest.mockResolvedValue(hubResource)
  })

  it('returns null when closed', () => {
    const { container } = renderModal(baseNode, false)
    expect(container.firstChild).toBeNull()
  })

  it('shows loading state while resource is fetching', () => {
    mockGetResource.mockReturnValue({
      promise: new Promise(() => {}),
    })
    renderModal()
    expect(screen.getByText('Edit YAML')).toBeInTheDocument()
  })

  it('loads hub resource and renders editor actions', async () => {
    const { close } = renderModal()
    expect(await screen.findByTestId('sync-editor')).toBeInTheDocument()
    expect(screen.getByText('Configmap > local-cluster > default > test-cm')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(close).toHaveBeenCalled()
  })

  it('uses applicationset raw resource without fetching', async () => {
    const appSetNode: TopologyNode = {
      id: 'appset-1',
      name: 'my-appset',
      namespace: 'openshift-gitops',
      type: 'applicationset',
      specs: {
        isDesign: true,
        raw: {
          apiVersion: 'argoproj.io/v1alpha1',
          kind: 'ApplicationSet',
          metadata: { name: 'my-appset', namespace: 'openshift-gitops', resourceVersion: '1' },
        },
      },
    }

    renderModal(appSetNode)
    expect(await screen.findByTestId('sync-editor')).toBeInTheDocument()
    expect(mockGetResource).not.toHaveBeenCalled()
  })

  it('fetches managed-cluster resources via fleet request', async () => {
    renderModal({ ...baseNode, cluster: 'managed-1' })
    await waitFor(() => expect(mockFleetResourceRequest).toHaveBeenCalled())
    expect(await screen.findByTestId('sync-editor')).toBeInTheDocument()
  })

  it('shows error alert when resource fetch fails', async () => {
    mockGetResource.mockReturnValue({
      promise: Promise.reject(new Error('not found')),
    })
    renderModal()
    expect(await screen.findByText(/Error querying for resource:/)).toBeInTheDocument()
    expect(screen.getByText('not found')).toBeInTheDocument()
  })

  it('calls onSave when Save is clicked', async () => {
    renderModal()
    expect(await screen.findByTestId('sync-editor')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(mockOnSave).toHaveBeenCalled()
  })

  it('calls onReload when Reload is clicked', async () => {
    renderModal()
    expect(await screen.findByTestId('sync-editor')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Reload' }))
    expect(mockOnReload).toHaveBeenCalled()
  })

  it('closes and reports success after updateSuccess', async () => {
    mockOnSave.mockImplementation(
      (_c, _k, _a, _n, _ns, _y, _h, _setYaml, _setError, setUpdateSuccess: (v: boolean) => void) => {
        setUpdateSuccess(true)
      }
    )
    const { close, onUpdateSuccess } = renderModal()
    expect(await screen.findByTestId('sync-editor')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(onUpdateSuccess).toHaveBeenCalledWith('node-1'))
    expect(close).toHaveBeenCalled()
  })

  it('marks stale when watched resource version changes', async () => {
    mockUseFleetK8sWatchResource.mockReturnValue([
      { ...hubResource, metadata: { ...hubResource.metadata, resourceVersion: '2' } },
      true,
      null,
    ])
    renderModal()
    expect(await screen.findByText('This object has been updated.')).toBeInTheDocument()
  })
})
