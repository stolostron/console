/* Copyright Contributors to the Open Cluster Management project */
import { StateProvider } from '~/lib/state-provider'
import { nockIgnoreApiPaths } from '../../../../lib/nock-util'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { NavigationPath } from '../../../../NavigationPath'
import { PolicyDetailsPage } from './PolicyDetailsPage'
import { waitForText } from '../../../../lib/test-util'
import { policiesState } from '../../../../atoms'
import { mockPolicy } from '../../governance.sharedMocks'

describe('PolicyDetailsPage Page', () => {
  beforeEach(async () => {
    nockIgnoreApiPaths()
  })
  test('Should render error message correctly', async () => {
    render(
      <StateProvider
        initializeStore={(store) => {
          store.set(policiesState, mockPolicy)
        }}
      >
        <MemoryRouter initialEntries={[NavigationPath.policyTemplateDetails, 'namespace-unkown', 'test-unknown']}>
          <PolicyDetailsPage />
        </MemoryRouter>
      </StateProvider>
    )

    await waitForText('Back to policies')
  })
})
