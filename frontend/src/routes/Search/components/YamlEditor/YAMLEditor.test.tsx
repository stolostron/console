/* Copyright Contributors to the Open Cluster Management project */

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { PluginContext, defaultPlugin } from '../../../../lib/PluginContext'
import YAMLEditor from './YAMLEditor'

jest.mock('../../../../shared-recoil', () => ({
  useSharedAtoms: jest.fn(() => ({ isFineGrainedRbacEnabledState: {} })),
  useRecoilValue: jest.fn(() => false),
}))

const mockOnSave = jest.fn()
const mockOnReload = jest.fn()
const mockFold = jest.fn()
const mockRegisterAutoFold = jest.fn()

jest.mock('./utils', () => ({
  fold: (...args: unknown[]) => mockFold(...args),
  onReload: (...args: unknown[]) => mockOnReload(...args),
  onSave: (
    cluster: string,
    kind: string,
    apiVersion: string,
    name: string,
    namespace: string,
    resourceYaml: string,
    isHubClusterResource: boolean,
    setResourceYaml: (v: string) => void,
    setUpdateError: (v: string) => void,
    setUpdateSuccess: (v: boolean) => void,
    setStale: (v: boolean) => void,
    isFineGrainedRbacEnabled: boolean
  ) => {
    mockOnSave(
      cluster,
      kind,
      apiVersion,
      name,
      namespace,
      resourceYaml,
      isHubClusterResource,
      setResourceYaml,
      setUpdateError,
      setUpdateSuccess,
      setStale,
      isFineGrainedRbacEnabled
    )
  },
  registerAutoFold: (...args: unknown[]) => mockRegisterAutoFold(...args),
}))

jest.mock('@patternfly/react-code-editor', () => ({
  CodeEditor: ({ code }: { code: string }) => (
    <div data-testid="code-editor-mock">
      <pre>{code}</pre>
    </div>
  ),
  Language: { yaml: 'yaml' },
}))

const mockNavigate = jest.fn()
jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useNavigate: () => mockNavigate,
}))

jest.mock('../../../../lib/rbac-util', () => ({
  canUser: jest.fn(() => ({
    promise: Promise.resolve({ status: { allowed: true } }),
    abort: jest.fn(),
  })),
}))

jest.mock('../../../../resources/utils/fleet-can-user', () => ({
  fleetCanUser: jest.fn(() => ({
    promise: Promise.resolve({ status: { allowed: true } }),
    abort: jest.fn(),
  })),
}))

jest.mock('../../../../components/theme', () => ({
  defineThemes: jest.fn(),
  getTheme: jest.fn(() => 'console-light'),
  mountTheme: jest.fn(),
}))

jest.mock('@patternfly/react-core', () => {
  const actual = jest.requireActual('@patternfly/react-core')
  return {
    ...actual,
    getResizeObserver: jest.fn(() => jest.fn()),
  }
})

jest.mock('file-saver', () => ({
  __esModule: true,
  default: jest.fn(),
}))

const mockUseFleetK8sWatchResource = jest.fn()
const mockPluginValue = {
  ...defaultPlugin,
  multiclusterApi: { useFleetK8sWatchResource: mockUseFleetK8sWatchResource },
}

const defaultResource = {
  apiVersion: 'v1',
  kind: 'Pod',
  metadata: { name: 'test-pod', namespace: 'default', resourceVersion: '1' },
}

const defaultProps = {
  resource: defaultResource,
  cluster: 'local-cluster',
  kind: 'Pod',
  apiVersion: 'v1',
  name: 'test-pod',
  namespace: 'default',
  isHubClusterResource: true,
}

function renderYAMLEditor(props = defaultProps) {
  mockUseFleetK8sWatchResource.mockReturnValue([defaultResource, true, null])
  return render(
    <MemoryRouter>
      <PluginContext.Provider value={mockPluginValue}>
        <YAMLEditor {...props} />
      </PluginContext.Provider>
    </MemoryRouter>
  )
}

describe('YAMLEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseFleetK8sWatchResource.mockReturnValue([defaultResource, true, null])
  })

  it('renders with resource YAML and action buttons', async () => {
    renderYAMLEditor()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
    })
    expect(screen.getByText(/apiVersion: v1/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument()
  })

  it('calls onSave with correct args when Save is clicked', async () => {
    renderYAMLEditor()

    await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(mockOnSave).toHaveBeenCalledWith(
      'local-cluster',
      'Pod',
      'v1',
      'test-pod',
      'default',
      expect.any(String),
      true,
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
      expect.any(Boolean)
    )
  })

  it('calls onReload with correct args when Reload is clicked', async () => {
    renderYAMLEditor()

    await waitFor(() => expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Reload' }))

    expect(mockOnReload).toHaveBeenCalledWith(
      'local-cluster',
      'Pod',
      'v1',
      'test-pod',
      'default',
      true,
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
      expect.any(Boolean),
      { current: false }
    )
  })

  it('calls navigate(-1) when Cancel is clicked', async () => {
    renderYAMLEditor()

    await waitFor(() => expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(mockNavigate).toHaveBeenCalledWith(-1)
  })

  it('calls saveAs when Download is clicked', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const saveAs = require('file-saver').default
    renderYAMLEditor()

    await waitFor(() => expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Download' }))

    expect(saveAs).toHaveBeenCalled()
    const [blob, filename] = saveAs.mock.calls[0]
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('text/yaml;charset=utf-8')
    expect(filename).toBe('test-pod.yaml')
  })

  it('uses watch result for stale detection when resourceVersion differs', () => {
    const watchedResource = {
      ...defaultResource,
      metadata: { ...defaultResource.metadata, resourceVersion: '2' },
    }
    mockUseFleetK8sWatchResource.mockReturnValue([watchedResource, true, null])

    renderYAMLEditor()

    expect(mockUseFleetK8sWatchResource).toHaveBeenCalledWith(
      expect.objectContaining({
        groupVersionKind: { group: '', version: 'v1', kind: 'Pod' },
        name: 'test-pod',
        namespace: 'default',
        cluster: 'local-cluster',
      })
    )
  })

  it('disables Save when readOnly', async () => {
    const { canUser } = jest.requireMock('../../../../lib/rbac-util')
    canUser.mockReturnValue({
      promise: Promise.resolve({ status: { allowed: false } }),
      abort: jest.fn(),
    })

    renderYAMLEditor()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled()
    })
  })

  it('renders CodeEditor with resource YAML content', async () => {
    renderYAMLEditor()

    await waitFor(() => {
      expect(screen.getByText(/apiVersion: v1/)).toBeInTheDocument()
      expect(screen.getByText(/kind: Pod/)).toBeInTheDocument()
      expect(screen.getByText(/name: test-pod/)).toBeInTheDocument()
      expect(screen.getByText(/namespace: default/)).toBeInTheDocument()
    })
  })

  it('uses fleetCanUser for non-hub cluster resources', async () => {
    const fleetCanUser = jest.requireMock('../../../../resources/utils/fleet-can-user').fleetCanUser
    fleetCanUser.mockReturnValue({
      promise: Promise.resolve({ status: { allowed: true } }),
      abort: jest.fn(),
    })

    renderYAMLEditor({
      ...defaultProps,
      cluster: 'managed-cluster',
      isHubClusterResource: false,
    })

    await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument())
    expect(fleetCanUser).toHaveBeenCalledWith(
      'update',
      'managed-cluster',
      expect.objectContaining({ apiVersion: 'v1', kind: 'Pod' }),
      'default',
      'test-pod'
    )
  })
})
