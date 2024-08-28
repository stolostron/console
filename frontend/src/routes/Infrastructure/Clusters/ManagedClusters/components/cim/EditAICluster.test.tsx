/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { RecoilRoot } from 'recoil'
import { MemoryRouter, Route, Routes } from 'react-router-dom-v5-compat'

import { NavigationPath } from '../../../../../../NavigationPath'

import {
  agentClusterInstallsState,
  agentsState,
  clusterDeploymentsState,
  clusterImageSetsState,
  configMapsState,
  infraEnvironmentsState,
} from '../../../../../../atoms'
import { clickByText, waitForTestId, waitForText, waitForNocks } from '../../../../../../lib/test-util'
import { nockGet, nockIgnoreApiPaths, nockList } from '../../../../../../lib/nock-util'

// import EditAICluster from './EditAICluster'
import {
  clusterName,
  mockAgentClusterInstall,
  mockAgents,
  mockClusterDeploymentAI,
  mockClusterImageSet,
  mockConfigMapAI,
  mockInfraEnv1,
  pullSecretMock,
  managedClusterMock,
  klusterletMock,
} from './EditAICluster.sharedmocks'
import { ClusterDeployment } from '../../../../../../resources'
import * as dynamicPluginSdk from '@openshift-console/dynamic-plugin-sdk'
import EditAICluster from './EditAICluster'

jest.mock('react-router-dom-v5-compat', () => {
  const originalModule = jest.requireActual('react-router-dom-v5-compat')
  return {
    __esModule: true,
    ...originalModule,
    useParams: () => {
      return { name: clusterName, namespace: clusterName }
    },
    useNavigate: () => jest.fn(),
  }
})

const Component = () => {
  return (
    <RecoilRoot
      initializeState={(snapshot) => {
        snapshot.set(clusterImageSetsState, [mockClusterImageSet])
        snapshot.set(agentsState, mockAgents)
        snapshot.set(configMapsState, [mockConfigMapAI])
        snapshot.set(clusterDeploymentsState, [mockClusterDeploymentAI as ClusterDeployment])
        snapshot.set(agentClusterInstallsState, [mockAgentClusterInstall])
        snapshot.set(infraEnvironmentsState, [mockInfraEnv1])
      }}
    >
      <MemoryRouter initialEntries={[NavigationPath.editCluster]}>
        <Routes>
          <Route path={NavigationPath.editCluster} element={<EditAICluster />} />
        </Routes>
      </MemoryRouter>
    </RecoilRoot>
  )
}

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  ...jest.requireActual('@openshift-console/dynamic-plugin-sdk'), // use actual for all non-hook parts
  useK8sWatchResource: jest.fn(),
}))

const provisioningConfig = {
  metadata: {
    name: 'foo',
    namespace: 'bar',
  },
}

describe('Edit AI Cluster', () => {
  beforeEach(() => nockIgnoreApiPaths())
  test('can be rendered', async () => {
    ;(dynamicPluginSdk.useK8sWatchResource as jest.Mock).mockReturnValue([provisioningConfig, true, null])
    const nocks = [
      nockGet(pullSecretMock, pullSecretMock),
      nockList(managedClusterMock, managedClusterMock),
      nockList({ apiVersion: klusterletMock.apiVersion, kind: klusterletMock.kind }, klusterletMock),
    ]
    render(<Component />)

    await waitForText('ai:Installation type')

    await waitForText('ai:Cluster details')
    await waitForText('ai:Cluster hosts')
    await waitForText('ai:Networking')
    await waitForText('ai:Review and create')

    await waitForTestId('form-static-openshiftVersion-field')

    await waitForText('ai:OpenShift 4.8.15')

    await clickByText('ai:Next')
    await waitForNocks(nocks)

    await waitForTestId('form-input-autoSelectHosts-field')

    /* TODO(mlibra): Subsequent steps should be covered by AI UI Lib tests. So far we can be sure that the AI UI component has been integrated into the ACM.

        const hostsNocks = [
          nockPatch(mockClusterDeploymentAI, [{"op":"replace","path":"/metadata/annotations","value":{}}]),
          nockPatch(mockAgent, mockAgent)]
        await clickByText('Next')
        await waitForNocks(hostsNocks)
        
        await waitForText('Host inventory')

        await waitForText('Save and install')
        */
    // screen.debug(undefined, -1)
  })
})
