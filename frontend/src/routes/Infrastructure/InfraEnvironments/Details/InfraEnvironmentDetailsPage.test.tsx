/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { cloneDeep } from 'lodash'
import set from 'lodash/set'
import { MemoryRouter, Route, Routes } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { infraEnvironmentsState, nmStateConfigsState } from '../../../../atoms'
import { nockGet, nockIgnoreApiPaths, nockPatch } from '../../../../lib/nock-util'
import { clickByText, clickHostAction, waitForNocks, waitForNotText, waitForText } from '../../../../lib/test-util'
import { NavigationPath } from '../../../../NavigationPath'
import { IResource } from '../../../../resources/resource'
import { mockNMStateConfig } from '../../Clusters/ManagedClusters/components/cim/EditAICluster.sharedmocks'
import { infraEnvName, mockInfraEnv1, mockPullSecret } from '../../../../test-helpers/infraEnvName'
import { InfraEnvK8sResource } from '@openshift-assisted/ui-lib/cim'
import * as dynamicPluginSdk from '@openshift-console/dynamic-plugin-sdk'
import InfraEnvironments from '../InfraEnvironments'

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  ...jest.requireActual('@openshift-console/dynamic-plugin-sdk'), // use actual for all non-hook parts
  useK8sWatchResource: jest.fn(),
}))
;(dynamicPluginSdk.useK8sWatchResource as jest.Mock).mockReturnValue([null as any, true, null])

const mockInfraEnvironments: InfraEnvK8sResource[] = [mockInfraEnv1]

// This will be changed after MGMT-7255
const mockInfraEnvRegeneratedISO = cloneDeep(mockInfraEnv1)
set(mockInfraEnvRegeneratedISO, 'status.createdTime', '2021-11-10T14:03:16Z')

const mockNMStateConfigInfraEnv = cloneDeep(mockNMStateConfig)
mockNMStateConfigInfraEnv.metadata.name = infraEnvName
mockNMStateConfigInfraEnv.metadata.namespace = infraEnvName

jest.mock('react-router-dom-v5-compat', () => {
  const originalModule = jest.requireActual('react-router-dom-v5-compat')
  return {
    __esModule: true,
    ...originalModule,
    useParams: () => {
      return { name: infraEnvName, namespace: infraEnvName }
    },
    useNavigate: () => jest.fn(),
  }
})

const Component = () => {
  return (
    <RecoilRoot
      initializeState={(snapshot) => {
        snapshot.set(infraEnvironmentsState, mockInfraEnvironments)
        snapshot.set(nmStateConfigsState, [mockNMStateConfigInfraEnv])
      }}
    >
      <MemoryRouter initialEntries={[NavigationPath.infraEnvironmentDetails]}>
        <Routes>
          <Route path={`${NavigationPath.infraEnvironments}/*`} element={<InfraEnvironments />} />
        </Routes>
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('Infrastructure Environment Details page', () => {
  beforeEach(() => nockIgnoreApiPaths())
  test('can render', async () => {
    const initialNocks = [nockGet(mockPullSecret as IResource)]
    const generateNocks = [
      nockPatch(
        {
          apiVersion: 'agent-install.openshift.io/v1beta1',
          kind: 'infraenvs',
          metadata: {
            namespace: 'infra-env-name',
            name: 'infra-env-name',
          },
        } as IResource,
        [
          {
            op: 'add',
            path: '/spec/imageType',
            value: 'minimal-iso',
          },
        ]
      ),
      nockGet({
        apiVersion: 'agent-install.openshift.io/v1beta1',
        kind: 'infraenvs',
        metadata: {
          namespace: 'infra-env-name',
          name: 'infra-env-name',
        },
      }),
    ]

    render(<Component />)

    await waitForText('ai:Infrastructure environment details')
    await waitForNocks(initialNocks)

    // The Overview tab
    await waitForText('ai:Name')

    // Open discovery ISO dialog
    await clickHostAction('ai:With Discovery ISO')

    // // Discovery ISO download state
    await waitForText('ai:Generate Discovery ISO')
    await clickByText('ai:Generate Discovery ISO')

    await waitForNocks(generateNocks)
    await waitForText('ai:Download Discovery ISO')

    await clickByText('ai:Close')
    await waitForNotText('ai:Download Discovery ISO')

    // The Hosts tab
    await clickByText('Hosts')
    await waitForText('ai:Hosts may take a few minutes to appear here after booting.')
  })
})
