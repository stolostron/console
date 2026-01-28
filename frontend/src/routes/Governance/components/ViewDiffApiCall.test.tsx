/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { v4 as uuidv4 } from 'uuid'
import { nockGet, nockIgnoreApiPaths, nockIgnoreRBAC } from '../../../lib/nock-util'
import { waitForNocks, waitForText } from '../../../lib/test-util'
import { ResultsTableData } from '../policies/policy-details/PolicyDetailsResults'
import { ViewDiffApiCall } from './ViewDiffApiCall'

// Mock UUID v4 to return predictable values during testing
jest.mock('uuid', () => ({
  v4: jest.fn(),
}))

const mockUuidV4 = jest.mocked(uuidv4)
const MOCKED_UUID = 'MOCKED_UUID'

const getResourceRequest = {
  apiVersion: 'view.open-cluster-management.io/v1beta1',
  kind: 'ManagedClusterView',
  metadata: {
    name: MOCKED_UUID,
    namespace: 'test-cluster',
    labels: {
      viewName: MOCKED_UUID,
    },
  },
  spec: {
    scope: {
      name: 'policy-set-with-1-placement-policy-1',
      resource: 'configurationpolicy.policy.open-cluster-management.io.v1',
    },
  },
}

const getResourceResponse = {
  apiVersion: 'view.open-cluster-management.io/v1beta1',
  kind: 'ManagedClusterView',
  metadata: {
    name: MOCKED_UUID,
    namespace: 'test-cluster',
    labels: {
      viewName: MOCKED_UUID,
    },
  },
  spec: {
    scope: {
      name: 'policy-set-with-1-placement-policy-1',
      resource: 'configurationpolicy.policy.open-cluster-management.io.v1',
    },
  },
  status: {
    conditions: [
      {
        message: 'Watching resources successfully',
        reason: 'GetResourceProcessing',
        status: 'True',
        type: 'Processing',
      },
    ],
    result: {
      apiVersion: 'policy.open-cluster-management.io/v1',
      kind: 'ConfigurationPolicy',
      metadata: {
        labels: {
          'cluster-name': 'test-cluster',
          'cluster-namespace': 'test-cluster',
          'policy.open-cluster-management.io/cluster-name': 'test-cluster',
          'policy.open-cluster-management.io/cluster-namespace': 'test-cluster',
        },
        name: 'policy-set-with-1-placement-policy-1',
        namespace: 'test-cluster',
        uid: '36c5e139-0982-428f-9248-7da6fc3d97e2',
      },
      spec: {
        namespaceSelector: { exclude: ['kube-*'], include: ['default'] },
        'object-templates': [
          {
            complianceType: 'musthave',
            objectDefinition: { apiVersion: 'v1', kind: 'Namespace', metadata: { name: 'test' } },
          },
          {
            complianceType: 'musthave',
            objectDefinition: { apiVersion: 'v1', kind: 'ConfigMap', metadata: { name: 'test-1' } },
          },
        ],
        remediationAction: 'inform',
        severity: 'low',
      },
      status: {
        compliancyDetails: [
          {
            Compliant: 'Compliant',
            Validity: {},
            conditions: [
              {
                lastTransitionTime: '2022-02-22T13:32:41Z',
                message: 'namespaces [test] found as specified, therefore this Object template is compliant',
                reason: 'K8s `must have` object already exists',
                status: 'True',
                type: 'notification',
              },
            ],
          },
        ],
        compliant: 'Compliant',
        relatedObjects: [
          {
            compliant: 'Compliant',
            object: { apiVersion: 'v1', kind: 'Namespace', metadata: { name: 'ns-1' } },
            reason: 'Resource found as expected',
            cluster: 'test-cluster',
            properties: {
              diff: `
                --- testing : existing
                +++ testing : updated
                @@ -5,10 +5,11 @@
                     openshift.io/sa.scc.mcs: s0:c29,c4
                     openshift.io/sa.scc.supplemental-groups: 1000820000/10000
                     openshift.io/sa.scc.uid-range: 1000820000/10000
                   creationTimestamp: "2024-05-28T20:32:17Z"
                   labels:
                +    cat: cookie
                     kubernetes.io/metadata.name: testing
                     pod-security.kubernetes.io/audit: restricted
                     pod-security.kubernetes.io/audit-version: v1.24
                     pod-security.kubernetes.io/warn: restricted
                     pod-security.kubernetes.io/warn-version: v1.24
                `,
            },
          },
          {
            compliant: 'Compliant',
            object: { apiVersion: 'v1', kind: 'ConfigMap', metadata: { name: 'configmap-1' } },
            reason: 'Resource found as expected',
            cluster: 'test-cluster',
            properties: {
              diff: `
                --- configmap-1 : existing
                +++ configmap-1 : updated
                @@ -5,10 +5,11 @@
                     openshift.io/sa.scc.mcs: s0:c29,c4
                     openshift.io/sa.scc.supplemental-groups: 1000820000/10000
                     openshift.io/sa.scc.uid-range: 1000820000/10000
                   creationTimestamp: "2024-05-28T20:32:17Z"
                   labels:
                +    cat: cookie
                     kubernetes.io/metadata.name: configmap-1-metadata-name
                     pod-security.kubernetes.io/audit: restricted
                     pod-security.kubernetes.io/audit-version: v1.24
                     pod-security.kubernetes.io/warn: restricted
                     pod-security.kubernetes.io/warn-version: v1.24
                `,
            },
          },
          {
            compliant: 'Compliant',
            object: { apiVersion: 'v1', kind: 'Pod', metadata: { name: 'pod-1' } },
            reason: 'Resource found as expected',
            cluster: 'test-cluster',
          },
        ],
      },
    },
  },
}

