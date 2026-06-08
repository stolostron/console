/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { managedClustersState, policiesState } from '../../../../atoms'
import { nockIgnoreApiPaths, nockIgnoreRBAC } from '../../../../lib/nock-util'
import {
  waitForText,
  waitForNotText,
  clickByLabel,
  clickByText,
  getCSVExportSpies,
  getCSVDownloadLink,
} from '../../../../lib/test-util'
import PolicyDetailsResults from './PolicyDetailsResults'
import { mockPolicy, mockPendingPolicy, mockPolicyBinding } from '../../governance.sharedMocks'
import { ManagedCluster, ManagedClusterApiVersion, ManagedClusterKind, Policy } from '../../../../resources'
import { PolicyDetailsContext } from './PolicyDetailsPage'

const mockManagedCluster: ManagedCluster = {
  apiVersion: ManagedClusterApiVersion,
  kind: ManagedClusterKind,
  metadata: { name: 'local-cluster' },
  spec: { hubAcceptsClient: true },
  status: {
    allocatable: { cpu: '', memory: '' },
    capacity: { cpu: '', memory: '' },
    clusterClaims: [],
    conditions: [],
    version: { kubernetes: '' },
  },
}

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
          snapshot.set(managedClustersState, [mockManagedCluster])
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
      'notification - namespaces [test] found as specified, therefore this Object template is compliant - ',
      false,
      { trim: false }
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
          snapshot.set(managedClustersState, [mockManagedCluster])
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
          snapshot.set(managedClustersState, [mockManagedCluster])
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
          snapshot.set(managedClustersState, [mockManagedCluster])
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
          snapshot.set(managedClustersState, [mockManagedCluster])
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

describe('Namespace-scoped user without cluster access', () => {
  beforeEach(async () => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })
  test('Should render cluster names as plain text when managedClustersState is empty', async () => {
    const context: PolicyDetailsContext = { policy: mockPolicy[0] }
    const { container } = render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(policiesState, mockPolicy)
          snapshot.set(managedClustersState, [])
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

    await waitForText('Clusters')
    await waitForText('local-cluster')

    expect(container.querySelector('td[data-label="Cluster"] a')).not.toBeInTheDocument()
  })
  test('Should render updated empty-state message when no results are available', async () => {
    const context: PolicyDetailsContext = { policy: mockPolicy[0] }
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(policiesState, [mockPolicy[0]])
          snapshot.set(managedClustersState, [])
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

    await waitForText('No results found')
    await waitForText('No results available.')
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
          snapshot.set(managedClustersState, [mockManagedCluster])
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

    const { blobConstructorSpy, createElementSpy } = getCSVExportSpies()

    await clickByLabel('export-search-result')
    await clickByText('Export all to CSV')

    expect(blobConstructorSpy).toHaveBeenCalledWith(
      [
        'Cluster,Violations,Template,Message,Remediation,Last report\n' +
          '"local-cluster","No violations","policy-set-with-1-placement-policy-1","notification - namespaces [test] found as specified, therefore this Object template is compliant","inform","2022-02-16T19:07:46.000Z"',
      ],
      { type: 'text/csv' }
    )
    expect(getCSVDownloadLink(createElementSpy)?.value.download).toMatch(
      /^policy-set-with-1-placement-policy-test-[\d]+\.csv$/
    )
  })
})

describe('Search prefill from URL query string', () => {
  beforeEach(async () => {
    localStorage.clear()
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })

  test('Should prefill search bar when location.search contains a search param', async () => {
    const context: PolicyDetailsContext = { policy: mockPolicy[0] }
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(policiesState, mockPolicy)
          snapshot.set(managedClustersState, [mockManagedCluster])
        }}
      >
        <MemoryRouter initialEntries={['?search=local-cluster']}>
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route path="*" element={<PolicyDetailsResults />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    await waitForText('Clusters')

    const searchInput = screen.getByPlaceholderText('Find clusters')
    expect(searchInput).toHaveValue('local-cluster')
  })

  test('Should have empty search bar when location.search is empty', async () => {
    const context: PolicyDetailsContext = { policy: mockPolicy[0] }
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(policiesState, mockPolicy)
          snapshot.set(managedClustersState, [mockManagedCluster])
        }}
      >
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route path="*" element={<PolicyDetailsResults />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    await waitForText('Clusters')

    const searchInput = screen.getByPlaceholderText('Find clusters')
    expect(searchInput).toHaveValue('')
  })
})
