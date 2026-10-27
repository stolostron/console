/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import {
  AgentK8sResource,
  AgentServiceConfigK8sResource,
  InfraEnvK8sResource,
  StorageClassK8sResource,
} from '@openshift-assisted/ui-lib/cim'
import { MemoryRouter, Route, Routes } from 'react-router'
import { StateProvider } from '~/lib/state-provider'

import { agentServiceConfigsState, infraEnvironmentsState, storageClassState } from '../../../atoms'
import { nockDelete, nockIgnoreApiPaths, nockIgnoreRBAC } from '../../../lib/nock-util'
import {
  clickByText,
  createClusterVersionMock,
  getCSVDownloadLink,
  getCSVExportSpies,
  typeByTestId,
  waitForNocks,
  waitForTestId,
  waitForText,
  clickElement,
} from '~/lib/test-util'
import { NavigationPath } from '../../../NavigationPath'
import InfraEnvironmentsPage, {
  getFirstAgentServiceConfig,
  getInfraEnvsOfMatchingPullSecret,
  getPlatform,
  isDeleteDisabled,
  isPullSecretReused,
} from './InfraEnvironmentsPage'
import { infraEnvName, mockInfraEnv1 } from '../../../test-helpers/infraEnvName'
import { IResource } from '../../../resources'

const mockNavigate = jest.fn()
jest.mock('react-router', () => {
  const originalModule = jest.requireActual('react-router')
  return {
    __esModule: true,
    ...originalModule,
    useNavigate: () => mockNavigate,
  }
})

const mockUseClusterVersion = createClusterVersionMock()
jest.mock('../../../hooks/use-cluster-version', () => ({
  useClusterVersion: () => mockUseClusterVersion(),
}))

const mockAgent1: AgentK8sResource = {
  apiVersion: 'agent-install.openshift.io/v1beta1',
  kind: 'Agent',
  metadata: {
    labels: {
      'infraenvs.agent-install.openshift.io': infraEnvName,
    },
    name: '0f093a00-5df8-40d7-840f-bca56216471',
    namespace: infraEnvName,
  },
  spec: {
    approved: true,
    hostname: 'host',
    role: 'auto-assign',
  },
}

const mockAgent2: AgentK8sResource = {
  apiVersion: 'agent-install.openshift.io/v1beta1',
  kind: 'Agent',
  metadata: {
    labels: {
      'infraenvs.agent-install.openshift.io': 'NOT-MATCHING-INFRA',
    },
    name: '0f093a00-5df8-40d7-840f-bca56216471',
    namespace: infraEnvName,
  },
  spec: {
    approved: true,
    hostname: 'host',
    role: 'auto-assign',
  },
}

const mockInfraEnvironments: InfraEnvK8sResource[] = [mockInfraEnv1]

const mockStorageClass: StorageClassK8sResource = {
  apiVersion: 'storage.k8s.io/v1',
  kind: 'StorageClass',
  metadata: { name: 'gp2' },
  provisioner: 'kubernetes.io/aws-ebs',
  reclaimPolicy: 'Delete',
}

const mockStorageConfig = {
  accessModes: ['ReadWriteOnce' as const],
  resources: { requests: { storage: '10Gi' } },
}

const mockAgentServiceConfig: AgentServiceConfigK8sResource = {
  apiVersion: 'agent-install.openshift.io/v1beta1',
  kind: 'AgentServiceConfig',
  metadata: { name: 'agent' },
  spec: {
    databaseStorage: mockStorageConfig,
    filesystemStorage: mockStorageConfig,
    imageStorage: mockStorageConfig,
  },
  status: {
    conditions: [
      {
        type: 'DeploymentsHealthy',
        status: 'True',
        reason: 'DeploymentSucceeded',
        message: 'All the deployments managed by Infrastructure-operator are healthy.',
        lastTransitionTime: '2021-10-04T11:26:37Z',
      },
    ],
  },
}

