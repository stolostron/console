/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { secretsState } from '../../../../../atoms'
import { clickByTestId } from '../../../../../lib/test-util'
import { NavigationPath } from '../../../../../NavigationPath'
import { CreateClusterCatalog } from './CreateClusterCatalog'

import { ProviderConnectionApiVersion, ProviderConnectionKind, Secret } from '../../../../../resources'

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

describe('CreateClusterCatalog', () => {
  const Component = () => {
    return (
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(secretsState, [providerConnectionAws])
        }}
      >
        <MemoryRouter initialEntries={[NavigationPath.createCluster]}>
          <Routes>
            <Route path={NavigationPath.createCluster} element={<CreateClusterCatalog />} />
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )
  }

  test('can select aws', async () => {
    render(<Component />)
    await clickByTestId('aws')
  })

  test('can select host inventory', async () => {
    render(<Component />)
    await clickByTestId('hostinventory')
  })

  test('can select google', async () => {
    render(<Component />)
    await clickByTestId('google')
  })

  test('can select azure', async () => {
    render(<Component />)
    await clickByTestId('azure')
  })

  test('can select openstack', async () => {
    render(<Component />)
    await clickByTestId('openstack')
  })

  test('can select vsphere', async () => {
    render(<Component />)
    await clickByTestId('vsphere')
  })
})
