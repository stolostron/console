/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { waitForNocks, waitForText } from '../../../lib/test-util'
import { ViewDiffApiCall } from './ViewDiffApiCall'
import { nockGet, nockIgnoreApiPaths } from '../../../lib/nock-util'
import { ResultsTableData } from '../policies/policy-details/PolicyDetailsResults'
import userEvent from '@testing-library/user-event'

const getResourceRequest = {
  apiVersion: 'view.open-cluster-management.io/v1beta1',
  kind: 'ManagedClusterView',
  metadata: {
    name: '232423625a3c9b73ebda9c52cb40cfac908f1ca1',
    namespace: 'test-cluster',
    labels: {
      viewName: '232423625a3c9b73ebda9c52cb40cfac908f1ca1',
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
    name: '232423625a3c9b73ebda9c52cb40cfac908f1ca1',
    namespace: 'test-cluster',
    labels: {
      viewName: '232423625a3c9b73ebda9c52cb40cfac908f1ca1',
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

describe('ViewDiffApCall components test', () => {
  beforeEach(() => nockIgnoreApiPaths())
  test('Should render ViewDiffApCall correctly', async () => {
    const getResourceNock = nockGet(getResourceRequest, getResourceResponse)
    render(<ViewDiffApiCall item={item} />)

    await waitForNocks([getResourceNock])
    await waitForText('View diff')
    const viewDiffLink = screen.getByText('View diff')
    userEvent.click(viewDiffLink)
    await waitForText('policy-set-with-1-placement-policy-1')
    await waitForText('Difference for the Namespace ns-1')
    await waitForText('Difference for the ConfigMap configmap-1')
    // Pod doesn't have diff
    expect(screen.queryAllByText('Difference for the Pod pod-1').length).toBe(0)

    const modal = screen.getByRole('dialog')
    expect(modal).toHaveTextContent('--- testing : existing')
    expect(modal).toHaveTextContent('+++ configmap-1 : updated')
  })
})
