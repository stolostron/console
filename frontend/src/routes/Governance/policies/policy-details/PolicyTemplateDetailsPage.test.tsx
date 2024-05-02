/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { managedClusterAddonsState } from '../../../../atoms'
import { waitForText } from '../../../../lib/test-util'
import { PolicyTemplateDetailsPage } from './PolicyTemplateDetailsPage'
import { nockIgnoreApiPaths } from '../../../../lib/nock-util'

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'), // use actual for all non-hook parts
  useParams: () => ({
    namespace: 'test',
    name: 'policy-set-with-1-placement-policy',
    clusterName: 'local-cluster',
    apiGroup: 'policy.open-cluster-management.io',
    apiVersion: 'v1',
    kind: 'ConfigurationPolicy',
    templateName: 'policy-set-with-1-placement-policy-1',
  }),
  useRouteMatch: () => ({
    url: '/multicloud/governance/policies/details/test/policy-set-with-1-placement-policy-1/template/local-cluster/policy.open-cluster-management.io/v1/ConfigurationPolicy/policy-set-with-1-placement-policy-1',
  }),
}))

describe('Policy Template Details Page', () => {
  test('Should render Policy Template Details Page', async () => {
    nockIgnoreApiPaths() //ignore /apiPaths
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(managedClusterAddonsState, [])
        }}
      >
        <MemoryRouter>
          <PolicyTemplateDetailsPage />
        </MemoryRouter>
      </RecoilRoot>
    )

    // wait for page load - looking for breadcrumb items
    await waitForText('Policies')
    await waitForText('policy-set-with-1-placement-policy')
    await waitForText('policy-set-with-1-placement-policy-1', true) // policy-set-with-1-placement-policy-1 is in breadcrumb and also the page header - so set multipleAllowed prop to true
  })
})
