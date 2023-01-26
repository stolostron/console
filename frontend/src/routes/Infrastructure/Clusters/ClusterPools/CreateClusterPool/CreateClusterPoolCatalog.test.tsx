/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { secretsState } from '../../../../../atoms'
import { clickByTestId } from '../../../../../lib/test-util'
import { NavigationPath } from '../../../../../NavigationPath'
import { ProviderConnectionApiVersion, ProviderConnectionKind, Secret } from '../../../../../resources'
import { CreateClusterPoolCatalog } from './CreateClusterPoolCatalog'

const providerConnectionAws: Secret = {
  apiVersion: ProviderConnectionApiVersion,
  kind: ProviderConnectionKind,
  metadata: {
    name: 'aws',
    namespace: 'default',
    labels: {
      'cluster.open-cluster-management.io/type': 'aws',
      'cluster.open-cluster-management.io/credentials': '',
    },
  },
}

describe('CreateClusterPoolCatalog', () => {
  const Component = () => {
    return (
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(secretsState, [providerConnectionAws])
        }}
      >
        <MemoryRouter initialEntries={[NavigationPath.createClusterPool]}>
          <Route path={NavigationPath.createClusterPool}>
            <CreateClusterPoolCatalog />
          </Route>
        </MemoryRouter>
      </RecoilRoot>
    )
  }

  test('can select aws', async () => {
    render(<Component />)
    await clickByTestId('aws')
  })

  test('can select google', async () => {
    render(<Component />)
    await clickByTestId('google')
  })

  test('can select azure', async () => {
    render(<Component />)
    await clickByTestId('azure')
  })
})
