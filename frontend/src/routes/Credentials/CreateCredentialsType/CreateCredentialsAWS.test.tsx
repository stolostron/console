/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { nockIgnoreApiPaths } from '../../../lib/nock-util'
import { clickByTestId } from '../../../lib/test-util'
import { NavigationPath } from '../../../NavigationPath'
import { CreateCredentialsAWS } from './CreateCredentialsAWS'
import { managedClusterAddonsState, multiClusterEnginesState } from '../../../atoms'
import {
  mockManagedClusterAddOn,
  mockMultiClusterEngine,
} from '../../Infrastructure/Clusters/ManagedClusters/CreateClusterCatalog/sharedMocks'

describe('CreateCredentialsAWS', () => {
  beforeEach(() => {
    nockIgnoreApiPaths()
  })

  const Component = () => {
    return (
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(managedClusterAddonsState, [mockManagedClusterAddOn])
          snapshot.set(multiClusterEnginesState, [mockMultiClusterEngine])
        }}
      >
        <MemoryRouter initialEntries={[NavigationPath.addAWSType]}>
          <Route path={NavigationPath.addAWSType}>
            <CreateCredentialsAWS />
          </Route>
        </MemoryRouter>
      </RecoilRoot>
    )
  }

  test('can click aws', async () => {
    render(<Component />)
    await clickByTestId('aws-standard')
  })

  test('can click aws S3', async () => {
    render(<Component />)
    await clickByTestId('aws-bucket')
  })
})
