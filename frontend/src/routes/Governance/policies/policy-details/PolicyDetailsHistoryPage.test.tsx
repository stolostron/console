/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { waitForText } from '../../../../lib/test-util'
import { PolicyDetailsHistoryPage } from './PolicyDetailsHistoryPage'

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'), // use actual for all non-hook parts
  useParams: () => ({
    namespace: 'test',
    name: 'policy-set-with-1-placement-policy',
    clusterName: 'local-cluster',
    templateName: 'policy-set-with-1-placement-policy-1',
  }),
  useRouteMatch: () => ({
    url: '/multicloud/governance/policies/details/test/policy-set-with-1-placement-policy/status/local-cluster/templates/policy-set-with-1-placement-policy-1/history',
  }),
}))

describe('Policy Details History Page', () => {
  test('Should render Policy Details History Page', async () => {
    render(
      <RecoilRoot>
        <MemoryRouter>
          <PolicyDetailsHistoryPage />
        </MemoryRouter>
      </RecoilRoot>
    )

    // wait for page load - looking for breadcrumb items
    await waitForText('Policies')
    await waitForText('policy-set-with-1-placement-policy')
    await waitForText('History', true) // History is in breadcurmb and also the page header - so set multipleAllowed prop to true
  })
})
