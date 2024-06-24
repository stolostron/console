/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { policiesState } from '../../../../atoms'
import { nockIgnoreApiPaths, nockIgnoreRBAC } from '../../../../lib/nock-util'
import { waitForText } from '../../../../lib/test-util'
import PolicyDetailsResults from './PolicyDetailsResults'
import { mockPolicy, mockPendingPolicy, mockPolicyBinding } from '../../governance.sharedMocks'

describe('Policy Details Results', () => {
  beforeEach(async () => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })
  test('Should render Policy Details Results Page content correctly', async () => {
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(policiesState, mockPolicy)
        }}
      >
        <MemoryRouter>
          <PolicyDetailsResults policy={mockPolicy[0]} />
        </MemoryRouter>
      </RecoilRoot>
    )

    // wait page load
    await waitForText('Clusters')

    // wait for table cells to load correctly
    await waitForText('local-cluster')
    await waitForText('Without violations')
    await waitForText('policy-set-with-1-placement-policy-1', true)
    await waitForText(
      'notification - namespaces [test] found as specified, therefore this Object template is compliant'
    )
    await waitForText('Remediation')
    await waitForText('inform')
  })
  test('Should render Policy Details Results Page with Remediation enforce', async () => {
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(policiesState, mockPolicyBinding)
        }}
      >
        <MemoryRouter>
          <PolicyDetailsResults policy={mockPolicyBinding[0]} />
        </MemoryRouter>
      </RecoilRoot>
    )
    await waitForText('Remediation')
    await waitForText('enforce')
  })
})

describe('Policy results of policy of a hosted cluster', () => {
  beforeEach(async () => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })
  test('Should display the cluster name and not namespace', async () => {
    const mockReplicatedPolicyCopy = JSON.parse(JSON.stringify(mockPolicy[1]))
    mockReplicatedPolicyCopy.metadata.labels['policy.open-cluster-management.io/cluster-namespace'] =
      'klusterlet-local-cluster'

    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(policiesState, [mockPolicy[0], mockReplicatedPolicyCopy, mockPolicy[2]])
        }}
      >
        <MemoryRouter>
          <PolicyDetailsResults policy={mockPolicy[0]} />
        </MemoryRouter>
      </RecoilRoot>
    )

    // wait page load
    await waitForText('Clusters')

    await waitForText('local-cluster')
    expect(screen.queryAllByText('klusterlet-local-cluster')).toHaveLength(0)
  })
})

describe('Policy Details Results with pending status', () => {
  beforeEach(async () => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })
  test('Should render Policy Details Results Page content correctly for pending status', async () => {
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(policiesState, mockPendingPolicy)
        }}
      >
        <MemoryRouter>
          <PolicyDetailsResults policy={mockPendingPolicy[0]} />
        </MemoryRouter>
      </RecoilRoot>
    )

    // wait page load
    await waitForText('Clusters')

    // wait for table cells to load correctly
    await waitForText('Pending')
    await waitForText(
      'template-error; Dependencies were not satisfied: 1 dependencies are still pending (Policy default.policy-pod)'
    )
  })
})
