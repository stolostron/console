/* Copyright Contributors to the Open Cluster Management project */
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { managedClusterAddonsState } from '../../../../atoms'
import { nockGet, nockIgnoreApiPaths } from '../../../../lib/nock-util'
import { waitForNocks, waitForText, waitForNotText } from '../../../../lib/test-util'
import { ManagedClusterAddOn } from '../../../../resources'
import { PolicyTemplateDetails } from './PolicyTemplateDetails'

jest.mock('../../../../components/YamlEditor', () => {
  // TODO replace with actual YAML Page when Monaco editor is imported correctly
  return function YamlEditor() {
    return <div />
  }
})

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
            object: { apiVersion: 'v1', kind: 'Namespace', metadata: { name: 'test' } },
            reason: 'Resource found as expected',
            cluster: 'test-cluster',
          },
        ],
      },
    },
  },
}

describe('Policy Template Details content', () => {
  beforeEach(() => nockIgnoreApiPaths())
  test('Should render Policy Template Details Page content correctly', async () => {
    const getResourceNock = nockGet(getResourceRequest, getResourceResponse)
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(managedClusterAddonsState, [])
        }}
      >
        <MemoryRouter>
          <PolicyTemplateDetails
            clusterName={'test-cluster'}
            apiGroup={'policy.open-cluster-management.io'}
            apiVersion={'v1'}
            kind={'ConfigurationPolicy'}
            templateName={'policy-set-with-1-placement-policy-1'}
          />
        </MemoryRouter>
      </RecoilRoot>
    )

    // Wait for delete resource requests to finish
    await waitForNocks([getResourceNock])

    // wait template description section to load correctly
    await waitForText('Template details')
    await waitForText('policy-set-with-1-placement-policy-1')
    await waitForText('test-cluster')
    await waitForText('ConfigurationPolicy')
    await waitForText(
      '[{"Compliant":"Compliant","Validity":{},"conditions":[{"lastTransitionTime":"2022-02-22T13:32:41Z","message":"namespaces [test] found as specified, therefore this Object template is compliant","reason":"K8s `must have` object already exists","status":"True","type":"notification"}]}]'
    )

    // wait for template yaml to load correctly
    await waitForText('Template yaml')

    // wait for related resources table to load correctly
    await waitForText('Related resources')
    await waitForText('test')
    await waitForText('v1')
    await waitForText('No violations')
    await waitForText('Resource found as expected')
  })

  test('Should render Policy Template Details Page content correctly in hosted mode', async () => {
    const clusterName = 'customer-cluster'
    const hostingClusterName = 'hosting-cluster'
    const installNamespace = `${clusterName}-hosted`

    // Add one irrelevant addon not in hosted mode to ensure it gets ignored.
    const mockManagedClusterAddOnWork: ManagedClusterAddOn = {
      apiVersion: 'addon.open-cluster-management.io/v1alpha1',
      kind: 'ManagedClusterAddOn',
      metadata: {
        name: 'work-manager',
        namespace: clusterName,
      },
      spec: {},
    }
    const mockManagedClusterAddOnPolicy: ManagedClusterAddOn = {
      apiVersion: 'addon.open-cluster-management.io/v1alpha1',
      kind: 'ManagedClusterAddOn',
      metadata: {
        name: 'governance-policy-framework',
        namespace: clusterName,
        annotations: {
          'addon.open-cluster-management.io/hosting-cluster-name': hostingClusterName,
        },
      },
      spec: {
        installNamespace: installNamespace,
      },
    }

    const getResourceRequestCopy = JSON.parse(JSON.stringify(getResourceRequest))
    getResourceRequestCopy.metadata.namespace = hostingClusterName
    getResourceRequestCopy.metadata.name = '99e5a663c0d087293127fd84856d50cf40595689'
    getResourceRequestCopy.metadata.labels.viewName = '99e5a663c0d087293127fd84856d50cf40595689'

    const getResourceResponseCopy = JSON.parse(JSON.stringify(getResourceResponse))
    getResourceResponseCopy.metadata.namespace = hostingClusterName
    getResourceResponseCopy.status.result.metadata.namespace = installNamespace
    getResourceResponseCopy.metadata.name = '99e5a663c0d087293127fd84856d50cf40595689'
    getResourceResponseCopy.metadata.labels.viewName = '99e5a663c0d087293127fd84856d50cf40595689'
    getResourceResponseCopy.status.result.metadata.labels = {
      'cluster-name': clusterName,
      'cluster-namespace': installNamespace,
      'policy.open-cluster-management.io/cluster-name': clusterName,
      'policy.open-cluster-management.io/cluster-namespace': installNamespace,
    }

    const getResourceNock = nockGet(getResourceRequestCopy, getResourceResponseCopy)

    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(managedClusterAddonsState, [mockManagedClusterAddOnWork, mockManagedClusterAddOnPolicy])
        }}
      >
        <MemoryRouter>
          <PolicyTemplateDetails
            clusterName={clusterName}
            apiGroup={'policy.open-cluster-management.io'}
            apiVersion={'v1'}
            kind={'ConfigurationPolicy'}
            templateName={'policy-set-with-1-placement-policy-1'}
          />
        </MemoryRouter>
      </RecoilRoot>
    )

    // Wait for the get resource requests to finish
    await waitForNocks([getResourceNock])

    // Verify the template description section
    await waitForText('Template details')
    await waitForText('policy-set-with-1-placement-policy-1')
    // Ensure the hosting cluster name isn't shown as the cluster name
    await waitForText(clusterName)
    await waitForText('ConfigurationPolicy')
    await waitForText(
      '[{"Compliant":"Compliant","Validity":{},"conditions":[{"lastTransitionTime":"2022-02-22T13:32:41Z","message":"namespaces [test] found as specified, therefore this Object template is compliant","reason":"K8s `must have` object already exists","status":"True","type":"notification"}]}]'
    )
    const viewYamlLink = screen.getByText('View YAML')
    expect(viewYamlLink.getAttribute('href')).toEqual(
      `/multicloud/home/search/resources/yaml?cluster=${clusterName}&kind=Namespace&apiversion=v1&name=test`
    )
  })

  test('Should render Policy Template Details Page content correctly with Gatekeeper content', async () => {
    const getResourceRequest = {
      apiVersion: 'view.open-cluster-management.io/v1beta1',
      kind: 'ManagedClusterView',
      metadata: {
        name: '2553352ec733ab71e2ded9369e78ad3f11047c7d',
        namespace: 'local-cluster',
        labels: { viewName: '2553352ec733ab71e2ded9369e78ad3f11047c7d' },
      },
      spec: {
        scope: {
          name: 'ns-must-have-gk',
          resource: 'k8srequiredlabels.v1beta1.constraints.gatekeeper.sh',
        },
      },
    }

    const getResourceResponse = JSON.parse(JSON.stringify(getResourceRequest))
    getResourceResponse.status = {
      conditions: [
        {
          message: 'Watching resources successfully',
          reason: 'GetResourceProcessing',
          status: 'True',
          type: 'Processing',
        },
      ],
      result: {
        apiVersion: 'constraints.gatekeeper.sh/v1beta1',
        kind: 'K8sRequiredLabels',
        metadata: {
          labels: {
            'cluster-name': 'local-cluster',
            'cluster-namespace': 'local-cluster',
            'policy.open-cluster-management.io/cluster-name': 'local-cluster',
            'policy.open-cluster-management.io/cluster-namespace': 'local-cluster',
            'policy.open-cluster-management.io/policy': 'open-cluster-management-global-set.gk-policy',
          },
          name: 'ns-must-have-gk',
        },
        spec: {
          enforcementAction: 'warn',
          match: { kinds: [{ apiGroups: [''], kinds: ['Namespace'] }] },
          parameters: { labels: ['gatekeeper'] },
        },
        status: {
          auditTimestamp: '2023-04-19T14:36:50Z',
          byPod: [
            {
              constraintUID: '920387b5-5976-48d5-a51b-4a74db008dfa',
              enforced: true,
              id: 'gatekeeper-audit-7457d48b6c-rtjtf',
              observedGeneration: 1,
              operations: ['audit', 'status'],
            },
            {
              constraintUID: '920387b5-5976-48d5-a51b-4a74db008dfa',
              enforced: true,
              id: 'gatekeeper-controller-manager-758949dcb9-2vrrg',
              observedGeneration: 1,
              operations: ['webhook'],
            },
            {
              constraintUID: '920387b5-5976-48d5-a51b-4a74db008dfa',
              enforced: true,
              id: 'gatekeeper-controller-manager-758949dcb9-pxwll',
              observedGeneration: 1,
              operations: ['webhook'],
            },
          ],
          totalViolations: 2,
          violations: [
            {
              enforcementAction: 'warn',
              group: '',
              kind: 'Namespace',
              message: 'you must provide labels: {"gatekeeper"}',
              name: 'default',
              version: 'v1',
            },
            {
              enforcementAction: 'warn',
              group: '',
              kind: 'Namespace',
              message: 'you must provide labels: {"gatekeeper"}',
              name: 'default-broker',
              version: 'v1',
            },
          ],
        },
      },
    }

    const getResourceNock = nockGet(getResourceRequest, getResourceResponse)

    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(managedClusterAddonsState, [])
        }}
      >
        <MemoryRouter>
          <PolicyTemplateDetails
            clusterName={'local-cluster'}
            apiGroup={'constraints.gatekeeper.sh'}
            apiVersion={'v1beta1'}
            kind={'K8sRequiredLabels'}
            templateName={'ns-must-have-gk'}
          />
        </MemoryRouter>
      </RecoilRoot>
    )

    // Wait for the get resource requests to finish
    await waitForNocks([getResourceNock])

    // Verify the template description section
    await waitForText('Template details')
    await waitForText('ns-must-have-gk')
    await waitForText('K8sRequiredLabels')
    screen.getByText(
      /\[\{"enforcementaction":"warn","group":"","kind":"namespace","message":"you must provide labels: \{\\"gatekeeper\\"\}","name":"default","version":"v1"\},\{"enforcementaction":"warn","group":"","kind":"namespace","message":"you must provide labels: \{\\"gatekeeper\\"\}","name":"default-broker","version":"v1"\}\]/i
    )

    const row = screen.getByRole('row', {
      name: /default-broker - namespace v1 violations you must provide labels: \{"gatekeeper"\} view yaml/i,
    })
    const viewYamlLink = within(row).getByRole('link', { name: /view yaml/i })
    expect(viewYamlLink.getAttribute('href')).toEqual(
      `/multicloud/home/search/resources/yaml?cluster=local-cluster&kind=Namespace&apiversion=v1&name=default-broker`
    )
  })

  test('Should render Policy Template Details Page content correctly with OperatorPolicy content', async () => {
    const getResourceRequest = {
      apiVersion: 'view.open-cluster-management.io/v1beta1',
      kind: 'ManagedClusterView',
      metadata: {
        name: '49652c0ab8ad9bcdcf2eeb21707b98245bd81c03',
        namespace: 'local-cluster',
        labels: { viewName: '49652c0ab8ad9bcdcf2eeb21707b98245bd81c03' },
      },
      spec: {
        scope: {
          name: 'oppol-no-group',
          namespace: 'local-cluster',
          resource: 'operatorpolicy.v1beta1.policy.open-cluster-management.io',
        },
      },
    }

    const getResourceResponse = JSON.parse(JSON.stringify(getResourceRequest))
    getResourceResponse.status = {
      conditions: [
        {
          message: 'Watching resources successfully',
          reason: 'GetResourceProcessing',
          status: 'True',
          type: 'Processing',
        },
      ],
      result: {
        apiVersion: 'policy.open-cluster-management.io/v1beta1',
        kind: 'OperatorPolicy',
        metadata: {
          labels: {
            'cluster-name': 'local-cluster',
            'cluster-namespace': 'local-cluster',
            'policy.open-cluster-management.io/cluster-name': 'local-cluster',
            'policy.open-cluster-management.io/cluster-namespace': 'local-cluster',
            'policy.open-cluster-management.io/policy': 'open-cluster-management-global-set.jk-quay-test',
          },
          name: 'oppol-no-group',
          namespace: 'local-cluster',
        },
        spec: {
          complianceType: 'musthave',
          remediationAction: 'enforce',
          severity: 'medium',
          subscription: {
            channel: 'stable-3.8',
            installPlanApproval: 'Automatic',
            name: 'quay-operator',
            namespace: 'operator-policy-testns',
            source: 'redhat-operators',
            sourceNamespace: 'openshift-marketplace',
            startingCSV: 'quay-operator.v3.8.1',
          },
        },
        status: {
          compliant: 'Compliant',
          conditions: [
            {
              message: 'CatalogSource was found',
              reason: 'CatalogSourcesFound',
              status: 'False',
              type: 'CatalogSourcesUnhealthy',
            },
            {
              message: 'ClusterServiceVersion - install strategy completed with no errors',
              reason: 'InstallSucceeded',
              status: 'True',
              type: 'ClusterServiceVersionCompliant',
            },
            {
              message:
                'Compliant; the OperatorGroup matches what is required by the policy, the Subscription matches what is required by the policy, no InstallPlans requiring approval were found, ClusterServiceVersion - install strategy completed with no errors, All operator Deployments have their minimum availability, CatalogSource was found',
              reason: 'Compliant',
              status: 'True',
              type: 'Compliant',
            },
            {
              message: 'All operator Deployments have their minimum availability',
              reason: 'DeploymentsAvailable',
              status: 'True',
              type: 'DeploymentCompliant',
            },
            {
              message: 'no InstallPlans requiring approval were found',
              reason: 'NoInstallPlansRequiringApproval',
              status: 'True',
              type: 'InstallPlanCompliant',
            },
            {
              message: 'the OperatorGroup matches what is required by the policy',
              reason: 'OperatorGroupMatches',
              status: 'True',
              type: 'OperatorGroupCompliant',
            },
            {
              message: 'the Subscription matches what is required by the policy',
              reason: 'SubscriptionMatches',
              status: 'True',
              type: 'SubscriptionCompliant',
            },
          ],
          relatedObjects: [
            {
              compliant: 'Compliant',
              object: {
                apiVersion: 'operators.coreos.com/v1alpha1',
                kind: 'CatalogSource',
                metadata: {
                  name: 'redhat-operators',
                  namespace: 'openshift-marketplace',
                },
              },
              reason: 'Resource found as expected',
            },
            {
              compliant: 'Compliant',
              object: {
                apiVersion: 'operators.coreos.com/v1alpha1',
                kind: 'ClusterServiceVersion',
                metadata: {
                  name: 'quay-operator.v3.8.15',
                  namespace: 'operator-policy-testns',
                },
              },
              reason: 'InstallSucceeded',
            },
            {
              compliant: 'Compliant',
              object: {
                apiVersion: 'apps/v1',
                kind: 'Deployment',
                metadata: {
                  name: 'quay-operator.v3.8.15',
                  namespace: 'operator-policy-testns',
                },
              },
              reason: 'Deployment Available',
            },
            {
              object: {
                apiVersion: 'operators.coreos.com/v1alpha1',
                kind: 'InstallPlan',
                metadata: {
                  name: 'install-4ftch',
                  namespace: 'operator-policy-testns',
                },
              },
              reason: 'The InstallPlan is Complete',
            },
            {
              object: {
                apiVersion: 'operators.coreos.com/v1alpha1',
                kind: 'InstallPlan',
                metadata: {
                  name: 'install-w7zpm',
                  namespace: 'operator-policy-testns',
                },
              },
              reason: 'The InstallPlan is Complete',
            },
            {
              compliant: 'Compliant',
              object: {
                apiVersion: 'operators.coreos.com/v1',
                kind: 'OperatorGroup',
                metadata: {
                  name: 'operator-policy-testns-k5pvq',
                  namespace: 'operator-policy-testns',
                },
              },
              reason: 'Resource found as expected',
            },
            {
              compliant: 'Compliant',
              object: {
                apiVersion: 'operators.coreos.com/v1alpha1',
                kind: 'Subscription',
                metadata: {
                  name: 'quay-operator',
                  namespace: 'operator-policy-testns',
                },
              },
              reason: 'Resource found as expected',
            },
          ],
        },
      },
    }

    const getResourceNock = nockGet(getResourceRequest, getResourceResponse)

    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(managedClusterAddonsState, [])
        }}
      >
        <MemoryRouter>
          <PolicyTemplateDetails
            clusterName={'local-cluster'}
            apiGroup={'policy.open-cluster-management.io'}
            apiVersion={'v1beta1'}
            kind={'OperatorPolicy'}
            templateName={'oppol-no-group'}
          />
        </MemoryRouter>
      </RecoilRoot>
    )

    // Wait for the get resource requests to finish
    await waitForNocks([getResourceNock])

    // Verify the template description section
    await waitForText('Template details')
    await waitForText('oppol-no-group')
    await waitForText('OperatorPolicy')
    screen.getByText(
      /Compliant; the OperatorGroup matches what is required by the policy, the Subscription matches what is required by the policy, no InstallPlans requiring approval were found, ClusterServiceVersion - install strategy completed with no errors, All operator Deployments have their minimum availability, CatalogSource was found/i
    )

    const row = screen.getByRole('row', {
      name: /Deployment Available/i,
    })
    const viewYamlLink = within(row).getByRole('link', { name: /view yaml/i })
    expect(viewYamlLink.getAttribute('href')).toEqual(
      `/multicloud/home/search/resources/yaml?cluster=local-cluster&kind=Deployment&apiversion=apps/v1&name=quay-operator.v3.8.15&namespace=operator-policy-testns`
    )
  })

  test('Should render correctly with relatedObject name is - when it is cluster scope', async () => {
    const replaceRelatedObj = [
      {
        compliant: 'NonCompliant',
        object: { apiVersion: 'v1', kind: 'Namespace', metadata: { name: '-' } },
        reason: 'Resource found as expected',
        cluster: 'test-cluster',
      },
    ]
    getResourceResponse.status.result.status.relatedObjects = replaceRelatedObj
    const getResourceNock = nockGet(getResourceRequest, getResourceResponse)
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(managedClusterAddonsState, [])
        }}
      >
        <MemoryRouter>
          <PolicyTemplateDetails
            clusterName={'test-cluster'}
            apiGroup={'policy.open-cluster-management.io'}
            apiVersion={'v1'}
            kind={'ConfigurationPolicy'}
            templateName={'policy-set-with-1-placement-policy-1'}
          />
        </MemoryRouter>
      </RecoilRoot>
    )
    // Wait for the get resource requests to finish
    await waitForNocks([getResourceNock])

    // wait for template yaml to load correctly
    await waitForText('Template yaml')

    // wait for related resources table to load correctly
    await waitForText('Related resources')
    // Both namespace and name
    await waitForText('-', true)
    await waitForText('v1')
    await waitForNotText('View YAML')
  })

  test('Should render correctly with relatedObject name is - when it is namespace scope', async () => {
    const replaceRelatedObj = [
      {
        compliant: 'NonCompliant',
        object: { apiVersion: 'networking.k8s.io/v1', kind: 'Ingress', metadata: { namespace: 'ohmyns', name: '-' } },
        reason: 'Resource found as expected',
        cluster: 'test-cluster',
      },
    ]
    getResourceResponse.status.result.status.relatedObjects = replaceRelatedObj
    const getResourceNock = nockGet(getResourceRequest, getResourceResponse)
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(managedClusterAddonsState, [])
        }}
      >
        <MemoryRouter>
          <PolicyTemplateDetails
            clusterName={'test-cluster'}
            apiGroup={'policy.open-cluster-management.io'}
            apiVersion={'v1'}
            kind={'ConfigurationPolicy'}
            templateName={'policy-set-with-1-placement-policy-1'}
          />
        </MemoryRouter>
      </RecoilRoot>
    )
    // Wait for the get resource requests to finish
    await waitForNocks([getResourceNock])

    // wait for template yaml to load correctly
    await waitForText('Template yaml')

    // wait for related resources table to load correctly
    await waitForText('Related resources')
    await waitForText('-')
    await waitForText('networking.k8s.io/v1')
    await waitForNotText('View YAML')
  })

  test('Should show an error when displaying unsupported IamPolicy', async () => {
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(managedClusterAddonsState, [])
        }}
      >
        <MemoryRouter>
          <PolicyTemplateDetails
            clusterName={'local-cluster'}
            apiGroup={'policy.open-cluster-management.io'}
            apiVersion={'v1'}
            kind={'IamPolicy'}
            templateName={'ns-must-have-gk'}
          />
        </MemoryRouter>
      </RecoilRoot>
    )

    await waitForText('IamPolicy is no longer supported')
  })
})
