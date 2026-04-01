/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AgentK8sResource, AgentServiceConfigK8sResource, InfraEnvK8sResource } from '@openshift-assisted/ui-lib/cim'
import { MemoryRouter, Route, Routes } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'

import { infraEnvironmentsState } from '../../../atoms'
import { nockIgnoreApiPaths, nockIgnoreRBAC } from '../../../lib/nock-util'
import {
  createClusterVersionMock,
  getCSVDownloadLink,
  getCSVExportSpies,
  waitForTestId,
  waitForText,
} from '../../../lib/test-util'
import { NavigationPath } from '../../../NavigationPath'
import InfraEnvironmentsPage, {
  getFirstAgentServiceConfig,
  getInfraEnvsOfMatchingPullSecret,
  getPlatform,
  isDeleteDisabled,
  isPullSecretReused,
} from './InfraEnvironmentsPage'
import { infraEnvName, mockInfraEnv1 } from '../../../test-helpers/infraEnvName'

const mockNavigate = jest.fn()
jest.mock('react-router-dom-v5-compat', () => {
  const originalModule = jest.requireActual('react-router-dom-v5-compat')
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

const Component = () => {
  return (
    <RecoilRoot
      initializeState={(snapshot) => {
        snapshot.set(infraEnvironmentsState, mockInfraEnvironments)
      }}
    >
      <MemoryRouter initialEntries={[NavigationPath.infraEnvironments]}>
        <Routes>
          <Route path={NavigationPath.infraEnvironments} element={<InfraEnvironmentsPage />} />
        </Routes>
      </MemoryRouter>
    </RecoilRoot>
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
    userEvent.click(getAllByRole('checkbox')[0])
    getByText('Actions').click()
    getByText('Delete infrastructure environments')
    expect(getByText('Delete infrastructure environments')).not.toHaveAttribute('disabled')
    userEvent.click(getByText('Delete infrastructure environments'))
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

    userEvent.click(getByLabelText('export-search-result'))
    userEvent.click(getByText('Export all to CSV'))

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
      userEvent.click(screen.getByRole('button', { name: /install storage operator/i }))
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
      userEvent.click(screen.getByRole('button', { name: /install storage operator/i }))
      expect(mockNavigate).toHaveBeenCalledWith('/operatorhub/ns/multicluster-engine?category=Storage')
    })
  })
})