const item: ResultsTableData = {
  templateName: 'policy-set-with-1-placement-policy-1',
  cluster: 'test-cluster',
  clusterNamespace: 'test-cluster',
  apiVersion: 'policy.open-cluster-management.io/v1',
  kind: 'ConfigurationPolicy',
  status: 'status',
  message: 'message',
  timestamp: 1,
  policyName: 'policy-set-with-1-placement-policy-1',
  policyNamespace: 'test-cluster',
  remediationAction: 'inform',
}

describe('ViewDiffApiCall components test', () => {
  beforeEach(() => {
    // Reset the mock before each test
    mockUuidV4.mockReset()
    mockUuidV4.mockReturnValue(MOCKED_UUID)
    nockIgnoreApiPaths()
    nockIgnoreRBAC()
  })
  test('Should render ViewDiffApCall correctly', async () => {
    const getResourceNockMount = nockGet(getResourceRequest, getResourceResponse)
    const getResourceNockModal = nockGet(getResourceRequest, getResourceResponse)
    render(<ViewDiffApiCall item={item} />)

    await waitForNocks([getResourceNockMount])
    await waitForText('View diff')
    const viewDiffLink = screen.getByText('View diff')
    userEvent.click(viewDiffLink)
    await waitForNocks([getResourceNockModal])
    await waitForText('policy-set-with-1-placement-policy-1')
    await waitForText('Difference for the Namespace ns-1')
    await waitForText('Difference for the ConfigMap configmap-1')
    // Pod doesn't have diff
    expect(screen.queryAllByText('Difference for the Pod pod-1').length).toBe(0)

    const modal = screen.getByRole('dialog')
    expect(modal).toHaveTextContent('--- testing : existing')
    expect(modal).toHaveTextContent('+++ configmap-1 : updated')
  })

  test('Should not render ViewDiffApiCall button when no diff data is available', async () => {
    const getResourceRequestNoDiff = {
      ...getResourceRequest,
      metadata: {
        ...getResourceRequest.metadata,
        name: 'MOCKED_UUID_NO_DIFF',
      },
    }

    const getResourceResponseNoDiff = {
      ...getResourceResponse,
      metadata: {
        ...getResourceResponse.metadata,
        name: 'MOCKED_UUID_NO_DIFF',
      },
      status: {
        ...getResourceResponse.status,
        result: {
          ...getResourceResponse.status.result,
          status: {
            compliant: 'NonCompliant',
            relatedObjects: [
              {
                compliant: 'NonCompliant',
                object: {
                  apiVersion: 'v1',
                  kind: 'ConfigMap',
                  metadata: {
                    name: '-',
                    namespace: 'open-cluster-management',
                  },
                },
                reason: 'Resource found but does not match',
              },
            ],
          },
        },
      },
    }

    mockUuidV4.mockReturnValue('MOCKED_UUID_NO_DIFF')
    const getResourceNock = nockGet(getResourceRequestNoDiff, getResourceResponseNoDiff)
    render(<ViewDiffApiCall item={item} />)

    // Wait for skeleton to appear during loading
    await waitForText('Loading diff')

    await waitForNocks([getResourceNock])
    expect(screen.queryByText('View diff')).not.toBeInTheDocument()
  })
})