const CimWorkingEmptyComponent = () => {
  return (
    <StateProvider
      initializeStore={(store) => {
        store.set(infraEnvironmentsState, [])
        store.set(storageClassState, [mockStorageClass])
        store.set(agentServiceConfigsState, [mockAgentServiceConfig])
      }}
    >
      <MemoryRouter initialEntries={[NavigationPath.infraEnvironments]}>
        <Routes>
          <Route path={NavigationPath.infraEnvironments} element={<InfraEnvironmentsPage />} />
        </Routes>
      </MemoryRouter>
    </StateProvider>
  )
}

const Component = () => {
  return (
    <StateProvider
      initializeStore={(store) => {
        store.set(infraEnvironmentsState, mockInfraEnvironments)
      }}
    >
      <MemoryRouter initialEntries={[NavigationPath.infraEnvironments]}>
        <Routes>
          <Route path={NavigationPath.infraEnvironments} element={<InfraEnvironmentsPage />} />
        </Routes>
      </MemoryRouter>
    </StateProvider>
  )
}

describe('Infrastructure Environments page', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })
  test('can render', async () => {
    const { getByText, getAllByRole } = render(<Component />)

    await waitForText('Host inventory', true)

    // the top-level hint
    await waitForTestId('createInfraEnv')

    // is the infraEnv listed?
    await waitForText(infraEnvName, true)

    // select mass-delete action
    await clickElement(getAllByRole('checkbox')[0])
    await clickElement(getByText('Actions'))
    getByText('Delete infrastructure environments')
    expect(getByText('Delete infrastructure environments')).not.toHaveAttribute('disabled')
    await clickElement(getByText('Delete infrastructure environments'))
  })
})

describe('Infrastructure Environments page utility functions', () => {
  test('isDeleteDisabled finds infra agents', () => {
    expect(isDeleteDisabled([mockInfraEnv1], [mockAgent1, mockAgent2])).toBe(true)
    expect(isDeleteDisabled([mockInfraEnv1], [mockAgent2])).toBe(false)
    expect(isDeleteDisabled([mockInfraEnv1], [])).toBe(false)

    expect(isDeleteDisabled([{}], [mockAgent1, mockAgent2])).toBe(true)
  })
  test('getFirstAgentServiceConfig', () => {
    expect(getFirstAgentServiceConfig(undefined)).toBe(undefined)
    expect(getFirstAgentServiceConfig([])).toBe(undefined)
    expect(getFirstAgentServiceConfig([{} as AgentServiceConfigK8sResource])).not.toBe(undefined)
  })
  test('getPlatform', () => {
    expect(getPlatform(undefined)).toBe('None')
    expect(getPlatform([])).toBe('None')
    expect(getPlatform([{ status: { platform: 'AWS' } }])).toBe('AWS')
  })
  test('getInfraEnvsOfMatchingPullSecret', () => {
    expect(getInfraEnvsOfMatchingPullSecret([], mockInfraEnv1)).toHaveLength(0)
    expect(getInfraEnvsOfMatchingPullSecret([mockInfraEnv1], mockInfraEnv1)).toHaveLength(1)
  })
  test('isPullSecretReused', () => {
    expect(isPullSecretReused([mockInfraEnv1], mockInfraEnv1, [mockAgent2])).toBe(true)
    expect(isPullSecretReused([mockInfraEnv1], mockInfraEnv1, [])).toBe(true)

    expect(isPullSecretReused([mockInfraEnv1, mockInfraEnv1], mockInfraEnv1, [])).toBe(false)
    expect(isPullSecretReused([mockInfraEnv1, mockInfraEnv1], mockInfraEnv1, [mockAgent1, mockAgent2])).toBe(false)
    expect(isPullSecretReused([], mockInfraEnv1, [mockAgent1, mockAgent2])).toBe(false)
  })
})

