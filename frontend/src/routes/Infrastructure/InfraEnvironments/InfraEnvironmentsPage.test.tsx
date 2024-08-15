/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  AgentK8sResource,
  AgentServiceConfigK8sResource,
  InfraEnvK8sResource,
  SecretK8sResource,
} from '@openshift-assisted/ui-lib/cim'
import { MemoryRouter, Route, Routes } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'

import { infraEnvironmentsState } from '../../../atoms'
import { nockIgnoreApiPaths, nockIgnoreRBAC } from '../../../lib/nock-util'
import { waitForTestId, waitForText } from '../../../lib/test-util'
import { NavigationPath } from '../../../NavigationPath'
import InfraEnvironmentsPage, {
  getFirstAgenterviceConfig,
  getInfraEnvsOfMatchingPullSecret,
  getPlatform,
  isDeleteDisabled,
  isPullSecretReused,
} from './InfraEnvironmentsPage'

export const infraEnvName = 'infra-env-name'

export const mockInfraEnv1: InfraEnvK8sResource = {
  apiVersion: 'agent-install.openshift.io/v1beta1',
  kind: 'InfraEnv',
  metadata: {
    labels: {
      'agentclusterinstalls.extensions.hive.openshift.io/location': 'brno',
      networkType: 'dhcp',
    },
    name: infraEnvName,
    namespace: infraEnvName,
  },
  spec: {
    agentLabels: {
      'agentclusterinstalls.extensions.hive.openshift.io/location': 'brno',
    },
    pullSecretRef: {
      name: `pullsecret-${infraEnvName}`,
    },
  },
  status: {
    agentLabelSelector: {
      matchLabels: {
        'infraenvs.agent-install.openshift.io': infraEnvName,
      },
    },
    conditions: [
      {
        lastTransitionTime: '2021-10-04T11:26:37Z',
        message: 'Image has been created',
        reason: 'ImageCreated',
        status: 'True',
        type: 'ImageCreated',
      },
    ],
    createdTime: '2021-11-10T13:00:00Z',
    isoDownloadURL: 'https://my.funny.download.url',
  },
}

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

export const mockPullSecret: SecretK8sResource = {
  apiVersion: 'v1',
  kind: 'Secret',
  metadata: {
    name: `pullsecret-${infraEnvName}`,
    namespace: infraEnvName,
    labels: { 'cluster.open-cluster-management.io/backup': 'cluster' },
  },
  data: {
    '.dockerconfigjson':
      'eyJhdXRocyI6eyJjbG91ZC5vcGVuc2hpZnQuY29tIjp7ImF1dGgiOiJiM0JsYlNLSVBQRUQiLCJlbWFpbCI6Im15QGVtYWlsLnNvbWV3aGVyZS5jb20ifX19',
  },
  type: 'kubernetes.io/dockerconfigjson',
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
  test('getFirstAgenterviceConfig', () => {
    expect(getFirstAgenterviceConfig(undefined)).toBe(undefined)
    expect(getFirstAgenterviceConfig([])).toBe(undefined)
    expect(getFirstAgenterviceConfig([{} as AgentServiceConfigK8sResource])).not.toBe(undefined)
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
    const { getByLabelText, getByText } = render(<Component />)
    window.URL.createObjectURL = jest.fn()
    window.URL.revokeObjectURL = jest.fn()
    const documentBody = document.body.appendChild
    const documentCreate = document.createElement('a').dispatchEvent

    const anchorMocked = { href: '', click: jest.fn(), download: 'table-values', style: { display: '' } } as any
    const createElementSpyOn = jest.spyOn(document, 'createElement').mockReturnValueOnce(anchorMocked)
    document.body.appendChild = jest.fn()
    document.createElement('a').dispatchEvent = jest.fn()

    userEvent.click(getByLabelText('export-search-result'))
    userEvent.click(getByText('Export as CSV'))

    expect(createElementSpyOn).toHaveBeenCalledWith('a')
    expect(anchorMocked.download).toContain('table-values')

    document.body.appendChild = documentBody
    document.createElement('a').dispatchEvent = documentCreate
  })
})
