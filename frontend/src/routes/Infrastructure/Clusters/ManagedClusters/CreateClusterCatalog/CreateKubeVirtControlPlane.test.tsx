/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { clickByTestId, waitForNocks } from '../../../../../lib/test-util'
import { NavigationPath } from '../../../../../NavigationPath'
import { CreateKubeVirtControlPlane } from './CreateKubeVirtControlPlane'
import { nockIgnoreApiPaths, nockList } from '../../../../../lib/nock-util'
import { MultiClusterEngine, MultiClusterEngineApiVersion, MultiClusterEngineKind } from '../../../../../resources'

const multiclusterEngine: MultiClusterEngine = {
  apiVersion: MultiClusterEngineApiVersion,
  kind: MultiClusterEngineKind,
  spec: {
    availabilityConfig: 'High',
    imagePullSecret: 'multiclusterhub-operator-pull-secret',
    overrides: {
      components: [
        { enabled: true, name: 'hypershift-local-hosting' },
        {
          enabled: true,
          name: 'hypershift-preview',
        },
      ],
    },
    targetNamespace: 'multicluster-engine',
    tolerations: [],
  },
  metadata: {
    name: 'multiclusterengine',
    generation: 2,
  },
}
const mockMulticlusterEngine = [multiclusterEngine]

describe('CreateKubeVirtControlPlane', () => {
  beforeEach(() => {
    nockIgnoreApiPaths()
  })
  const Component = () => {
    return (
      <RecoilRoot>
        <MemoryRouter initialEntries={[NavigationPath.createKubeVirtControlPlane]}>
          <Route path={NavigationPath.createKubeVirtControlPlane}>
            <CreateKubeVirtControlPlane />
          </Route>
        </MemoryRouter>
      </RecoilRoot>
    )
  }

  test('can click hosted', async () => {
    const initialNocks = [nockList(multiclusterEngine, mockMulticlusterEngine)]
    render(<Component />)
    await waitForNocks(initialNocks)
    await clickByTestId('hosted')
  })
})
