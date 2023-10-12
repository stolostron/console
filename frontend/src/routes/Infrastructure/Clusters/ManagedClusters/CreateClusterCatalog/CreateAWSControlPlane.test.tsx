/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { clickByTestId } from '../../../../../lib/test-util'
import { NavigationPath } from '../../../../../NavigationPath'
import { CreateAWSControlPlane } from './CreateAWSControlPlane'
import { nockIgnoreApiPaths, nockList } from '../../../../../lib/nock-util'
import { multiClusterEnginesState } from '../../../../../atoms'
import { MultiClusterEngine, MultiClusterEngineApiVersion, MultiClusterEngineKind } from '../../../../../resources'

const mockMultiClusterEngine: MultiClusterEngine = {
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
          name: 'hypershift',
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
  status: {
    conditions: [
      {
        reason: 'ManagedClusterAddOnLeaseUpdated',
        status: 'True',
      },
    ],
  },
}

const listMulticlusterengines1 = {
  req: {
    apiVersion: 'multicluster.openshift.io/v1',
    kind: 'multiclusterengines',
  },
  res: [],
}

describe('CreateAWSControlPlane hosted', () => {
  beforeEach(() => {
    nockIgnoreApiPaths()
  })

  const Component = () => {
    return (
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(multiClusterEnginesState, [mockMultiClusterEngine])
        }}
      >
        <MemoryRouter initialEntries={[NavigationPath.createAWSControlPlane]}>
          <Route path={NavigationPath.createAWSControlPlane}>
            <CreateAWSControlPlane />
          </Route>
        </MemoryRouter>
      </RecoilRoot>
    )
  }

  test('can click hosted', async () => {
    render(<Component />)
    await clickByTestId('hosted')
  })

  test('can click standalone', async () => {
    nockList(listMulticlusterengines1.req, listMulticlusterengines1.res)
    nockList(listMulticlusterengines1.req, listMulticlusterengines1.res)
    render(<Component />)
    await clickByTestId('standalone')
  })
})
