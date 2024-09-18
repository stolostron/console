/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { policiesState } from '../../../../atoms'
import { nockIgnoreApiPaths, nockIgnoreRBAC } from '../../../../lib/nock-util'
import { waitForText, waitForNotText, clickByLabel, clickByText } from '../../../../lib/test-util'
import PolicyDetailsResults from './PolicyDetailsResults'
import { mockPolicy, mockPendingPolicy, mockPolicyBinding } from '../../governance.sharedMocks'
import { Policy } from '../../../../resources'
import { PolicyDetailsContext } from './PolicyDetailsPage'

describe('Policy Details Results', () => {
  beforeEach(async () => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })
  test('Should render Policy Details Results Page content correctly', async () => {
    const context: PolicyDetailsContext = { policy: mockPolicy[0] }
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(policiesState, mockPolicy)
        }}
      >
        <MemoryRouter>
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route path="*" element={<PolicyDetailsResults />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // wait page load
    await waitForText('Clusters')

    // wait for table cells to load correctly
    await waitForText('local-cluster')
    await waitForText('No violations')
    await waitForText('policy-set-with-1-placement-policy-1', true)
    expect(screen.getByTestId('template-name-link-disabled')).toBeInTheDocument()
    await waitForText(
      'notification - namespaces [test] found as specified, therefore this Object template is compliant'
    )
    await waitForText('Remediation')
    await waitForText('inform')
  })
  test('Should render Policy Details Results Page with Remediation enforce', async () => {
    const context: PolicyDetailsContext = { policy: mockPolicyBinding[0] }
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(policiesState, mockPolicyBinding)
        }}
      >
        <MemoryRouter>
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route path="*" element={<PolicyDetailsResults />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )
    await waitForText('Remediation')
    await waitForText('enforce')
  })
  test('Should render Policy Details Results Page without view details on hub templates', async () => {
    const mockRootPolicy = JSON.parse(JSON.stringify(mockPolicyBinding[0])) as Policy
    const mockReplPolicy = JSON.parse(JSON.stringify(mockPolicyBinding[1])) as Policy

    mockRootPolicy.status = {
      compliant: 'NonCompliant',
      placement: [
        {
          placement: 'policy-set-with-1-placement',
          placementBinding: 'policy-set-with-1-placement',
          policySet: 'policy-set-with-1-placement',
        },
      ],
      status: [{ clustername: 'local-cluster', clusternamespace: 'local-cluster', compliant: 'NonCompliant' }],
    }
    mockReplPolicy.status = {
      compliant: 'NonCompliant',
      details: [
        {
          compliant: 'NonCompliant',
          history: [
            {
              eventName: 'test.policy-set-with-1-placement-policy.16d459c516462fbf',
              lastTimestamp: '2022-02-16T19:07:46Z',
              message:
                'NonCompliant; template-error; failed to parse the template JSON string ... {{hub some hub}} ' +
                'template: tmpl:12: function "some" not defined',
            },
          ],
          templateMeta: { creationTimestamp: null, name: 'policy-set-with-1-placement-policy-1' },
        },
      ],
    }

    const context: PolicyDetailsContext = { policy: mockRootPolicy }
    const { container } = render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(policiesState, [mockRootPolicy, mockReplPolicy])
        }}
      >
        <MemoryRouter>
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route path="*" element={<PolicyDetailsResults />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )
    screen.getByText(/template-error; failed .+/i)
    await waitForNotText('View details')

    // Verify there is no link on the template
    expect(container.querySelector('td[data-label="Template"] a')).not.toBeInTheDocument()
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
    const context: PolicyDetailsContext = { policy: mockPolicy[0] }
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(policiesState, [mockPolicy[0], mockReplicatedPolicyCopy, mockPolicy[2]])
        }}
      >
        <MemoryRouter>
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route path="*" element={<PolicyDetailsResults />} />
            </Route>
          </Routes>
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
    const context: PolicyDetailsContext = { policy: mockPendingPolicy[0] }
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(policiesState, mockPendingPolicy)
        }}
      >
        <MemoryRouter>
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route path="*" element={<PolicyDetailsResults />} />
            </Route>
          </Routes>
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

describe('Export from policy details results table', () => {
  beforeEach(async () => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })
  test('export button should produce a file for download', async () => {
    const context: PolicyDetailsContext = { policy: mockPolicy[0] }
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(policiesState, mockPolicy)
        }}
      >
        <MemoryRouter>
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route path="*" element={<PolicyDetailsResults />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // wait page load
    await waitForText('Clusters')

    window.URL.createObjectURL = jest.fn()
    window.URL.revokeObjectURL = jest.fn()
    const documentBody = document.body.appendChild
    const documentCreate = document.createElement('a').dispatchEvent

    const anchorMocked = { href: '', click: jest.fn(), download: 'table-values', style: { display: '' } } as any
    const createElementSpyOn = jest.spyOn(document, 'createElement').mockReturnValueOnce(anchorMocked)
    document.body.appendChild = jest.fn()
    document.createElement('a').dispatchEvent = jest.fn()

    await clickByLabel('export-search-result')
    await clickByText('Export all to CSV')

    expect(createElementSpyOn).toHaveBeenCalledWith('a')
    expect(anchorMocked.download).toContain('table-values')

    document.body.appendChild = documentBody
    document.createElement('a').dispatchEvent = documentCreate
  })
})
