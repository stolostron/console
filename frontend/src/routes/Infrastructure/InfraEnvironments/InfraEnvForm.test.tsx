/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'

import { infraEnvironmentsState } from '../../../atoms'
import { nockIgnoreApiPaths, nockIgnoreRBAC } from '../../../lib/nock-util'
import { waitForText } from '../../../lib/test-util'
import { NavigationPath } from '../../../NavigationPath'
import InfraEnvForm from './InfraEnvForm'
import { InfraEnvK8sResource } from 'openshift-assisted-ui-lib/cim'

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

const mockInfraEnvironments: InfraEnvK8sResource[] = [mockInfraEnv1]

const Component = () => {
  return (
    <RecoilRoot
      initializeState={(snapshot) => {
        snapshot.set(infraEnvironmentsState, mockInfraEnvironments)
      }}
    >
      <MemoryRouter initialEntries={[NavigationPath.infraEnvironments]}>
        <Route path={NavigationPath.infraEnvironments}>
          <InfraEnvForm control={{}} handleChange={() => {}} />
        </Route>
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
    render(<Component />)
    await waitForText('ai:Name', true)
  })
})
