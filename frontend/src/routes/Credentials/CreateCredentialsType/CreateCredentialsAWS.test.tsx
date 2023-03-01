/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { nockIgnoreApiPaths, nockList } from '../../../lib/nock-util'
import { clickByTestId, waitForNocks } from '../../../lib/test-util'
import { NavigationPath } from '../../../NavigationPath'
import { MultiClusterEngine, MultiClusterEngineApiVersion, MultiClusterEngineKind } from '../../../resources'
import { CreateCredentialsAWS } from './CreateCredentialsAWS'

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

describe('CreateCredentialsAWS', () => {
  beforeEach(() => {
    nockIgnoreApiPaths()
  })

  const Component = () => {
    return (
      <RecoilRoot>
        <MemoryRouter initialEntries={[NavigationPath.addAWSType]}>
          <Route path={NavigationPath.addAWSType}>
            <CreateCredentialsAWS />
          </Route>
        </MemoryRouter>
      </RecoilRoot>
    )
  }

  test('can click aws', async () => {
    const initialNocks = [nockList(multiclusterEngine, mockMulticlusterEngine)]
    render(<Component />)
    await waitForNocks(initialNocks)
    await clickByTestId('aws-standard')
  })

  test('can click aws S3', async () => {
    const initialNocks = [nockList(multiclusterEngine, mockMulticlusterEngine)]
    render(<Component />)
    await waitForNocks(initialNocks)
    await clickByTestId('aws-bucket')
  })
})