describe('Export from host inventory table', () => {
  test('export button should produce a file for download', async () => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths() //ignore /apiPaths
    const { getByLabelText, getByText } = render(<Component />)
    window.URL.createObjectURL = jest.fn()
    window.URL.revokeObjectURL = jest.fn()

    const { blobConstructorSpy, createElementSpy } = getCSVExportSpies()

    await clickElement(getByLabelText('export-search-result'))
    await clickElement(getByText('Export all to CSV'))

    expect(blobConstructorSpy).toHaveBeenCalledWith(
      [
        'Infrastructure environment name,Namespace,Labels,Location,Hosts,Creation date\n' +
          '"infra-env-name","infra-env-name","\'agentclusterinstalls.extensions.hive.openshift.io/location\':\'brno\',\'networkType\':\'dhcp\'","brno","healthy: 0, danger: 0, warning: 0",-',
      ],
      { type: 'text/csv' }
    )
    expect(getCSVDownloadLink(createElementSpy)?.value.download).toMatch(/^hostenvironments-[\d]+\.csv$/)
  })
})

describe('InfraEnvironmentsPage - Version-specific URLs', () => {
  describe('OCP 4.21 (uses /catalog)', () => {
    beforeEach(() => {
      mockNavigate.mockClear()
      mockUseClusterVersion.mockReturnValue({
        version: '4.21',
        isLoading: false,
        error: undefined,
      })
      nockIgnoreRBAC()
      nockIgnoreApiPaths()
    })

    it('should use /catalog path for storage operator link on OCP 4.21', async () => {
      render(<Component />)
      await waitForText('Host inventory', true)
      await clickElement(screen.getByRole('button', { name: /install storage operator/i }))
      expect(mockNavigate).toHaveBeenCalledWith('/catalog/ns/multicluster-engine?category=storage')
    })
  })

  describe('OCP 4.19 (uses /operatorhub)', () => {
    beforeEach(() => {
      mockNavigate.mockClear()
      mockUseClusterVersion.mockReturnValue({
        version: '4.19',
        isLoading: false,
        error: undefined,
      })
      nockIgnoreRBAC()
      nockIgnoreApiPaths()
    })

    it('should use /operatorhub path for storage operator link on OCP 4.19', async () => {
      render(<Component />)
      await waitForText('Host inventory', true)
      await clickElement(screen.getByRole('button', { name: /install storage operator/i }))
      expect(mockNavigate).toHaveBeenCalledWith('/operatorhub/ns/multicluster-engine?category=Storage')
    })
  })
})

describe('Infrastructure Environments page - empty state navigation', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    mockUseClusterVersion.mockReturnValue({
      version: '4.19',
      isLoading: false,
      error: undefined,
    })
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })

  it('navigates to create infrastructure environment from the empty state', async () => {
    render(<CimWorkingEmptyComponent />)
    await waitForText('No infrastructure environments yet')

    const createButton = screen.getByRole('button', { name: 'Create infrastructure environment' })
    expect(createButton).toBeEnabled()

    await clickElement(createButton)
    expect(mockNavigate).toHaveBeenCalledWith(NavigationPath.createInfraEnv)
  })
})

describe('Infrastructure Environments page - delete', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })

  it('deletes an infrastructure environment and its related resources', async () => {
    const deleteInfraEnvNock = nockDelete(mockInfraEnv1 as IResource)
    const deleteRoleNock = nockDelete({
      kind: 'Role',
      apiVersion: 'rbac.authorization.k8s.io/v1',
      metadata: { name: 'capi-provider-role', namespace: infraEnvName },
    })
    const deleteSecretNock = nockDelete({
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: { name: `pullsecret-${infraEnvName}`, namespace: infraEnvName },
    })

    const { getByText, getAllByRole } = render(<Component />)
    await waitForText(infraEnvName, true)

    // open the bulk delete modal
    await clickElement(getAllByRole('checkbox')[0])
    await clickElement(getByText('Actions'))
    await clickElement(getByText('Delete infrastructure environments'))

    // confirm and submit the deletion
    await typeByTestId('confirm', 'confirm')
    await clickByText('Delete')

    await waitForNocks([deleteInfraEnvNock, deleteRoleNock, deleteSecretNock])
  })
})
